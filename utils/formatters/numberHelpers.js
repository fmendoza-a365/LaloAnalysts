/**
 * Helpers para formateo de números
 * Centraliza parseo de monedas, formateo, etc.
 */

/**
 * Parsea string de moneda a número
 * Maneja formatos: "$1,234.56", "1.234,56", "$1234.56", etc.
 * @param {string} str - String a parsear
 * @returns {number} Número parseado o 0 si es inválido
 */
function parsearMoneda(str) {
  if (!str) return 0;
  if (typeof str === 'number') return str;

  // Eliminar símbolos de moneda y espacios
  let cleaned = str.toString().trim();
  cleaned = cleaned.replace(/[$€£¥\s]/g, '');

  // Detectar si usa coma como decimal (formato europeo)
  const hasCommaDecimal = cleaned.match(/,\d{2}$/);

  if (hasCommaDecimal) {
    // Formato europeo: 1.234,56
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    // Formato americano: 1,234.56
    cleaned = cleaned.replace(/,/g, '');
  }

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formatea número a moneda
 * @param {number} value - Valor a formatear
 * @param {string} currency - Símbolo de moneda (default: '$')
 * @param {number} decimals - Decimales a mostrar (default: 2)
 * @returns {string} Número formateado
 */
function formatearMoneda(value, currency = '$', decimals = 2) {
  if (value === null || value === undefined) return `${currency}0.00`;

  const formatted = value.toLocaleString('es-MX', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

  return `${currency}${formatted}`;
}

/**
 * Formatea número con separador de miles
 * @param {number} value - Valor a formatear
 * @param {number} decimals - Decimales a mostrar (default: 0)
 * @returns {string} Número formateado
 */
function formatearNumero(value, decimals = 0) {
  if (value === null || value === undefined) return '0';

  return value.toLocaleString('es-MX', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Formatea número como porcentaje
 * @param {number} value - Valor a formatear (0-100)
 * @param {number} decimals - Decimales a mostrar (default: 2)
 * @returns {string} Porcentaje formateado
 */
function formatearPorcentaje(value, decimals = 2) {
  if (value === null || value === undefined) return '0.00%';

  return `${value.toFixed(decimals)}%`;
}

/**
 * Convierte segundos a formato HH:MM:SS
 * @param {number} seconds - Segundos totales
 * @returns {string} Tiempo formateado
 */
function formatearTiempo(seconds) {
  if (!seconds || seconds < 0) return '00:00:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Redondea número a N decimales
 * @param {number} value - Valor a redondear
 * @param {number} decimals - Decimales (default: 2)
 * @returns {number} Valor redondeado
 */
function redondear(value, decimals = 2) {
  if (value === null || value === undefined) return 0;

  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Calcula porcentaje de un valor respecto a un total
 * @param {number} value - Valor parcial
 * @param {number} total - Valor total
 * @param {number} decimals - Decimales (default: 2)
 * @returns {number} Porcentaje calculado
 */
function calcularPorcentaje(value, total, decimals = 2) {
  if (!total || total === 0) return 0;
  const percentage = (value / total) * 100;
  return redondear(percentage, decimals);
}

module.exports = {
  parsearMoneda,
  formatearMoneda,
  formatearNumero,
  formatearPorcentaje,
  formatearTiempo,
  redondear,
  calcularPorcentaje
};
