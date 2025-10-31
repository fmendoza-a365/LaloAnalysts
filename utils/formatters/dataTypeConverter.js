/**
 * Data Type Converter
 * Convierte automáticamente los tipos de datos en los datasets
 * Similar al "Data Type Detection" de Power BI
 */

/**
 * Detectar y convertir el tipo de dato de un valor
 */
function detectAndConvert(value) {
  // Null o undefined
  if (value === null || value === undefined || value === '') {
    return null;
  }

  // Ya es un objeto Date
  if (value instanceof Date) {
    return value;
  }

  // String
  if (typeof value === 'string') {
    const trimmed = value.trim();

    // Intentar detectar fecha
    const dateValue = detectDate(trimmed);
    if (dateValue) {
      return dateValue;
    }

    // Intentar detectar número
    const numberValue = detectNumber(trimmed);
    if (numberValue !== null) {
      return numberValue;
    }

    // Intentar detectar booleano
    const boolValue = detectBoolean(trimmed);
    if (boolValue !== null) {
      return boolValue;
    }

    // Mantener como string
    return trimmed;
  }

  // Número
  if (typeof value === 'number') {
    return value;
  }

  // Booleano
  if (typeof value === 'boolean') {
    return value;
  }

  // Otro tipo, devolver tal cual
  return value;
}

/**
 * Detectar si un string es una fecha y convertirla
 */
function detectDate(str) {
  // Patrones de fecha comunes
  const datePatterns = [
    // ISO 8601: 2024-01-15, 2024-01-15T10:30:00
    /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/,
    // DD/MM/YYYY o DD-MM-YYYY
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
    // DD/MM/YYYY HH:MM:SS
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})/,
    // DD/MM/YYYY HH:MM
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\s+(\d{1,2}):(\d{2})/,
    // YYYY/MM/DD
    /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
  ];

  for (const pattern of datePatterns) {
    if (pattern.test(str)) {
      const parsed = new Date(str);
      // Verificar que sea una fecha válida
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }

      // Si falla el constructor de Date, intentar parseo manual para DD/MM/YYYY
      if (/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/.test(str)) {
        const match = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
        if (match) {
          const day = parseInt(match[1], 10);
          const month = parseInt(match[2], 10) - 1; // Mes base 0
          const year = parseInt(match[3], 10);
          const date = new Date(year, month, day);

          // Verificar que la fecha sea válida
          if (date.getFullYear() === year &&
              date.getMonth() === month &&
              date.getDate() === day) {
            return date;
          }
        }
      }
    }
  }

  return null;
}

/**
 * Detectar si un string es un número y convertirlo
 */
function detectNumber(str) {
  // Remover espacios y comas de miles
  const cleaned = str.replace(/[\s,]/g, '');

  // Verificar si es un número válido
  if (/^-?\d+(\.\d+)?$/.test(cleaned)) {
    const num = parseFloat(cleaned);
    if (!isNaN(num)) {
      return num;
    }
  }

  // Detectar porcentajes (ej: "85%")
  if (/^-?\d+(\.\d+)?%$/.test(cleaned)) {
    const num = parseFloat(cleaned.replace('%', ''));
    if (!isNaN(num)) {
      return num; // Devolver el número sin el %
    }
  }

  return null;
}

/**
 * Detectar si un string es un booleano
 */
function detectBoolean(str) {
  const lower = str.toLowerCase();

  if (lower === 'true' || lower === 'verdadero' || lower === 'sí' || lower === 'si' || lower === '1') {
    return true;
  }

  if (lower === 'false' || lower === 'falso' || lower === 'no' || lower === '0') {
    return false;
  }

  return null;
}

/**
 * Convertir todos los valores de un objeto (registro)
 */
function convertRecord(record) {
  const converted = {};

  for (const [key, value] of Object.entries(record)) {
    // Saltar campos especiales de MongoDB
    if (key === '_id' || key === '__v' || key === 'createdAt' || key === 'updatedAt') {
      converted[key] = value;
      continue;
    }

    converted[key] = detectAndConvert(value);
  }

  return converted;
}

/**
 * Convertir todos los registros de un array
 */
function convertRecords(records) {
  return records.map(record => convertRecord(record));
}

/**
 * Extraer componentes temporales de una fecha
 * Genera campos virtuales para agrupar por diferentes granularidades
 */
function extractTemporalFields(date, fieldName = 'fecha') {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return {};
  }

  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const dayOfWeek = date.getDay(); // 0 = Domingo, 6 = Sábado

  // Calcular número de semana del año
  const startOfYear = new Date(year, 0, 1);
  const dayOfYear = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);

  // Calcular trimestre
  const quarter = Math.ceil(month / 3);

  // Media hora (0 o 30)
  const halfHour = minute < 30 ? 0 : 30;

  return {
    // Campos básicos
    [`${fieldName}_year`]: year,
    [`${fieldName}_month`]: month,
    [`${fieldName}_day`]: day,
    [`${fieldName}_hour`]: hour,
    [`${fieldName}_minute`]: minute,

    // Campos compuestos
    [`${fieldName}_yearMonth`]: `${year}-${String(month).padStart(2, '0')}`, // "2024-01"
    [`${fieldName}_date`]: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`, // "2024-01-15"
    [`${fieldName}_dateHour`]: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:00`, // "2024-01-15 10:00"
    [`${fieldName}_dateHalfHour`]: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(halfHour).padStart(2, '0')}`, // "2024-01-15 10:30"

    // Campos temporales avanzados
    [`${fieldName}_weekNumber`]: weekNumber,
    [`${fieldName}_quarter`]: quarter,
    [`${fieldName}_dayOfWeek`]: dayOfWeek,
    [`${fieldName}_dayOfWeekName`]: getDayName(dayOfWeek),
    [`${fieldName}_monthName`]: getMonthName(month - 1),

    // Etiquetas para UI
    [`${fieldName}_hourLabel`]: `${String(hour).padStart(2, '0')}:00`,
    [`${fieldName}_halfHourLabel`]: `${String(hour).padStart(2, '0')}:${String(halfHour).padStart(2, '0')}`,
    [`${fieldName}_quarterLabel`]: `Q${quarter} ${year}`,
    [`${fieldName}_weekLabel`]: `Semana ${weekNumber} (${year})`
  };
}

/**
 * Obtener nombre del día de la semana
 */
function getDayName(dayOfWeek) {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[dayOfWeek] || '';
}

/**
 * Obtener nombre del mes
 */
function getMonthName(month) {
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return months[month] || '';
}

/**
 * Agregar campos temporales a un registro
 * Detecta automáticamente campos de fecha y agrega campos derivados
 */
function addTemporalFields(record) {
  const enriched = { ...record };

  // Buscar campos que sean fechas
  for (const [key, value] of Object.entries(record)) {
    if (value instanceof Date && !isNaN(value.getTime())) {
      // Agregar campos temporales derivados
      const temporalFields = extractTemporalFields(value, key);
      Object.assign(enriched, temporalFields);
    }
  }

  return enriched;
}

/**
 * Procesar un dataset completo: convertir tipos y agregar campos temporales
 */
function processDataset(records) {
  // 1. Convertir tipos de datos
  const converted = convertRecords(records);

  // 2. Agregar campos temporales
  const enriched = converted.map(record => addTemporalFields(record));

  return enriched;
}

/**
 * Obtener información de los tipos de datos de un dataset
 */
function getDatasetSchema(records) {
  if (!records || records.length === 0) {
    return {};
  }

  const schema = {};
  const sample = records[0];

  for (const [key, value] of Object.entries(sample)) {
    let type = 'string';
    let hasTemporalFields = false;

    if (value instanceof Date) {
      type = 'date';
      hasTemporalFields = true;
    } else if (typeof value === 'number') {
      type = 'number';
    } else if (typeof value === 'boolean') {
      type = 'boolean';
    }

    schema[key] = {
      type,
      hasTemporalFields,
      temporalOptions: hasTemporalFields ? [
        { value: `${key}_date`, label: 'Por Día', granularity: 'day' },
        { value: `${key}_dateHour`, label: 'Por Hora', granularity: 'hour' },
        { value: `${key}_dateHalfHour`, label: 'Por Media Hora', granularity: 'halfHour' },
        { value: `${key}_weekNumber`, label: 'Por Semana', granularity: 'week' },
        { value: `${key}_yearMonth`, label: 'Por Mes', granularity: 'month' },
        { value: `${key}_quarter`, label: 'Por Trimestre', granularity: 'quarter' },
        { value: `${key}_year`, label: 'Por Año', granularity: 'year' },
        { value: `${key}_dayOfWeekName`, label: 'Por Día de la Semana', granularity: 'dayOfWeek' }
      ] : []
    };
  }

  return schema;
}

module.exports = {
  detectAndConvert,
  detectDate,
  detectNumber,
  detectBoolean,
  convertRecord,
  convertRecords,
  extractTemporalFields,
  addTemporalFields,
  processDataset,
  getDatasetSchema,
  getDayName,
  getMonthName
};
