const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const notificationController = require('../controllers/notification.controller');

router.use(authMiddleware.verifyToken);

router.get('/', notificationController.getNotifications);
router.post('/', notificationController.addNotification);
router.post('/:id/read', notificationController.markNotificationAsRead);
router.post('/read-all', notificationController.markAllNotificationsAsRead);

module.exports = router;
