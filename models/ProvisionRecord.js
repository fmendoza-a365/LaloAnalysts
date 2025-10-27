const mongoose = require('mongoose');

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

// Índices compuestos para búsquedas eficientes
provisionRecordSchema.index({ datasetId: 1, fecha: 1 });
provisionRecordSchema.index({ datasetId: 1, mesa: 1 });
provisionRecordSchema.index({ datasetId: 1, cola: 1 });

module.exports = mongoose.model('ProvisionRecord', provisionRecordSchema);
