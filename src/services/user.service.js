// src/services/user.service.js
const userRepository = require('../repositories/user.repository');
const bcrypt = require('bcrypt');

class UserService {

    // 1. Logika untuk Registrasi User baru
    async register(nama, email, password) {
        // Cek apakah email sudah terdaftar di database
        const userExists = await userRepository.findByEmail(email);
        if (userExists) {
            // Padanan dari throw new IllegalStateException() di Java Spring
            throw new Error("Email sudah digunakan!");
        }

        // Enkripsi password sebelum disimpan (Salting)
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Simpan data user baru ke database lewat repository
        return await userRepository.save({
            nama: nama,
            email: email,
            password: hashedPassword
        });
    }

    // 2. Logika untuk Login User (Ini yang Anda cari)
    async login(email, password) {
        // Cari user berdasarkan email
        const user = await userRepository.findByEmail(email);
        if (!user) {
            // Padanan dari throw new IllegalArgumentException() di Java
            throw new Error("Email atau kata sandi salah!");
        }

        // Bandingkan password yang diinput dengan password terenkripsi di DB
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            throw new Error("Email atau kata sandi salah!");
        }

        // Jika lolos semua pengecekan, kembalikan data user ke controller
        return user;
    }
}

// Eksport sebagai singleton instance seperti @Service di Spring
module.exports = new UserService();