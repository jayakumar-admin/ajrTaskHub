const notificationService = require('../services/notification.service');

const getNotifications = async (req, res) => {
    try {
        const notifications = await notificationService.getNotifications(req.user.id);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const addNotification = async (req, res) => {
    try {
        const notification = await notificationService.addNotification(req.body);
        res.status(201).json(notification);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const markNotificationAsRead = async (req, res) => {
    try {
        await notificationService.markNotificationAsRead(req.params.id, req.user.id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const markAllNotificationsAsRead = async (req, res) => {
    try {
        await notificationService.markAllNotificationsAsRead(req.user.id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getNotifications,
    addNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
};
