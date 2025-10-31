const mongoose = require('mongoose');

/**
 * Schema para definir un Widget/KPI/Gráfico personalizado
 */
const WidgetSchema = new mongoose.Schema({
  // Identificador único del widget
  id: {
    type: String,
    required: true
  },

  // Tipo de widget
  type: {
    type: String,
    enum: ['kpi', 'chart', 'table'],
    required: true
  },

  // Título del widget
  title: {
    type: String,
    required: true
  },

  // Posición y tamaño en la grilla
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    width: { type: Number, default: 4 },
    height: { type: Number, default: 3 }
  },

  // Configuración de datos
  dataConfig: {
    // Dataset fuente (provision, asistencia, genesys, nomina)
    dataset: {
      type: String,
      enum: ['provision', 'asistencia', 'genesys', 'nomina', 'asesores'],
      required: true
    },

    // Campos seleccionados del dataset
    fields: [{
      name: String,
      label: String,
      type: String // number, string, date, etc.
    }],

    // Agregación/Cálculo a realizar
    aggregation: {
      type: {
        type: String,
        enum: ['sum', 'avg', 'count', 'min', 'max', 'custom'],
        default: 'sum'
      },
      field: String,
      // Para cálculos personalizados (ej: rotación = bajas / total * 100)
      customFormula: String
    },

    // Filtros aplicados (mejorados con lógica anidada)
    filters: {
      operator: {
        type: String,
        enum: ['AND', 'OR'],
        default: 'AND'
      },
      conditions: [{
        field: String,
        operator: {
          type: String,
          enum: ['eq', 'ne', 'gt', 'lt', 'gte', 'lte', 'in', 'nin', 'between', 'contains', 'startsWith', 'endsWith', 'regex', 'exists']
        },
        value: mongoose.Schema.Types.Mixed,
        dataType: {
          type: String,
          enum: ['string', 'number', 'date', 'boolean', 'array']
        }
      }],
      // Soporte para filtros anidados
      nestedFilters: [this]
    },

    // Agrupación de datos (múltiple)
    groupBy: [{
      field: String,
      order: Number, // Para jerarquía de agrupación
      granularity: {
        type: String,
        enum: ['halfHour', 'hour', 'day', 'week', 'month', 'quarter', 'year'],
        default: 'day'
      },
      // Para campos de fecha
      timeFormat: String // ej: 'YYYY-MM-DD HH:mm'
    }],

    // Ordenamiento
    sortBy: [{
      field: String,
      direction: {
        type: String,
        enum: ['asc', 'desc'],
        default: 'asc'
      }
    }],

    // Límite de resultados
    limit: Number,

    // Cálculos adicionales
    calculations: [{
      name: String,
      formula: String,
      label: String,
      format: String
    }]
  },

  // Configuración visual (para gráficos) - MEJORADA
  chartConfig: {
    chartType: {
      type: String,
      enum: ['line', 'bar', 'horizontalBar', 'pie', 'doughnut', 'area', 'scatter', 'radar', 'polarArea', 'bubble', 'mixed']
    },

    // Sistema de colores avanzado
    colorScheme: {
      type: {
        type: String,
        enum: ['preset', 'custom', 'gradient'],
        default: 'preset'
      },
      preset: {
        type: String,
        enum: ['default', 'material', 'cool', 'warm', 'neon', 'pastel', 'earth', 'ocean', 'forest', 'sunset']
      },
      customColors: [String], // Colores hexadecimales personalizados
      gradients: [{
        start: String,
        end: String
      }]
    },

    // Configuración de visualización
    display: {
      showLegend: { type: Boolean, default: true },
      legendPosition: {
        type: String,
        enum: ['top', 'bottom', 'left', 'right'],
        default: 'top'
      },
      showLabels: { type: Boolean, default: true },
      showValues: { type: Boolean, default: false },
      showGrid: { type: Boolean, default: true },
      showTooltips: { type: Boolean, default: true },
      showTitle: { type: Boolean, default: true },
      showAxes: { type: Boolean, default: true },

      // Configuración de ejes
      xAxis: {
        label: String,
        min: Number,
        max: Number,
        format: String
      },
      yAxis: {
        label: String,
        min: Number,
        max: Number,
        format: String
      }
    },

    // Opciones de interacción
    interactions: {
      responsive: { type: Boolean, default: true },
      maintainAspectRatio: { type: Boolean, default: true },
      animation: { type: Boolean, default: true },
      hover: { type: Boolean, default: true },
      onClick: String // Acción personalizada
    },

    // Tema visual
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },

    // Opciones específicas del tipo de gráfico
    specificOptions: mongoose.Schema.Types.Mixed
  },

  // Configuración de KPI
  kpiConfig: {
    format: String, // number, percentage, currency, time
    icon: String, // Font Awesome icon class (ej: 'fa-users', 'fa-phone', 'fa-chart-line')
    backgroundColor: String, // Color de fondo (hex o nombre)
    textColor: String, // Color del texto
    showTrend: Boolean,
    comparisonPeriod: String, // previous_month, previous_year, etc.
    // Formato condicional
    conditionalFormatting: [{
      condition: String, // 'gt', 'lt', 'gte', 'lte', 'eq', 'between'
      value: mongoose.Schema.Types.Mixed, // Valor de comparación
      backgroundColor: String,
      textColor: String,
      icon: String
    }]
  }
}, { _id: false });

/**
 * Schema principal de Dashboard Personalizado
 */
const CustomDashboardSchema = new mongoose.Schema({
  // Nombre del dashboard
  name: {
    type: String,
    required: true,
    trim: true
  },

  // Descripción
  description: {
    type: String,
    trim: true
  },

  // Usuario creador
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Campaña asociada (si aplica)
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign'
  },

  // Es dashboard por defecto?
  isDefault: {
    type: Boolean,
    default: false
  },

  // Widgets del dashboard
  widgets: [WidgetSchema],

  // Configuración del dashboard
  config: {
    layout: {
      type: String,
      enum: ['grid', 'flex'],
      default: 'grid'
    },
    columns: {
      type: Number,
      default: 12
    },
    refreshInterval: Number // en segundos
  },

  // Compartido con otros usuarios?
  sharedWith: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['view', 'edit'],
      default: 'view'
    }
  }],

  // Metadatos
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índices
CustomDashboardSchema.index({ createdBy: 1, isActive: 1 });
CustomDashboardSchema.index({ campaign: 1, isActive: 1 });
CustomDashboardSchema.index({ isDefault: 1 });

/**
 * Método para obtener dashboards de un usuario
 */
CustomDashboardSchema.statics.getUserDashboards = function(userId, campaignId = null) {
  const query = {
    $or: [
      { createdBy: userId },
      { 'sharedWith.user': userId }
    ],
    isActive: true
  };

  if (campaignId) {
    query.campaign = campaignId;
  }

  return this.find(query).sort({ isDefault: -1, createdAt: -1 });
};

/**
 * Método para clonar un dashboard
 */
CustomDashboardSchema.methods.clone = function(userId, newName) {
  const cloned = new this.constructor({
    name: newName || `${this.name} (Copia)`,
    description: this.description,
    createdBy: userId,
    campaign: this.campaign,
    widgets: this.widgets,
    config: this.config,
    isDefault: false
  });

  return cloned.save();
};

module.exports = mongoose.model('CustomDashboard', CustomDashboardSchema);
