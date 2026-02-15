
import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { SupabaseService } from '../../services/supabase.service';
import { NotificationService } from '../../services/notification.service';
import { WhatsAppService } from '../../services/whatsapp.service';
import { User, SystemConfig } from '../../shared/interfaces';
import { SkeletonLoaderComponent } from '../skeleton-loader/skeleton-loader.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, SkeletonLoaderComponent, DatePipe, RouterLink],
  template: `
<div class="container mx-auto p-4 space-y-8">
  
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
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl mb-6">
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
            <input type="password" id="newUserPassword" [(ngModel)]="newUserPassword" name="newUserPassword" required
                   class="form-input">
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
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl overflow-x-auto">
        <table class="min-w-full">
          <thead>
            <tr>
              <th class="w-1/4 px-6 py-3"><app-skeleton-loader height="20px"/></th>
              <th class="w-1/4 px-6 py-3"><app-skeleton-loader height="20px"/></th>
              <th class="w-1/4 px-6 py-3"><app-skeleton-loader height="20px"/></th>
              <th class="w-1/4 px-6 py-3"><app-skeleton-loader height="20px"/></th>
            </tr>
          </thead>
          <tbody>
            @for (_ of [1,2,3,4,5]; track _) {
              <tr>
                <td class="px-6 py-4"><app-skeleton-loader height="20px"/></td>
                <td class="px-6 py-4"><app-skeleton-loader height="20px"/></td>
                <td class="px-6 py-4"><app-skeleton-loader height="20px"/></td>
                <td class="px-6 py-4"><app-skeleton-loader height="20px"/></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
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
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Auth ID</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Created At</th>
              <th scope="col" class="relative px-6 py-3"><span class="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            @for (user of users(); track user.id) {
              <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{{ user.username }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ user.auth_id }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  @if (editingUserRole?.id === user.id) {
                    <select [(ngModel)]="selectedNewRole"
                            class="form-select">
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
        @if (users().length === 0) {
          <p class="text-center text-gray-500 dark:text-gray-400 py-4">No users found.</p>
        }
      </div>
    }
  </div>

  <!-- Section 2: Global Configuration (WhatsApp) -->
  <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl">
    <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Global Integrations</h2>
    
    <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <span class="mr-2">💬</span> WhatsApp Notification Configuration
      </h3>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Configure the global WhatsApp integration provider. Users can only receive WhatsApp notifications if this is enabled.
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Enable Toggle -->
        <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
          <div>
            <label for="enableWhatsApp" class="font-medium text-gray-900 dark:text-white block">Enable WhatsApp Integration</label>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Globally enable/disable sending messages.</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" id="enableWhatsApp" class="sr-only peer" [(ngModel)]="whatsAppConfig.whatsapp_integration_enabled">
            <div class="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-green-600"></div>
          </label>
        </div>

        <!-- Provider Select -->
        <div>
          <label for="waProvider" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Provider</label>
          <select id="waProvider" [(ngModel)]="whatsAppConfig.whatsapp_provider"
                  class="form-select">
            <option value="Twilio">Twilio</option>
            <option value="Meta">Meta Business API</option>
          </select>
        </div>

        <!-- API Key (Mock) -->
        <div class="col-span-full">
          <label for="waApiKey" class="block text-sm font-medium text-gray-700 dark:text-gray-300">API Key / Token</label>
          <input type="password" id="waApiKey" [(ngModel)]="whatsAppConfig.whatsapp_api_key" placeholder="Enter API Key"
                 class="form-input">
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">This key is simulated in this environment.</p>
        </div>

        <!-- WhatsApp Template -->
        <div class="col-span-full">
          <label for="waTemplate" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Status Update Template</label>
          <textarea id="waTemplate" [(ngModel)]="whatsAppConfig.whatsapp_status_template" name="waTemplate" rows="4"
                    class="form-input"
                    [placeholder]="exampleWhatsAppTemplate"></textarea>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Use placeholders: <code class="bg-gray-200 dark:bg-gray-600 px-1 rounded">{{ '{{taskTitle}}' }}</code> and <code class="bg-gray-200 dark:bg-gray-600 px-1 rounded">{{ '{{newStatus}}' }}</code>.
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
  supabaseService = inject(SupabaseService);
  notificationService = inject(NotificationService);
  whatsappService = inject(WhatsAppService);

  users = signal<User[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  newUserName = signal('');
  newUserEmail = signal('');
  newUserPassword = signal('');
  newUserRole = signal<User['role']>('User');
  addingUser = signal(false);

  editingUserRole: User | null = null;
  selectedNewRole = signal<User['role']>('User');

  roles: Array<User['role']> = ['Admin', 'Manager', 'User', 'Viewer'];

  exampleWhatsAppTemplate = "e.g., Task '{{taskTitle}}' moved to {{newStatus}}";

  // WhatsApp Config State
  whatsAppConfig: SystemConfig = {
    whatsapp_integration_enabled: false,
    whatsapp_provider: 'Twilio',
    whatsapp_api_key: '',
    whatsapp_status_template: '🔔 *Task Update* 🔔\n\nTask *{{taskTitle}}* has been moved to status: *{{newStatus}}*.'
  };

  constructor() {
    effect(() => {
      const currentUser = this.authService.currentUser();
      if (currentUser && this.authService.isAdmin()) {
        this.fetchUsers();
        // Load current global config, ensuring all properties are present
        const loadedConfig = this.whatsappService.globalConfig();
        this.whatsAppConfig = {
          ...this.whatsAppConfig, // Start with defaults
          ...loadedConfig // Override with loaded values
        };
      } else if (!currentUser) {
        this.users.set([]);
      }
    }, {allowSignalWrites: true});
  }

  async fetchUsers(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate loading
      const fetchedUsers = await this.supabaseService.fetchUsers();
      this.users.set(fetchedUsers);
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      this.error.set(`Failed to fetch users: ${err.message || 'Unknown error'}`);
      this.notificationService.showToast('Failed to fetch user list.', 'error');
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

  async addNewUser(): Promise<void> {
    if (!this.newUserName() || !this.newUserEmail() || !this.newUserPassword()) {
      this.notificationService.showToast('Please fill all fields for new user.', 'warning');
      return;
    }

    try {
      const success = await this.authService.signUpWithEmailAndPassword(
        this.newUserEmail(),
        this.newUserPassword(),
        this.newUserName(),
        this.newUserRole()
      );

      if (success) {
        this.notificationService.showToast(`User ${this.newUserName()} created successfully!`, 'success');
        this.toggleAddUserForm();
        await this.fetchUsers();
      } else {
        this.notificationService.showToast('Failed to add new user.', 'error');
      }
    } catch (err: any) {
      console.error('Error adding new user:', err);
      this.notificationService.showToast(`Error adding user: ${err.message || 'Unknown error'}`, 'error');
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
    if (!this.editingUserRole || !this.selectedNewRole()) {
      this.notificationService.showToast('No user selected or role not set.', 'warning');
      return;
    }

    const userToUpdate = this.editingUserRole;
    const newRole = this.selectedNewRole();

    try {
      const updatedUser = await this.supabaseService.updateUserRole(userToUpdate.id, newRole);
      if (updatedUser) {
        this.users.update(users => 
          users.map(u => u.id === updatedUser.id ? updatedUser : u)
        );
        this.notificationService.showToast(`Role for ${userToUpdate.username} updated to ${newRole}.`, 'success');
      }
    } catch (err: any) {
      console.error('Error updating user role:', err);
      this.notificationService.showToast(`Error updating role: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      this.cancelEditUserRole();
    }
  }

  async deleteUser(user: User): Promise<void> {
    // Prevent admin from deleting their own account
    const currentAuthId = this.authService.currentUser()?.session.user.id;
    if (user.auth_id === currentAuthId) {
      this.notificationService.showToast("Admins cannot delete their own account from this panel.", 'error');
      return;
    }

    if (confirm(`Are you sure you want to permanently delete the user "${user.username}"? This will remove their authentication and profile data. This action cannot be undone.`)) {
      try {
        // Step 1: Call the RPC function to delete from auth.users. This is the secure way.
        // The backend function should have the necessary privileges.
        await this.supabaseService.deleteAuthUser(user.auth_id);

        // Step 2: Delete from public.users table. This might be redundant if you have a cascade delete trigger,
        // but it's safer to do it explicitly.
        await this.supabaseService.deleteUserProfile(user.id);

        this.notificationService.showToast(`User ${user.username} has been deleted successfully.`, 'success');
        
        // Refresh the user list from the signal without a full DB fetch
        this.users.update(currentUsers => currentUsers.filter(u => u.id !== user.id));
        
      } catch (err: any) {
        console.error('Error deleting user:', err);
        this.notificationService.showToast(`Error deleting user: ${err.message || 'Unknown error'}`, 'error');
      }
    }
  }

  // WhatsApp Config Methods
  saveWhatsAppConfig(): void {
    this.whatsappService.updateGlobalConfig(this.whatsAppConfig);
  }
}