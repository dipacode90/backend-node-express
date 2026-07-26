// src/routes/tabungan.routes.js
const express = require('express');
const router = express.Router();
const tabunganController = require('../controllers/tabungan.controller');

// Endpoint: GET /api/tabungan/goals-list
router.get('/goals-list', tabunganController.getGoalsList);

// Endpoint: POST /api/tabungan (Simpan & Update)
router.post('/', tabunganController.saveTabungan);

// Endpoint: DELETE /api/tabungan/:idTabungan
router.delete('/:idTabungan', tabunganController.deleteTabungan);

module.exports = router;