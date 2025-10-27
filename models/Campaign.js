const mongoose = require('mongoose');

const CampaignSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: {
    type: String,
    default: ''
  },
  imagen: {
    type: String,
    default: '/images/default-campaign.jpg'
  },
  gerente: {
    type: String,
    default: ''
  },
  analista: {
    type: String,
    default: ''
  },
  subCampanas: [{
    nombre: String,
    descripcion: String
  }],
  activa: {
    type: Boolean,
    default: true
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  fechaActualizacion: {
    type: Date,
    default: Date.now
  }
});

// Actualizar fechaActualizacion antes de guardar
CampaignSchema.pre('save', function(next) {
  this.fechaActualizacion = Date.now();
  next();
});

module.exports = mongoose.model('Campaign', CampaignSchema);
