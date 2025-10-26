const mongoose = require('mongoose');

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

// Índices compuestos para consultas eficientes
asistenciaRecordSchema.index({ datasetId: 1, dni: 1 });
asistenciaRecordSchema.index({ datasetId: 1, fecha: 1 });

module.exports = mongoose.model('AsistenciaRecord', asistenciaRecordSchema);
