/**
 * Tenant Models Registration
 * Registra todos los schemas que deben ser multi-tenant (aislados por campaña)
 *
 * IMPORTANTE: Este archivo NO compila los modelos directamente.
 * Solo registra los SCHEMAS para que el factory los use dinámicamente.
 */

const mongoose = require('mongoose');
const { registerSchema } = require('../utils/tenantModelFactory');

/**
 * MODELOS MULTI-TENANT (Aislados por campaña)
 * Estos modelos tendrán colecciones separadas por tenant: tenant_<campaignId>_<modelo>s
 */

// =====================================================
// PROVISION - Datos de colas y métricas de provisión
// =====================================================
const provisionRecordSchema = new mongoose.Schema({
  datasetId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProvisionDataset', required: true, index: true },

  // Información de la cola
  cola: { type: String, required: true, index: true },
  mesa: { type: String, required: true, index: true },

  // Fecha
  fecha: { type: Date, required: true, index: true },
  fechaTexto: { type: String },

  // Métricas del día para esta cola específica
  ofrecidas: { type: Number, default: 0 },
  contestadas: { type: Number, default: 0 },
  umbral: { type: Number, default: 0 }, // Cumplen SLA

  // TMO (Tiempo Medio de Operación)
  tmo: { type: String }, // Formato HH:MM:SS
  tmoSegundos: { type: Number, default: 0 } // TMO en segundos para cálculos
});

provisionRecordSchema.index({ datasetId: 1, fecha: 1 });
provisionRecordSchema.index({ datasetId: 1, mesa: 1 });
provisionRecordSchema.index({ datasetId: 1, cola: 1 });

// ✅ SCHEMA ORIGINAL - Mantener compatibilidad total
const provisionDatasetSchema = new mongoose.Schema({
  anio: { type: Number, required: true },
  mes: { type: Number, required: true },
  nombreArchivo: { type: String, required: true },
  creadoEn: { type: Date, default: Date.now },
  creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  totalRegistros: { type: Number, default: 0 }
}, { timestamps: true });

provisionDatasetSchema.index({ anio: 1, mes: 1, creadoEn: -1 });

// =====================================================
// NÓMINA - Datos de planilla y remuneraciones
// =====================================================
const nominaRecordSchema = new mongoose.Schema({
  datasetId: { type: mongoose.Schema.Types.ObjectId, ref: 'NominaDataset', required: true, index: true },

  // Identificación
  nro: { type: Number },
  codigoScire: { type: String, index: true },
  dni: { type: String, required: true, index: true },
  nombreCompleto: { type: String, required: true },
  apellidoPaterno: { type: String },
  apellidoMaterno: { type: String },
  nombres: { type: String },

  // Estructura organizacional
  gerente: { type: String },
  responsableUnidad: { type: String },
  supervisor: { type: String },
  cargo: { type: String },
  campana: { type: String, index: true },
  departamento: { type: String },
  grupo: { type: String },

  // Información laboral
  estado: { type: String }, // ACTIVO, CESADO
  tipoPersonal: { type: String },
  tipoPlanilla: { type: String },
  fechaIngreso: { type: Date },
  fechaCese: { type: Date },
  turno: { type: String },
  horario: { type: String },

  // Días trabajados
  diasLaborados: { type: Number, default: 0 },
  diasVacaciones: { type: Number, default: 0 },
  diasSubsidiados: { type: Number, default: 0 },
  diasFeriados: { type: Number, default: 0 },
  diasDescansoMedico: { type: Number, default: 0 },
  totalDias: { type: Number, default: 0 },

  // Remuneraciones
  sueldoBasico: { type: Number, default: 0 },
  sueldoPorDias: { type: Number, default: 0 },
  vacaciones: { type: Number, default: 0 },
  subsidio: { type: Number, default: 0 },
  asignacionFamiliar: { type: Number, default: 0 },
  horasExtras: { type: Number, default: 0 },
  feriados: { type: Number, default: 0 },

  // Bonos e incentivos
  bonoMayo: { type: Number, default: 0 },
  bonoIncentivos: { type: Number, default: 0 },
  bonoNocturno: { type: Number, default: 0 },
  bonoCumplimientos: { type: Number, default: 0 },
  comisiones: { type: Number, default: 0 },
  reintegro: { type: Number, default: 0 },

  // Totales
  subTotalIngresos: { type: Number, default: 0 },

  // Descuentos
  tardanzaMonto: { type: Number, default: 0 },
  inasistenciaMonto: { type: Number, default: 0 },
  licenciaSinGoce: { type: Number, default: 0 },
  totalDescuentos: { type: Number, default: 0 },

  // AFP/ONP
  tipoAFP: { type: String },
  aporteAFP: { type: Number, default: 0 },
  seguroAFP: { type: Number, default: 0 },
  comisionAFP: { type: Number, default: 0 },
  totalAFP: { type: Number, default: 0 },

  // Impuestos
  renta5ta: { type: Number, default: 0 },

  // Otros descuentos
  cooperativa: { type: Number, default: 0 },
  smartCash: { type: Number, default: 0 },
  retencionJudicial: { type: Number, default: 0 },
  oncosalud: { type: Number, default: 0 },
  descuentoEPS: { type: Number, default: 0 },
  otrosDescuentos: { type: Number, default: 0 },
  totalDescuentosExtras: { type: Number, default: 0 },

  // Otros ingresos
  movilidad: { type: Number, default: 0 },
  subsidioInternet: { type: Number, default: 0 },
  capacitacion: { type: Number, default: 0 },
  otrosIngresos: { type: Number, default: 0 },
  totalOtrosIngresos: { type: Number, default: 0 },

  // Neto
  netoAPagar: { type: Number, default: 0 },
  pago1aQuincena: { type: Number, default: 0 },
  pago2aQuincena: { type: Number, default: 0 },

  // Costo empleador
  eps: { type: Number, default: 0 },
  essalud: { type: Number, default: 0 },
  sueldoBruto: { type: Number, default: 0 },
  costoEmpleador: { type: Number, default: 0 },
  otrosIngresos2: { type: Number, default: 0 },
  costoTotalEmpleador: { type: Number, default: 0 },

  // Variables
  variables: { type: Number, default: 0 },
  costoVariables: { type: Number, default: 0 },
  costoTotalVariables: { type: Number, default: 0 },

  // Agentes efectivos
  diasEfectivos: { type: Number, default: 0 },
  agentesEfectivos: { type: Number, default: 0 },

  // Información bancaria
  formaPago: { type: String },
  numeroCuenta: { type: String },

  // Contacto
  celular: { type: String },
  email: { type: String },
  direccion: { type: String }
});

nominaRecordSchema.index({ datasetId: 1, dni: 1 });
nominaRecordSchema.index({ datasetId: 1, campana: 1 });
nominaRecordSchema.index({ datasetId: 1, supervisor: 1 });

// ✅ SCHEMA ORIGINAL - Mantener compatibilidad total
const nominaDatasetSchema = new mongoose.Schema({
  anio: { type: Number, required: true, index: true },
  mes: { type: Number, required: true, index: true },
  nombreArchivo: { type: String, required: true },
  totalRegistros: { type: Number, default: 0 },
  totalEmpleados: { type: Number, default: 0 },

  // Totales del mes
  totalSueldoBruto: { type: Number, default: 0 },
  totalNetoAPagar: { type: Number, default: 0 },
  totalCostoEmpleador: { type: Number, default: 0 },
  totalBonos: { type: Number, default: 0 },
  totalComisiones: { type: Number, default: 0 },

  // Metadata
  creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  creadoEn: { type: Date, default: Date.now }
});

nominaDatasetSchema.index({ anio: 1, mes: 1 });

// =====================================================
// ASISTENCIA - Marcaciones y registros de asistencia
// =====================================================
const asistenciaRecordSchema = new mongoose.Schema({
  datasetId: { type: mongoose.Schema.Types.ObjectId, ref: 'AsistenciaDataset', required: true },
  dni: { type: String, required: true, index: true },
  fecha: { type: Date, required: true },
  regAsistencia: { type: String }, // P, FI, DS, FER
  huella1: { type: String }, // Hora marcación entrada
  huella2: { type: String }, // Hora marcación salida
  jornada: { type: String },
  tardanza: { type: String },
  entrada: { type: String }, // Hora programada entrada
  salida: { type: String }, // Hora programada salida
  asiste: { type: String }, // Puntual, Falta Injustificada, etc.
  primeraConexion: { type: String },
  permiso: { type: String },
  tipoPermiso: { type: String },
  tiempoPermiso: { type: String },
  motivo: { type: String },
  fModificacion: { type: Date },
  estado: { type: String }, // VALIDADO_USUARIO, VALIDADO_ADMIN
  ipHuella1: { type: String },
  ipHuella2: { type: String }
});

asistenciaRecordSchema.index({ datasetId: 1, dni: 1 });
asistenciaRecordSchema.index({ datasetId: 1, fecha: 1 });

// ✅ SCHEMA ORIGINAL - Mantener compatibilidad total
const asistenciaDatasetSchema = new mongoose.Schema({
  anio: { type: Number, required: true },
  mes: { type: Number, required: true },
  nombreArchivo: { type: String, required: true },
  creadoEn: { type: Date, default: Date.now },
  creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  totalRegistros: { type: Number, default: 0 }
});

asistenciaDatasetSchema.index({ anio: 1, mes: 1, creadoEn: -1 });

// =====================================================
// GENESYS - Datos de rendimiento y estados
// =====================================================
// ✅ CORREGIDO: Mantener estructura original compatible con parsers existentes
const genesysRecordSchema = new mongoose.Schema({
  datasetId: { type: mongoose.Schema.Types.ObjectId, ref: 'GenesysDataset', index: true, required: true },
  tipo: { type: String, enum: ['rendimiento', 'estados'], required: true, index: true },
  ag: { type: String, index: true },              // Código de agente (puede ser DNI o código)
  nombreGenesys: { type: String },                // Nombre del agente en Genesys
  data: { type: mongoose.Schema.Types.Mixed }     // Datos flexibles parseados del CSV/Excel
}, { timestamps: true });

genesysRecordSchema.index({ datasetId: 1 });
genesysRecordSchema.index({ datasetId: 1, tipo: 1 });

// ✅ SCHEMA ORIGINAL - Mantener compatibilidad total
const genesysDatasetSchema = new mongoose.Schema({
  tipo: { type: String, enum: ['rendimiento', 'estados'], required: true, index: true },
  anio: { type: Number, required: true, index: true },
  mes: { type: Number, required: true, index: true },
  originalFilename: { type: String },
  totalRegistros: { type: Number, default: 0 }
}, { timestamps: true });

genesysDatasetSchema.index({ tipo: 1, anio: 1, mes: 1 });

// =====================================================
// ASESORES - Información de asesores por campaña
// =====================================================
const asesorSchema = new mongoose.Schema({
  DNI: { type: String, required: true, index: true },
  nombreGenesys: { type: String, required: true },
  apellidosNombres: { type: String, required: true },
  supervisor: { type: String, required: true },
  estado: { type: String, required: true },
  fechaAlta: { type: Date },
  fechaCese: { type: Date },
  motivoCese: { type: String },
  edad: { type: Number },
  turno: { type: String },
  modalidad: { type: String },
  horarioLV: { type: String },
  horarioFdsFer: { type: String },
  descanso: { type: String },
  pool: { type: String },
  ag: { type: String }
}, { timestamps: true });

asesorSchema.index({ DNI: 1 }, { unique: true });

// =====================================================
// TARIFAS - Configuración de tarifas por campaña
// =====================================================
const tarifaSchema = new mongoose.Schema({
  // Información de la tarifa
  mesa: { type: String, required: true, index: true },
  vigenciaDesde: { type: Date, required: true, index: true },
  vigenciaHasta: { type: Date, index: true },

  // Rangos escalonados
  rangos: [{
    rango: { type: Number, required: true },
    min: { type: Number, required: true },
    max: { type: Number },
    rangoReferencial: { type: Number },
    costoConIGV: { type: Number, required: true },
    costoSinIGV: { type: Number, required: true }
  }],

  // Costos especiales (para Reclamos)
  onrConIGV: { type: Number },
  onrSinIGV: { type: Number },

  // Metadata
  activo: { type: Boolean, default: true },
  creadoEn: { type: Date, default: Date.now },
  actualizadoEn: { type: Date, default: Date.now }
});

// Índice compuesto para búsquedas eficientes por mesa y vigencia
tarifaSchema.index({ mesa: 1, vigenciaDesde: -1 });
tarifaSchema.index({ mesa: 1, activo: 1 });

// Método para obtener el costo unitario según la cantidad de llamadas
tarifaSchema.methods.obtenerCostoUnitario = function(cantidadLlamadas, conIGV = false) {
  // Encontrar el rango aplicable
  let rangoAplicable = null;

  for (const rango of this.rangos) {
    if (cantidadLlamadas >= rango.min) {
      // Si no tiene max o cantidad está dentro del rango
      if (!rango.max || cantidadLlamadas <= rango.max) {
        rangoAplicable = rango;
        break;
      }
    }
  }

  // Si no hay rango, usar el último (mayor)
  if (!rangoAplicable && this.rangos.length > 0) {
    rangoAplicable = this.rangos[this.rangos.length - 1];
  }

  if (!rangoAplicable) {
    return 0;
  }

  return conIGV ? rangoAplicable.costoConIGV : rangoAplicable.costoSinIGV;
};

// Método estático para obtener tarifa activa de una mesa en una fecha
tarifaSchema.statics.obtenerTarifaVigente = async function(mesa, fecha = new Date()) {
  return await this.findOne({
    mesa,
    activo: true,
    vigenciaDesde: { $lte: fecha },
    $or: [
      { vigenciaHasta: { $gte: fecha } },
      { vigenciaHasta: null }
    ]
  }).sort({ vigenciaDesde: -1 });
};

// =====================================================
// CUSTOM DASHBOARDS - Dashboards personalizados por campaña
// =====================================================
// Schema para Widget (sub-documento)
const widgetSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, enum: ['kpi', 'chart', 'table'], required: true },
  title: { type: String, required: true },
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    width: { type: Number, default: 4 },
    height: { type: Number, default: 3 }
  },
  dataConfig: {
    dataset: { type: String, enum: ['provision', 'asistencia', 'genesys', 'nomina', 'asesores'], required: true },
    fields: [{ name: String, label: String, type: String }],
    aggregation: {
      type: { type: String, enum: ['sum', 'avg', 'count', 'min', 'max', 'custom'], default: 'sum' },
      field: String,
      customFormula: String
    },
    calculatedFields: [{
      label: String,
      aggregationType: String,
      field: String,
      customFormula: String
    }],
    filters: {
      operator: { type: String, enum: ['AND', 'OR'], default: 'AND' },
      conditions: [{
        field: String,
        operator: { type: String, enum: ['eq', 'ne', 'gt', 'lt', 'gte', 'lte', 'in', 'nin', 'between', 'contains', 'startsWith', 'endsWith', 'regex', 'exists'] },
        value: mongoose.Schema.Types.Mixed,
        dataType: { type: String, enum: ['string', 'number', 'date', 'boolean', 'array'] }
      }],
      nestedFilters: [this]
    },
    groupBy: [{
      field: String,
      order: Number,
      granularity: { type: String, enum: ['halfHour', 'hour', 'day', 'week', 'month', 'quarter', 'year'], default: 'day' },
      timeFormat: String
    }],
    sortBy: [{ field: String, direction: { type: String, enum: ['asc', 'desc'], default: 'asc' } }],
    limit: Number,
    calculations: [{ name: String, formula: String, label: String, format: String }]
  },
  chartConfig: {
    chartType: { type: String, enum: ['line', 'bar', 'horizontalBar', 'pie', 'doughnut', 'area', 'scatter', 'radar', 'polarArea', 'bubble', 'mixed', 'gauge', 'waterfall', 'funnel', 'treemap'] },
    colorScheme: {
      type: { type: String, enum: ['preset', 'custom', 'gradient'], default: 'preset' },
      preset: { type: String, enum: ['default', 'material', 'cool', 'warm', 'neon', 'pastel', 'earth', 'ocean', 'forest', 'sunset'] },
      customColors: [String],
      gradients: [{ start: String, end: String }]
    },
    display: {
      showLegend: { type: Boolean, default: true },
      legendPosition: { type: String, enum: ['top', 'bottom', 'left', 'right'], default: 'top' },
      showLabels: { type: Boolean, default: true },
      showValues: { type: Boolean, default: false },
      showGrid: { type: Boolean, default: true },
      showTooltips: { type: Boolean, default: true },
      showTitle: { type: Boolean, default: true },
      showAxes: { type: Boolean, default: true },
      xAxis: { label: String, min: Number, max: Number, format: String },
      yAxis: { label: String, min: Number, max: Number, format: String }
    },
    interactions: {
      responsive: { type: Boolean, default: true },
      maintainAspectRatio: { type: Boolean, default: true },
      animation: { type: Boolean, default: true },
      hover: { type: Boolean, default: true },
      onClick: String
    },
    theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'light' },
    specificOptions: mongoose.Schema.Types.Mixed
  },
  kpiConfig: {
    format: String,
    icon: String,
    backgroundColor: String,
    textColor: String,
    showTrend: Boolean,
    comparisonPeriod: String,
    conditionalFormatting: [{
      condition: String,
      value: mongoose.Schema.Types.Mixed,
      backgroundColor: String,
      textColor: String,
      icon: String
    }]
  },
  // Configuración específica para gráficos tipo Gauge (medidor)
  gaugeConfig: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 100 },
    target: Number, // Valor objetivo/meta
    ranges: [{
      from: Number,
      to: Number,
      color: String,
      label: String // ej: "Bajo", "Medio", "Alto"
    }],
    unit: String, // ej: "%", "hrs", "unidades"
    showValue: { type: Boolean, default: true },
    showRanges: { type: Boolean, default: true },
    animationDuration: { type: Number, default: 1000 }
  }
}, { _id: false });

// Schema principal de CustomDashboard
const customDashboardSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
  isDefault: { type: Boolean, default: false },
  widgets: [widgetSchema],
  config: {
    layout: { type: String, enum: ['grid', 'flex'], default: 'grid' },
    columns: { type: Number, default: 12 },
    refreshInterval: Number
  },
  sharedWith: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    permission: { type: String, enum: ['view', 'edit'], default: 'view' }
  }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

customDashboardSchema.index({ createdBy: 1, isActive: 1 });
customDashboardSchema.index({ campaign: 1, isActive: 1 });
customDashboardSchema.index({ isDefault: 1 });

// Método estático para obtener dashboards de un usuario
customDashboardSchema.statics.getUserDashboards = function(userId, campaignId = null) {
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

// Método para clonar un dashboard
customDashboardSchema.methods.clone = function(userId, newName) {
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

// =====================================================
// REGISTRAR TODOS LOS SCHEMAS EN EL FACTORY
// =====================================================
registerSchema('ProvisionRecord', provisionRecordSchema);
registerSchema('ProvisionDataset', provisionDatasetSchema);
registerSchema('NominaRecord', nominaRecordSchema);
registerSchema('NominaDataset', nominaDatasetSchema);
registerSchema('AsistenciaRecord', asistenciaRecordSchema);
registerSchema('AsistenciaDataset', asistenciaDatasetSchema);
registerSchema('GenesysRecord', genesysRecordSchema);
registerSchema('GenesysDataset', genesysDatasetSchema);
registerSchema('Asesor', asesorSchema);
registerSchema('Tarifa', tarifaSchema);
registerSchema('CustomDashboard', customDashboardSchema);

console.log('[TENANT MODELS] ✅ Todos los schemas multi-tenant registrados:');
console.log('  - ProvisionRecord, ProvisionDataset');
console.log('  - NominaRecord, NominaDataset');
console.log('  - AsistenciaRecord, AsistenciaDataset');
console.log('  - GenesysRecord, GenesysDataset');
console.log('  - Asesor');
console.log('  - Tarifa');
console.log('  - CustomDashboard');

module.exports = {
  // Exportar los schemas por si se necesitan para referencia
  schemas: {
    provisionRecord: provisionRecordSchema,
    provisionDataset: provisionDatasetSchema,
    nominaRecord: nominaRecordSchema,
    nominaDataset: nominaDatasetSchema,
    asistenciaRecord: asistenciaRecordSchema,
    asistenciaDataset: asistenciaDatasetSchema,
    genesysRecord: genesysRecordSchema,
    genesysDataset: genesysDatasetSchema,
    asesor: asesorSchema,
    tarifa: tarifaSchema,
    customDashboard: customDashboardSchema
  }
};
