
import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';
import { WhatsAppService } from '../../services/whatsapp.service';
import { User, SystemConfig, CronJob } from '../../shared/interfaces';
import { SkeletonLoaderComponent } from '../skeleton-loader/skeleton-loader.component';
import { RouterLink } from '@angular/router';
import { CronService } from '../../services/cron.service';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, SkeletonLoaderComponent, DatePipe, RouterLink],
  template: `
<div class="container mx-auto p-4 space-y-8 animate-fade-in">
  
  <!-- Section 1: User Management -->
  <div>
    <div class="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
      <h2 class="text-3xl font-bold text-gray-900 dark:text-white">User Management</h2>
      <div class="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <a routerLink="/admin/access-control"
              class="w-full sm:w-auto px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Access Control
        </a>
        <button (click)="toggleAddUserForm()"
                class="w-full sm:w-auto px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add New User
        </button>
      </div>
    </div>

    @if (addingUser()) {
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl mb-6 animate-slide-down-form">
        <h3 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Add New User</h3>
        <form (ngSubmit)="addNewUser()" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="newUserName" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
            <input type="text" id="newUserName" [(ngModel)]="newUserName" name="newUserName" required
                   class="form-input">
          </div>
          <div>
            <label for="newUserEmail" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <input type="email" id="newUserEmail" [(ngModel)]="newUserEmail" name="newUserEmail" required
                   class="form-input">
          </div>
          <div>
            <label for="newUserPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
            <div class="relative">
              <input [type]="newUserPasswordFieldType()" id="newUserPassword" [(ngModel)]="newUserPassword" name="newUserPassword" required
                     class="form-input pr-10">
              <button type="button" (click)="toggleNewUserPasswordVisibility()" class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none" aria-label="Toggle password visibility">
                @if (newUserPasswordFieldType() === 'password') {
                    <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                } @else {
                    <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L6.228 6.228" />
                    </svg>
                }
              </button>
            </div>
          </div>
          <div>
            <label for="newUserRole" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
            <select id="newUserRole" [(ngModel)]="newUserRole" name="newUserRole"
                    class="form-select">
              @for (r of roles; track r) {
                <option [value]="r">{{ r }}</option>
              }
            </select>
          </div>
          <div class="col-span-full flex justify-end space-x-4 mt-2">
            <button type="button" (click)="toggleAddUserForm()"
                    class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors">
              Cancel
            </button>
            <button type="submit"
                    class="inline-flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-primary-700 dark:hover:bg-primary-600 transition-colors">
              Add User
            </button>
          </div>
        </form>
      </div>
    }

    @if (loading()) {
      <app-skeleton-loader height="200px" customClass="rounded-lg"/>
    } @else if (error()) {
      <div class="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded relative" role="alert">
        <strong class="font-bold">Error!</strong>
        <span class="block sm:inline"> {{ error() }}</span>
      </div>
    } @else {
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Username</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Created At</th>
              <th scope="col" class="relative px-6 py-3"><span class="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            @for (user of users(); track user.id) {
              <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{{ user.username }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  @if (editingUserRole?.id === user.id) {
                    <select [(ngModel)]="selectedNewRole"
                            class="form-select !mt-0">
                      @for (r of roles; track r) {
                        <option [value]="r">{{ r }}</option>
                      }
                    </select>
                  } @else {
                    {{ user.role }}
                  }
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ user.created_at | date:'short' }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  @if (editingUserRole?.id === user.id) {
                    <button (click)="saveUserRole()" class="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 transition-colors">Save</button>
                    <button (click)="cancelEditUserRole()" class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 transition-colors">Cancel</button>
                  } @else {
                    <button (click)="editUserRole(user)" class="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 transition-colors">Edit Role</button>
                    <button (click)="deleteUser(user)" class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 ml-4 transition-colors">Delete</button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  </div>

  <!-- Section 2: Cron Job Management -->
  <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl">
    <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Cron Job Management</h2>
    <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
      Configure automated background jobs.
    </p>

    @if(cronLoading()) {
      <app-skeleton-loader height="150px" customClass="rounded-lg"/>
    } @else {
      <div class="space-y-4">
        @for(job of cronJobs(); track job.id) {
          <div class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
            <div class="flex flex-col md:flex-row justify-between md:items-start">
              <div class="flex-1">
                <h4 class="font-semibold text-lg text-gray-900 dark:text-white">{{ job.name }}</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">{{ job.description }}</p>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center space-x-4">
                    <span>Last Run: {{ job.last_run ? (job.last_run | date:'short') : 'Never' }}</span>
                    <span>Next Run: {{ job.next_run ? (job.next_run | date:'short') : 'N/A' }}</span>
                </div>
              </div>
              <div class="flex items-center space-x-4 mt-4 md:mt-0">
                <div class="flex items-center">
                   <label [for]="'cron-schedule-' + job.id" class="text-sm font-medium mr-2 text-gray-700 dark:text-gray-300">Schedule (UTC)</label>
                   <input type="text" [id]="'cron-schedule-' + job.id" [(ngModel)]="job.schedule" class="form-input !mt-0 w-36 text-sm" placeholder="e.g., 0 9 * * *">
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" class="sr-only peer" [(ngModel)]="job.enabled">
                  <div class="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-green-600"></div>
                </label>
                <button (click)="saveCronJob(job)" class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm">Save</button>
              </div>
            </div>
          </div>
        }
      </div>
    }
  </div>

  <!-- Section 3: Global Configuration (WhatsApp) -->
  <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl">
    <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Global Integrations</h2>
    
    <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <span class="mr-2">💬</span> WhatsApp Notification Configuration (Meta API)
      </h3>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Configure the global WhatsApp integration. Users can only receive WhatsApp notifications if this is enabled and their profile settings allow it.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="col-span-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
          <div>
            <label for="enableWhatsApp" class="font-medium text-gray-900 dark:text-white block">Enable WhatsApp Integration</label>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Globally enable/disable sending messages.</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" id="enableWhatsApp" class="sr-only peer" [(ngModel)]="whatsAppConfig.whatsapp_integration_enabled" name="wa_enabled">
            <div class="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-green-600"></div>
          </label>
        </div>

        <div class="col-span-full">
          <label for="waAccessToken" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Access Token</label>
          <input type="password" id="waAccessToken" [(ngModel)]="whatsAppConfig.whatsapp_access_token" name="wa_token" placeholder="Enter Meta API Access Token"
                 class="form-input">
        </div>

        <div>
          <label for="waPhoneNumberId" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number ID</label>
          <input type="text" id="waPhoneNumberId" [(ngModel)]="whatsAppConfig.whatsapp_phone_number_id" name="wa_phone_id" placeholder="e.g., 10xxxxxxxxx"
                 class="form-input">
        </div>
        
        <div>
          <label for="waGraphUrl" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Graph API Base URL</label>
          <input type="text" id="waGraphUrl" [(ngModel)]="whatsAppConfig.whatsapp_graph_url" name="wa_graph_url" placeholder="e.g., https://graph.facebook.com/v18.0"
                 class="form-input">
        </div>

        <div class="col-span-full">
          <label for="waTemplate" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Status Update Template</label>
          <textarea id="waTemplate" [(ngModel)]="whatsAppConfig.whatsapp_status_template" name="wa_template" rows="4"
                    class="form-input"
                    [placeholder]="exampleWhatsAppTemplate"></textarea>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Use placeholders: <code class="bg-gray-200 dark:bg-gray-600 px-1 rounded">{{ '{{taskTitle}}' }}</code> and <code class="bg-gray-200 dark:bg-gray-600 px-1 rounded">{{ '{{newStatus}}' }}</code>.
          </p>
        </div>
        
        <div class="col-span-full">
          <label for="waAssignmentTemplate" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Task Assignment Template</label>
          <textarea id="waAssignmentTemplate" [(ngModel)]="whatsAppConfig.whatsapp_assignment_template" name="wa_assignment_template" rows="4"
                    class="form-input"
                    [placeholder]="exampleAssignmentTemplate"></textarea>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Use placeholders: <code class="bg-gray-200 dark:bg-gray-600 px-1 rounded">{{ '{{taskTitle}}' }}</code> and <code class="bg-gray-200 dark:bg-gray-600 px-1 rounded">{{ '{{assignedBy}}' }}</code>.
          </p>
        </div>

        <div class="col-span-full flex justify-end">
          <button (click)="saveWhatsAppConfig()" 
                  class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors">
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  </div>

</div>
  `,
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

  exampleWhatsAppTemplate = "e.g., Task '{{taskTitle}}' moved to {{newStatus}}";
  exampleAssignmentTemplate = "e.g., You have been assigned a new task: '{{taskTitle}}' by {{assignedBy}}.";
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
