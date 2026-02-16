const adminQueries = require('../queries/admin.queries');

const updateUserRole = async (userId, role) => {
    return await adminQueries.updateUserRole(userId, role);
};

const deleteUser = async (userId, adminId) => {
    if (userId === adminId) {
        const error = new Error('Admins cannot delete their own account.');
        error.statusCode = 400;
        throw error;
    }
    await adminQueries.deleteUserById(userId);
};

const getRolePermissions = async () => {
    return await adminQueries.getRolePermissions();
};

const updateRolePermissions = async (role, permissions) => {
    if (role === 'Admin') {
        const error = new Error('Admin permissions cannot be changed.');
        error.statusCode = 403;
        throw error;
    }
    await adminQueries.updateRolePermissions(role, permissions);
};

const getWhatsAppConfig = async () => {
    return await adminQueries.getWhatsAppConfig();
};

const saveWhatsAppConfig = async (config) => {
    await adminQueries.saveWhatsAppConfig(config);
};

module.exports = {
    updateUserRole,
    deleteUser,
    getRolePermissions,
    updateRolePermissions,
    getWhatsAppConfig,
    saveWhatsAppConfig,
};
