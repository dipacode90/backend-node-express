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

    // 3. Logika untuk Admin: ambil semua user (tanpa password)
    async getAllUsers() {
        const users = await userRepository.findAll();
        return users.map((user) => {
            const { password, ...safeUser } = user.toJSON();
            return safeUser;
        });
    }

    // 4. Logika untuk Admin: membuat user baru lengkap dengan role
    async createUser(nama, email, password, role) {
        const userExists = await userRepository.findByEmail(email);
        if (userExists) {
            throw new Error("Email sudah digunakan!");
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const user = await userRepository.save({
            nama: nama,
            email: email,
            password: hashedPassword,
            role: role || 'User'
        });
        const { password: _pw, ...safeUser } = user.toJSON();
        return safeUser;
    }

    // 5. Logika untuk Admin: memperbarui data user (password opsional)
    async updateUser(idUser, { nama, email, password, role }) {
        const existing = await userRepository.findById(idUser);
        if (!existing) {
            throw new Error("User tidak ditemukan!");
        }

        const updateData = { idUser, nama, email, role };
        if (password && password.trim()) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const user = await userRepository.save(updateData);
        const { password: _pw, ...safeUser } = user.toJSON();
        return safeUser;
    }

    // 6. Logika untuk Admin: menghapus user
    async deleteUser(idUser) {
        const deleted = await userRepository.deleteById(idUser);
        if (!deleted) {
            throw new Error("User tidak ditemukan!");
        }
        return true;
    }
}

// Eksport sebagai singleton instance seperti @Service di Spring
module.exports = new UserService();