const mongoose = require('mongoose');

const stepSchema = new mongoose.Schema({
  title: String,
  description: String
});

const algorithmSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  timeComplexity: { type: String, required: true },
  spaceComplexity: { type: String, required: true },
  bestFor: { type: String, required: true },
  advantages: [String],
  disadvantages: [String],
  steps: [stepSchema]
});

module.exports = mongoose.model('Algorithm', algorithmSchema);
