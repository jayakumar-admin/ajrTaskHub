import { Injectable, signal, effect, inject } from '@angular/core';
import { NotificationService } from './notification.service';
import { SystemConfig, Task } from '../shared/interfaces';
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
    whatsapp_status_template: 'task_status_update',
    whatsapp_assignment_template: 'task_assigned_new',
    whatsapp_reminder_template: 'task_reminder'
  });

  constructor() {
    effect(() => {
        if (this.authService.isAdmin()) {
            this.loadGlobalConfig();
        }
    }, { allowSignalWrites: true });
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

  private getTaskLink(taskId: string): string {
      return `${window.location.origin}/tasks/${taskId}`;
  }

  async sendStatusUpdate(targetUserId: string, targetUserName: string, task: Task, projectName: string, remarks: string = ''): Promise<void> {
    const config = this.globalConfig();
    if (!config.whatsapp_integration_enabled) return;

    try {
      // Template: task_status_update
      // Params: 
      // {{1}} = Hello {{1}} (User Name)
      // {{2}} = Task Title
      // {{3}} = Ticket ID
      // {{4}} = Project
      // {{5}} = Due Date
      // {{6}} = Assigned To
      // {{7}} = Current Status
      // {{8}} = Remarks / Comments
      // {{9}} = Task Link
      
      const params = [
          targetUserName,
          task.title,
          task.ticket_id.toString().padStart(4, '0'),
          projectName || 'N/A',
          task.due_date,
          task.assigned_to_username || 'Unassigned',
          task.status,
          remarks || 'Status updated',
          this.getTaskLink(task.id)
      ];

      await this.apiService.sendWhatsAppTemplate(targetUserId, 'task_status_update', params);
    } catch (error: any) {
        console.error("Failed to send WhatsApp status update:", error);
    }
  }

  async sendTaskAssignment(targetUserId: string, targetUserName: string, task: Task, projectName: string, assignerName: string): Promise<void> {
    const config = this.globalConfig();
    if (!config.whatsapp_integration_enabled) return;

    try {
      // Template: task_assigned_new
      // Params:
      // {{1}} = Hello {{1}} (User Name)
      // {{2}} = Task Title
      // {{3}} = Ticket ID
      // {{4}} = Project
      // {{5}} = Due Date
      // {{6}} = Priority
      // {{7}} = Description
      // {{8}} = Task Link

      const params = [
          targetUserName,
          task.title,
          task.ticket_id.toString().padStart(4, '0'),
          projectName || 'N/A',
          task.due_date,
          task.priority,
          task.description || 'No description',
          this.getTaskLink(task.id)
      ];

      await this.apiService.sendWhatsAppTemplate(targetUserId, 'task_assigned_new', params);
    } catch (error: any) {
        console.error("Failed to send WhatsApp assignment notification:", error);
    }
  }

  async sendTaskReminder(targetUserId: string, targetUserName: string, task: Task, projectName: string, type: 'due_today' | 'upcoming'): Promise<void> {
      const config = this.globalConfig();
      if (!config.whatsapp_integration_enabled) return;

      try {
          let templateName = config.whatsapp_reminder_template || 'task_reminder';
          let params: string[] = [];

          if (type === 'due_today') {
              // Template: task_reminder
              // {{1}} = Hello {{1}}
              // {{2}} = Task Title
              // {{3}} = Ticket ID
              // {{4}} = Project
              // {{5}} = Due Date
              // {{6}} = Priority
              // {{7}} = Current Status
              // {{8}} = Task Link
              params = [
                  targetUserName,
                  task.title,
                  task.ticket_id.toString().padStart(4, '0'),
                  projectName || 'N/A',
                  task.due_date,
                  task.priority,
                  task.status,
                  this.getTaskLink(task.id)
              ];
          } else {
              // Template: task_reminder_upcoming (Assuming name)
              // {{1}} = Hello {{1}}
              // {{2}} = Task Title
              // {{3}} = Ticket ID
              // {{4}} = Project
              // {{5}} = Due Date
              // {{6}} = Priority
              // {{7}} = Status
              // {{8}} = Task Link
              templateName = config.whatsapp_reminder_template || 'task_reminder_upcoming'; // Or whatever user configured
              params = [
                  targetUserName,
                  task.title,
                  task.ticket_id.toString().padStart(4, '0'),
                  projectName || 'N/A',
                  task.due_date,
                  task.priority,
                  task.status,
                  this.getTaskLink(task.id)
              ];
          }

          await this.apiService.sendWhatsAppTemplate(targetUserId, templateName, params);
      } catch (error: any) {
          console.error(`Failed to send WhatsApp reminder (${type}):`, error);
      }
  }
}
