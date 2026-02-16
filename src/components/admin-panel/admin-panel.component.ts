

import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';
import { WhatsAppService } from '../../services/whatsapp.service';
import { User, SystemConfig, CronJob, WhatsAppLog } from '../../shared/interfaces';
import { SkeletonLoaderComponent } from '../skeleton-loader/skeleton-loader.component';
import { RouterLink } from '@angular/router';
import { CronService } from '../../services/cron.service';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, SkeletonLoaderComponent, DatePipe, RouterLink],
  templateUrl: './admin-panel.component.html',
  styles: [`
    .form-input { @apply mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors; }
    .form-select { @apply mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors; }
  `]
})
export class AdminPanelComponent {
  authService = inject(AuthService);
  apiService = inject(ApiService);
  notificationService = inject(NotificationService);
  whatsappService = inject(WhatsAppService);
  cronService = inject(CronService);

  users = signal<User[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  newUserName = signal('');
  newUserEmail = signal('');
  newUserPassword = signal('');
  newUserRole = signal<User['role']>('User');
  addingUser = signal(false);
  newUserPasswordFieldType = signal<'password' | 'text'>('password');

  editingUserRole: User | null = null;
  selectedNewRole = signal<User['role']>('User');

  roles: Array<User['role']> = ['Admin', 'Manager', 'User', 'Viewer'];
  
  cronJobs = this.cronService.cronJobs;
  cronLoading = this.cronService.loading;

  whatsAppLogs = signal<WhatsAppLog[]>([]);
  logsLoading = signal(true);
  logsError = signal<string | null>(null);

  exampleWhatsAppTemplate = "e.g., 🔔 *Task Status Updated* 🔔\n\nTask '{{taskTitle}}' has been moved to *{{newStatus}}*.\n\n*Priority:* {{taskPriority}}\n*Due:* {{taskDueDate}}\n\nView Task: {{taskLink}}";
  exampleAssignmentTemplate = "e.g., 🚀 *New Task Assignment* 🚀\n\nYou have been assigned a new task by *{{assignedBy}}*:\n\n*Task:* {{taskTitle}}\n*Priority:* {{taskPriority}}\n*Due:* {{taskDueDate}}\n\n*Description:* {{taskDescription}}\n\nView Task: {{taskLink}}";
  whatsAppConfig: SystemConfig = {
    whatsapp_integration_enabled: false,
    whatsapp_access_token: '',
    whatsapp_phone_number_id: '',
    whatsapp_graph_url: '',
    whatsapp_status_template: '',
    whatsapp_assignment_template: ''
  };

  constructor() {
    effect(() => {
      if (this.authService.isAdmin()) {
        this.fetchUsers();
        this.fetchWhatsAppLogs();
      } else {
        this.users.set([]);
      }
    }, {allowSignalWrites: true});

    effect(() => {
        this.whatsAppConfig = { ...this.whatsappService.globalConfig() };
    }, {allowSignalWrites: true});
  }

  async fetchUsers(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const fetchedUsers = await this.apiService.fetchUsers();
      this.users.set(fetchedUsers);
    } catch (err: any) {
      this.handleError(err, 'Failed to fetch users.');
    } finally {
      this.loading.set(false);
    }
  }

  async fetchWhatsAppLogs(): Promise<void> {
    this.logsLoading.set(true);
    this.logsError.set(null);
    try {
      const logs = await this.apiService.fetchWhatsAppLogs();
      this.whatsAppLogs.set(logs);
    } catch (err: any) {
      const message = err?.error?.error || 'Failed to fetch WhatsApp logs.';
      this.notificationService.showToast(message, 'error');
      this.logsError.set(message);
      console.error(err);
    } finally {
      this.logsLoading.set(false);
    }
  }

  toggleAddUserForm(): void {
    this.addingUser.update(val => !val);
    this.newUserName.set('');
    this.newUserEmail.set('');
    this.newUserPassword.set('');
    this.newUserRole.set('User');
  }

  toggleNewUserPasswordVisibility(): void {
    this.newUserPasswordFieldType.update(type => type === 'password' ? 'text' : 'password');
  }

  async addNewUser(): Promise<void> {
    if (!this.newUserName() || !this.newUserEmail() || !this.newUserPassword()) {
      this.notificationService.showToast('Please fill all fields for new user.', 'warning');
      return;
    }
    try {
      // Admin creating a user is like registration.
      await this.authService.signUpWithEmailAndPassword(this.newUserEmail(), this.newUserPassword(), this.newUserName(), this.newUserRole());
      this.notificationService.showToast(`User ${this.newUserName()} created successfully!`, 'success');
      this.toggleAddUserForm();
      await this.fetchUsers();
    } catch (err: any) {
      this.handleError(err, 'Error adding new user.');
    }
  }

  editUserRole(user: User): void {
    this.editingUserRole = user;
    this.selectedNewRole.set(user.role);
  }

  cancelEditUserRole(): void {
    this.editingUserRole = null;
  }

  async saveUserRole(): Promise<void> {
    if (!this.editingUserRole) return;
    const userToUpdate = this.editingUserRole;
    const newRole = this.selectedNewRole();
    try {
      const updatedUser = await this.apiService.adminUpdateUserRole(userToUpdate.id, newRole);
      this.users.update(users => users.map(u => u.id === updatedUser.id ? updatedUser : u));
      this.notificationService.showToast(`Role for ${userToUpdate.username} updated to ${newRole}.`, 'success');
    } catch (err: any) {
      this.handleError(err, `Error updating role.`);
    } finally {
      this.cancelEditUserRole();
    }
  }

  async deleteUser(user: User): Promise<void> {
    if (user.id === this.authService.currentUser()?.profile.id) {
      this.notificationService.showToast("Admins cannot delete their own account.", 'error');
      return;
    }
    if (confirm(`Are you sure you want to permanently delete the user "${user.username}"?`)) {
      try {
        await this.apiService.adminDeleteUser(user.id);
        this.notificationService.showToast(`User ${user.username} has been deleted.`, 'success');
        this.users.update(currentUsers => currentUsers.filter(u => u.id !== user.id));
      } catch (err: any) {
        this.handleError(err, `Error deleting user.`);
      }
    }
  }

  saveWhatsAppConfig(): void {
    this.whatsappService.updateGlobalConfig(this.whatsAppConfig);
  }

  saveCronJob(job: CronJob): void {
    this.cronService.updateCronJob(job);
  }

  private handleError(error: any, defaultMessage: string) {
    const message = error?.error?.error || defaultMessage;
    this.notificationService.showToast(message, 'error');
    this.error.set(message);
    console.error(error);
  }
}