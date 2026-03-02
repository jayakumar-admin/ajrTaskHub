const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authMiddleware.verifyToken, authController.getProfile);
router.post('/change-password', authMiddleware.verifyToken, authController.changePassword);

module.exports = router;
