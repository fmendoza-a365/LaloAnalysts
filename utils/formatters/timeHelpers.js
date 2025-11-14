/**
 * Utilidades para formateo de tiempo
 * Centraliza funciones duplicadas de conversión de tiempo
 */

/**
 * Convierte segundos a formato HH:MM:SS
 * @param {number} seconds - Segundos a convertir
 * @returns {string} - Tiempo en formato HH:MM:SS
 */
function secondsToHMS(seconds) {
  if (seconds == null || isNaN(seconds)) return '00:00:00';

  const sec = Math.abs(Math.round(seconds));
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const secs = sec % 60;

  return [hours, minutes, secs]
    .map(v => v.toString().padStart(2, '0'))
    .join(':');
}

/**
 * Convierte segundos a formato MM:SS
 * @param {number} seconds - Segundos a convertir
 * @returns {string} - Tiempo en formato MM:SS
 */
function secondsToMS(seconds) {
  if (seconds == null || isNaN(seconds)) return '00:00';

  const sec = Math.abs(Math.round(seconds));
  const minutes = Math.floor(sec / 60);
  const secs = sec % 60;

  return [minutes, secs]
    .map(v => v.toString().padStart(2, '0'))
    .join(':');
}

/**
 * Convierte formato HH:MM:SS a segundos
 * @param {string} timeString - Tiempo en formato HH:MM:SS o MM:SS
 * @returns {number} - Segundos
 */
function hmsToSeconds(timeString) {
  if (!timeString || typeof timeString !== 'string') return 0;

  const parts = timeString.split(':').map(p => parseInt(p, 10) || 0);

  if (parts.length === 3) {
    // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1];
  }

  return 0;
}

/**
 * Formatea segundos a formato legible (ej: "2h 30m", "45m", "30s")
 * @param {number} seconds - Segundos a convertir
 * @param {boolean} short - Si true, usa formato corto (h, m, s)
 * @returns {string} - Tiempo formateado
 */
function formatSecondsHuman(seconds, short = false) {
  if (seconds == null || isNaN(seconds)) return short ? '0s' : '0 segundos';

  const sec = Math.abs(Math.round(seconds));
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const secs = sec % 60;

  const parts = [];

  if (hours > 0) {
    parts.push(short ? `${hours}h` : `${hours} hora${hours !== 1 ? 's' : ''}`);
  }
  if (minutes > 0) {
    parts.push(short ? `${minutes}m` : `${minutes} minuto${minutes !== 1 ? 's' : ''}`);
  }
  if (secs > 0 || parts.length === 0) {
    parts.push(short ? `${secs}s` : `${secs} segundo${secs !== 1 ? 's' : ''}`);
  }

  return parts.join(' ');
}

/**
 * Calcula promedio de tiempos en segundos
 * @param {Array<number>} times - Array de tiempos en segundos
 * @returns {number} - Promedio en segundos
 */
function averageTime(times) {
  if (!Array.isArray(times) || times.length === 0) return 0;

  const validTimes = times.filter(t => t != null && !isNaN(t));
  if (validTimes.length === 0) return 0;

  const sum = validTimes.reduce((acc, t) => acc + Number(t), 0);
  return sum / validTimes.length;
}

module.exports = {
  secondsToHMS,
  secondsToMS,
  hmsToSeconds,
  formatSecondsHuman,
  averageTime
};
