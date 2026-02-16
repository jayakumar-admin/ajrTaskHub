const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const userController = require('../controllers/user.controller');

router.use(authMiddleware.verifyToken);

router.get('/', userController.getAllUsers);
router.get('/settings', userController.getUserSettings);
router.post('/settings', userController.updateUserSettings);
router.put('/:id/profile', userController.updateUserProfile);

module.exports = router;
