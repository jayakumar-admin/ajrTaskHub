
import { Injectable, signal, inject, effect, NgZone } from '@angular/core';
import { User, AuthenticatedUser, UserSettings } from '../shared/interfaces';
import { ApiService } from './api.service';
import { NotificationService } from './notification.service';
import { Router } from '@angular/router';

const TOKEN_KEY = 'ajrtaskhub_token';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentUser = signal<AuthenticatedUser | null>(null);
  userSettings = signal<UserSettings | null>(null);
  
  private apiService = inject(ApiService);
  private notificationService = inject(NotificationService);
  private router: Router = inject(Router);
  private ngZone: NgZone = inject(NgZone);

  constructor() {
    this.loadUserFromToken();

    // Effect to load user settings when currentUser changes
    effect(() => {
      const user = this.currentUser();
      if (user?.profile?.id) {
        this.loadUserSettings();
        this.notificationService.loadNotifications();
      } else {
        this.userSettings.set(null);
      }
    });
  }
  
  private async loadUserFromToken(): Promise<void> {
    const token = this.getToken();
    if (token) {
      try {
        const userProfile = await this.apiService.getProfile();
        this.currentUser.set({ token, profile: userProfile });
      } catch (error) {
        console.error('Failed to load user from token', error);
        this.logout(); // Token is invalid, so log out
      }
    }
  }

  private async loadUserSettings(): Promise<void> {
    try {
      const settings = await this.apiService.fetchUserSettings();
      if (settings) {
        this.userSettings.set(settings);
      } else {
        const newSettings = await this.apiService.updateUserSettings({ email_notifications_enabled: true });
        this.userSettings.set(newSettings);
      }
    } catch (error) {
      console.error('Failed to load/create user settings:', error);
      this.notificationService.showToast('Failed to load user settings.', 'error');
      this.userSettings.set(null);
    }
  }

  async updateUserProfile(updates: { username?: string; avatar_url?: string }): Promise<void> {
    const user = this.currentUser();
    if (!user?.profile?.id) {
      this.notificationService.showToast('User not logged in.', 'error');
      throw new Error('User not logged in');
    }

    try {
      const updatedProfile = await this.apiService.updateUserProfile(user.profile.id, updates);
      this.currentUser.update(current => {
        if (current) {
          return { ...current, profile: { ...current.profile, ...updatedProfile } };
        }
        return null;
      });
      this.notificationService.showToast('Profile updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating profile in AuthService:', error);
      this.notificationService.showToast('Failed to update profile.', 'error');
      throw error;
    }
  }

  async updateSettings(settings: Partial<UserSettings>): Promise<boolean> {
    const user = this.currentUser();
    if (!user?.profile?.id) {
      this.notificationService.showToast('User not logged in.', 'error');
      return false;
    }
    try {
      const updatedSettings = await this.apiService.updateUserSettings(settings);
      this.userSettings.set(updatedSettings);
      this.notificationService.showToast('Settings updated successfully.', 'success');
      return true;
    } catch (error) {
      console.error('Error updating settings:', error);
      this.notificationService.showToast('Failed to update settings.', 'error');
      return false;
    }
  }

  async signUpWithEmailAndPassword(email: string, password: string, username: string, role: 'Admin' | 'User' | 'Manager' | 'Viewer'): Promise<boolean> {
    try {
      await this.apiService.register({ email, password, username, role });
      this.notificationService.showToast(`Welcome, ${username}! Your account has been created. Please log in.`, 'success', 5000);
      return true;
    } catch (error: any) {
      const errorMessage = error?.error?.error || 'Signup failed. Please try again.';
      this.notificationService.showToast(errorMessage, 'error', 7000);
      return false;
    }
  }

  async signInWithEmailAndPassword(email: string, password: string): Promise<boolean> {
    try {
      const { token, user } = await this.apiService.login({ email, password });
      localStorage.setItem(TOKEN_KEY, token);
      this.currentUser.set({ token, profile: user });
      this.notificationService.showToast('Logged in successfully!', 'success');
      this.ngZone.run(() => {
        this.router.navigate(['/tasks']);
      });
      return true;
    } catch (error: any) {
      const errorMessage = error?.error?.error || 'Invalid credentials.';
      this.notificationService.showToast(`Sign-in failed: ${errorMessage}`, 'error');
      return false;
    }
  }

  // Note: Forgot password needs a backend implementation which is not provided in the original files.
  // This will be a placeholder.
  async forgotPassword(email: string): Promise<boolean> {
    this.notificationService.showToast('Password reset functionality needs to be implemented on the backend.', 'info', 5000);
    // In a real app: await this.apiService.forgotPassword(email);
    return true;
  }

  logout(): void {
    this.currentUser.set(null);
    this.userSettings.set(null);
    localStorage.removeItem(TOKEN_KEY);
    this.notificationService.clearNotifications();
    this.notificationService.showToast('Logged out successfully.', 'info');
    this.ngZone.run(() => {
      this.router.navigate(['/auth']);
    });
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isAdmin(): boolean {
    return this.currentUser()?.profile?.role === 'Admin';
  }

  isManager(): boolean {
    return this.currentUser()?.profile?.role === 'Manager';
  }

  isViewer(): boolean {
    return this.currentUser()?.profile?.role === 'Viewer';
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
