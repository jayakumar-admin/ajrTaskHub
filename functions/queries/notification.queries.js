const db = require('../config/db');

const getNotificationsByUserId = async (userId) => {
    const { rows } = await db.query(
        'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
    );
    return rows;
};

const createNotification = async (notificationData) => {
    const { user_id, message, type, task_id } = notificationData;
    const { rows } = await db.query(
        'INSERT INTO notifications (user_id, message, type, task_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [user_id, message, type, task_id]
    );
    return rows[0];
};

const markAsRead = async (notificationId, userId) => {
    await db.query('UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2', [notificationId, userId]);
};

const markAllAsRead = async (userId) => {
    await db.query('UPDATE notifications SET read = true WHERE user_id = $1', [userId]);
};

module.exports = {
    getNotificationsByUserId,
    createNotification,
    markAsRead,
    markAllAsRead,
};
