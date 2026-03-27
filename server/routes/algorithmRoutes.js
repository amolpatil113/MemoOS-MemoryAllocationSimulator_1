const express = require('express');
const router = express.Router();
const algoCtrl = require('../controllers/algorithmController');

router.get('/', algoCtrl.getAllAlgorithms);
router.get('/:slug', algoCtrl.getAlgorithmBySlug);
router.post('/', algoCtrl.createAlgorithm);
router.put('/:id', algoCtrl.updateAlgorithm);
router.delete('/:id', algoCtrl.deleteAlgorithm);

module.exports = router;
