const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const projectController = require('../controllers/project.controller');

router.use(authMiddleware.verifyToken);

router.get('/', projectController.getProjects);
router.post('/', projectController.createProject);
router.get('/:id', projectController.getProjectById);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

module.exports = router;
