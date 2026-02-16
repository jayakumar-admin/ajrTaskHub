const userService = require('../services/user.service');

const getAllUsers = async (req, res) => {
    try {
        const users = await userService.getAllUsers();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getUserSettings = async (req, res) => {
    try {
        const settings = await userService.getUserSettings(req.user.id);
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateUserSettings = async (req, res) => {
    try {
        const settings = await userService.updateUserSettings(req.user.id, req.body);
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateUserProfile = async (req, res) => {
    try {
        // Ensure users can only update their own profile unless they are an admin
        if (req.user.id !== req.params.id && req.user.role !== 'Admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const updatedUser = await userService.updateUserProfile(req.params.id, req.body);
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllUsers,
    getUserSettings,
    updateUserSettings,
    updateUserProfile,
};
