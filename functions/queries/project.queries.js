const db = require('../config/db');

const getProjectsForUser = async (userId) => {
    const { rows } = await db.query(
        `SELECT p.*, u.username as created_by_username, array_agg(pu.user_id) as member_ids
         FROM projects p
         JOIN users u ON p.created_by = u.id
         JOIN project_users pu ON p.id = pu.project_id
         WHERE p.id IN (SELECT project_id FROM project_users WHERE user_id = $1)
         GROUP BY p.id, u.username
         ORDER BY p.created_at DESC`,
        [userId]
    );
    return rows;
};

const findProjectById = async (projectId) => {
    const { rows } = await db.query('SELECT * FROM projects WHERE id = $1', [projectId]);
    return rows[0];
};

const createProject = async (projectData, creatorId) => {
    const { name, description, image_url } = projectData;
    const { rows } = await db.query(
        'INSERT INTO projects (name, description, created_by, image_url) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, description, creatorId, image_url]
    );
    return rows[0];
};

const addProjectMembers = async (projectId, memberIds) => {
    const values = memberIds.map(userId => `('${projectId}', '${userId}')`).join(',');
    await db.query(`INSERT INTO project_users (project_id, user_id) VALUES ${values}`);
};

const updateProject = async (projectId, projectData) => {
    const { name, description, image_url } = projectData;
    const { rows } = await db.query(
        'UPDATE projects SET name = $1, description = $2, image_url = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
        [name, description, image_url, projectId]
    );
    return rows[0];
};

const removeProjectMembers = async (projectId) => {
    await db.query('DELETE FROM project_users WHERE project_id = $1', [projectId]);
};

const deleteProjectById = async (projectId) => {
    await db.query('DELETE FROM projects WHERE id = $1', [projectId]);
};

const getProjectMembers = async (projectId) => {
    const { rows } = await db.query('SELECT user_id FROM project_users WHERE project_id = $1', [projectId]);
    return rows.map(r => r.user_id);
};

module.exports = {
    getProjectsForUser,
    findProjectById,
    createProject,
    addProjectMembers,
    updateProject,
    removeProjectMembers,
    deleteProjectById,
    getProjectMembers,
};