/**
 * Servicio de Detección Automática de Tipo de Dataset
 * Analiza las cabeceras de archivos Excel/CSV para determinar el tipo de dataset
 */

const XLSX = require('xlsx');

/**
 * Patrones de cabeceras para cada tipo de dataset
 */
const DATASET_PATTERNS = {
  // GENESYS - RENDIMIENTO
  'genesys-rendimiento': {
    requiredHeaders: ['ag', 'nombre', 'ofrecidas', 'contestadas'],
    optionalHeaders: ['manejo', 'tmo', 'acw', 'conversación'],
    minMatchPercentage: 0.6,
    keywords: ['ofrecidas', 'contestadas', 'manejo']
  },

  // GENESYS - ESTADOS
  'genesys-estados': {
    requiredHeaders: ['ag', 'nombre', 'conectado'],
    optionalHeaders: ['disponible', 'ocupado', 'descanso', 'comida', 'ausente'],
    minMatchPercentage: 0.6,
    keywords: ['conectado', 'disponible', 'estados']
  },

  // GENESYS - PROVISIÓN AGREGADA
  'genesys-provision-agregada': {
    requiredHeaders: ['fecha', 'cola', 'ofrecidas', 'contestadas'],
    optionalHeaders: ['abandonadas', 'tmo', 'ns', 'umbral'],
    minMatchPercentage: 0.7,
    keywords: ['cola', 'abandonadas', 'nivel de servicio', 'ns']
  },

  // ASISTENCIA
  'asistencia': {
    requiredHeaders: ['dni', 'fecha'],
    optionalHeaders: ['hora entrada', 'hora salida', 'horas trabajadas', 'tardanza'],
    minMatchPercentage: 0.6,
    keywords: ['asistencia', 'tardanza', 'hora entrada']
  },

  // NÓMINA
  'nomina': {
    requiredHeaders: ['dni', 'nombres', 'apellidos'],
    optionalHeaders: ['campaña', 'supervisor', 'salario', 'cargo'],
    minMatchPercentage: 0.6,
    keywords: ['nomina', 'salario', 'supervisor', 'campaña']
  },

  // TARIFAS
  'tarifas': {
    requiredHeaders: ['mesa', 'tarifa'],
    optionalHeaders: ['vigencia', 'desde', 'hasta'],
    minMatchPercentage: 0.8,
    keywords: ['tarifa', 'mesa', 'vigencia']
  },

  // ASESORES
  'asesores': {
    requiredHeaders: ['dni', 'nombres', 'apellidos'],
    optionalHeaders: ['nombre genesys', 'supervisor', 'estado', 'fecha alta'],
    minMatchPercentage: 0.6,
    keywords: ['asesor', 'genesys', 'estado', 'activo']
  }
};

/**
 * Normaliza un header para comparación
 */
function normalizeHeader(header) {
  if (!header) return '';
  return String(header)
    .toLowerCase()
    .trim()
    .replace(/[áàâä]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[íìîï]/g, 'i')
    .replace(/[óòôö]/g, 'o')
    .replace(/[úùûü]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Extrae headers del archivo
 */
function extractHeaders(buffer, filename) {
  try {
    const ext = filename.toLowerCase().split('.').pop();

    if (ext === 'csv') {
      // Para CSV, leer primera línea
      const text = buffer.toString('utf-8');
      const firstLine = text.split('\n')[0];
      return firstLine.split(/[,;|\t]/).map(h => normalizeHeader(h));
    } else if (ext === 'xlsx' || ext === 'xls') {
      // Para Excel
      const workbook = XLSX.read(buffer, { type: 'buffer', sheetRows: 1 });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

      if (data && data[0]) {
        return data[0].map(h => normalizeHeader(h));
      }
    }
  } catch (error) {
    console.error('[DATASET DETECTOR] Error extrayendo headers:', error);
  }
  return [];
}

/**
 * Calcula el score de match entre headers y un patrón
 */
function calculateMatchScore(headers, pattern) {
  let score = 0;
  let totalChecks = 0;

  // Normalizar todos los headers
  const normalizedHeaders = headers.map(h => normalizeHeader(h));
  const headersStr = normalizedHeaders.join(' ');

  // Verificar headers requeridos
  for (const required of pattern.requiredHeaders) {
    totalChecks++;
    const normalizedRequired = normalizeHeader(required);

    // Buscar match exacto o parcial
    const hasMatch = normalizedHeaders.some(h =>
      h.includes(normalizedRequired) || normalizedRequired.includes(h)
    );

    if (hasMatch) {
      score += 2; // Peso doble para requeridos
    }
  }

  // Verificar headers opcionales
  for (const optional of pattern.optionalHeaders) {
    totalChecks++;
    const normalizedOptional = normalizeHeader(optional);

    const hasMatch = normalizedHeaders.some(h =>
      h.includes(normalizedOptional) || normalizedOptional.includes(h)
    );

    if (hasMatch) {
      score += 1; // Peso simple para opcionales
    }
  }

  // Verificar keywords en todo el conjunto de headers
  for (const keyword of pattern.keywords) {
    if (headersStr.includes(normalizeHeader(keyword))) {
      score += 0.5;
    }
  }

  // Calcular porcentaje de match
  const maxScore = (pattern.requiredHeaders.length * 2) + pattern.optionalHeaders.length + (pattern.keywords.length * 0.5);
  const percentage = maxScore > 0 ? score / maxScore : 0;

  return { score, percentage, totalChecks };
}

/**
 * Detecta el tipo de dataset basado en los headers
 * @param {Buffer} fileBuffer - Buffer del archivo
 * @param {string} filename - Nombre del archivo
 * @returns {Object} - { type, confidence, matches, headers }
 */
function detectDatasetType(fileBuffer, filename) {
  const headers = extractHeaders(fileBuffer, filename);

  if (!headers || headers.length === 0) {
    return {
      type: null,
      confidence: 0,
      matches: [],
      headers: [],
      error: 'No se pudieron extraer headers del archivo'
    };
  }

  console.log('[DATASET DETECTOR] Headers encontrados:', headers);

  // Calcular scores para cada tipo
  const matches = [];

  for (const [type, pattern] of Object.entries(DATASET_PATTERNS)) {
    const matchResult = calculateMatchScore(headers, pattern);

    if (matchResult.percentage >= pattern.minMatchPercentage) {
      matches.push({
        type,
        confidence: matchResult.percentage,
        score: matchResult.score,
        matchedHeaders: matchResult.totalChecks
      });
    }
  }

  // Ordenar por confianza
  matches.sort((a, b) => b.confidence - a.confidence);

  const bestMatch = matches[0];

  return {
    type: bestMatch ? bestMatch.type : null,
    confidence: bestMatch ? bestMatch.confidence : 0,
    matches: matches.slice(0, 3), // Top 3 matches
    headers: headers,
    detectedAt: new Date()
  };
}

/**
 * Mapea tipo detectado a configuración de procesamiento
 */
function getProcessingConfig(detectedType) {
  const typeMapping = {
    'genesys-rendimiento': {
      route: '/admin/genesys/upload',
      parser: 'parseRendimiento',
      model: 'GenesysDataset',
      tipo: 'rendimiento',
      requiresPeriod: true
    },
    'genesys-estados': {
      route: '/admin/genesys/upload',
      parser: 'parseEstados',
      model: 'GenesysDataset',
      tipo: 'estados',
      requiresPeriod: true
    },
    'genesys-provision-agregada': {
      route: '/admin/genesys/upload',
      parser: 'parseProvisionAgregada',
      model: 'ProvisionDataset',
      tipo: 'provision-agregada',
      requiresPeriod: true
    },
    'asistencia': {
      route: '/admin/asistencia/upload',
      parser: 'parseAsistencia',
      model: 'AsistenciaDataset',
      tipo: null,
      requiresPeriod: true
    },
    'nomina': {
      route: '/admin/nomina/upload',
      parser: 'parseNomina',
      model: 'NominaDataset',
      tipo: null,
      requiresPeriod: true
    },
    'tarifas': {
      route: '/admin/tarifas/upload',
      parser: 'parseTarifasCSV',
      model: 'Tarifa',
      tipo: null,
      requiresPeriod: false
    },
    'asesores': {
      route: '/admin/asesores/carga',
      parser: 'parseAsesores',
      model: 'Asesor',
      tipo: null,
      requiresPeriod: false
    }
  };

  return typeMapping[detectedType] || null;
}

/**
 * Valida si un archivo puede ser procesado
 */
function canProcessFile(filename) {
  const ext = filename.toLowerCase().split('.').pop();
  return ['csv', 'xlsx', 'xls'].includes(ext);
}

module.exports = {
  detectDatasetType,
  getProcessingConfig,
  canProcessFile,
  extractHeaders,
  normalizeHeader
};
