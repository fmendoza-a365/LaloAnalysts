/**
 * Constantes para índices de columnas CSV
 * Centraliza todos los magic numbers de parseo de archivos
 */

/**
 * Columnas del archivo de NÓMINA
 */
const NOMINA_COLUMNS = {
  CODIGO_SCIRE: 1,
  NOMBRE_COMPLETO: 13,
  FECHA_NACIMIENTO: 14,
  GRUPO: 19,
  CAMPANA: 20,
  SUELDO_BASICO: 26,
  NETO_A_PAGAR: 89,
  SUELDO_BRUTO: 111,
  COSTO_EMPLEADOR: 113,
  COSTO_TOTAL_EMPLEADOR: 114,
  COSTO_TOTAL: 115
};

/**
 * Línea desde donde empezar a leer (después del header)
 */
const NOMINA_START_LINE = 8;

/**
 * Columnas del archivo de PROVISIÓN
 */
const PROVISION_COLUMNS = {
  // TODO: Agregar índices específicos cuando se identifiquen
};

/**
 * Columnas del archivo de ASISTENCIA
 */
const ASISTENCIA_COLUMNS = {
  // TODO: Agregar índices específicos cuando se identifiquen
};

/**
 * Columnas del archivo de GENESYS - Estados
 */
const GENESYS_ESTADOS_COLUMNS = {
  // TODO: Agregar índices específicos cuando se identifiquen
};

/**
 * Columnas del archivo de GENESYS - Rendimiento
 */
const GENESYS_RENDIMIENTO_COLUMNS = {
  // TODO: Agregar índices específicos cuando se identifiquen
};

module.exports = {
  NOMINA_COLUMNS,
  NOMINA_START_LINE,
  PROVISION_COLUMNS,
  ASISTENCIA_COLUMNS,
  GENESYS_ESTADOS_COLUMNS,
  GENESYS_RENDIMIENTO_COLUMNS
};
