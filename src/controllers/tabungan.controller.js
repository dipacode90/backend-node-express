// src/controllers/tabungan.controller.js
const goalsRepository = require('../repositories/financialGoals.repository');
const tabunganRepository = require('../repositories/tabungan.repository');
const sequelize = require('../config/database'); // Import sequelize untuk Transaction

exports.getGoalsList = async (req, res) => {
    try {
        const idUser = req.query.idUser;
        const goals = await goalsRepository.findByUserId(idUser);
        return res.status(200).json(goals);
    } catch (error) {
        return res.status(500).json({ error: "Gagal mengambil daftar goals: " + error.message });
    }
};

exports.saveTabungan = async (req, res) => {
    const { idTabungan, idGoal, tanggal, jenisTransaksi, nominal, keterangan } = req.body;

    // 1. Validasi Input Dasar
    if (!idGoal || !tanggal || !nominal || !jenisTransaksi) {
        return res.status(400).json({ error: "Data input tidak lengkap!" });
    }

    // Padanan: dto.getNominal().compareTo(BigDecimal.ZERO) <= 0
    if (Number(nominal) <= 0) {
        return res.status(400).json({ error: "Nominal transaksi harus lebih besar dari 0!" });
    }

    // Inisialisasi Sequelize Transaction (Padanan @Transactional)
    const t = await sequelize.transaction();

    try {
        // 2. Cari target Financial Goal
        const goal = await goalsRepository.findById(idGoal);
        if (!goal) {
            await t.rollback(); // Batalkan transaksi jika gagal
            return res.status(404).json({ error: "Target Financial Goal tidak ditemukan" });
        }

        const payloadData = {
            idGoal: idGoal,
            tanggal: tanggal,
            jenisTransaksi: jenisTransaksi,
            nominal: nominal,
            keterangan: keterangan || ""
        };

        let isUpdate = false;

        // 3. Logika Update atau Insert
        if (idTabungan) {
            const existingTabungan = await tabunganRepository.findById(idTabungan);
            if (existingTabungan) {
                // Update (lemparkan variabel `t` agar ikut dalam transaksi)
                await tabunganRepository.update(idTabungan, payloadData, t);
                isUpdate = true;
            } else {
                // Jika idTabungan dikirim tapi tidak ada di DB, buat baru (Padanan: orElse(new Tabungan()))
                await tabunganRepository.create(payloadData, t);
            }
        } else {
            // Insert baru
            await tabunganRepository.create(payloadData, t);
        }

        // 4. COMMIT transaksi jika semua proses di atas berhasil tanpa error
        await t.commit(); 

        return res.status(200).json({ 
            message: isUpdate ? "Sukses memperbarui transaksi tabungan!" : "Sukses menyimpan transaksi tabungan!" 
        });

    } catch (error) {
        // ROLLBACK transaksi jika ada exception di tengah jalan
        await t.rollback();
        return res.status(500).json({ error: "Terjadi kesalahan pada server: " + error.message });
    }
};

// ================= FUNGSI BARU: DELETE TABUNGAN =================
exports.deleteTabungan = async (req, res) => {
    const { idTabungan } = req.params;

    if (!idTabungan) {
        return res.status(400).json({ error: "ID Tabungan wajib diisi!" });
    }

    const t = await sequelize.transaction();

    try {
        // 1. Cek apakah data tabungan yang ingin dihapus ada
        const existingTabungan = await tabunganRepository.findById(idTabungan);
        if (!existingTabungan) {
            await t.rollback();
            return res.status(404).json({ error: "Data Tabungan tidak ditemukan!" });
        }

        // 2. Lakukan proses hapus
        await tabunganRepository.deleteById(idTabungan, t);

        // 3. Commit transaksi jika sukses
        await t.commit();
        return res.status(200).json({ message: "Sukses menghapus transaksi tabungan!" });

    } catch (error) {
        await t.rollback();
        return res.status(500).json({ error: "Terjadi kesalahan pada server: " + error.message });
    }
};