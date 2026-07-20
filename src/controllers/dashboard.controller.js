// src/controllers/dashboard.controller.js
const dashboardService = require('../services/dashboard.service');

exports.getSummary = async (req, res) => {
    try {
        const idUser = req.query.idUser;
        
        if (!idUser) {
            return res.status(400).json({ error: "Parameter idUser diwajibkan!" });
        }

        // Panggil service
        const summary = await dashboardService.getDashboardSummary(idUser);
        
        // Express otomatis mengonversi object 'summary' menjadi JSON yang sama persis dengan DTO Java
        return res.status(200).json(summary);

    } catch (error) {
        return res.status(500).json({ 
            error: "Gagal memuat dashboard summary: " + error.message 
        });
    }
};