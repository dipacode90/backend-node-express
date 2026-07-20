// src/routes/financialGoals.routes.js
const express = require('express');
const router = express.Router();
const goalsController = require('../controllers/financialGoals.controller');

router.get('/get-financial-goals', goalsController.getFinancialGoals);
router.post('/save-financial-goals', goalsController.saveOrUpdateFinancialGoals);
router.delete('/delete-financial-goals', goalsController.deleteFinancialGoals);

module.exports = router;