const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const chatController = require('../controllers/chat.controller');

router.use(authMiddleware.verifyToken);

router.get('/conversations', chatController.getConversations);
router.get('/messages/:otherUserId', chatController.getMessages);
router.post('/messages', chatController.sendMessage);

module.exports = router;
