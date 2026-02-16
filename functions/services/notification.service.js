const notificationQueries = require('../queries/notification.queries');

const getNotifications = async (userId) => {
    return await notificationQueries.getNotificationsByUserId(userId);
};

const addNotification = async (notificationData) => {
    return await notificationQueries.createNotification(notificationData);
};

const markNotificationAsRead = async (notificationId, userId) => {
    await notificationQueries.markAsRead(notificationId, userId);
};

const markAllNotificationsAsRead = async (userId) => {
    await notificationQueries.markAllAsRead(userId);
};

module.exports = {
    getNotifications,
    addNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
};
