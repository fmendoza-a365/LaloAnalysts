/**
 * Constantes para el Dashboard
 * Centraliza valores hardcodeados del sistema de dashboards
 */

/**
 * Filtros de antigüedad (en días)
 */
const ANTIGUEDAD_FILTERS = {
  NUEVO_DIAS: 30,
  INTERMEDIO_DIAS: 90
};

/**
 * Configuración de volumen base para provisión
 */
const PROVISION_VOLUME = {
  BASE_HORAS_PICO: 800,
  BASE_HORAS_BAJA: 200,
  HORAS_PICO_INICIO: 8,
  HORAS_PICO_FIN: 18
};

/**
 * Límites de paginación
 */
const PAGINATION = {
  MIN_PER_PAGE: 5,
  MAX_PER_PAGE: 50,
  DEFAULT_PER_PAGE: 12
};

/**
 * Límites de upload de archivos (en bytes)
 */
const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 25 * 1024 * 1024, // 25 MB
  MAX_FIELD_SIZE: 10 * 1024 * 1024  // 10 MB
};

/**
 * Campos a excluir del dataset al extraer metadatos
 */
const DATASET_EXCLUDED_FIELDS = [
  '_id',
  '__v',
  'datasetId',
  'createdAt',
  'updatedAt'
];

/**
 * Tipos de datasets disponibles
 */
const DATASET_TYPES = [
  'provision',
  'asistencia',
  'genesys',
  'nomina',
  'asesores'
];

/**
 * Tipos de gráficos disponibles
 */
const CHART_TYPES = [
  'line',
  'bar',
  'horizontalBar',
  'pie',
  'doughnut',
  'area',
  'scatter',
  'radar',
  'polarArea',
  'bubble',
  'mixed'
];

/**
 * Tipos de agregación disponibles
 */
const AGGREGATION_TYPES = [
  'sum',
  'avg',
  'count',
  'min',
  'max',
  'median',
  'mode',
  'stddev',
  'variance',
  'custom'
];

/**
 * Granularidades temporales
 */
const TIME_GRANULARITIES = [
  'halfHour',
  'hour',
  'day',
  'week',
  'month',
  'quarter',
  'year'
];

/**
 * Operadores de filtros
 */
const FILTER_OPERATORS = [
  'eq',    // Igual
  'ne',    // Diferente
  'gt',    // Mayor que
  'lt',    // Menor que
  'gte',   // Mayor o igual
  'lte',   // Menor o igual
  'in',    // En lista
  'nin',   // No en lista
  'between', // Entre
  'contains', // Contiene
  'startsWith', // Empieza con
  'endsWith',   // Termina con
  'regex',      // Expresión regular
  'exists'      // Existe
];

module.exports = {
  ANTIGUEDAD_FILTERS,
  PROVISION_VOLUME,
  PAGINATION,
  UPLOAD_LIMITS,
  DATASET_EXCLUDED_FIELDS,
  DATASET_TYPES,
  CHART_TYPES,
  AGGREGATION_TYPES,
  TIME_GRANULARITIES,
  FILTER_OPERATORS
};
