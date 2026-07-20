// src/repositories/financialGoals.repository.js
const FinancialGoals = require('../models/financialGoals.model');

class FinancialGoalsRepository {
    
    // Padanan dari: List<FinancialGoals> findByUser_IdUser(Integer idUser)
    async findByUserId(idUser) {
        return await FinancialGoals.findAll({
            where: { idUser: idUser }
        });
    }

    async findById(idGoal) {
        return await FinancialGoals.findByPk(idGoal);
    }

    async create(goalData) {
        return await FinancialGoals.create(goalData);
    }

    async update(idGoal, goalData) {
        const goal = await FinancialGoals.findByPk(idGoal);
        if (goal) {
            return await goal.update(goalData);
        }
        throw new Error("Data Financial Goal tidak ditemukan untuk di-update!");
    }
}

module.exports = new FinancialGoalsRepository();