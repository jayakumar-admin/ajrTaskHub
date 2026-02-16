
const axios = require('axios');
const adminQueries = require('../queries/admin.queries');

const sendMessage = async (phoneNumber, message) => {
    const config = await adminQueries.getWhatsAppConfig();

    if (!config || !config.whatsapp_integration_enabled) {
        throw new Error('WhatsApp integration is not enabled or configured.');
    }

    const { whatsapp_graph_url, whatsapp_phone_number_id, whatsapp_access_token } = config;
    
    const phone = formatPhone(phoneNumber);
    const payload = {
        messaging_product: "whatsapp",
        to: phone,
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
        console.log('WhatsApp message sent successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('Meta API Error:', error.response ? error.response.data : error.message);
        throw new Error(`Failed to send WhatsApp message: ${error.response?.data?.error?.message || error.message}`);
    }
};

const sendTaskAssignmentNotification = async (phoneNumber, taskTitle, assignedByUsername) => {
    const config = await adminQueries.getWhatsAppConfig();
    if (!config || !config.whatsapp_integration_enabled || !config.whatsapp_assignment_template) {
        console.log('WhatsApp assignment notification is disabled or template is not configured.');
        return;
    }

    const message = config.whatsapp_assignment_template
        .replace('{{taskTitle}}', taskTitle)
        .replace('{{assignedBy}}', assignedByUsername);
    
    const { whatsapp_graph_url, whatsapp_phone_number_id, whatsapp_access_token } = config;
    
    const payload = {
        messaging_product: "whatsapp",
        to: phoneNumber,
        type: "text",
        text: { "body": message }
    };

    try {
        await axios.post(`${whatsapp_graph_url}/${whatsapp_phone_number_id}/messages`, payload, {
            headers: {
                'Authorization': `Bearer ${whatsapp_access_token}`,
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Meta API Error (Task Assignment):', error.response ? error.response.data : error.message);
        // Do not throw to avoid failing the main operation (task creation/update)
    }
};
function formatPhone(number) {
  if (!number) return null;

  // remove spaces and + signs
  let cleaned = number.replace(/\s/g, '').replace(/\+/g, '');

  // remove leading 0 if user entered 0XXXXXXXXXX
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // if already starts with 91, just add +
  if (cleaned.startsWith('91')) {
    return '+' + cleaned;
  }

  // otherwise add +91
  return '+91' + cleaned;
}
module.exports = {
    sendMessage,
    sendTaskAssignmentNotification,
};
