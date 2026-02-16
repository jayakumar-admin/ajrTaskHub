const whatsappService = require('../services/whatsapp.service');

const sendMessage = async (req, res) => {
    try {
        const { phoneNumber, message } = req.body;
        const result = await whatsappService.sendMessage(phoneNumber, message);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    sendMessage,
};
