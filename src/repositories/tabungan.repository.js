// src/repositories/tabungan.repository.js
const Tabungan = require('../models/tabungan.model');

class TabunganRepository {
    async findById(idTabungan) {
        return await Tabungan.findByPk(idTabungan);
    }

    // Perhatikan parameter `transaction` di bawah ini
    async create(data, transaction = null) {
        return await Tabungan.create(data, { transaction: transaction });
    }

    async update(idTabungan, data, transaction = null) {
        const tabungan = await Tabungan.findByPk(idTabungan);
        if (tabungan) {
            return await tabungan.update(data, { transaction: transaction });
        }
        throw new Error("Data Tabungan tidak ditemukan!");
    }

    // Fungsi ini akan dipakai saat menghapus Financial Goal
    async deleteByGoalId(idGoal) {
        return await Tabungan.destroy({
            where: { idGoal: idGoal }
        });
    }
}

module.exports = new TabunganRepository();