/**
 * Configuración y utilidades para Widgets del Dashboard
 * Sistema modular similar a Power BI
 */

// ============================================
// PALETAS DE COLORES PREDEFINIDAS
// ============================================
const COLOR_PALETTES = {
  default: ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b'],
  material: ['#2196F3', '#F44336', '#4CAF50', '#FF9800', '#9C27B0', '#00BCD4', '#FFEB3B'],
  cool: ['#667eea', '#764ba2', '#2196F3', '#00BCD4', '#8e44ad', '#3498db'],
  warm: ['#F44336', '#FF9800', '#FF5722', '#FFC107', '#FF6B6B', '#FFD93D'],
  neon: ['#00ff41', '#00b8ff', '#ff00de', '#ffea00', '#ff006e', '#8338ec'],
  pastel: ['#ffd7d7', '#ffe5d7', '#d7f0ff', '#d7ffd7', '#f0d7ff', '#ffd7f0'],
  earth: ['#8B4513', '#D2691E', '#CD853F', '#DEB887', '#F4A460', '#DAA520'],
  ocean: ['#006994', '#0099cc', '#66ccff', '#33ccff', '#00ccff', '#99e6ff'],
  forest: ['#228B22', '#32CD32', '#90EE90', '#98FB98', '#00FF00', '#7CFC00'],
  sunset: ['#FF6B6B', '#FF8E53', '#FFA94D', '#FFD93D', '#FFE66D', '#6BCF7F']
};

// ============================================
// OPERADORES DE FILTRADO
// ============================================
const FILTER_OPERATORS = {
  // Numéricos
  number: [
    { value: 'eq', label: 'Igual a (=)', icon: '=' },
    { value: 'ne', label: 'Diferente de (≠)', icon: '≠' },
    { value: 'gt', label: 'Mayor que (>)', icon: '>' },
    { value: 'lt', label: 'Menor que (<)', icon: '<' },
    { value: 'gte', label: 'Mayor o igual (≥)', icon: '≥' },
    { value: 'lte', label: 'Menor o igual (≤)', icon: '≤' },
    { value: 'between', label: 'Entre', icon: '↔' },
    { value: 'in', label: 'Está en lista', icon: '∈' },
    { value: 'nin', label: 'No está en lista', icon: '∉' }
  ],

  // Texto
  string: [
    { value: 'eq', label: 'Igual a', icon: '=' },
    { value: 'ne', label: 'Diferente de', icon: '≠' },
    { value: 'contains', label: 'Contiene', icon: '⊃' },
    { value: 'startsWith', label: 'Empieza con', icon: '⊲' },
    { value: 'endsWith', label: 'Termina con', icon: '⊳' },
    { value: 'regex', label: 'Expresión regular', icon: '.*' },
    { value: 'in', label: 'Está en lista', icon: '∈' },
    { value: 'nin', label: 'No está en lista', icon: '∉' }
  ],

  // Fechas
  date: [
    { value: 'eq', label: 'Igual a', icon: '=' },
    { value: 'ne', label: 'Diferente de', icon: '≠' },
    { value: 'gt', label: 'Después de', icon: '>' },
    { value: 'lt', label: 'Antes de', icon: '<' },
    { value: 'gte', label: 'Desde', icon: '≥' },
    { value: 'lte', label: 'Hasta', icon: '≤' },
    { value: 'between', label: 'Entre', icon: '↔' }
  ],

  // Booleanos
  boolean: [
    { value: 'eq', label: 'Es', icon: '=' }
  ],

  // Arrays
  array: [
    { value: 'contains', label: 'Contiene', icon: '⊃' },
    { value: 'in', label: 'Está en', icon: '∈' },
    { value: 'exists', label: 'Existe', icon: '✓' }
  ]
};

// ============================================
// GRANULARIDADES TEMPORALES
// ============================================
const TIME_GRANULARITIES = [
  { value: 'halfHour', label: 'Media Hora', format: 'HH:mm', icon: '⏰' },
  { value: 'hour', label: 'Hora', format: 'HH:00', icon: '🕐' },
  { value: 'day', label: 'Día', format: 'DD/MM/YYYY', icon: '📅' },
  { value: 'week', label: 'Semana', format: 'ww YYYY', icon: '📆' },
  { value: 'month', label: 'Mes', format: 'MMM YYYY', icon: '📊' },
  { value: 'quarter', label: 'Trimestre', format: 'Q YYYY', icon: '📈' },
  { value: 'year', label: 'Año', format: 'YYYY', icon: '📉' }
];

// ============================================
// TIPOS DE AGREGACIÓN
// ============================================
const AGGREGATION_TYPES = [
  { value: 'sum', label: 'Suma (SUM)', icon: '∑', description: 'Suma todos los valores' },
  { value: 'avg', label: 'Promedio (AVG)', icon: '≈', description: 'Calcula el promedio' },
  { value: 'count', label: 'Conteo (COUNT)', icon: '#', description: 'Cuenta registros' },
  { value: 'min', label: 'Mínimo (MIN)', icon: '↓', description: 'Valor mínimo' },
  { value: 'max', label: 'Máximo (MAX)', icon: '↑', description: 'Valor máximo' },
  { value: 'median', label: 'Mediana', icon: '⊕', description: 'Valor medio' },
  { value: 'mode', label: 'Moda', icon: '⊙', description: 'Valor más frecuente' },
  { value: 'stddev', label: 'Desviación Estándar', icon: 'σ', description: 'Dispersión de datos' },
  { value: 'variance', label: 'Varianza', icon: 'σ²', description: 'Varianza estadística' },
  { value: 'custom', label: 'Fórmula Personalizada', icon: 'ƒ', description: 'Cálculo personalizado' }
];

// ============================================
// TIPOS DE GRÁFICOS
// ============================================
const CHART_TYPES = [
  { value: 'line', label: 'Línea', icon: '📈', bestFor: 'Tendencias temporales' },
  { value: 'bar', label: 'Barras Verticales', icon: '📊', bestFor: 'Comparaciones' },
  { value: 'horizontalBar', label: 'Barras Horizontales', icon: '📉', bestFor: 'Rankings' },
  { value: 'pie', label: 'Pastel', icon: '🥧', bestFor: 'Proporciones' },
  { value: 'doughnut', label: 'Dona', icon: '🍩', bestFor: 'Proporciones con centro' },
  { value: 'area', label: 'Área', icon: '🏔️', bestFor: 'Volúmenes acumulados' },
  { value: 'scatter', label: 'Dispersión', icon: '⚫', bestFor: 'Correlaciones' },
  { value: 'radar', label: 'Radar', icon: '🎯', bestFor: 'Comparación multidimensional' },
  { value: 'polarArea', label: 'Área Polar', icon: '🔵', bestFor: 'Magnitudes circulares' },
  { value: 'bubble', label: 'Burbujas', icon: '🫧', bestFor: 'Tres dimensiones' },
  { value: 'mixed', label: 'Mixto', icon: '🎨', bestFor: 'Combinación de tipos' }
];

// ============================================
// UTILIDADES
// ============================================

/**
 * Obtiene colores de una paleta
 */
function getColorPalette(paletteName) {
  return COLOR_PALETTES[paletteName] || COLOR_PALETTES.default;
}

/**
 * Genera gradientes CSS
 */
function generateGradient(startColor, endColor, angle = 135) {
  return `linear-gradient(${angle}deg, ${startColor}, ${endColor})`;
}

/**
 * Obtiene operadores válidos para un tipo de dato
 */
function getOperatorsForType(dataType) {
  return FILTER_OPERATORS[dataType] || FILTER_OPERATORS.string;
}

/**
 * Valida un filtro
 */
function validateFilter(filter) {
  if (!filter.field || !filter.operator) return false;
  if (filter.operator === 'between' && (!Array.isArray(filter.value) || filter.value.length !== 2)) {
    return false;
  }
  return true;
}

/**
 * Construye query de MongoDB desde filtros
 */
function buildMongoQuery(filters) {
  if (!filters || !filters.conditions || filters.conditions.length === 0) {
    return {};
  }

  const query = {};
  const conditions = [];

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
        fieldQuery[field] = { $gt: dataType === 'date' ? new Date(value) : value };
        break;
      case 'lt':
        fieldQuery[field] = { $lt: dataType === 'date' ? new Date(value) : value };
        break;
      case 'gte':
        fieldQuery[field] = { $gte: dataType === 'date' ? new Date(value) : value };
        break;
      case 'lte':
        fieldQuery[field] = { $lte: dataType === 'date' ? new Date(value) : value };
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
            $gte: dataType === 'date' ? new Date(min) : min,
            $lte: dataType === 'date' ? new Date(max) : max
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

    conditions.push(fieldQuery);
  });

  // Aplicar operador lógico (AND/OR)
  const logicOperator = filters.operator === 'OR' ? '$or' : '$and';

  if (conditions.length === 1) {
    return conditions[0];
  } else if (conditions.length > 1) {
    query[logicOperator] = conditions;
  }

  return query;
}

/**
 * Formatea un valor según el tipo
 */
function formatValue(value, format) {
  if (value === null || value === undefined) return '-';

  switch (format) {
    case 'number':
      return typeof value === 'number' ? value.toLocaleString('es-MX') : value;
    case 'percentage':
      return typeof value === 'number' ? `${value.toFixed(2)}%` : value;
    case 'currency':
      return typeof value === 'number' ? `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : value;
    case 'time':
      return typeof value === 'number' ? `${Math.floor(value / 60)}:${(value % 60).toString().padStart(2, '0')}` : value;
    case 'decimal':
      return typeof value === 'number' ? value.toFixed(2) : value;
    default:
      return value;
  }
}

/**
 * Genera ID único para widgets
 */
function generateWidgetId() {
  return `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// EXPORTAR (para Node.js)
// ============================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    COLOR_PALETTES,
    FILTER_OPERATORS,
    TIME_GRANULARITIES,
    AGGREGATION_TYPES,
    CHART_TYPES,
    getColorPalette,
    generateGradient,
    getOperatorsForType,
    validateFilter,
    buildMongoQuery,
    formatValue,
    generateWidgetId
  };
}
