// src/config/database.js
const { Sequelize } = require('sequelize');

// Cek apakah database berada di cloud (bukan localhost)
const isCloudDb = process.env.DB_HOST && 
  process.env.DB_HOST !== 'localhost' && 
  process.env.DB_HOST !== '127.0.0.1';

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql', // Kompatibel penuh dengan MariaDB lokal & MySQL Aiven
        logging: false,
        // SSL hanya aktif jika mengarah ke Aiven / Cloud
        dialectOptions: isCloudDb ? {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        } : {}
    }
);

module.exports = sequelize;