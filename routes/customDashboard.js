const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const { requireTenant, getTenantModelFromReq } = require('../middleware/tenant');
const { processDataset, getDatasetSchema } = require('../utils/formatters/dataTypeConverter');

// ❌ NO importar modelos multi-tenant directamente
// Modelos multi-tenant: CustomDashboard, ProvisionRecord, ProvisionDataset, AsistenciaRecord,
// AsistenciaDataset, GenesysRecord, GenesysDataset, NominaRecord, NominaDataset, Asesor

// Middleware
router.use(ensureAuthenticated, requireTenant);

/**
 * GET / - Lista de dashboards personalizados del usuario
 */
router.get('/', async (req, res) => {
  try {
    // Obtener modelo dinámico del tenant actual
    const CustomDashboard = getTenantModelFromReq(req, 'CustomDashboard');

    // ✅ Obtener dashboards (solo del tenant actual)
    const dashboards = await CustomDashboard.find({
      $or: [
        { userId: req.user._id },
        { shared: true }
      ]
    }).sort({ createdAt: -1 });

    res.render('customDashboard/index', {
      title: 'Mis Dashboards',
      user: req.user,
      dashboards
    });
  } catch (error) {
    console.error('[CUSTOM DASHBOARD] Error:', error);
    req.flash('error_msg', 'Error al cargar dashboards');
    res.redirect('/dashboard');
  }
});

/**
 * GET /editor - Página del editor de dashboards
 */
router.get('/editor', async (req, res) => {
  try {
    // Obtener modelo dinámico del tenant actual
    const CustomDashboard = getTenantModelFromReq(req, 'CustomDashboard');

    const dashboardId = req.query.id;
    let dashboard = null;

    if (dashboardId) {
      dashboard = await CustomDashboard.findById(dashboardId);

      // Verificar permisos
      if (!dashboard ||
          (dashboard.createdBy.toString() !== req.user._id.toString() &&
           !dashboard.sharedWith.some(s => s.user.toString() === req.user._id.toString() && s.permission === 'edit'))) {
        req.flash('error_msg', 'No tienes permisos para editar este dashboard');
        return res.redirect('/custom-dashboard');
      }
    }

    res.render('customDashboard/editor', {
      title: dashboard ? `Editar: ${dashboard.name}` : 'Nuevo Dashboard',
      user: req.user,
      dashboard: dashboard || {
        name: '',
        description: '',
        widgets: [],
        config: {
          layout: 'grid',
          columns: 12
        }
      },
      datasetSchemas: getDatasetSchemas()
    });
  } catch (error) {
    console.error('[CUSTOM DASHBOARD] Error en editor:', error);
    req.flash('error_msg', 'Error al cargar el editor');
    res.redirect('/custom-dashboard');
  }
});

/**
 * POST /save - Guardar dashboard
 */
router.post('/save', async (req, res) => {
  try {
    // Obtener modelo dinámico del tenant actual
    const CustomDashboard = getTenantModelFromReq(req, 'CustomDashboard');

    const { id, name, description, widgets, config } = req.body;

    let dashboard;
    if (id) {
      dashboard = await CustomDashboard.findById(id);
      if (!dashboard || dashboard.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'No autorizado' });
      }

      dashboard.name = name;
      dashboard.description = description;
      dashboard.widgets = JSON.parse(widgets);
      dashboard.config = JSON.parse(config);
    } else {
      dashboard = new CustomDashboard({
        name,
        description,
        createdBy: req.user._id,
        campaign: req.session.selectedCampaign?.id || null,
        widgets: JSON.parse(widgets),
        config: JSON.parse(config)
      });
    }

    await dashboard.save();

    res.json({
      success: true,
      dashboardId: dashboard._id,
      message: 'Dashboard guardado exitosamente'
    });
  } catch (error) {
    console.error('[CUSTOM DASHBOARD] Error al guardar:', error);
    res.status(500).json({ error: 'Error al guardar dashboard' });
  }
});

/**
 * GET /view/:id - Ver dashboard personalizado
 */
router.get('/view/:id', async (req, res) => {
  try {
    // Obtener modelo dinámico del tenant actual
    const CustomDashboard = getTenantModelFromReq(req, 'CustomDashboard');

    const dashboard = await CustomDashboard.findById(req.params.id);

    if (!dashboard) {
      req.flash('error_msg', 'Dashboard no encontrado');
      return res.redirect('/custom-dashboard');
    }

    // Verificar permisos
    if (dashboard.createdBy.toString() !== req.user._id.toString() &&
        !dashboard.sharedWith.some(s => s.user.toString() === req.user._id.toString())) {
      req.flash('error_msg', 'No tienes permisos para ver este dashboard');
      return res.redirect('/custom-dashboard');
    }

    // Obtener datos para los widgets
    const widgetData = await Promise.all(
      dashboard.widgets.map(widget => getWidgetData(widget, req.query, req))
    );

    res.render('customDashboard/view', {
      title: dashboard.name,
      user: req.user,
      dashboard,
      widgetData
    });
  } catch (error) {
    console.error('[CUSTOM DASHBOARD] Error al visualizar:', error);
    req.flash('error_msg', 'Error al cargar dashboard');
    res.redirect('/custom-dashboard');
  }
});

/**
 * GET /preview - Vista previa del dashboard (lee desde localStorage del cliente)
 */
router.get('/preview', (req, res) => {
  try {
    // Renderizar la misma vista pero sin dashboard del servidor
    // El dashboard se cargará desde localStorage en el cliente
    res.render('customDashboard/preview', {
      title: 'Vista Previa',
      user: req.user
    });
  } catch (error) {
    console.error('[CUSTOM DASHBOARD] Error en preview:', error);
    res.redirect('/custom-dashboard');
  }
});

/**
 * POST /api/widget-data - Obtener datos de un widget específico (AJAX)
 */
router.post('/api/widget-data', async (req, res) => {
  try {
    const { widget, filters } = req.body;

    console.log('═══════════════════════════════════════════════════════');
    console.log('[CUSTOM DASHBOARD] 📊 API /widget-data llamada');
    console.log('[CUSTOM DASHBOARD] Widget ID:', widget.id);
    console.log('[CUSTOM DASHBOARD] Widget Title:', widget.title);
    console.log('[CUSTOM DASHBOARD] Widget Type:', widget.type);
    console.log('[CUSTOM DASHBOARD] Dataset:', widget.dataConfig?.dataset);
    console.log('[CUSTOM DASHBOARD] GroupBy configurado:', widget.dataConfig?.groupBy);
    if (widget.dataConfig?.groupBy) {
      console.log('  ├─ Campo:', widget.dataConfig.groupBy.field);
      console.log('  └─ Granularidad:', widget.dataConfig.groupBy.granularity);
    }
    console.log('[CUSTOM DASHBOARD] Filtros:', filters);
    console.log('───────────────────────────────────────────────────────');

    const data = await getWidgetData(widget, filters || {}, req);

    console.log('[CUSTOM DASHBOARD] 📤 Respuesta preparada:');
    console.log('  ├─ Tipo de respuesta:', data.data ? 'AGRUPADO' : 'VALOR ÚNICO');
    if (data.data) {
      console.log('  ├─ Número de grupos:', data.data.length);
      console.log('  └─ Primeros 3 grupos:', data.data.slice(0, 3));
    } else {
      console.log('  └─ Valor:', data.value);
    }
    console.log('═══════════════════════════════════════════════════════');

    res.json({ success: true, data });
  } catch (error) {
    console.error('[CUSTOM DASHBOARD] ❌ Error en widget-data:', error);
    res.status(500).json({ error: 'Error al obtener datos del widget' });
  }
});

/**
 * GET /api/dataset-fields/:dataset - Obtener campos/cabeceras de un dataset
 */
router.get('/api/dataset-fields/:dataset', async (req, res) => {
  try {
    const { dataset } = req.params;
    console.log('[CUSTOM DASHBOARD] API llamado para dataset:', dataset);
    const fields = await getDatasetFields(dataset, req);
    console.log('[CUSTOM DASHBOARD] Campos obtenidos:', fields.length, 'campos');
    res.json({ success: true, fields });
  } catch (error) {
    console.error('[CUSTOM DASHBOARD] Error al obtener campos:', error);
    res.status(500).json({ success: false, error: 'Error al obtener campos del dataset' });
  }
});

/**
 * DELETE /delete/:id - Eliminar dashboard
 */
router.delete('/delete/:id', async (req, res) => {
  try {
    // Obtener modelo dinámico del tenant actual
    const CustomDashboard = getTenantModelFromReq(req, 'CustomDashboard');

    const dashboard = await CustomDashboard.findById(req.params.id);

    if (!dashboard || dashboard.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    dashboard.isActive = false;
    await dashboard.save();

    res.json({ success: true, message: 'Dashboard eliminado' });
  } catch (error) {
    console.error('[CUSTOM DASHBOARD] Error al eliminar:', error);
    res.status(500).json({ error: 'Error al eliminar dashboard' });
  }
});

/**
 * POST /clone/:id - Clonar dashboard
 */
router.post('/clone/:id', async (req, res) => {
  try {
    // Obtener modelo dinámico del tenant actual
    const CustomDashboard = getTenantModelFromReq(req, 'CustomDashboard');

    const dashboard = await CustomDashboard.findById(req.params.id);

    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard no encontrado' });
    }

    const cloned = await dashboard.clone(req.user._id, req.body.name);

    res.json({
      success: true,
      dashboardId: cloned._id,
      message: 'Dashboard clonado exitosamente'
    });
  } catch (error) {
    console.error('[CUSTOM DASHBOARD] Error al clonar:', error);
    res.status(500).json({ error: 'Error al clonar dashboard' });
  }
});

/**
 * Función auxiliar para obtener esquemas de datasets
 */
function getDatasetSchemas() {
  return {
    provision: {
      name: 'Provisión',
      fields: [
        { name: 'fecha', label: 'Fecha', type: 'date' },
        { name: 'mesa', label: 'Mesa', type: 'string' },
        { name: 'cola', label: 'Cola', type: 'string' },
        { name: 'ofrecidas', label: 'Llamadas Ofrecidas', type: 'number' },
        { name: 'contestadas', label: 'Llamadas Contestadas', type: 'number' },
        { name: 'abandonadas', label: 'Llamadas Abandonadas', type: 'number' },
        { name: 'umbral', label: 'Llamadas en Umbral', type: 'number' },
        { name: 'tmoSegundos', label: 'TMO (segundos)', type: 'number' },
        { name: 'acwSegundos', label: 'ACW (segundos)', type: 'number' }
      ]
    },
    asistencia: {
      name: 'Asistencia',
      fields: [
        { name: 'fecha', label: 'Fecha', type: 'date' },
        { name: 'dni', label: 'DNI', type: 'string' },
        { name: 'estado', label: 'Estado', type: 'string' },
        { name: 'horaIngreso', label: 'Hora Ingreso', type: 'time' },
        { name: 'horaSalida', label: 'Hora Salida', type: 'time' },
        { name: 'horasTrabajadas', label: 'Horas Trabajadas', type: 'number' }
      ]
    },
    genesys: {
      name: 'Genesys',
      fields: [
        { name: 'fecha', label: 'Fecha', type: 'date' },
        { name: 'agente', label: 'Agente', type: 'string' },
        { name: 'estado', label: 'Estado', type: 'string' },
        { name: 'duracionSegundos', label: 'Duración (seg)', type: 'number' }
      ]
    },
    nomina: {
      name: 'Nómina',
      fields: [
        { name: 'dni', label: 'DNI', type: 'string' },
        { name: 'nombres', label: 'Nombres', type: 'string' },
        { name: 'cargo', label: 'Cargo', type: 'string' },
        { name: 'campana', label: 'Campaña', type: 'string' },
        { name: 'sueldoBruto', label: 'Sueldo Bruto', type: 'number' },
        { name: 'costoTotalEmpleador', label: 'Costo Total Empleador', type: 'number' },
        { name: 'agentesEfectivos', label: 'Agentes Efectivos (EFT)', type: 'number' }
      ]
    },
    asesores: {
      name: 'Asesores',
      fields: [
        { name: 'DNI', label: 'DNI', type: 'string' },
        { name: 'apellidosNombres', label: 'Nombres', type: 'string' },
        { name: 'supervisor', label: 'Supervisor', type: 'string' },
        { name: 'estado', label: 'Estado', type: 'string' },
        { name: 'tipoJornada', label: 'Tipo Jornada', type: 'string' },
        { name: 'antiguedad', label: 'Antigüedad', type: 'string' },
        { name: 'fechaIngreso', label: 'Fecha Ingreso', type: 'date' }
      ]
    }
  };
}

/**
 * Función auxiliar para obtener datos de un widget
 */
async function getWidgetData(widget, filters = {}, req) {
  const { dataset, aggregation, fields, groupBy, filters: widgetFilters } = widget.dataConfig;

  // Obtener período de filtros globales
  const anio = parseInt(filters.anio || new Date().getFullYear(), 10);
  const mes = parseInt(filters.mes || (new Date().getMonth() + 1), 10);

  try {
    // Obtener modelos dinámicos del tenant actual
    const ProvisionDataset = getTenantModelFromReq(req, 'ProvisionDataset');
    const ProvisionRecord = getTenantModelFromReq(req, 'ProvisionRecord');
    const AsistenciaDataset = getTenantModelFromReq(req, 'AsistenciaDataset');
    const AsistenciaRecord = getTenantModelFromReq(req, 'AsistenciaRecord');
    const GenesysDataset = getTenantModelFromReq(req, 'GenesysDataset');
    const GenesysRecord = getTenantModelFromReq(req, 'GenesysRecord');
    const NominaDataset = getTenantModelFromReq(req, 'NominaDataset');
    const NominaRecord = getTenantModelFromReq(req, 'NominaRecord');
    const Asesor = getTenantModelFromReq(req, 'Asesor');

    let datasetDoc, records;

    // Obtener dataset y registros según el tipo
    switch (dataset) {
      case 'provision':
        datasetDoc = await ProvisionDataset.findOne({ anio: anio, mes });
        if (datasetDoc) {
          records = await ProvisionRecord.find({ datasetId: datasetDoc._id });
        }
        break;

      case 'asistencia':
        datasetDoc = await AsistenciaDataset.findOne({ anio, mes });
        if (datasetDoc) {
          records = await AsistenciaRecord.find({ datasetId: datasetDoc._id });
        }
        break;

      case 'genesys':
        datasetDoc = await GenesysDataset.findOne({ anio, mes });
        if (datasetDoc) {
          records = await GenesysRecord.find({ datasetId: datasetDoc._id });
        }
        break;

      case 'nomina':
        datasetDoc = await NominaDataset.findOne({ anio, mes });
        if (datasetDoc) {
          records = await NominaRecord.find({ datasetId: datasetDoc._id });
        }
        break;

      case 'asesores':
        records = await Asesor.find({});
        break;
    }

    if (!records || records.length === 0) {
      return { value: 0, data: [] };
    }

    // Convertir a objetos planos (si son documentos de Mongoose)
    const plainRecords = records.map(r => r.toObject ? r.toObject() : r);

    // ✨ PROCESAR DATASET: Convertir tipos y agregar campos temporales
    const processedRecords = processDataset(plainRecords);

    console.log('[CUSTOM DASHBOARD] Registros procesados:', processedRecords.length);
    if (processedRecords.length > 0) {
      console.log('[CUSTOM DASHBOARD] Ejemplo de registro con campos temporales:',
        Object.keys(processedRecords[0]).filter(k => k.includes('_')).slice(0, 5));
    }

    // Aplicar filtros del widget
    let filteredRecords = processedRecords;
    if (widgetFilters && widgetFilters.length > 0) {
      filteredRecords = applyFilters(processedRecords, widgetFilters);
    }

    // Realizar agregación
    const result = performAggregation(filteredRecords, aggregation, groupBy);

    return result;
  } catch (error) {
    console.error('[CUSTOM DASHBOARD] Error en getWidgetData:', error);
    return { value: 0, data: [], error: error.message };
  }
}

/**
 * Aplicar filtros a los registros
 */
function applyFilters(records, filters) {
  return records.filter(record => {
    return filters.every(filter => {
      const fieldValue = record[filter.field];

      switch (filter.operator) {
        case 'eq':
          return fieldValue === filter.value;
        case 'gt':
          return fieldValue > filter.value;
        case 'lt':
          return fieldValue < filter.value;
        case 'gte':
          return fieldValue >= filter.value;
        case 'lte':
          return fieldValue <= filter.value;
        case 'in':
          return Array.isArray(filter.value) && filter.value.includes(fieldValue);
        case 'between':
          return fieldValue >= filter.value[0] && fieldValue <= filter.value[1];
        default:
          return true;
      }
    });
  });
}

/**
 * Realizar agregación sobre los registros
 */
function performAggregation(records, aggregation, groupBy) {
  const { type, field, customFormula } = aggregation;

  console.log('[CUSTOM DASHBOARD] performAggregation - aggregation:', { type, field, customFormula });
  console.log('[CUSTOM DASHBOARD] performAggregation - groupBy:', groupBy);
  console.log('[CUSTOM DASHBOARD] performAggregation - records count:', records.length);

  // Si hay agrupación
  if (groupBy && groupBy.field) {
    console.log('[CUSTOM DASHBOARD] Agrupando por campo:', groupBy.field);

    const grouped = {};
    let exampleValues = [];

    records.forEach((record, index) => {
      const fieldValue = record[groupBy.field];

      // Guardar ejemplos para debug
      if (index < 3) {
        exampleValues.push(fieldValue);
      }

      const groupKey = getGroupKey(fieldValue, groupBy.granularity);

      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(record);
    });

    console.log('[CUSTOM DASHBOARD] Ejemplos de valores del campo:', exampleValues);
    console.log('[CUSTOM DASHBOARD] Grupos creados:', Object.keys(grouped).slice(0, 10));
    console.log('[CUSTOM DASHBOARD] Total de grupos:', Object.keys(grouped).length);

    const data = Object.entries(grouped).map(([key, group]) => ({
      label: key,
      value: calculateAggregation(group, type, field, customFormula)
    }));

    console.log('[CUSTOM DASHBOARD] Data resultante (primeros 5):', data.slice(0, 5));

    return { data, grouped: true };
  }

  // Sin agrupación - valor único
  console.log('[CUSTOM DASHBOARD] Sin agrupación, calculando valor único');
  const value = calculateAggregation(records, type, field, customFormula);
  console.log('[CUSTOM DASHBOARD] Valor calculado:', value);
  return { value, data: [] };
}

/**
 * Calcular agregación
 */
function calculateAggregation(records, type, field, customFormula) {
  switch (type) {
    case 'sum':
      return Math.round(records.reduce((sum, r) => sum + (parseFloat(r[field]) || 0), 0) * 100) / 100;

    case 'avg':
      const sum = records.reduce((s, r) => s + (parseFloat(r[field]) || 0), 0);
      return records.length > 0 ? Math.round((sum / records.length) * 100) / 100 : 0;

    case 'count':
      return records.length;

    case 'min':
      const values = records.map(r => parseFloat(r[field]) || 0).filter(v => v > 0);
      return values.length > 0 ? Math.min(...values) : 0;

    case 'max':
      const maxValues = records.map(r => parseFloat(r[field]) || 0);
      return maxValues.length > 0 ? Math.max(...maxValues) : 0;

    case 'custom':
      // Evaluar fórmula personalizada
      return evaluateCustomFormula(records, customFormula);

    default:
      return 0;
  }
}

/**
 * Evaluar fórmula personalizada
 */
function evaluateCustomFormula(records, formula) {
  try {
    // Ejemplo de fórmulas:
    // "COUNT(estado='Baja') / COUNT(*) * 100" para rotación
    // "SUM(contestadas) / COUNT(DISTINCT agente)" para promedio por agente

    // Por seguridad, solo permitir operaciones básicas
    // Esto es una implementación simplificada

    // Extraer operaciones de la fórmula
    const operations = formula.match(/(COUNT|SUM|AVG)\([^)]+\)/gi) || [];

    let result = formula;
    operations.forEach(op => {
      const value = evaluateOperation(records, op);
      result = result.replace(op, value.toString());
    });

    // Evaluar expresión matemática (solo números y operadores básicos)
    const sanitized = result.replace(/[^0-9+\-*/().\s]/g, '');
    const calculated = eval(sanitized);

    return Math.round(calculated * 100) / 100;
  } catch (error) {
    console.error('[CUSTOM DASHBOARD] Error en fórmula:', error);
    return 0;
  }
}

/**
 * Evaluar operación individual en fórmula
 */
function evaluateOperation(records, operation) {
  const match = operation.match(/(COUNT|SUM|AVG)\(([^)]+)\)/i);
  if (!match) return 0;

  const [, func, param] = match;

  if (param === '*') {
    return records.length;
  }

  // Si tiene condición (ej: estado='Baja')
  if (param.includes('=')) {
    const [field, value] = param.split('=').map(s => s.trim().replace(/['"]/g, ''));
    const filtered = records.filter(r => r[field] === value);

    if (func.toUpperCase() === 'COUNT') {
      return filtered.length;
    }
  }

  // Campo simple
  const field = param.trim();
  const values = records.map(r => parseFloat(r[field]) || 0);

  switch (func.toUpperCase()) {
    case 'SUM':
      return values.reduce((a, b) => a + b, 0);
    case 'AVG':
      return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    case 'COUNT':
      return values.filter(v => v > 0).length;
    default:
      return 0;
  }
}

/**
 * Obtener clave de agrupación según granularidad
 * NOTA: Con el nuevo sistema de campos temporales, el valor ya viene procesado
 */
function getGroupKey(value, granularity) {
  // Si el valor es null o undefined
  if (value === null || value === undefined) {
    return 'Sin especificar';
  }

  // Si es una fecha, formatearla según granularidad (para campos de fecha originales)
  if (value instanceof Date && !isNaN(value.getTime())) {
    switch (granularity) {
      case 'halfHour':
        const halfHourMinute = value.getMinutes() < 30 ? '00' : '30';
        return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')} ${String(value.getHours()).padStart(2, '0')}:${halfHourMinute}`;
      case 'hour':
        return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')} ${String(value.getHours()).padStart(2, '0')}:00`;
      case 'day':
        return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
      case 'week':
        const startOfYear = new Date(value.getFullYear(), 0, 1);
        const dayOfYear = Math.floor((value - startOfYear) / (24 * 60 * 60 * 1000));
        const weekNumber = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);
        return `Semana ${weekNumber} (${value.getFullYear()})`;
      case 'month':
        return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`;
      case 'year':
        return value.getFullYear().toString();
      default:
        return value.toString();
    }
  }

  // Para todos los demás valores (incluidos campos temporales pre-procesados), devolver como string
  // Los campos temporales como "fecha_dateHour", "fecha_weekLabel", etc. ya vienen formateados
  return String(value);
}

/**
 * Obtener campos/cabeceras disponibles de un dataset
 */
async function getDatasetFields(datasetType, req) {
  try {
    let sample, modelSchema;

    // Obtener modelos dinámicos del tenant actual
    const ProvisionRecord = getTenantModelFromReq(req, 'ProvisionRecord');
    const AsistenciaRecord = getTenantModelFromReq(req, 'AsistenciaRecord');
    const GenesysRecord = getTenantModelFromReq(req, 'GenesysRecord');
    const NominaRecord = getTenantModelFromReq(req, 'NominaRecord');
    const Asesor = getTenantModelFromReq(req, 'Asesor');

    switch (datasetType) {
      case 'provision':
        sample = await ProvisionRecord.findOne().lean();
        break;
      case 'asistencia':
        sample = await AsistenciaRecord.findOne().lean();
        break;
      case 'genesys':
        sample = await GenesysRecord.findOne().lean();
        break;
      case 'nomina':
        sample = await NominaRecord.findOne().lean();
        break;
      case 'asesores':
        sample = await Asesor.findOne().lean();
        break;
      default:
        return [];
    }

    if (!sample) {
      console.log('[CUSTOM DASHBOARD] ⚠️ No hay datos en el dataset:', datasetType);
      console.log('[CUSTOM DASHBOARD] Asegúrate de que existen registros en la base de datos para este dataset');
      return [];
    }

    console.log('[CUSTOM DASHBOARD] Sample encontrado para', datasetType, '- Campos originales:', Object.keys(sample).length);

    // ✨ Procesar el sample para obtener campos base y temporales
    let processedSample;
    try {
      processedSample = processDataset([sample])[0];
      console.log('[CUSTOM DASHBOARD] Sample procesado exitosamente, campos:', Object.keys(processedSample).length);
    } catch (error) {
      console.error('[CUSTOM DASHBOARD] Error al procesar sample:', error);
      // Si falla el procesamiento, usar el sample original
      processedSample = sample;
    }

    // Extraer todos los campos (base + temporales)
    const allFields = Object.keys(processedSample)
      .filter(key => !['_id', '__v', 'datasetId', 'createdAt', 'updatedAt'].includes(key))
      .map(key => {
        const value = processedSample[key];
        let type = 'string';
        let isTemporalField = false;
        let baseDateField = null;

        // Detectar tipo
        if (typeof value === 'number') {
          type = 'number';
        } else if (value instanceof Date) {
          type = 'date';
        } else if (typeof value === 'boolean') {
          type = 'boolean';
        }

        // Detectar si es campo temporal derivado
        if (key.includes('_year') || key.includes('_month') || key.includes('_day') ||
            key.includes('_hour') || key.includes('_minute') || key.includes('_week') ||
            key.includes('_quarter') || key.includes('Date') || key.includes('Label') ||
            key.includes('Name')) {
          isTemporalField = true;
          // Extraer el campo base (ej: "fecha" de "fecha_year")
          baseDateField = key.split('_')[0];
        }

        // Generar etiqueta legible
        let label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim();

        // Mejorar etiquetas de campos temporales
        if (isTemporalField) {
          if (key.endsWith('_year')) label = `${baseDateField} - Año`;
          else if (key.endsWith('_month')) label = `${baseDateField} - Mes (número)`;
          else if (key.endsWith('_day')) label = `${baseDateField} - Día`;
          else if (key.endsWith('_hour')) label = `${baseDateField} - Hora`;
          else if (key.endsWith('_yearMonth')) label = `${baseDateField} - Año-Mes`;
          else if (key.endsWith('_date')) label = `${baseDateField} - Fecha completa`;
          else if (key.endsWith('_dateHour')) label = `${baseDateField} - Por Hora`;
          else if (key.endsWith('_dateHalfHour')) label = `${baseDateField} - Por Media Hora`;
          else if (key.endsWith('_weekNumber')) label = `${baseDateField} - Número de Semana`;
          else if (key.endsWith('_quarter')) label = `${baseDateField} - Trimestre`;
          else if (key.endsWith('_dayOfWeek')) label = `${baseDateField} - Día de Semana (número)`;
          else if (key.endsWith('_dayOfWeekName')) label = `${baseDateField} - Día de Semana (nombre)`;
          else if (key.endsWith('_monthName')) label = `${baseDateField} - Mes (nombre)`;
          else if (key.endsWith('_hourLabel')) label = `${baseDateField} - Hora (etiqueta)`;
          else if (key.endsWith('_halfHourLabel')) label = `${baseDateField} - Media Hora (etiqueta)`;
          else if (key.endsWith('_quarterLabel')) label = `${baseDateField} - Trimestre (etiqueta)`;
          else if (key.endsWith('_weekLabel')) label = `${baseDateField} - Semana (etiqueta)`;
        }

        return {
          name: key,
          label: label,
          type: type,
          isTemporalField: isTemporalField,
          baseDateField: baseDateField
        };
      });

    return allFields;
  } catch (error) {
    console.error('[CUSTOM DASHBOARD] Error al obtener campos:', error);
    return [];
  }
}

/**
 * Construir query MongoDB desde filtros avanzados
 * Soporte para operadores lógicos anidados (AND/OR)
 */
function buildAdvancedQuery(filters) {
  if (!filters || !filters.conditions || filters.conditions.length === 0) {
    return {};
  }

  const conditions = [];

  // Procesar cada condición
  filters.conditions.forEach(condition => {
    const { field, operator, value, dataType } = condition;
    let fieldQuery = {};

    switch (operator) {
      case 'eq':
        fieldQuery[field] = value;
        break;
      case 'ne':
        fieldQuery[field] = { $ne: value };
        break;
      case 'gt':
        fieldQuery[field] = { $gt: dataType === 'date' ? new Date(value) : parseFloat(value) };
        break;
      case 'lt':
        fieldQuery[field] = { $lt: dataType === 'date' ? new Date(value) : parseFloat(value) };
        break;
      case 'gte':
        fieldQuery[field] = { $gte: dataType === 'date' ? new Date(value) : parseFloat(value) };
        break;
      case 'lte':
        fieldQuery[field] = { $lte: dataType === 'date' ? new Date(value) : parseFloat(value) };
        break;
      case 'in':
        fieldQuery[field] = { $in: Array.isArray(value) ? value : [value] };
        break;
      case 'nin':
        fieldQuery[field] = { $nin: Array.isArray(value) ? value : [value] };
        break;
      case 'between':
        if (Array.isArray(value) && value.length === 2) {
          const [min, max] = value;
          fieldQuery[field] = {
            $gte: dataType === 'date' ? new Date(min) : parseFloat(min),
            $lte: dataType === 'date' ? new Date(max) : parseFloat(max)
          };
        }
        break;
      case 'contains':
        fieldQuery[field] = { $regex: value, $options: 'i' };
        break;
      case 'startsWith':
        fieldQuery[field] = { $regex: `^${value}`, $options: 'i' };
        break;
      case 'endsWith':
        fieldQuery[field] = { $regex: `${value}$`, $options: 'i' };
        break;
      case 'regex':
        fieldQuery[field] = { $regex: value };
        break;
      case 'exists':
        fieldQuery[field] = { $exists: !!value };
        break;
    }

    if (Object.keys(fieldQuery).length > 0) {
      conditions.push(fieldQuery);
    }
  });

  // Si no hay condiciones válidas
  if (conditions.length === 0) return {};

  // Aplicar operador lógico (AND/OR)
  const logicOperator = filters.operator === 'OR' ? '$or' : '$and';

  if (conditions.length === 1) {
    return conditions[0];
  }

  return { [logicOperator]: conditions };
}

/**
 * Construir pipeline de agregación con agrupaciones múltiples
 * Soporta jerarquías de agrupación
 */
function buildAggregationPipeline(widgetConfig, campaignId) {
  const pipeline = [];

  // 1. Match - Filtrar por campaña
  const matchStage = { campaign: campaignId };

  // 2. Aplicar filtros avanzados
  if (widgetConfig.dataConfig?.filters) {
    const filterQuery = buildAdvancedQuery(widgetConfig.dataConfig.filters);
    Object.assign(matchStage, filterQuery);
  }

  pipeline.push({ $match: matchStage });

  // 3. Agrupaciones múltiples
  if (widgetConfig.dataConfig?.groupBy && Array.isArray(widgetConfig.dataConfig.groupBy)) {
    const groupBy = widgetConfig.dataConfig.groupBy.filter(g => g.field);

    if (groupBy.length > 0) {
      // Ordenar por jerarquía
      groupBy.sort((a, b) => (a.order || 0) - (b.order || 0));

      // Construir _id de agrupación
      const groupId = {};
      groupBy.forEach((group, index) => {
        const fieldName = `level${index}`;

        // Si es campo de fecha con granularidad
        if (group.granularity && group.granularity !== 'day') {
          groupId[fieldName] = buildDateTruncExpression(group.field, group.granularity);
        } else {
          groupId[fieldName] = `$${group.field}`;
        }
      });

      // Stage de agrupación
      const groupStage = {
        _id: groupId
      };

      // Agregar cálculo de agregación
      const aggType = widgetConfig.dataConfig?.aggregation?.type || 'count';
      const aggField = widgetConfig.dataConfig?.aggregation?.field;

      switch (aggType) {
        case 'sum':
          groupStage.value = { $sum: `$${aggField}` };
          break;
        case 'avg':
          groupStage.value = { $avg: `$${aggField}` };
          break;
        case 'count':
          groupStage.value = { $sum: 1 };
          break;
        case 'min':
          groupStage.value = { $min: `$${aggField}` };
          break;
        case 'max':
          groupStage.value = { $max: `$${aggField}` };
          break;
      }

      pipeline.push({ $group: groupStage });

      // 4. Proyección para renombrar campos
      const projectStage = { value: 1 };
      groupBy.forEach((group, index) => {
        projectStage[group.field] = `$_id.level${index}`;
      });
      pipeline.push({ $project: projectStage });
    }
  }

  // 5. Ordenamiento
  if (widgetConfig.dataConfig?.sortBy && Array.isArray(widgetConfig.dataConfig.sortBy)) {
    const sortStage = {};
    widgetConfig.dataConfig.sortBy.forEach(sort => {
      sortStage[sort.field] = sort.direction === 'desc' ? -1 : 1;
    });
    if (Object.keys(sortStage).length > 0) {
      pipeline.push({ $sort: sortStage });
    }
  }

  // 6. Límite de resultados
  if (widgetConfig.dataConfig?.limit) {
    pipeline.push({ $limit: parseInt(widgetConfig.dataConfig.limit) });
  }

  return pipeline;
}

/**
 * Construir expresión de truncado de fecha para MongoDB
 */
function buildDateTruncExpression(field, granularity) {
  const dateField = `$${field}`;

  switch (granularity) {
    case 'halfHour':
      return {
        $dateToString: {
          format: '%Y-%m-%d %H:%M',
          date: {
            $dateFromParts: {
              year: { $year: dateField },
              month: { $month: dateField },
              day: { $dayOfMonth: dateField },
              hour: { $hour: dateField },
              minute: {
                $cond: [
                  { $lt: [{ $minute: dateField }, 30] },
                  0,
                  30
                ]
              }
            }
          }
        }
      };

    case 'hour':
      return {
        $dateToString: {
          format: '%Y-%m-%d %H:00',
          date: {
            $dateFromParts: {
              year: { $year: dateField },
              month: { $month: dateField },
              day: { $dayOfMonth: dateField },
              hour: { $hour: dateField }
            }
          }
        }
      };

    case 'day':
      return { $dateToString: { format: '%Y-%m-%d', date: dateField } };

    case 'week':
      return {
        $concat: [
          { $toString: { $year: dateField } },
          '-W',
          { $toString: { $week: dateField } }
        ]
      };

    case 'month':
      return { $dateToString: { format: '%Y-%m', date: dateField } };

    case 'quarter':
      return {
        $concat: [
          { $toString: { $year: dateField } },
          '-Q',
          {
            $toString: {
              $ceil: { $divide: [{ $month: dateField }, 3] }
            }
          }
        ]
      };

    case 'year':
      return { $toString: { $year: dateField } };

    default:
      return dateField;
  }
}

/**
 * Calcular agregaciones estadísticas avanzadas
 */
function calculateAdvancedAggregation(records, aggType, field) {
  const values = records.map(r => parseFloat(r[field])).filter(v => !isNaN(v));

  switch (aggType) {
    case 'median':
      values.sort((a, b) => a - b);
      const mid = Math.floor(values.length / 2);
      return values.length % 2 === 0
        ? (values[mid - 1] + values[mid]) / 2
        : values[mid];

    case 'mode':
      const frequency = {};
      values.forEach(v => frequency[v] = (frequency[v] || 0) + 1);
      return Object.keys(frequency).reduce((a, b) =>
        frequency[a] > frequency[b] ? a : b
      );

    case 'stddev':
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      return Math.sqrt(variance);

    case 'variance':
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      return values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;

    default:
      return 0;
  }
}

module.exports = router;
