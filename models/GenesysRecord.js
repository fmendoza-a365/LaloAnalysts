const mongoose = require('mongoose');

const GenesysRecordSchema = new mongoose.Schema({
  datasetId: { type: mongoose.Schema.Types.ObjectId, ref: 'GenesysDataset', index: true, required: true },
  tipo: { type: String, enum: ['rendimiento','estados'], required: true, index: true },
  ag: { type: String, index: true },
  nombreGenesys: { type: String },
  data: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

GenesysRecordSchema.index({ datasetId: 1 });

module.exports = mongoose.model('GenesysRecord', GenesysRecordSchema);
