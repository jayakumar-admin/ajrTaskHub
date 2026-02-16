const db = require('../config/db');

const getAllUsers = async () => {
    const { rows } = await db.query('SELECT id, username, email, role, avatar_url, created_at FROM users ORDER BY username');
    return rows;
};

const findUserSettingsById = async (userId) => {
    const { rows } = await db.query('SELECT * FROM user_settings WHERE user_id = $1', [userId]);
    return rows[0];
};

const upsertUserSettings = async (userId, settings) => {
    const { email_notifications_enabled, whatsapp_notifications_enabled, whatsapp_number } = settings;
    const { rows } = await db.query(
        `INSERT INTO user_settings (user_id, email_notifications_enabled, whatsapp_notifications_enabled, whatsapp_number, updated_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (user_id) DO UPDATE SET
            email_notifications_enabled = $2,
            whatsapp_notifications_enabled = $3,
            whatsapp_number = $4,
            updated_at = NOW()
         RETURNING *`,
        [userId, email_notifications_enabled, whatsapp_notifications_enabled, whatsapp_number]
    );
    return rows[0];
};

const updateUserProfile = async (userId, { username, avatar_url }) => {
    const fieldsToUpdate = [];
    const values = [];
    let queryIndex = 1;

    if (username) {
        fieldsToUpdate.push(`username = $${queryIndex++}`);
        values.push(username);
    }
    if (avatar_url) {
        fieldsToUpdate.push(`avatar_url = $${queryIndex++}`);
        values.push(avatar_url);
    }

    if (fieldsToUpdate.length === 0) {
        // If nothing to update, just fetch the user
        const { rows } = await db.query('SELECT id, username, email, role, avatar_url FROM users WHERE id = $1', [userId]);
        return rows[0];
    }

    values.push(userId);
    const { rows } = await db.query(
        `UPDATE users SET ${fieldsToUpdate.join(', ')} WHERE id = $${queryIndex} RETURNING id, username, email, role, avatar_url`,
        values
    );
    return rows[0];
};

module.exports = {
    getAllUsers,
    findUserSettingsById,
    upsertUserSettings,
    updateUserProfile,
};
