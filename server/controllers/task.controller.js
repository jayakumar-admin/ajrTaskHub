const taskService = require('../services/task.service');

const getAllTasks = async (req, res) => {
    try {
        const tasks = await taskService.getAllTasks();
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getTaskById = async (req, res) => {
    try {
        const task = await taskService.getTaskById(req.params.id);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json(task);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createTask = async (req, res) => {
    try {
        const task = await taskService.createTask(req.body, req.user.id);
        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateTask = async (req, res) => {
    try {
        const updatedTask = await taskService.updateTask(req.params.id, req.body, req.user.id);
        res.json(updatedTask);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteTask = async (req, res) => {
    try {
        await taskService.deleteTask(req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getCommentsForTask = async (req, res) => {
    try {
        const comments = await taskService.getCommentsForTask(req.params.id);
        res.json(comments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const addCommentToTask = async (req, res) => {
    try {
        const comment = await taskService.addCommentToTask(req.params.id, req.body.text, req.user.id);
        res.status(201).json(comment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAttachmentsForTask = async (req, res) => {
    try {
        const attachments = await taskService.getAttachmentsForTask(req.params.id);
        res.json(attachments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const addAttachmentToTask = async (req, res) => {
    try {
        const attachment = await taskService.addAttachmentToTask(req.params.id, req.body, req.user.id);
        res.status(201).json(attachment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getHistoryForTask = async (req, res) => {
    try {
        const history = await taskService.getHistoryForTask(req.params.id);
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const likeTask = async (req, res) => {
    try {
        await taskService.likeTask(req.params.id, req.user.id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const unlikeTask = async (req, res) => {
    try {
        await taskService.unlikeTask(req.params.id, req.user.id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAllComments = async (req, res) => {
     try {
        const comments = await taskService.getAllComments();
        res.json(comments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


module.exports = {
    getAllTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    getCommentsForTask,
    addCommentToTask,
    getAttachmentsForTask,
    addAttachmentToTask,
    getHistoryForTask,
    likeTask,
    unlikeTask,
    getAllComments
};
