
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const taskController = require('../controllers/task.controller');

router.use(authMiddleware.verifyToken);

// Core Task Routes
router.get('/', taskController.getAllTasks);
router.post('/', taskController.createTask);
router.get('/:id', taskController.getTaskById);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

// Task Sub-resource Routes
router.get('/:id/comments', taskController.getCommentsForTask);
router.post('/:id/comments', taskController.addCommentToTask);
router.get('/:id/attachments', taskController.getAttachmentsForTask);
router.post('/:id/attachments', taskController.addAttachmentToTask);
router.get('/:id/history', taskController.getHistoryForTask);

// Likes
router.post('/:id/like', taskController.likeTask);
router.post('/:id/unlike', taskController.unlikeTask);

module.exports = router;
