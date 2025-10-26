const mongoose = require('mongoose');

const provisionRecordSchema = new mongoose.Schema({
  datasetId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProvisionDataset', required: true, index: true },
  fecha: { type: Date, required: true, index: true },
  fechaTexto: { type: String },
  
  // Métricas totales del día
  ofrecidas: { type: Number, default: 0 },
  contestadas: { type: Number, default: 0 },
  abandonadas: { type: Number, default: 0 },
  porcentajeContestadas: { type: Number, default: 0 },
  porcentajeAbandono: { type: Number, default: 0 },
  nivelServicio: { type: Number, default: 0 },
  cumpleSLA: { type: Number, default: 0 },
  
  // Tiempos medios
  manejoMedio: { type: String },
  conversacionMedia: { type: String },
  retencionMedia: { type: String },
  acwMedio: { type: String },
  esperaMedia: { type: String },
  asa: { type: String },
  
  // Colas
  nombresColas: [{ type: String }],
  totalColas: { type: Number, default: 0 },
  
  // Datos agrupados por mesa (almacenado como objeto flexible)
  mesasData: { type: mongoose.Schema.Types.Mixed }
});

// Índice compuesto para búsquedas por dataset y fecha
provisionRecordSchema.index({ datasetId: 1, fecha: 1 });

module.exports = mongoose.model('ProvisionRecord', provisionRecordSchema);
