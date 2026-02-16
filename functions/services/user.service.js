const userQueries = require('../queries/user.queries');

const getAllUsers = async () => {
    return await userQueries.getAllUsers();
};

const getUserSettings = async (userId) => {
    let settings = await userQueries.findUserSettingsById(userId);
    if (!settings) {
        // Create default settings if they don't exist
        settings = await userQueries.upsertUserSettings(userId, {
            email_notifications_enabled: true,
            whatsapp_notifications_enabled: false,
            whatsapp_number: '',
        });
    }
    return settings;
};

const updateUserSettings = async (userId, settings) => {
    return await userQueries.upsertUserSettings(userId, settings);
};

const updateUserProfile = async (userId, updates) => {
    return await userQueries.updateUserProfile(userId, updates);
};

module.exports = {
    getAllUsers,
    getUserSettings,
    updateUserSettings,
    updateUserProfile,
};
