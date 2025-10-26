const mongoose = require('mongoose');

const provisionDatasetSchema = new mongoose.Schema({
  anio: { type: Number, required: true },
  mes: { type: Number, required: true },
  nombreArchivo: { type: String, required: true },
  creadoEn: { type: Date, default: Date.now },
  creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  totalRegistros: { type: Number, default: 0 }
}, { timestamps: true });

// Índice compuesto para búsquedas eficientes
provisionDatasetSchema.index({ anio: 1, mes: 1, creadoEn: -1 });

module.exports = mongoose.model('ProvisionDataset', provisionDatasetSchema);
