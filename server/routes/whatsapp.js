const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const whatsappController = require('../controllers/whatsapp.controller');

router.post('/send', authMiddleware.verifyToken, whatsappController.sendMessage);

module.exports = router;
