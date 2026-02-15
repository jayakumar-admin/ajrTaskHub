import { Injectable, signal, effect } from '@angular/core';
import { NotificationService } from './notification.service';
import { SystemConfig } from '../shared/interfaces';

@Injectable({
  providedIn: 'root'
})
export class WhatsAppService {
  // Store global config in signal. In a real app, this would come from a 'system_settings' table.
  // We use localStorage to simulate persistence for the admin configuration.
  globalConfig = signal<SystemConfig>({
    whatsapp_integration_enabled: false,
    whatsapp_provider: 'Twilio',
    whatsapp_status_template: '🔔 *Task Update* 🔔\n\nTask *{{taskTitle}}* has been moved to status: *{{newStatus}}*.'
  });

  constructor(private notificationService: NotificationService) {
    const storedConfig = localStorage.getItem('system_config');
    if (storedConfig) {
      const parsedConfig = JSON.parse(storedConfig);
      // Ensure default template exists if it's missing from stored config
      if (!parsedConfig.whatsapp_status_template) {
        parsedConfig.whatsapp_status_template = this.globalConfig().whatsapp_status_template;
      }
      this.globalConfig.set(parsedConfig);
    }
  }

  updateGlobalConfig(config: SystemConfig): void {
    this.globalConfig.set(config);
    localStorage.setItem('system_config', JSON.stringify(config));
    this.notificationService.showToast('Global WhatsApp settings updated.', 'success');
  }

  /**
   * Simulates sending a WhatsApp message using a dynamic template.
   * In production, this would call a Supabase Edge Function to keep API keys secure.
   */
  async sendStatusUpdate(phoneNumber: string, taskTitle: string, newStatus: string): Promise<boolean> {
    const config = this.globalConfig();
    if (!config.whatsapp_integration_enabled) {
      console.log('WhatsApp integration is globally disabled.');
      return false;
    }

    if (!phoneNumber) {
      console.warn('No phone number provided for WhatsApp notification.');
      return false;
    }

    // Use the template from config, or fallback to a simpler default
    const template = config.whatsapp_status_template || 'Task "{{taskTitle}}" status updated to: {{newStatus}}';
    const message = template
      .replace('{{taskTitle}}', taskTitle)
      .replace('{{newStatus}}', newStatus.toUpperCase());


    console.log(`[WhatsApp Simulation] Sending message to ${phoneNumber} via ${config.whatsapp_provider}...`);
    console.log(`[Message Content]: ${message}`);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Show a visual indicator for the simulation that looks more like a real notification.
    const toastMessage = `📱 WhatsApp (Simulated) to ${phoneNumber}:\n"${message}"`;
    this.notificationService.showToast(
      toastMessage,
      'info',
      5000
    );

    return true;
  }
}