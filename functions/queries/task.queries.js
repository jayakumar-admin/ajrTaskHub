const db = require('../config/db');

const getAllTasks = async () => {
    const { rows } = await db.query(
        `SELECT t.*, COALESCE(array_agg(tl.user_id) FILTER (WHERE tl.user_id IS NOT NULL), '{}') as liked_by_users
         FROM tasks t
         LEFT JOIN task_likes tl ON t.id = tl.task_id
         GROUP BY t.id
         ORDER BY t.created_at DESC`
    );
    return rows;
};

const findTaskById = async (taskId) => {
    const { rows } = await db.query(
        `SELECT t.*, COALESCE(array_agg(tl.user_id) FILTER (WHERE tl.user_id IS NOT NULL), '{}') as liked_by_users
         FROM tasks t
         LEFT JOIN task_likes tl ON t.id = tl.task_id
         WHERE t.id = $1
         GROUP BY t.id`,
        [taskId]
    );
    return rows[0];
};

const createTask = async (taskData, userId) => {
    const { title, description, type, priority, duration, start_date, due_date, status, assign_to, approval_required, approval_status, tags, tagged_users, subtasks, reminder_option, repeat_option, project_id } = taskData;
    const { rows } = await db.query(
        `INSERT INTO tasks (title, description, type, priority, duration, start_date, due_date, status, assign_to, assigned_by, updated_by, approval_required, approval_status, tags, tagged_users, subtasks, reminder_option, repeat_option, project_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10, $11, $12, $13, $14, $15, $16, $17, $18)
         RETURNING *`,
        [title, description, type, priority, duration, start_date, due_date, status || 'todo', assign_to, userId, approval_required, approval_status, tags, tagged_users, subtasks, reminder_option, repeat_option, project_id]
    );
    return { ...rows[0], liked_by_users: [] }; // New task has no likes
};

const updateTask = async (taskId, taskData, userId) => {
    const { title, description, type, priority, duration, start_date, due_date, status, assign_to, approval_required, approval_status, tags, tagged_users, subtasks, reminder_option, repeat_option, project_id } = taskData;
    const { rows } = await db.query(
        `UPDATE tasks SET 
            title = $1, description = $2, type = $3, priority = $4, duration = $5, start_date = $6, due_date = $7, status = $8, assign_to = $9, 
            approval_required = $10, approval_status = $11, tags = $12, tagged_users = $13, subtasks = $14, reminder_option = $15, repeat_option = $16, 
            project_id = $17, updated_by = $18, updated_at = NOW()
         WHERE id = $19 RETURNING *`,
        [title, description, type, priority, duration, start_date, due_date, status, assign_to, approval_required, approval_status, tags, tagged_users, subtasks, reminder_option, repeat_option, project_id, userId, taskId]
    );
    return rows[0];
};

const deleteTaskById = async (taskId) => {
    await db.query('DELETE FROM tasks WHERE id = $1', [taskId]);
};

// Comments
const getCommentsByTaskId = async (taskId) => {
    const { rows } = await db.query('SELECT c.*, u.username FROM comments c JOIN users u ON c.user_id = u.id WHERE task_id = $1 ORDER BY created_at ASC', [taskId]);
    return rows;
};

const createComment = async (taskId, text, userId) => {
    const { rows } = await db.query(
        'INSERT INTO comments (task_id, text, user_id) VALUES ($1, $2, $3) RETURNING *, (SELECT username FROM users WHERE id = $3)',
        [taskId, text, userId]
    );
    return rows[0];
};

const getAllComments = async () => {
    const { rows } = await db.query('SELECT c.*, u.username FROM comments c JOIN users u ON c.user_id = u.id');
    return rows;
}

// Attachments
const getAttachmentsByTaskId = async (taskId) => {
    const { rows } = await db.query('SELECT a.*, u.username as uploaded_by_username FROM attachments a JOIN users u ON a.uploaded_by = u.id WHERE task_id = $1', [taskId]);
    return rows;
};

const createAttachment = async (taskId, { file_url, fileName }, userId) => {
    const { rows } = await db.query(
        'INSERT INTO attachments (task_id, file_url, file_name, uploaded_by) VALUES ($1, $2, $3, $4) RETURNING *',
        [taskId, file_url, fileName, userId]
    );
    return rows[0];
};

// History
const getHistoryByTaskId = async (taskId) => {
    const { rows } = await db.query('SELECT h.*, u.username FROM task_history h JOIN users u ON h.user_id = u.id WHERE task_id = $1 ORDER BY timestamp ASC', [taskId]);
    return rows;
};

const createHistoryEntry = async (taskId, action, userId, details = null) => {
    await db.query(
        'INSERT INTO task_history (task_id, action, user_id, details) VALUES ($1, $2, $3, $4)',
        [taskId, action, userId, details]
    );
};

// Likes
const likeTask = async (taskId, userId) => {
    await db.query('INSERT INTO task_likes (task_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [taskId, userId]);
};

const unlikeTask = async (taskId, userId) => {
    await db.query('DELETE FROM task_likes WHERE task_id = $1 AND user_id = $2', [taskId, userId]);
};

module.exports = {
    getAllTasks,
    findTaskById,
    createTask,
    updateTask,
    deleteTaskById,
    getCommentsByTaskId,
    createComment,
    getAllComments,
    getAttachmentsByTaskId,
    createAttachment,
    getHistoryByTaskId,
    createHistoryEntry,
    likeTask,
    unlikeTask,
};