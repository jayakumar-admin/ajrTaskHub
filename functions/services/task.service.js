const taskQueries = require('../queries/task.queries');
const userQueries = require('../queries/user.queries');

const _hydrateTasksWithUsernames = async (tasks) => {
    const users = await userQueries.getAllUsers();
    const userMap = new Map(users.map(u => [u.id, u.username]));

    const hydrate = (task) => ({
        ...task,
        assigned_to_username: userMap.get(task.assign_to) || 'N/A',
        assigned_by_username: userMap.get(task.assigned_by) || 'N/A',
        updated_by_username: userMap.get(task.updated_by) || 'N/A',
    });

    return Array.isArray(tasks) ? tasks.map(hydrate) : hydrate(tasks);
};


const getAllTasks = async () => {
    const tasks = await taskQueries.getAllTasks();
    return await _hydrateTasksWithUsernames(tasks);
};

const getTaskById = async (taskId) => {
    const task = await taskQueries.findTaskById(taskId);
    return task ? await _hydrateTasksWithUsernames(task) : null;
};

const createTask = async (taskData, userId) => {
    const newTask = await taskQueries.createTask(taskData, userId);
    await taskQueries.createHistoryEntry(newTask.id, 'Task Created', userId);
    return await _hydrateTasksWithUsernames(newTask);
};

const updateTask = async (taskId, taskData, userId) => {
    const originalTask = await taskQueries.findTaskById(taskId);
    const updatedTask = await taskQueries.updateTask(taskId, taskData, userId);

    if (originalTask.status !== updatedTask.status) {
        await taskQueries.createHistoryEntry(taskId, `Status changed from ${originalTask.status} to ${updatedTask.status}`, userId);
    }
    // Add more history tracking as needed

    return await _hydrateTasksWithUsernames(updatedTask);
};

const deleteTask = async (taskId) => {
    // History, comments, etc., will be deleted by CASCADE constraint in DB
    await taskQueries.deleteTaskById(taskId);
};

const getCommentsForTask = async (taskId) => {
    return await taskQueries.getCommentsByTaskId(taskId);
};

const addCommentToTask = async (taskId, text, userId) => {
    const comment = await taskQueries.createComment(taskId, text, userId);
    await taskQueries.createHistoryEntry(taskId, 'Comment Added', userId, `"${text.substring(0, 30)}..."`);
    return comment;
};

const getAttachmentsForTask = async (taskId) => {
    return await taskQueries.getAttachmentsByTaskId(taskId);
};

const addAttachmentToTask = async (taskId, attachmentData, userId) => {
    const attachment = await taskQueries.createAttachment(taskId, attachmentData, userId);
    await taskQueries.createHistoryEntry(taskId, 'Attachment Added', userId, attachment.file_name);
    return attachment;
};

const getHistoryForTask = async (taskId) => {
    return await taskQueries.getHistoryByTaskId(taskId);
};

const likeTask = async (taskId, userId) => {
    await taskQueries.likeTask(taskId, userId);
};

const unlikeTask = async (taskId, userId) => {
    await taskQueries.unlikeTask(taskId, userId);
};

const getAllComments = async () => {
    return await taskQueries.getAllComments();
}


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
    getAllComments,
};
