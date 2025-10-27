const mongoose = require('mongoose');

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
  tipoAFP: { type: String }, // INTEGRA, PRIMA, PROFUTURO, HABITAT, SNP
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

// Índices compuestos
nominaRecordSchema.index({ datasetId: 1, dni: 1 });
nominaRecordSchema.index({ datasetId: 1, campana: 1 });
nominaRecordSchema.index({ datasetId: 1, supervisor: 1 });

module.exports = mongoose.model('NominaRecord', nominaRecordSchema);
