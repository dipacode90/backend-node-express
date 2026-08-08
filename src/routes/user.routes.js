// src/routes/user.routes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

// Semua endpoint manajemen pengguna khusus Admin
router.use(verifyToken, isAdmin);

router.get('/', userController.getAllUsers);
router.post('/', userController.createUser);
router.put('/:idUser', userController.updateUser);
router.delete('/:idUser', userController.deleteUser);

module.exports = router;
