const adminService = require('../services/admin.service');

const updateUserRole = async (req, res) => {
    try {
        const updatedUser = await adminService.updateUserRole(req.params.userId, req.body.role);
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        await adminService.deleteUser(req.params.userId, req.user.id);
        res.status(204).send();
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

const getRolePermissions = async (req, res) => {
    try {
        const permissions = await adminService.getRolePermissions();
        res.json(permissions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateRolePermissions = async (req, res) => {
    try {
        const { role } = req.params;
        const permissions = req.body;
        await adminService.updateRolePermissions(role, permissions);
        res.status(200).json({ message: 'Permissions updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getWhatsAppConfig = async (req, res) => {
    try {
        const config = await adminService.getWhatsAppConfig();
        res.json(config);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const saveWhatsAppConfig = async (req, res) => {
    try {
        await adminService.saveWhatsAppConfig(req.body);
        res.status(200).json({ message: 'WhatsApp config saved successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    updateUserRole,
    deleteUser,
    getRolePermissions,
    updateRolePermissions,
    getWhatsAppConfig,
    saveWhatsAppConfig,
};
