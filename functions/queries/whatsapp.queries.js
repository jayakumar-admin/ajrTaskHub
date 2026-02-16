const db = require('../config/db');

const createLog = async (logData) => {
    const { phoneNumber, messageContent, status, errorMessage, metaMessageId } = logData;
    await db.query(
        `INSERT INTO whatsapp_logs (phone_number, message_content, status, error_message, meta_message_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [phoneNumber, messageContent, status, errorMessage, metaMessageId]
    );
};

module.exports = {
    createLog,
};
