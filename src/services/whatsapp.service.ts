import { Injectable, signal, effect, inject } from '@angular/core';
import { NotificationService } from './notification.service';
import { SystemConfig } from '../shared/interfaces';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class WhatsAppService {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  globalConfig = signal<SystemConfig>({
    whatsapp_integration_enabled: false,
    whatsapp_access_token: '',
    whatsapp_phone_number_id: '',
    whatsapp_graph_url: 'https://graph.facebook.com/v18.0',
    whatsapp_status_template: '🔔 *Task Update* 🔔\n\nTask *{{taskTitle}}* has been moved to status: *{{newStatus}}*.'
  });

  constructor() {
    effect(() => {
        if (this.authService.isAdmin()) {
            this.loadGlobalConfig();
        }
    });
  }

  async loadGlobalConfig(): Promise<void> {
    try {
        const config = await this.apiService.getWhatsAppConfig();
        if (config) {
            this.globalConfig.set(config);
        }
    } catch (error) {
        console.error("Failed to load WhatsApp config:", error);
        this.notificationService.showToast('Could not load WhatsApp configuration.', 'error');
    }
  }

  async updateGlobalConfig(config: SystemConfig): Promise<void> {
    try {
        await this.apiService.saveWhatsAppConfig(config);
        this.globalConfig.set(config);
        this.notificationService.showToast('Global WhatsApp settings updated.', 'success');
    } catch (error) {
        console.error("Failed to save WhatsApp config:", error);
        this.notificationService.showToast('Failed to save WhatsApp configuration.', 'error');
    }
  }

  async sendStatusUpdate(phoneNumber: string, taskTitle: string, newStatus: string): Promise<void> {
    const config = this.globalConfig();
    if (!config.whatsapp_integration_enabled) {
      console.log('WhatsApp integration is disabled. Skipping notification.');
      return;
    }

    const message = (config.whatsapp_status_template || 'Task {{taskTitle}} updated to {{newStatus}}')
      .replace('{{taskTitle}}', taskTitle)
      .replace('{{newStatus}}', newStatus);

    try {
      await this.apiService.sendWhatsAppMessage(phoneNumber, message);
      this.notificationService.showToast(`WhatsApp notification sent successfully.`, 'success');
    } catch (error: any) {
        console.error("Failed to send WhatsApp status update:", error);
        const errorMessage = error?.error?.error || 'Failed to send WhatsApp notification.';
        this.notificationService.showToast(errorMessage, 'error');
    }
  }
}
