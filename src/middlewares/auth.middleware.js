// src/middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');

// Padanan dari filter JWT di Spring Security: memverifikasi token dan menyisipkan payload ke req.user
exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
        return res.status(401).json({ success: false, message: "Token tidak ditemukan, silakan login kembali." });
    }

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkeyanda');
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Token tidak valid atau sudah kedaluwarsa." });
    }
};

// Padanan dari @PreAuthorize("hasRole('ADMIN')")
exports.isAdmin = (req, res, next) => {
    if (req.user?.role !== 'Admin') {
        return res.status(403).json({ success: false, message: "Akses ditolak, khusus untuk Admin." });
    }
    next();
};
