// src/controllers/auth.controller.js
const jwt = require('jsonwebtoken');
const userService = require('../services/user.service'); // Kita asumsikan file service ini ada nanti

exports.register = async (req, res) => {
    const { nama, email, password } = req.body;

    // Validasi input wajib isi (Padanan dari getNama() == null || isBlank())
    if (!nama || !nama.trim() || !email || !email.trim() || !password || !password.trim()) {
        return res.status(400).json({
            success: false,
            message: "Nama, email, dan kata sandi wajib diisi!"
        });
    }

    try {
        await userService.register(nama, email, password);
        return res.status(201).json({
            success: true,
            message: "Registrasi berhasil! Silakan masuk."
        });
    } catch (error) {
        // Padanan dari penanganan IllegalStateException (misal: email duplikat)
        return res.status(409).json({
            success: false,
            message: error.message
        });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await userService.login(email, password);

        // Membuat JWT Token berlaku selama 1 Jam ('1h')
        // Menggunakan sub (subject) dan claim nama seperti di Java Spring Anda
        const token = jwt.sign(
            {
                sub: user.email,
                name: user.nama,
                idUser: user.idUser,
                role: user.role
            },
            process.env.JWT_SECRET || 'supersecretkeyanda', // Kunci rahasia dari file .env
            { expiresIn: '1h' }
        );

        // Membentuk struktur data JSON persis seperti LoginResponse di Java
        return res.status(200).json({
            success: true,
            message: "Login berhasil!",
            token: token,
            user: {
                idUser: user.idUser,
                nama: user.nama,
                role: user.role
            }
        });
    } catch (error) {
        // Padanan dari penanganan IllegalArgumentException (misal: password/email salah)
        return res.status(401).json({
            success: false,
            message: error.message,
            token: null,
            user: null
        });
    }
};