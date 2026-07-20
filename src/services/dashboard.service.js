// src/services/dashboard.service.js
const FinancialGoals = require('../models/financialGoals.model');
const Tabungan = require('../models/tabungan.model');

class DashboardService {
    
    async getDashboardSummary(idUser) {
        // 1. Ambil data Goals sekaligus "JOIN" dengan riwayat Tabungannya
        // Ini lebih efisien daripada melakukan filtering manual seperti di Java
        const userGoals = await FinancialGoals.findAll({
            where: { idUser: idUser },
            include: [{
                model: Tabungan,
                as: 'riwayatTabungan' // Sesuai dengan relasi hasMany yang kita buat sebelumnya
            }]
        });

        // 2. Ambil semua riwayat Tabungan milik user ini (untuk list riwayat di bawah dashboard)
        const userTabungan = await Tabungan.findAll({
            include: [{
                model: FinancialGoals,
                as: 'financialGoal',
                where: { idUser: idUser },
                attributes: ['idGoal', 'namaGoal'] // Kita hanya butuh id dan namanya
            }],
            order: [['tanggal', 'DESC'], ['idTabungan', 'DESC']] // Urutkan dari yang terbaru
        });

        // Inisialisasi variabel akumulasi utama
        let totalTabunganKeseluruhan = 0;
        let totalSisaSemuaGoals = 0;
        const goalDetailDTOs = [];

        // 3. Kalkulasi per Goal
        for (const goal of userGoals) {
            let totalTerkumpul = 0;

            // Hitung total terkumpul dari riwayat tabungan (setor - tarik)
            // Di Sequelize, hasil include ada di property 'riwayatTabungan'
            const goalTxs = goal.riwayatTabungan || [];
            
            for (const tx of goalTxs) {
                // Sequelize mengembalikan tipe DECIMAL sebagai string, jadi kita ubah ke Number
                const nominal = Number(tx.nominal); 
                if (tx.jenisTransaksi.toLowerCase() === 'setor') {
                    totalTerkumpul += nominal;
                } else if (tx.jenisTransaksi.toLowerCase() === 'tarik') {
                    totalTerkumpul -= nominal;
                }
            }

            // Hitung sisa target dana
            const targetNominal = Number(goal.targetNominal);
            let sisaTarget = targetNominal - totalTerkumpul;
            if (sisaTarget < 0) {
                sisaTarget = 0; // Jika tabungan melebihi target
            }

            // Hitung persentase (Padanan RoundingMode.HALF_UP)
            let persentase = 0.0;
            if (targetNominal > 0) {
                persentase = (totalTerkumpul / targetNominal) * 100;
                // Pembulatan 2 angka di belakang koma
                persentase = Math.round(persentase * 100) / 100; 
            }

            // Masukkan ke array (Padanan GoalDetailDTO)
            goalDetailDTOs.push({
                idGoal: goal.idGoal,
                namaGoal: goal.namaGoal,
                targetNominal: targetNominal,
                totalTerkumpul: totalTerkumpul,
                sisaTarget: sisaTarget,
                persentase: persentase
            });

            // Akumulasi ke total utama
            totalTabunganKeseluruhan += totalTerkumpul;
            totalSisaSemuaGoals += sisaTarget;
        }

        // 4. Map transaksi mentah ke format JSON yang diinginkan (Padanan RiwayatTabunganDTO)
        const riwayatDTOs = userTabungan.map(t => {
            return {
                idTabungan: t.idTabungan,
                idGoal: t.financialGoal.idGoal,
                namaGoal: t.financialGoal.namaGoal,
                tanggal: t.tanggal,
                jenisTransaksi: t.jenisTransaksi,
                nominal: Number(t.nominal),
                keterangan: t.keterangan
            };
        });

        // 5. Bungkus semua data menjadi satu Object Utama (Padanan DashboardSummaryDTO)
        return {
            totalTabunganKeseluruhan: totalTabunganKeseluruhan,
            totalGoalsAktif: userGoals.length,
            totalTabunganTerkumpul: totalTabunganKeseluruhan, // Sesuai kode Java Anda
            totalSisaSemuaGoals: totalSisaSemuaGoals,
            goals: goalDetailDTOs,
            riwayatTabungan: riwayatDTOs
        };
    }
}

module.exports = new DashboardService();