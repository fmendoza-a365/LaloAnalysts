/**
 * Service Layer para manejo de Datasets
 * Centraliza la lógica de consulta y procesamiento de datasets
 */

/**
 * Obtiene dataset por período (año/mes)
 * @param {Object} Model - Modelo de Dataset (ej: GenesysDataset, ProvisionDataset)
 * @param {number} anio - Año
 * @param {number} mes - Mes (opcional)
 * @param {string} tipo - Tipo de dataset (opcional, para Genesys)
 * @param {Object} additionalFilters - Filtros adicionales (opcional)
 * @returns {Promise<Object|null>} - Dataset encontrado o null
 */
async function getDatasetByPeriod(Model, anio, mes = null, tipo = null, additionalFilters = {}) {
  const query = { anio, ...additionalFilters };

  if (mes != null) {
    query.mes = mes;
  }

  if (tipo != null) {
    query.tipo = tipo;
  }

  return await Model.findOne(query).sort({ createdAt: -1 }).lean();
}

/**
 * Obtiene múltiples datasets por rango de períodos
 * @param {Object} Model - Modelo de Dataset
 * @param {number} anio - Año
 * @param {Array<number>} meses - Array de meses
 * @param {Object} additionalFilters - Filtros adicionales
 * @returns {Promise<Array>} - Array de datasets
 */
async function getDatasetsByPeriods(Model, anio, meses, additionalFilters = {}) {
  const query = {
    anio,
    mes: { $in: meses },
    ...additionalFilters
  };

  return await Model.find(query).sort({ anio: -1, mes: -1 }).lean();
}

/**
 * Obtiene datasets de Genesys por período
 * @param {Object} GenesysDataset - Modelo de GenesysDataset
 * @param {number} anio - Año
 * @param {number} mes - Mes
 * @returns {Promise<Object>} - Objeto con dsEstados y dsRendimiento
 */
async function getGenesysDatasets(GenesysDataset, anio, mes) {
  const [dsEstados, dsRendimiento] = await Promise.all([
    getDatasetByPeriod(GenesysDataset, anio, mes, 'estados'),
    getDatasetByPeriod(GenesysDataset, anio, mes, 'rendimiento')
  ]);

  return { dsEstados, dsRendimiento };
}

/**
 * Obtiene records de un dataset con paginación
 * @param {Object} RecordModel - Modelo de Records
 * @param {string} datasetId - ID del dataset
 * @param {Object} options - Opciones de consulta
 * @param {number} options.limit - Límite de registros (default: 1000)
 * @param {number} options.skip - Registros a saltar
 * @param {Object} options.filters - Filtros adicionales
 * @param {Object} options.sort - Ordenamiento
 * @param {string} options.select - Campos a seleccionar
 * @returns {Promise<Array>} - Array de records
 */
async function getRecordsByDataset(RecordModel, datasetId, options = {}) {
  const {
    limit = 1000,
    skip = 0,
    filters = {},
    sort = {},
    select = null
  } = options;

  const query = RecordModel.find({
    datasetId,
    ...filters
  });

  if (select) {
    query.select(select);
  }

  if (Object.keys(sort).length > 0) {
    query.sort(sort);
  }

  query.skip(skip).limit(limit).lean();

  return await query.exec();
}

/**
 * Obtiene count de records de un dataset
 * @param {Object} RecordModel - Modelo de Records
 * @param {string} datasetId - ID del dataset
 * @param {Object} filters - Filtros adicionales
 * @returns {Promise<number>} - Número de records
 */
async function countRecordsByDataset(RecordModel, datasetId, filters = {}) {
  return await RecordModel.countDocuments({
    datasetId,
    ...filters
  });
}

/**
 * Obtiene todos los datasets disponibles para un tipo
 * @param {Object} Model - Modelo de Dataset
 * @param {Object} filters - Filtros adicionales
 * @returns {Promise<Array>} - Array de datasets con resumen
 */
async function getAvailableDatasets(Model, filters = {}) {
  const datasets = await Model.find(filters)
    .select('anio mes tipo nombre createdAt')
    .sort({ anio: -1, mes: -1 })
    .lean();

  return datasets.map(ds => ({
    id: ds._id.toString(),
    anio: ds.anio,
    mes: ds.mes,
    tipo: ds.tipo,
    nombre: ds.nombre,
    fecha: ds.createdAt
  }));
}

/**
 * Obtiene períodos únicos disponibles
 * @param {Object} Model - Modelo de Dataset
 * @param {Object} filters - Filtros adicionales
 * @returns {Promise<Array>} - Array de períodos { anio, mes }
 */
async function getAvailablePeriods(Model, filters = {}) {
  const periods = await Model.aggregate([
    { $match: filters },
    {
      $group: {
        _id: { anio: '$anio', mes: '$mes' },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        anio: '$_id.anio',
        mes: '$_id.mes',
        count: 1
      }
    },
    { $sort: { anio: -1, mes: -1 } }
  ]);

  return periods;
}

/**
 * Cache en memoria simple para datasets (TTL de 5 minutos)
 */
const datasetCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

function getCacheKey(modelName, anio, mes, tipo) {
  return `${modelName}_${anio}_${mes || 'null'}_${tipo || 'null'}`;
}

/**
 * Obtiene dataset con caché
 * @param {Object} Model - Modelo de Dataset
 * @param {number} anio - Año
 * @param {number} mes - Mes
 * @param {string} tipo - Tipo
 * @returns {Promise<Object|null>} - Dataset o null
 */
async function getDatasetByPeriodCached(Model, anio, mes = null, tipo = null) {
  const cacheKey = getCacheKey(Model.modelName, anio, mes, tipo);

  // Verificar cache
  if (datasetCache.has(cacheKey)) {
    const cached = datasetCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    // Cache expirado
    datasetCache.delete(cacheKey);
  }

  // Consultar DB
  const dataset = await getDatasetByPeriod(Model, anio, mes, tipo);

  // Guardar en cache
  if (dataset) {
    datasetCache.set(cacheKey, {
      data: dataset,
      timestamp: Date.now()
    });
  }

  return dataset;
}

/**
 * Limpia el cache de datasets
 */
function clearDatasetCache() {
  datasetCache.clear();
}

/**
 * Elimina entradas de cache expiradas
 */
function pruneExpiredCache() {
  const now = Date.now();
  for (const [key, value] of datasetCache.entries()) {
    if (now - value.timestamp >= CACHE_TTL) {
      datasetCache.delete(key);
    }
  }
}

// Limpiar cache expirado cada minuto
setInterval(pruneExpiredCache, 60000);

module.exports = {
  getDatasetByPeriod,
  getDatasetsByPeriods,
  getGenesysDatasets,
  getRecordsByDataset,
  countRecordsByDataset,
  getAvailableDatasets,
  getAvailablePeriods,
  getDatasetByPeriodCached,
  clearDatasetCache
};
