// src/services/financialGoals.service.js
const goalsRepository = require('../repositories/financialGoals.repository');
const tabunganRepository = require('../repositories/tabungan.repository'); // Buka komentarnya

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
}

module.exports = new FinancialGoalsService();