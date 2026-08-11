// src/services/financialGoals.service.js
const goalsRepository = require('../repositories/financialGoals.repository');
const tabunganRepository = require('../repositories/tabungan.repository'); // Buka komentarnya
const Tabungan = require('../models/tabungan.model');

class FinancialGoalsService {

    async deleteGoalWithTabungan(idGoal) {
        const goal = await goalsRepository.findById(idGoal);
        if (!goal) {
            throw new Error("Data Financial Goal tidak ditemukan!");
        }

        // Hapus semua data Tabungan (anak) terlebih dahulu
        await tabunganRepository.deleteByGoalId(idGoal);

        // Setelah aman, baru hapus Goal (induk)
        await goal.destroy();
        return true;
    }

    // Hitung ulang total tabungan suatu goal, lalu set status 'Done' otomatis jika sudah mencapai target
    async recalculateGoalStatus(idGoal, transaction = null) {
        const goal = await goalsRepository.findById(idGoal);
        if (!goal) return;

        const transaksi = await Tabungan.findAll({
            where: { idGoal: idGoal },
            transaction
        });

        let totalTerkumpul = 0;
        for (const tx of transaksi) {
            const nominal = Number(tx.nominal);
            if (tx.jenisTransaksi.toLowerCase() === 'setor') {
                totalTerkumpul += nominal;
            } else if (tx.jenisTransaksi.toLowerCase() === 'tarik') {
                totalTerkumpul -= nominal;
            }
        }

        const statusBaru = totalTerkumpul >= Number(goal.targetNominal) ? 'Done' : 'Progress';
        if (goal.status !== statusBaru) {
            await goal.update({ status: statusBaru }, { transaction });
        }
    }
}

module.exports = new FinancialGoalsService();