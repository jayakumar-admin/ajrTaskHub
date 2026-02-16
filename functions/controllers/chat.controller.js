const chatService = require('../services/chat.service');

const getConversations = async (req, res) => {
    try {
        const conversations = await chatService.getConversations(req.user.id);
        res.json(conversations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getMessages = async (req, res) => {
    try {
        const messages = await chatService.getMessages(req.user.id, req.params.otherUserId);
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const sendMessage = async (req, res) => {
    try {
        const message = await chatService.sendMessage(req.user.id, req.body);
        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getConversations,
    getMessages,
    sendMessage,
};
