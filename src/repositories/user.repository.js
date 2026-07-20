// src/repositories/user.repository.js
const User = require('../models/user.model');

class UserRepository {
    
    // Padanan dari: Optional<User> findById(Integer id)
    async findById(id) {
        return await User.findByPk(id);
    }

    // Padanan dari query method: Optional<User> findByEmail(String email)
    async findByEmail(email) {
        return await User.findOne({
            where: { email: email }
        });
    }

    // Padanan dari: User save(User user) - Bisa untuk Insert dan Update
    async save(userData) {
        if (userData.idUser) {
            // Jika ada ID, lakukan update
            const user = await User.findByPk(userData.idUser);
            if (user) {
                return await user.update(userData);
            }
            throw new Error("User tidak ditemukan untuk diperbarui");
        }
        // Jika tidak ada ID, lakukan insert baru (Create)
        return await User.create(userData);
    }

    // Padanan dari: void delete(User user) atau deleteById(Integer id)
    async deleteById(id) {
        const user = await User.findByPk(id);
        if (user) {
            await user.destroy();
            return true;
        }
        return false;
    }

    // Padanan dari: List<User> findAll()
    async findAll() {
        return await User.findAll();
    }
}

// Eksport sebagai instance tunggal (Singleton) mirip seperti @Repository di Spring
module.exports = new UserRepository();