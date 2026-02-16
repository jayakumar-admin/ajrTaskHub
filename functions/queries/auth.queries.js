const db = require('../config/db');

const createUser = async (username, email, passwordHash, role) => {
    const { rows } = await db.query(
        'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role, avatar_url, created_at',
        [username, email, passwordHash, role]
    );
    return rows[0];
};

const findUserByEmail = async (email) => {
    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0];
};

const findUserById = async (userId) => {
    const { rows } = await db.query('SELECT id, username, email, role, avatar_url, created_at FROM users WHERE id = $1', [userId]);
    return rows[0];
};

module.exports = {
    createUser,
    findUserByEmail,
    findUserById,
};
