// src/models/financialGoals.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user.model'); // Import model User untuk membuat relasi

const FinancialGoals = sequelize.define('FinancialGoals', {
    idGoal: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'id_goal'
    },
    idUser: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'id_user',
        references: {
            model: User,
            key: 'id_user' // Mengikat ke primary key milik tabel User
        }
    },
    namaGoal: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'nama_goal'
    },
    targetNominal: {
        // Padanan BigDecimal precision = 12, scale = 2 (sangat aman untuk nominal uang)
        type: DataTypes.DECIMAL(12, 2), 
        allowNull: false,
        field: 'target_nominal'
    },
    targetTanggal: {
        // Padanan LocalDate (Hanya menyimpan YYYY-MM-DD tanpa zona waktu / jam)
        type: DataTypes.DATEONLY, 
        allowNull: false,
        field: 'target_tanggal'
    },
    prioritas: {
        type: DataTypes.STRING(20),
        allowNull: false,
        field: 'prioritas'
    },
    deskripsi: {
        // Padanan columnDefinition = "TEXT"
        type: DataTypes.TEXT, 
        allowNull: true,
        field: 'deskripsi'
    }
}, {
    tableName: 'financial_goals', // Padanan dari @Table(name = "Financial_Goals")
    timestamps: false
});

// Relasi Asosiasi: Padanan dari Anotasi @ManyToOne di Java Spring
// Artinya: Banyak FinancialGoals dimiliki oleh 1 User
FinancialGoals.belongsTo(User, { foreignKey: 'id_user', as: 'user' });

// // Letakkan di bawah FinancialGoals.belongsTo(User, ...);
// const Tabungan = require('./tabungan.model');
// FinancialGoals.hasMany(Tabungan, { foreignKey: 'id_goal', as: 'riwayatTabungan' });

module.exports = FinancialGoals;