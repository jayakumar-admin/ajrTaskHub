
const db = require('../config/db');

const updateUserRole = async (userId, role) => {
    const { rows } = await db.query(
        'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, email, role, avatar_url, created_at',
        [role, userId]
    );
    return rows[0];
};

const deleteUserById = async (userId) => {
    await db.query('DELETE FROM users WHERE id = $1', [userId]);
};

const findUserById = async (userId) => {
    const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    return rows[0];
};

const getRolePermissions = async () => {
    const { rows } = await db.query('SELECT * FROM role_permissions ORDER BY role');
    return rows;
};

const updateRolePermissions = async (role, permissions) => {
    const setClause = Object.keys(permissions).map((key, i) => `${key} = $${i + 2}`).join(', ');
    const values = [role, ...Object.values(permissions)];
    await db.query(`UPDATE role_permissions SET ${setClause} WHERE role = $1`, values);
};

const getWhatsAppConfig = async () => {
    try {
        const { rows } = await db.query('SELECT * FROM system_config WHERE id = 1');
        return rows[0];
    } catch (error) {
        if (error.code === '42P01') { // undefined_table
            console.warn('Warning: "system_config" table does not exist. Returning null config.');
            return null;
        }
        throw error;
    }
};

const saveWhatsAppConfig = async (config) => {
    const { 
        whatsapp_integration_enabled, 
        whatsapp_access_token, 
        whatsapp_phone_number_id, 
        whatsapp_graph_url, 
        whatsapp_status_template,
        whatsapp_assignment_template
    } = config;

    await db.query(
        `INSERT INTO system_config (id, whatsapp_integration_enabled, whatsapp_access_token, whatsapp_phone_number_id, whatsapp_graph_url, whatsapp_status_template, whatsapp_assignment_template)
         VALUES (1, $1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
            whatsapp_integration_enabled = $1,
            whatsapp_access_token = $2,
            whatsapp_phone_number_id = $3,
            whatsapp_graph_url = $4,
            whatsapp_status_template = $5,
            whatsapp_assignment_template = $6`,
        [whatsapp_integration_enabled, whatsapp_access_token, whatsapp_phone_number_id, whatsapp_graph_url, whatsapp_status_template, whatsapp_assignment_template]
    );
};

const getCronJobs = async () => {
    try {
        const { rows } = await db.query('SELECT * FROM cron_jobs ORDER BY name');
        return rows;
    } catch (error) {
         if (error.code === '42P01') { // undefined_table
            console.warn('Warning: "cron_jobs" table does not exist. Returning empty array.');
            return [];
        }
        throw error;
    }
};

const updateCronJob = async (jobId, { schedule, enabled }) => {
    const { rows } = await db.query(
        'UPDATE cron_jobs SET schedule = $1, enabled = $2 WHERE id = $3 RETURNING *',
        [schedule, enabled, jobId]
    );
    return rows[0];
};

const getWhatsAppLogs = async () => {
    try {
        const { rows } = await db.query(
            'SELECT * FROM whatsapp_logs ORDER BY sent_at DESC LIMIT 100'
        );
        return rows;
    } catch (error) {
        if (error.code === '42P01') { // undefined_table
            console.warn('Warning: "whatsapp_logs" table does not exist. Returning empty array.');
            return [];
        }
        throw error;
    }
};

module.exports = {
    updateUserRole,
    deleteUserById,
    findUserById,
    getRolePermissions,
    updateRolePermissions,
    getWhatsAppConfig,
    saveWhatsAppConfig,
    getCronJobs,
    updateCronJob,
    getWhatsAppLogs,
};
