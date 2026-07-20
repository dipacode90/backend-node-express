// src/controllers/financialGoals.controller.js
const goalsRepository = require('../repositories/financialGoals.repository');
const userRepository = require('../repositories/user.repository');
const goalsService = require('../services/financialGoals.service');

exports.getFinancialGoals = async (req, res) => {
    try {
        // req.query untuk mengambil parameter dari URL: ?idUser=1
        const idUser = req.query.idUser;
        const listGoals = await goalsRepository.findByUserId(idUser);
        
        return res.status(200).json(listGoals);
    } catch (error) {
        return res.status(500).json({
            error: "Gagal memuat list goals: " + error.message
        });
    }
};

exports.saveOrUpdateFinancialGoals = async (req, res) => {
    const { idGoal, idUser, namaGoal, targetNominal, targetTanggal, prioritas, deskripsi } = req.body;

    // 1. Validasi parameter wajib (Padanan if (dto.getIdUser() == null ...))
    if (!idUser || !namaGoal || !targetNominal || !targetTanggal) {
        return res.status(400).json({ error: "Data input belum lengkap!" });
    }

    // Padanan compareTo(BigDecimal.ZERO) <= 0
    if (Number(targetNominal) <= 0) {
        return res.status(400).json({ error: "Target nominal harus lebih besar dari 0!" });
    }

    try {
        // 2. Cari entity User berdasarkan ID
        const user = await userRepository.findById(idUser);
        if (!user) {
            return res.status(404).json({ error: "User tidak ditemukan dengan ID: " + idUser });
        }

        // 3. Logika UPSERT
        const payloadData = {
            idUser: idUser,
            namaGoal: namaGoal,
            targetNominal: targetNominal,
            targetTanggal: targetTanggal,
            prioritas: prioritas || "Sedang", // Default value jika null
            deskripsi: deskripsi || ""        // Default value jika null
        };

        if (idGoal) {
            // UPDATE
            await goalsRepository.update(idGoal, payloadData);
            return res.status(200).json({ message: "Financial Goal berhasil diperbarui!" });
        } else {
            // INSERT
            await goalsRepository.create(payloadData);
            return res.status(200).json({ message: "Financial Goal berhasil disimpan!" });
        }

    } catch (error) {
        // Jika error berasal dari data tidak ditemukan (seperti RuntimeException Not Found)
        if (error.message.includes("tidak ditemukan")) {
            return res.status(404).json({ error: error.message });
        }
        // Exception lainnya
        return res.status(500).json({ error: "Terjadi error pada server: " + error.message });
    }
};

exports.deleteFinancialGoals = async (req, res) => {
    try {
        const idGoal = req.query.idGoal;
        
        await goalsService.deleteGoalWithTabungan(idGoal);
        
        return res.status(200).json({ message: "Financial Goal berhasil dihapus!" });
    } catch (error) {
        if (error.message.includes("tidak ditemukan")) {
            return res.status(404).json({ error: error.message });
        }
        return res.status(500).json({ error: "Gagal menghapus data: " + error.message });
    }
};