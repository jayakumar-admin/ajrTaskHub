const authService = require('../services/auth.service');

const register = async (req, res) => {
    try {
        const user = await authService.register(req.body);
        res.status(201).json({ user });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { token, user } = await authService.login(req.body);
        res.json({ token, user });
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
};

const getProfile = async (req, res) => {
    try {
        // req.user is attached by the authMiddleware
        const userProfile = await authService.getProfile(req.user.id);
        res.json(userProfile);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};

module.exports = {
    register,
    login,
    getProfile,
};
