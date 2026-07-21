// src/models/tabungan.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const FinancialGoals = require('./financialGoals.model'); // Import model induk

const Tabungan = sequelize.define('Tabungan', {
    idTabungan: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'id_tabungan'
    },
    idGoal: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'id_goal',
        references: {
            model: FinancialGoals,
            key: 'id_goal'
        }
    },
    tanggal: {
        // Padanan LocalDate
        type: DataTypes.DATEONLY, 
        allowNull: false,
        field: 'tanggal'
    },
    jenisTransaksi: {
        type: DataTypes.STRING(20),
        allowNull: false,
        field: 'jenis_transaksi'
    },
    nominal: {
        // Padanan BigDecimal precision 12, scale 2
        type: DataTypes.DECIMAL(12, 2), 
        allowNull: false,
        field: 'nominal'
    },
    keterangan: {
        type: DataTypes.STRING(255),
        allowNull: true, // Di Java tidak ada nullable=false, berarti boleh null
        field: 'keterangan'
    }
}, {
    tableName: 'tabungan', // Padanan dari @Table(name = "Tabungan")
    timestamps: false
});

// Relasi Asosiasi: Padanan @ManyToOne
// Banyak riwayat Tabungan terhubung ke 1 Financial Goal
Tabungan.belongsTo(FinancialGoals, { foreignKey: 'id_goal', as: 'financialGoal' });

// (Opsional tapi disarankan) Tambahkan relasi kebalikan di model FinancialGoals
// Agar nanti kita bisa melakukan query JOIN dengan mudah (misal: ambil Goal beserta riwayat tabungannya)
FinancialGoals.hasMany(Tabungan, { foreignKey: 'id_goal', as: 'riwayatTabungan' });

module.exports = Tabungan;