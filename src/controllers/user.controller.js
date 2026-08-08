// src/controllers/user.controller.js
const userService = require('../services/user.service');

exports.getAllUsers = async (req, res) => {
    try {
        const users = await userService.getAllUsers();
        return res.status(200).json(users);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Gagal mengambil daftar pengguna: " + error.message });
    }
};

exports.createUser = async (req, res) => {
    const { nama, email, password, role } = req.body;

    if (!nama || !nama.trim() || !email || !email.trim() || !password || !password.trim()) {
        return res.status(400).json({ success: false, message: "Nama, email, dan kata sandi wajib diisi!" });
    }

    try {
        const user = await userService.createUser(nama, email, password, role);
        return res.status(201).json({ success: true, message: "Pengguna berhasil ditambahkan!", user });
    } catch (error) {
        return res.status(409).json({ success: false, message: error.message });
    }
};

exports.updateUser = async (req, res) => {
    const { idUser } = req.params;
    const { nama, email, password, role } = req.body;

    if (!nama || !nama.trim() || !email || !email.trim()) {
        return res.status(400).json({ success: false, message: "Nama dan email wajib diisi!" });
    }

    try {
        const user = await userService.updateUser(idUser, { nama, email, password, role });
        return res.status(200).json({ success: true, message: "Pengguna berhasil diperbarui!", user });
    } catch (error) {
        return res.status(404).json({ success: false, message: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    const { idUser } = req.params;

    try {
        await userService.deleteUser(idUser);
        return res.status(200).json({ success: true, message: "Pengguna berhasil dihapus!" });
    } catch (error) {
        return res.status(404).json({ success: false, message: error.message });
    }
};
