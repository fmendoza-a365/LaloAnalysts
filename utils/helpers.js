/**
 * Utilidades y helpers globales para la aplicación
 */

/**
 * Formatea un número como porcentaje con exactamente 2 decimales
 * @param {number} value - El valor a formatear (puede ser un decimal como 0.85 o un número como 85)
 * @param {boolean} isDecimal - Si el valor ya está en formato decimal (0.85) o es un número entero (85)
 * @returns {string} - El porcentaje formateado como "00.00"
 */
function formatPercentage(value, isDecimal = false) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.00';
  }

  const numValue = parseFloat(value);
  const percentage = isDecimal ? numValue * 100 : numValue;

  return percentage.toFixed(2);
}

/**
 * Formatea un número con máximo 2 decimales
 * @param {number} value - El valor a formatear
 * @param {number} maxDecimals - Máximo número de decimales (default: 2)
 * @returns {string} - El número formateado
 */
function formatNumber(value, maxDecimals = 2) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }

  const numValue = parseFloat(value);

  // Si es un número entero, devolverlo sin decimales
  if (Number.isInteger(numValue)) {
    return numValue.toString();
  }

  // Si tiene decimales, limitarlos al máximo especificado
  return numValue.toFixed(maxDecimals);
}

/**
 * Formatea un número para display con separadores de miles y máximo 2 decimales
 * @param {number} value - El valor a formatear
 * @param {object} options - Opciones de formato
 * @returns {string} - El número formateado con separadores
 */
function formatNumberLocale(value, options = {}) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }

  const defaults = {
    locale: 'es-PE',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  };

  const finalOptions = { ...defaults, ...options };
  const { locale, ...toLocaleOptions } = finalOptions;

  return parseFloat(value).toLocaleString(locale, toLocaleOptions);
}

/**
 * Registra los helpers globales en la aplicación Express
 * @param {object} app - La instancia de la aplicación Express
 */
function registerGlobalHelpers(app) {
  // Hacer disponibles los helpers en todas las vistas EJS
  app.locals.formatPercentage = formatPercentage;
  app.locals.formatNumber = formatNumber;
  app.locals.formatNumberLocale = formatNumberLocale;
}

module.exports = {
  formatPercentage,
  formatNumber,
  formatNumberLocale,
  registerGlobalHelpers
};
