// 1. Tambalan untuk Object.hasOwn
if (!Object.hasOwn) {
    Object.hasOwn = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);
}

// 2. Tambalan untuk replaceAll (Tambahkan ini)
if (!String.prototype.replaceAll) {
    String.prototype.replaceAll = function(search, replacement) {
        return this.split(search).join(replacement);
    };
}

require('dotenv').config();
const express = require('express');
const cors = require('cors');
// ... sisa kode server.js Anda


const app = express();
const PORT = process.env.PORT || 8080;

// Konfigurasi CORS khusus untuk React Anda (Padanan dari @CrossOrigin di Java)
app.use(cors({
    origin: 'http://localhost:3000'
}));

app.use(express.json()); 

const authRoutes = require('./routes/auth.routes');

// Daftarkan rute dengan prefix /api (Padanan @RequestMapping("/api"))
app.use('/api', authRoutes);

const financeRoutes = require('./routes/financialGoals.routes'); // Letakkan di atas
app.use('/api/finance', financeRoutes); // Letakkan di bawah (dekat app.use('/api', authRoutes))

const dashboardRoutes = require('./routes/dashboard.routes'); // Taruh di atas bersama route lain
app.use('/api/dashboard', dashboardRoutes); // Taruh di bawah bersama app.use yang lain

// 1. Tambahkan ini di bagian atas (di bawah import routes lainnya)
const tabunganRoutes = require('./routes/tabungan.routes');

// 2. Tambahkan ini di bagian middleware routing
app.use('/api/tabungan', tabunganRoutes);

// Cek server jalan
app.get('/', (req, res) => {
    res.send('Backend Finance Node.js is running...');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});