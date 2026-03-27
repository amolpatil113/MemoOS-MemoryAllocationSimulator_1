const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['paging', 'segmentation'], required: true },
  createdAt: { type: Date, default: Date.now },
  memorySize: { type: Number },
  frameSize: { type: Number },
  frames: { type: Array, default: [] },
  pageTable: { type: Array, default: [] },
  segments: { type: Array, default: [] },
  logs: { type: Array, default: [] }
});

module.exports = mongoose.model('Session', sessionSchema);
