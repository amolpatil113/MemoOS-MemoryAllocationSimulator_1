const Algorithm = require('../models/Algorithm');

exports.getAllAlgorithms = async (req, res) => {
  try {
    const algos = await Algorithm.find();
    res.json(algos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAlgorithmBySlug = async (req, res) => {
  try {
    const algo = await Algorithm.findOne({ slug: req.params.slug });
    if (!algo) return res.status(404).json({ message: 'Algorithm not found' });
    res.json(algo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createAlgorithm = async (req, res) => {
  try {
    const algo = new Algorithm(req.body);
    await algo.save();
    res.status(201).json(algo);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateAlgorithm = async (req, res) => {
  try {
    const algo = await Algorithm.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!algo) return res.status(404).json({ message: 'Algorithm not found' });
    res.json(algo);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteAlgorithm = async (req, res) => {
  try {
    const algo = await Algorithm.findByIdAndDelete(req.params.id);
    if (!algo) return res.status(404).json({ message: 'Algorithm not found' });
    res.json({ message: 'Algorithm deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
