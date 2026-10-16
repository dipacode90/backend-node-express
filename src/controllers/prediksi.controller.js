// src/controllers/prediksi.controller.js
const prediksiService = require('../services/prediksi.service');

const parsePeriode = (val) => (val === 'mingguan' ? 'mingguan' : 'bulanan');

// α kosong / "auto" -> null (dipilih otomatis), selain itu harus 0 < α < 1
const parseAlpha = (val) => {
    if (val === undefined || val === null || val === '' || val === 'auto') return { alpha: null };
    const alpha = Number(val);
    if (isNaN(alpha) || alpha <= 0 || alpha >= 1) {
        return { error: "Nilai alpha harus di antara 0 dan 1 (contoh: 0.3)" };
    }
    return { alpha };
};

// GET /api/prediksi/ringkasan?idUser=1&periode=bulanan
exports.getRingkasan = async (req, res) => {
    try {
        const { idUser } = req.query;
        if (!idUser) {
            return res.status(400).json({ error: "Parameter idUser diwajibkan!" });
        }
        const data = await prediksiService.ringkasanByUser(idUser, parsePeriode(req.query.periode));
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: "Gagal memuat ringkasan prediksi: " + error.message });
    }
};

// GET /api/prediksi/:idGoal?periode=bulanan&alpha=auto
exports.getPrediksiGoal = async (req, res) => {
    try {
        const { alpha, error } = parseAlpha(req.query.alpha);
        if (error) {
            return res.status(400).json({ error });
        }

        const data = await prediksiService.prediksiByGoalId(
            req.params.idGoal,
            parsePeriode(req.query.periode),
            alpha
        );
        if (!data) {
            return res.status(404).json({ error: "Target Financial Goal tidak ditemukan" });
        }
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: "Gagal menghitung prediksi: " + error.message });
    }
};
