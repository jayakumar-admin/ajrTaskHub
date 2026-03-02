

const axios = require('axios');
const adminQueries = require('../queries/admin.queries');
const whatsappQueries = require('../queries/whatsapp.queries');
const userQueries = require('../queries/user.queries');

const sendMessage = async (phoneNumber, message) => {
    const config = await adminQueries.getWhatsAppConfig();

    if (!config || !config.whatsapp_integration_enabled) {
        throw new Error('WhatsApp integration is not enabled or configured.');
    }

    const { whatsapp_graph_url, whatsapp_phone_number_id, whatsapp_access_token } = config;
    
    const payload = {
        messaging_product: "whatsapp",
        to: phoneNumber,
        type: "text",
        text: { "body": message }
    };

    try {
        const response = await axios.post(`${whatsapp_graph_url}/${whatsapp_phone_number_id}/messages`, payload, {
            headers: {
                'Authorization': `Bearer ${whatsapp_access_token}`,
                'Content-Type': 'application/json'
            }
        });
        await whatsappQueries.createLog({
            phoneNumber,
            messageContent: message,
            status: 'success',
            metaMessageId: response.data?.messages?.[0]?.id,
        });
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.error?.message || error.message;
        await whatsappQueries.createLog({
            phoneNumber,
            messageContent: message,
            status: 'failure',
            errorMessage,
        });
        console.error('Meta API Error:', error.response ? error.response.data : error.message);
        throw new Error(`Failed to send WhatsApp message: ${errorMessage}`);
    }
};

const sendTemplateMessage = async (userId, templateName, parameters) => {
    const config = await adminQueries.getWhatsAppConfig();
    if (!config || !config.whatsapp_integration_enabled) {
        console.log('WhatsApp integration is disabled globally.');
        return;
    }

    const userSettings = await userQueries.findUserSettingsById(userId);
    if (!userSettings || !userSettings.whatsapp_notifications_enabled || !userSettings.whatsapp_number) {
        console.log(`WhatsApp notifications disabled or number missing for user ${userId}.`);
        return;
    }

    const phoneNumber = userSettings.whatsapp_number;
    const { whatsapp_graph_url, whatsapp_phone_number_id, whatsapp_access_token } = config;

    const payload = {
        messaging_product: "whatsapp",
        to: phoneNumber,
        type: "template",
        template: {
            name: templateName,
            language: { code: "en" },
            components: [
                {
                    type: "body",
                    parameters: parameters.map(param => ({ type: "text", text: String(param) }))
                }
            ]
        }
    };

    try {
        const response = await axios.post(`${whatsapp_graph_url}/${whatsapp_phone_number_id}/messages`, payload, {
            headers: {
                'Authorization': `Bearer ${whatsapp_access_token}`,
                'Content-Type': 'application/json'
            }
        });
        
        await whatsappQueries.createLog({
            phoneNumber,
            messageContent: `Template: ${templateName}, Params: ${JSON.stringify(parameters)}`,
            status: 'success',
            metaMessageId: response.data?.messages?.[0]?.id,
        });
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.error?.message || error.message;
        await whatsappQueries.createLog({
            phoneNumber,
            messageContent: `Template: ${templateName}, Params: ${JSON.stringify(parameters)}`,
            status: 'failure',
            errorMessage,
        });
        console.error('Meta API Error (Template):', error.response ? error.response.data : error.message);
        // We don't throw here to avoid breaking the calling flow (e.g. task update)
    }
};

// Deprecated or Legacy functions (kept for backward compatibility if needed, or redirected)
const sendTaskAssignmentNotification = async (phoneNumber, task, assignedByUsername) => {
    // This function was using text templates. We should try to use the new template system if possible,
    // but it requires userId, not phoneNumber.
    // Since this is legacy/internal, we might leave it or update it to find user by phone (hard).
    // Better to just leave it as is for now, but the frontend will use sendTemplateMessage.
    // Actually, let's keep it but maybe log a warning.
    console.warn('sendTaskAssignmentNotification is deprecated. Use sendTemplateMessage instead.');
    return sendMessage(phoneNumber, `Task Assigned: ${task.title}`);
};

const sendStatusUpdate = async (phoneNumber, task) => {
    console.warn('sendStatusUpdate is deprecated. Use sendTemplateMessage instead.');
    return sendMessage(phoneNumber, `Task Status Updated: ${task.title} -> ${task.status}`);
};

module.exports = {
    sendMessage,
    sendTemplateMessage,
    sendTaskAssignmentNotification,
    sendStatusUpdate,
};