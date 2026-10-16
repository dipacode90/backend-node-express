// src/routes/prediksi.routes.js
const express = require('express');
const router = express.Router();
const prediksiController = require('../controllers/prediksi.controller');

// Endpoint: GET /api/prediksi/ringkasan?idUser=
router.get('/ringkasan', prediksiController.getRingkasan);

// Endpoint: GET /api/prediksi/:idGoal?periode=bulanan|mingguan&alpha=auto|0.1-0.9
router.get('/:idGoal', prediksiController.getPrediksiGoal);

module.exports = router;
