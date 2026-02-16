
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const taskController = require('../controllers/task.controller');

router.use(authMiddleware.verifyToken);

// Special route to get all comments (used on initial load)
router.get('/all', taskController.getAllComments);

module.exports = router;
