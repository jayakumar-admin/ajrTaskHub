
import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';
import { ThemeService, Theme } from '../../services/theme.service';
import { UserSettings } from '../../shared/interfaces';
import { ImageUploadDirective } from '../../directives/image-upload.directive';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageUploadDirective],
  template: `
<div class="container mx-auto p-4 my-8 animate-fade-in">
  <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">Settings</h2>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <!-- Left Sidebar for Navigation -->
    <div class="lg:col-span-1">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sticky top-4">
        <ul class="space-y-2">
          <li><a href="#profile" (click)="scrollTo('profile', $event)" class="settings-nav-link">Profile</a></li>
          <li><a href="#notifications" (click)="scrollTo('notifications', $event)" class="settings-nav-link">Notifications</a></li>
          <li><a href="#appearance" (click)="scrollTo('appearance', $event)" class="settings-nav-link">Appearance</a></li>
          <li><a href="#security" (click)="scrollTo('security', $event)" class="settings-nav-link">Security</a></li>
          <li><a href="#account" (click)="scrollTo('account', $event)" class="settings-nav-link">Account</a></li>
        </ul>
      </div>
    </div>

    <!-- Main Content -->
    <div class="lg:col-span-2 space-y-12">
      <!-- Profile Section -->
      <section id="profile" class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 scroll-mt-20">
        <h3 class="text-2xl font-semibold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">Profile</h3>
        <div class="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <div class="relative group" appImageUpload (fileDropped)="onAvatarDropped($event)">
                <img [src]="avatarUrl()" alt="User Avatar" class="w-24 h-24 rounded-full object-cover ring-4 ring-primary-300 dark:ring-primary-700 group-hover:opacity-75 transition-opacity">
                <label for="avatar-upload" class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </label>
                <input id="avatar-upload" type="file" class="hidden" (change)="onAvatarSelected($event)" accept="image/*">
            </div>
            <div class="flex-grow text-center sm:text-left">
                <h4 class="text-xl font-bold text-gray-800 dark:text-gray-200">{{ currentUser()?.profile?.username }}</h4>
                <p class="text-gray-500 dark:text-gray-400">{{ currentUser()?.profile?.email }}</p>
            </div>
        </div>
        <div class="mt-6 space-y-4">
          <div>
            <label for="username" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
            <input type="text" id="username" [(ngModel)]="username" class="form-input">
          </div>
        </div>
        <div class="mt-6 flex justify-end">
          <button (click)="saveProfileChanges()" class="form-submit-button">Save Profile</button>
        </div>
      </section>

      <!-- Notifications Section -->
      <section id="notifications" class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 scroll-mt-20">
        <h3 class="text-2xl font-semibold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">Notifications</h3>
        <div class="space-y-6">
          <div class="flex items-center justify-between">
            <div>
              <label for="email_notifications" class="font-medium text-gray-900 dark:text-white block">Email Notifications</label>
              <p class="text-sm text-gray-500 dark:text-gray-400">Receive notifications via email for important updates.</p>
            </div>
            <label class="switch">
              <input type="checkbox" id="email_notifications" [(ngModel)]="emailNotifications">
              <span class="slider round"></span>
            </label>
          </div>
          <div class="flex items-center justify-between">
            <div>
              <label for="whatsapp_notifications" class="font-medium text-gray-900 dark:text-white block">WhatsApp Notifications</label>
              <p class="text-sm text-gray-500 dark:text-gray-400">Receive instant updates on WhatsApp.</p>
            </div>
            <label class="switch">
              <input type="checkbox" id="whatsapp_notifications" [(ngModel)]="whatsappNotifications">
              <span class="slider round"></span>
            </label>
          </div>
          @if(whatsappNotifications()) {
            <div class="animate-fade-in-fast">
              <label for="whatsapp_number" class="block text-sm font-medium text-gray-700 dark:text-gray-300">WhatsApp Number</label>
              <input type="tel" id="whatsapp_number" [(ngModel)]="whatsappNumber" class="form-input" placeholder="e.g., +15551234567">
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Include country code.</p>
            </div>
          }
        </div>
        <div class="mt-6 flex justify-end">
          <button (click)="saveNotificationSettings()" class="form-submit-button">Save Notifications</button>
        </div>
      </section>

      <!-- Appearance Section -->
      <section id="appearance" class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 scroll-mt-20">
        <h3 class="text-2xl font-semibold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">Appearance</h3>
        <div class="space-y-6">
          <div>
            <h4 class="font-medium text-gray-900 dark:text-white mb-3">Theme Color</h4>
            <div class="flex flex-wrap gap-3">
              @for (theme of themes; track theme.id) {
                <button (click)="setTheme(theme.id)"
                        class="px-6 py-3 rounded-lg text-sm font-semibold capitalize transition-all duration-200"
                        [class.ring-2]="currentTheme() === theme.id"
                        [class.ring-offset-2]="currentTheme() === theme.id"
                        [class.dark:ring-offset-gray-800]="currentTheme() === theme.id"
                        [class.theme-preview-indigo]="theme.id === 'indigo'"
                        [class.theme-preview-teal]="theme.id === 'teal'"
                        [class.theme-preview-rose]="theme.id === 'rose'">
                  {{ theme.name }}
                </button>
              }
            </div>
          </div>
          <div class="flex items-center justify-between">
            <div>
              <label for="dark_mode" class="font-medium text-gray-900 dark:text-white block">Dark Mode</label>
              <p class="text-sm text-gray-500 dark:text-gray-400">Reduce eye strain in low light.</p>
            </div>
            <label class="switch">
              <input type="checkbox" id="dark_mode" [checked]="isDarkMode()" (change)="toggleDarkMode()">
              <span class="slider round"></span>
            </label>
          </div>
        </div>
      </section>

      <!-- Security Section -->
      <section id="security" class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 scroll-mt-20">
        <h3 class="text-2xl font-semibold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">Security</h3>
        <div class="space-y-4">
          <div>
            <label for="current_password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Current Password</label>
            <input type="password" id="current_password" [(ngModel)]="currentPassword" class="form-input">
          </div>
          <div>
            <label for="new_password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
            <input type="password" id="new_password" [(ngModel)]="newPassword" class="form-input">
          </div>
          <div>
            <label for="confirm_password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm New Password</label>
            <input type="password" id="confirm_password" [(ngModel)]="confirmPassword" class="form-input">
          </div>
        </div>
        <div class="mt-6 flex justify-end">
          <button (click)="changePassword()" class="form-submit-button" [disabled]="isChangingPassword()">
            @if(isChangingPassword()) {
              <span class="animate-spin mr-2">⏳</span> Changing...
            } @else {
              Change Password
            }
          </button>
        </div>
      </section>

      <!-- Account Section -->
      <section id="account" class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 scroll-mt-20">
        <h3 class="text-2xl font-semibold text-red-600 dark:text-red-400 mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">Account</h3>
        <div class="space-y-4">
          <button (click)="logout()" class="w-full sm:w-auto px-4 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            Log Out
          </button>
           <p class="text-sm text-gray-500 dark:text-gray-400">This will end your current session.</p>
        </div>
      </section>
    </div>
  </div>
</div>
  `,
  styles: [`
    .form-input { @apply mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors; }
    .form-submit-button { @apply inline-flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors; }
    .settings-nav-link { @apply block px-4 py-2 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors; }
    
    .theme-preview-indigo { @apply bg-indigo-500 text-white ring-indigo-500; }
    .theme-preview-teal { @apply bg-teal-500 text-white ring-teal-500; }
    .theme-preview-rose { @apply bg-rose-500 text-white ring-rose-500; }

    /* The switch - the box around the slider */
    .switch {
      position: relative;
      display: inline-block;
      width: 50px;
      height: 28px;
    }

    /* Hide default HTML checkbox */
    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    /* The slider */
    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      transition: .4s;
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 20px;
      width: 20px;
      left: 4px;
      bottom: 4px;
      background-color: white;
      transition: .4s;
    }

    input:checked + .slider {
      background-color: rgb(var(--color-primary-600));
    }

    input:focus + .slider {
      box-shadow: 0 0 1px rgb(var(--color-primary-600));
    }

    input:checked + .slider:before {
      transform: translateX(22px);
    }

    /* Rounded sliders */
    .slider.round {
      border-radius: 28px;
    }

    .slider.round:before {
      border-radius: 50%;
    }
  `]
})
export class SettingsComponent {
  authService = inject(AuthService);
  notificationService = inject(NotificationService);
  themeService = inject(ThemeService);
  apiService = inject(ApiService);
  router = inject(Router);

  currentUser = this.authService.currentUser;
  userSettings = this.authService.userSettings;
  themes = this.themeService.themes;
  currentTheme = this.themeService.currentTheme;
  isDarkMode = this.themeService.isDarkMode;
  
  // Local signals for form bindings
  username = signal('');
  emailNotifications = signal(false);
  whatsappNotifications = signal(false);
  whatsappNumber = signal('');
  selectedAvatarFile: File | null = null;
  isUploadingAvatar = signal(false);
  
  // Password change state
  currentPassword = signal('');
  newPassword = signal('');
  confirmPassword = signal('');
  isChangingPassword = signal(false);

  avatarUrl = signal('https://picsum.photos/seed/default/100');

  constructor() {
    effect(() => {
      const user = this.currentUser()?.profile;
      const settings = this.userSettings();
      
      if (user) {
        this.username.set(user.username);
        this.avatarUrl.set(user.avatar_url || user.avatar_base64 || `https://picsum.photos/seed/${user.id}/100`);
      }
      if (settings) {
        this.emailNotifications.set(settings.email_notifications_enabled);
        this.whatsappNotifications.set(settings.whatsapp_notifications_enabled ?? false);
        this.whatsappNumber.set(settings.whatsapp_number ?? '');
      }
    }, { allowSignalWrites: true });
  }

  scrollTo(id: string, event: MouseEvent): void {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedAvatarFile = input.files[0];
      this.uploadAvatar();
    }
  }

  onAvatarDropped(file: File): void {
    this.selectedAvatarFile = file;
    this.uploadAvatar();
  }

  async uploadAvatar(): Promise<void> {
    if (!this.selectedAvatarFile) return;

    this.isUploadingAvatar.set(true);
    try {
      // Create a local URL for instant preview
      const reader = new FileReader();
      reader.onload = (e: any) => this.avatarUrl.set(e.target.result);
      reader.readAsDataURL(this.selectedAvatarFile);
      
      const { url } = await this.apiService.uploadFile(this.selectedAvatarFile, 'avatars');
      await this.authService.updateUserProfile({ avatar_url: url });
      this.notificationService.showToast('Avatar updated successfully!', 'success');
      this.selectedAvatarFile = null;
    } catch (error) {
      this.notificationService.showToast('Avatar upload failed.', 'error');
      // Revert to original avatar on failure
      const user = this.currentUser()?.profile;
      if (user) {
         this.avatarUrl.set(user.avatar_url || user.avatar_base64 || `https://picsum.photos/seed/${user.id}/100`);
      }
    } finally {
      this.isUploadingAvatar.set(false);
    }
  }

  async saveProfileChanges(): Promise<void> {
    if (this.username().trim() === '') {
      this.notificationService.showToast('Username cannot be empty.', 'error');
      return;
    }
    await this.authService.updateUserProfile({ username: this.username() });
  }

  async saveNotificationSettings(): Promise<void> {
    const settings: Partial<UserSettings> = {
      email_notifications_enabled: this.emailNotifications(),
      whatsapp_notifications_enabled: this.whatsappNotifications(),
      whatsapp_number: this.whatsappNumber(),
    };
    await this.authService.updateSettings(settings);
  }

  async changePassword(): Promise<void> {
    if (this.newPassword() !== this.confirmPassword()) {
      this.notificationService.showToast('New passwords do not match.', 'error');
      return;
    }
    if (this.newPassword().length < 6) {
      this.notificationService.showToast('Password must be at least 6 characters long.', 'error');
      return;
    }

    this.isChangingPassword.set(true);
    try {
      const success = await this.authService.changePassword(this.currentPassword(), this.newPassword());
      if (success) {
        this.currentPassword.set('');
        this.newPassword.set('');
        this.confirmPassword.set('');
      }
    } finally {
      this.isChangingPassword.set(false);
    }
  }

  setTheme(theme: Theme): void {
    this.themeService.setTheme(theme);
  }

  toggleDarkMode(): void {
    this.themeService.toggleDarkMode();
  }

  logout(): void {
    this.authService.logout();
  }
}