import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';
import { ThemeService, Theme } from '../../services/theme.service';
import { UserSettings } from '../../shared/interfaces';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container mx-auto p-4 my-8 max-w-2xl">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
        <h2 class="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          Profile Settings
        </h2>

        <form (ngSubmit)="saveChanges()" class="space-y-6">
          <!-- Profile Picture -->
          <div class="flex flex-col items-center space-y-4">
            <img [src]="avatarUrl()" alt="User Avatar" class="h-32 w-32 rounded-full object-cover shadow-md">
            <input type="file" (change)="onFileSelected($event)" accept="image/png, image/jpeg" #fileInput class="hidden">
            <button type="button" (click)="fileInput.click()" class="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
              Change Picture
            </button>
            @if (selectedFile) {
              <p class="text-sm text-gray-500 dark:text-gray-400">New file: {{ selectedFile.name }}</p>
            }
          </div>

          <!-- Username -->
          <div>
            <label for="username" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
            <input type="text" id="username" name="username" [(ngModel)]="username" required
                   class="form-input">
          </div>

          <!-- Section for Notifications & Theme -->
          <div class="pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">Notifications & Theme</h3>

            <div class="space-y-6">
              <!-- WhatsApp Notifications -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">WhatsApp Notifications</label>
                <div class="mt-2 flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                  <p class="text-sm text-gray-600 dark:text-gray-400">Receive task updates via WhatsApp.</p>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" class="sr-only peer" [(ngModel)]="whatsappEnabled" name="whatsappEnabled">
                    <div class="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>

              @if (whatsappEnabled()) {
                <div>
                  <label for="whatsappNumber" class="block text-sm font-medium text-gray-700 dark:text-gray-300">WhatsApp Number</label>
                  <input type="text" id="whatsappNumber" name="whatsappNumber" [(ngModel)]="whatsappNumber" placeholder="+1234567890"
                         class="form-input">
                </div>
              }

              <!-- Theme Selection -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Application Theme</label>
                <div class="flex flex-wrap gap-3">
                  @for(theme of themes; track theme.id) {
                    <button type="button" (click)="setTheme(theme.id)"
                            class="px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all duration-200"
                            [class.border-primary-500]="currentTheme() === theme.id"
                            [class.bg-primary-500]="currentTheme() === theme.id"
                            [class.text-white]="currentTheme() === theme.id"
                            [class.border-gray-300]="currentTheme() !== theme.id"
                            [class.dark:border-gray-600]="currentTheme() !== theme.id"
                            [class.hover:border-primary-400]="currentTheme() !== theme.id"
                            [class.dark:hover:border-primary-500]="currentTheme() !== theme.id">
                      {{ theme.name }}
                    </button>
                  }
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
             <button type="button" (click)="router.navigateByUrl('/tasks')"
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors">
              Back to Tasks
            </button>
            <button type="submit" [disabled]="isSaving()"
                    class="inline-flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-primary-700 dark:hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-wait">
              @if(isSaving()) {
                <span>Saving...</span>
              } @else {
                <span>Save Changes</span>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `
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
  
  username = signal('');
  avatarUrl = signal('');
  selectedFile: File | null = null;
  isSaving = signal(false);

  whatsappEnabled = signal(false);
  whatsappNumber = signal('');

  constructor() {
    effect(() => {
      const user = this.currentUser()?.profile;
      if (user) {
        this.username.set(user.username);
        this.avatarUrl.set(user.avatar_url || `https://picsum.photos/seed/${user.id}/200`);
      }
    }, { allowSignalWrites: true });

    effect(() => {
      const settings = this.userSettings();
      if (settings) {
        this.whatsappEnabled.set(settings.whatsapp_notifications_enabled ?? false);
        this.whatsappNumber.set(settings.whatsapp_number ?? '');
      }
    }, { allowSignalWrites: true });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => this.avatarUrl.set(e.target.result);
      reader.readAsDataURL(this.selectedFile);
    }
  }
  
  setTheme(theme: Theme): void {
    this.themeService.setTheme(theme);
  }

  async saveChanges(): Promise<void> {
    const user = this.currentUser()?.profile;
    if (!user) {
      this.notificationService.showToast('You must be logged in.', 'error');
      return;
    }

    this.isSaving.set(true);

    try {
      let avatar_url = user.avatar_url;
      if (this.selectedFile) {
        const { url } = await this.apiService.uploadFile(this.selectedFile);
        avatar_url = url;
      }

      const profileUpdates: { username?: string; avatar_url?: string } = {};
      const settingsUpdates: Partial<UserSettings> = {};
      let profileChanged = false;
      let settingsChanged = false;

      if (avatar_url !== user.avatar_url) {
        profileUpdates.avatar_url = avatar_url;
        profileChanged = true;
      }
      if (this.username().trim() !== user.username) {
        profileUpdates.username = this.username().trim();
        profileChanged = true;
      }

      const currentSettings = this.userSettings();
      if ((currentSettings?.whatsapp_notifications_enabled ?? false) !== this.whatsappEnabled()) {
        settingsUpdates.whatsapp_notifications_enabled = this.whatsappEnabled();
        settingsChanged = true;
      }
      if ((currentSettings?.whatsapp_number ?? '') !== this.whatsappNumber()) {
        settingsUpdates.whatsapp_number = this.whatsappNumber();
        settingsChanged = true;
      }
      
      const promises = [];
      if (profileChanged) {
        promises.push(this.authService.updateUserProfile(profileUpdates));
      }
      if (settingsChanged) {
        promises.push(this.authService.updateSettings(settingsUpdates));
      }

      if (promises.length > 0) {
        await Promise.all(promises);
        this.notificationService.showToast('Settings saved successfully!', 'success');
      } else {
        this.notificationService.showToast('No changes to save.', 'info');
      }

      this.selectedFile = null;
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      this.isSaving.set(false);
    }
  }
}
