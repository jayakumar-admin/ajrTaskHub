

const axios = require('axios');
const adminQueries = require('../queries/admin.queries');
const whatsappQueries = require('../queries/whatsapp.queries');

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

const sendTaskAssignmentNotification = async (phoneNumber, task, assignedByUsername) => {
    const config = await adminQueries.getWhatsAppConfig();
    if (!config || !config.whatsapp_integration_enabled || !config.whatsapp_assignment_template) {
        console.log('WhatsApp assignment notification is disabled or template is not configured.');
        return;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://your-app-domain.com';
    const taskLink = `${frontendUrl}/tasks/${task.id}`;

    const message = config.whatsapp_assignment_template
        .replace(/{{taskTitle}}/g, task.title)
        .replace(/{{assignedBy}}/g, assignedByUsername)
        .replace(/{{taskDescription}}/g, task.description || 'No description.')
        .replace(/{{taskDueDate}}/g, new Date(task.due_date).toDateString())
        .replace(/{{taskPriority}}/g, task.priority)
        .replace(/{{taskLink}}/g, taskLink);
    
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
    } catch (error) {
        const errorMessage = error.response?.data?.error?.message || error.message;
        await whatsappQueries.createLog({
            phoneNumber,
            messageContent: message,
            status: 'failure',
            errorMessage,
        });
        console.error('Meta API Error (Task Assignment):', error.response ? error.response.data : error.message);
        // Do not throw to avoid failing the main operation (task creation/update)
    }
};

const sendStatusUpdate = async (phoneNumber, task) => {
    const config = await adminQueries.getWhatsAppConfig();
    if (!config || !config.whatsapp_integration_enabled || !config.whatsapp_status_template) {
        console.log('WhatsApp status update notification is disabled or template is not configured.');
        return;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://your-app-domain.com';
    const taskLink = `${frontendUrl}/tasks/${task.id}`;

    const message = config.whatsapp_status_template
        .replace(/{{taskTitle}}/g, task.title)
        .replace(/{{newStatus}}/g, task.status)
        .replace(/{{taskDescription}}/g, task.description || 'No description.')
        .replace(/{{taskDueDate}}/g, new Date(task.due_date).toDateString())
        .replace(/{{taskPriority}}/g, task.priority)
        .replace(/{{taskLink}}/g, taskLink);
    
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
    } catch (error) {
        const errorMessage = error.response?.data?.error?.message || error.message;
        await whatsappQueries.createLog({
            phoneNumber,
            messageContent: message,
            status: 'failure',
            errorMessage,
        });
        console.error('Meta API Error (Status Update):', error.response ? error.response.data : error.message);
    }
};

module.exports = {
    sendMessage,
    sendTaskAssignmentNotification,
    sendStatusUpdate,
};