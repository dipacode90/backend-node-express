// src/models/user.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Mengambil koneksi database

const User = sequelize.define('User', {
    idUser: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'id_user' // Menyelaraskan nama kolom camelCase di Node dengan snake_case di MySQL
    },
    nama: {
        type: DataTypes.STRING(100),
        allowNull: false // Padanan dari nullable = false
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    role: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'User'
    }
}, {
    tableName: 'user', // Padanan dari @Table(name = "user")
    timestamps: false  // Set ke false jika tabel MySQL Anda tidak memiliki kolom createdAt dan updatedAt
});

module.exports = User;