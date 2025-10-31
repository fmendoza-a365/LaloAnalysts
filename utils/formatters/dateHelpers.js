/**
 * Helpers para manejo de fechas
 * Centraliza conversiones de fechas Excel, formateo, etc.
 */

/**
 * Convierte fecha de Excel a Date de JavaScript
 * @param {number|string|Date} excelDate - Fecha en formato Excel (número serial o string)
 * @returns {Date|null} Fecha JavaScript o null si es inválida
 */
function excelDateToJSDate(excelDate) {
  if (!excelDate) return null;

  // Si ya es Date válido, retornar
  if (excelDate instanceof Date && !isNaN(excelDate.getTime())) {
    return excelDate;
  }

  // Si es string, intentar parsear
  if (typeof excelDate === 'string') {
    const parsed = new Date(excelDate);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  // Si es número (serial de Excel)
  if (typeof excelDate === 'number') {
    // Excel cuenta desde 1900-01-01, pero tiene bug del año bisiesto 1900
    // JavaScript cuenta desde 1970-01-01
    // Excel epoch: 1899-12-30 (día 0 en Excel)
    const excelEpoch = new Date(1899, 11, 30); // Mes 11 = Diciembre
    const jsDate = new Date(excelEpoch.getTime() + excelDate * 86400000);

    if (!isNaN(jsDate.getTime())) {
      return jsDate;
    }
  }

  return null;
}

/**
 * Formatea fecha a string en formato YYYY-MM-DD
 * @param {Date} date - Fecha a formatear
 * @returns {string} Fecha formateada
 */
function formatDate(date) {
  if (!date || !(date instanceof Date)) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Formatea fecha a string en formato DD/MM/YYYY
 * @param {Date} date - Fecha a formatear
 * @returns {string} Fecha formateada
 */
function formatDateDMY(date) {
  if (!date || !(date instanceof Date)) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${day}/${month}/${year}`;
}

/**
 * Calcula diferencia en días entre dos fechas
 * @param {Date} date1 - Primera fecha
 * @param {Date} date2 - Segunda fecha
 * @returns {number} Diferencia en días
 */
function daysDifference(date1, date2) {
  const diffTime = Math.abs(date2 - date1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Obtiene fecha de hace N días
 * @param {number} days - Número de días hacia atrás
 * @returns {Date} Fecha resultante
 */
function getDaysAgo(days) {
  const today = new Date();
  return new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
}

/**
 * Verifica si una fecha es válida
 * @param {Date} date - Fecha a verificar
 * @returns {boolean} True si es válida
 */
function isValidDate(date) {
  return date instanceof Date && !isNaN(date.getTime());
}

module.exports = {
  excelDateToJSDate,
  formatDate,
  formatDateDMY,
  daysDifference,
  getDaysAgo,
  isValidDate
};
