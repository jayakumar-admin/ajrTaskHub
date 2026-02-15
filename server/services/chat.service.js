const chatQueries = require('../queries/chat.queries');

const getConversations = async (userId) => {
    return await chatQueries.getConversations(userId);
};

const getMessages = async (userId, otherUserId) => {
    return await chatQueries.getMessages(userId, otherUserId);
};

const sendMessage = async (senderId, { receiverId, messageText, attachmentUrl, attachmentType }) => {
    return await chatQueries.createMessage(senderId, receiverId, messageText, attachmentUrl, attachmentType);
};

module.exports = {
    getConversations,
    getMessages,
    sendMessage,
};
