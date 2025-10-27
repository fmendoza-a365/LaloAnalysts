const mongoose = require('mongoose');

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

// Índice compuesto único para evitar duplicados
nominaDatasetSchema.index({ anio: 1, mes: 1 }, { unique: true });

module.exports = mongoose.model('NominaDataset', nominaDatasetSchema);
