
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const adminController = require('../controllers/admin.controller');

// Middleware to ensure user is authenticated and is an admin for all routes in this file
router.use(authMiddleware.verifyToken);
router.use(authMiddleware.isAdmin);

// User Management
router.put('/users/:userId/role', adminController.updateUserRole);
router.delete('/users/:userId', adminController.deleteUser);

// Permissions Management
router.get('/permissions', adminController.getRolePermissions);
router.put('/permissions/:role', adminController.updateRolePermissions);

// WhatsApp Configuration
router.get('/whatsapp-config', adminController.getWhatsAppConfig);
router.post('/whatsapp-config', adminController.saveWhatsAppConfig);

// Cron Job Management
router.get('/cron-jobs', adminController.getCronJobs);
router.put('/cron-jobs/:jobId', adminController.updateCronJob);


module.exports = router;
