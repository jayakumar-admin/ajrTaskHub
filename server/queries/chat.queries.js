const db = require('../config/db');

const getConversations = async (userId) => {
    const { rows } = await db.query(
        `WITH last_messages AS (
            SELECT
                LEAST(sender_id, receiver_id) as user1,
                GREATEST(sender_id, receiver_id) as user2,
                MAX(created_at) as last_message_time
            FROM chat_messages
            WHERE sender_id = $1 OR receiver_id = $1
            GROUP BY user1, user2
        )
        SELECT
            u.id as other_user_id,
            u.username as other_user_username,
            u.avatar_url as other_user_avatar_base64,
            cm.message_text as last_message_text,
            cm.created_at as last_message_timestamp,
            (SELECT COUNT(*) FROM chat_messages unread WHERE unread.receiver_id = $1 AND unread.sender_id = u.id AND unread.is_read = false) as unread_count
        FROM last_messages lm
        JOIN chat_messages cm ON (
            (cm.sender_id = lm.user1 AND cm.receiver_id = lm.user2) OR
            (cm.sender_id = lm.user2 AND cm.receiver_id = lm.user1)
        ) AND cm.created_at = lm.last_message_time
        JOIN users u ON u.id = (CASE WHEN lm.user1 = $1 THEN lm.user2 ELSE lm.user1 END)
        ORDER BY cm.created_at DESC`,
        [userId]
    );
    return rows;
};

const getMessages = async (userId, otherUserId) => {
    // Mark messages as read
    await db.query(
        'UPDATE chat_messages SET is_read = true WHERE sender_id = $1 AND receiver_id = $2',
        [otherUserId, userId]
    );
    
    // Fetch messages
    const { rows } = await db.query(
        `SELECT cm.*, u.username as sender_username
         FROM chat_messages cm
         JOIN users u ON u.id = cm.sender_id
         WHERE (cm.sender_id = $1 AND cm.receiver_id = $2) OR (cm.sender_id = $2 AND cm.receiver_id = $1)
         ORDER BY cm.created_at ASC`,
        [userId, otherUserId]
    );
    return rows;
};

const createMessage = async (senderId, receiverId, messageText, attachmentUrl, attachmentType) => {
    const { rows } = await db.query(
        `INSERT INTO chat_messages (sender_id, receiver_id, message_text, attachment_url, attachment_type)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *, (SELECT username FROM users WHERE id = $1) as sender_username`,
        [senderId, receiverId, messageText, attachmentUrl, attachmentType]
    );
    return rows[0];
};

module.exports = {
    getConversations,
    getMessages,
    createMessage,
};
