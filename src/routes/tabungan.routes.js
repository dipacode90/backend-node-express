// src/routes/tabungan.routes.js
const express = require('express');
const router = express.Router();
const tabunganController = require('../controllers/tabungan.controller');

// Endpoint untuk dropdown list goals di form tabungan
router.get('/goals-list', tabunganController.getGoalsList);

// Endpoint untuk menyimpan atau mengupdate transaksi tabungan (Setor / Tarik)
router.post('/tabungan', tabunganController.saveTabungan);

module.exports = router;