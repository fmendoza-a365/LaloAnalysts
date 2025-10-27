const mongoose = require('mongoose');

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

module.exports = mongoose.model('Tarifa', tarifaSchema);
