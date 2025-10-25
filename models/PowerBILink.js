const mongoose = require('mongoose');

// Esquema para guardar enlaces de Power BI simples
// Permite registrar Nombre de la Mesa, Descripción y URL (embed o enlace normal)
const powerBILinkSchema = new mongoose.Schema({
  nombreMesa: { type: String, required: true, trim: true },
  descripcion: { type: String, trim: true },
  url: { type: String, required: true, trim: true },
  imageUrl: { type: String, trim: true },
  modulo: { type: String, enum: ['finanzas', 'kpis', 'asesores', 'general'], default: 'general' },
  rolesPermitidos: [{ type: String, enum: ['admin', 'analista', 'supervisor', 'asesor'] }],
  activo: { type: Boolean, default: true },
  creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  creadoEn: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PowerBILink', powerBILinkSchema);
