const mongoose = require('mongoose');

const AsesorSchema = new mongoose.Schema({
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
  ag: { type: String },
}, { timestamps: true });

AsesorSchema.index({ DNI: 1 }, { unique: true });

module.exports = mongoose.model('Asesor', AsesorSchema);
