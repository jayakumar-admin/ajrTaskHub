const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authQueries = require('../queries/auth.queries');

const register = async ({ username, email, password, role }) => {
    const existingUser = await authQueries.findUserByEmail(email);
    if (existingUser) {
        throw new Error('User with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    return await authQueries.createUser(username, email, passwordHash, role);
};

const login = async ({ email, password }) => {
    const user = await authQueries.findUserByEmail(email);
    if (!user) {
        throw new Error('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
        throw new Error('Invalid credentials');
    }

    const payload = {
        id: user.id,
        role: user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Remove password hash from the user object returned to the client
    const { password_hash, ...userWithoutPassword } = user;

    return { token, user: userWithoutPassword };
};

const getProfile = async (userId) => {
    const user = await authQueries.findUserById(userId);
    if (!user) {
        throw new Error('User not found');
    }
    return user;
};

module.exports = {
    register,
    login,
    getProfile,
};
