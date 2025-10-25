const mongoose = require('mongoose');

const GenesysDatasetSchema = new mongoose.Schema({
  tipo: { type: String, enum: ['rendimiento','estados'], required: true, index: true },
  anio: { type: Number, required: true, index: true },
  mes: { type: Number, required: true, index: true },
  originalFilename: { type: String },
  totalRegistros: { type: Number, default: 0 },
}, { timestamps: true });

GenesysDatasetSchema.index({ tipo: 1, anio: 1, mes: 1 }, { unique: true });

module.exports = mongoose.model('GenesysDataset', GenesysDatasetSchema);
