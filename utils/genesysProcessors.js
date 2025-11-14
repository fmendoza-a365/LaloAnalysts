/**
 * Utilidades para procesar datos de Genesys
 * Centraliza la lógica duplicada de procesamiento de estados y rendimiento
 */

/**
 * Helper para seleccionar el primer valor no nulo/vacío de un conjunto de claves
 */
function pick(obj, keys) {
  for (const k of keys) {
    if (obj[k] != null && obj[k] !== '') return obj[k];
  }
  return null;
}

/**
 * Helper para establecer un valor en el mapa de indicadores
 */
function setIndicator(map, agent, metric, value) {
  if (value != null && !map.has(agent)) {
    map.set(agent, {});
  }
  if (value != null) {
    map.get(agent)[metric] = value;
  }
}

/**
 * Procesa registros de estados de Genesys
 * @param {Array} records - Registros de GenesysRecord
 * @param {Map} indicatorsMap - Mapa de indicadores (puede ser nuevo o existente)
 * @returns {Map} - Mapa actualizado con estados
 */
function processEstadosRecords(records, indicatorsMap = new Map()) {
  for (const r of records) {
    const d = r.data || {};
    setIndicator(indicatorsMap, r.ag, 'Conectado', pick(d, ['Conectado']));
    setIndicator(indicatorsMap, r.ag, 'En Cola', pick(d, ['En Cola']));
    setIndicator(indicatorsMap, r.ag, 'Fuera de Cola', pick(d, ['Fuera de Cola']));
    setIndicator(indicatorsMap, r.ag, 'Interactuando', pick(d, ['Interactuando']));
    setIndicator(indicatorsMap, r.ag, 'No Responde', pick(d, ['No Responde']));
    setIndicator(indicatorsMap, r.ag, 'Inactivo', pick(d, ['Inactivo']));
    setIndicator(indicatorsMap, r.ag, 'Disponible', pick(d, ['Disponible']));
    setIndicator(indicatorsMap, r.ag, 'Comida', pick(d, ['Comida']));
    setIndicator(indicatorsMap, r.ag, 'Ocupado', pick(d, ['Ocupado']));
    setIndicator(indicatorsMap, r.ag, 'Ausente', pick(d, ['Ausente']));
    setIndicator(indicatorsMap, r.ag, 'Descanso', pick(d, ['Descanso']));
    setIndicator(indicatorsMap, r.ag, 'Sistema Ausente', pick(d, ['Sistema Ausente']));
    setIndicator(indicatorsMap, r.ag, 'Reunión', pick(d, ['Reunión']));
    setIndicator(indicatorsMap, r.ag, 'Capacitación', pick(d, ['Capacitación']));
    setIndicator(indicatorsMap, r.ag, 'En Comunicación', pick(d, ['En Comunicación']));
  }
  return indicatorsMap;
}

/**
 * Procesa registros de rendimiento de Genesys
 * @param {Array} records - Registros de GenesysRecord
 * @param {Map} indicatorsMap - Mapa de indicadores (puede ser nuevo o existente)
 * @returns {Map} - Mapa actualizado con rendimiento
 */
function processRendimientoRecords(records, indicatorsMap = new Map()) {
  for (const r of records) {
    const d = r.data || {};

    const ofrecidas = pick(d, ['Ofrecidas', 'Total de alertas', 'Total que están contactando']);
    const contestadas = pick(d, ['Contestadas', 'Manejo']);
    const noContestadas = (ofrecidas != null && contestadas != null)
      ? (Number(ofrecidas) - Number(contestadas))
      : pick(d, ['No Contestadas']);

    setIndicator(indicatorsMap, r.ag, 'Ofrecidas', ofrecidas);
    setIndicator(indicatorsMap, r.ag, 'Contestadas', contestadas);
    setIndicator(indicatorsMap, r.ag, 'No Contestadas', noContestadas);
    setIndicator(indicatorsMap, r.ag, 'Tiempo Medio Operativo', pick(d, ['Manejo medio']));
    setIndicator(indicatorsMap, r.ag, 'Tiempo Medio Conversación', pick(d, ['Conversación media']));
    setIndicator(indicatorsMap, r.ag, 'Tiempo Medio ACW', pick(d, ['ACW medio']));
    setIndicator(indicatorsMap, r.ag, 'Tiempo Medio Retención', pick(d, ['Retención media', 'Retención media manejada']));
  }
  return indicatorsMap;
}

/**
 * Procesa datasets de Estados y Rendimiento de Genesys
 * @param {Object} GenesysRecord - Modelo de GenesysRecord
 * @param {Object} estadosDataset - Dataset de estados (puede ser null)
 * @param {Object} rendimientoDataset - Dataset de rendimiento (puede ser null)
 * @returns {Promise<Object>} - Objeto con indicadores por agente
 */
async function processGenesysDatasets(GenesysRecord, estadosDataset, rendimientoDataset) {
  const indicatorsMap = new Map();

  // Procesar Estados
  if (estadosDataset) {
    const estadosRecords = await GenesysRecord
      .find({ datasetId: estadosDataset._id })
      .select('ag data')
      .lean(); // Usar lean() para mejor performance
    processEstadosRecords(estadosRecords, indicatorsMap);
  }

  // Procesar Rendimiento
  if (rendimientoDataset) {
    const rendimientoRecords = await GenesysRecord
      .find({ datasetId: rendimientoDataset._id })
      .select('ag data')
      .lean(); // Usar lean() para mejor performance
    processRendimientoRecords(rendimientoRecords, indicatorsMap);
  }

  // Convertir Map a Object
  return indicatorsMap.size ? Object.fromEntries(indicatorsMap) : {};
}

/**
 * Calcula KPIs globales a partir de los indicadores procesados
 * @param {Object} indicadores - Objeto con indicadores por agente
 * @returns {Object} - KPIs globales calculados
 */
function calculateGlobalKPIs(indicadores) {
  let totalOfrecidas = 0;
  let totalContestadas = 0;
  let totalNoContestadas = 0;
  let sumaConectado = 0;
  let sumaEnComunicacion = 0;
  let conteoAgentes = 0;

  for (const ag of Object.keys(indicadores)) {
    const ind = indicadores[ag];
    conteoAgentes++;

    if (ind.Ofrecidas != null) totalOfrecidas += Number(ind.Ofrecidas);
    if (ind.Contestadas != null) totalContestadas += Number(ind.Contestadas);
    if (ind['No Contestadas'] != null) totalNoContestadas += Number(ind['No Contestadas']);
    if (ind.Conectado != null) sumaConectado += Number(ind.Conectado);
    if (ind['En Comunicación'] != null) sumaEnComunicacion += Number(ind['En Comunicación']);
  }

  const nivelServicio = totalOfrecidas > 0 ? (totalContestadas / totalOfrecidas * 100).toFixed(2) : '0.00';
  const promedioConectado = conteoAgentes > 0 ? (sumaConectado / conteoAgentes).toFixed(2) : '0.00';
  const promedioEnComunicacion = conteoAgentes > 0 ? (sumaEnComunicacion / conteoAgentes).toFixed(2) : '0.00';

  return {
    totalOfrecidas,
    totalContestadas,
    totalNoContestadas,
    nivelServicio,
    promedioConectado,
    promedioEnComunicacion,
    conteoAgentes
  };
}

module.exports = {
  pick,
  setIndicator,
  processEstadosRecords,
  processRendimientoRecords,
  processGenesysDatasets,
  calculateGlobalKPIs
};
