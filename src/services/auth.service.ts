import { Injectable, signal, inject, effect, NgZone } from '@angular/core';
import { User, AuthenticatedUser, UserSettings } from '../shared/interfaces';
import { SupabaseService } from './supabase.service';
import { NotificationService } from './notification.service';
import { Router } from '@angular/router'; // Import Router for redirects
// Removed explicit import for AuthSession, it's inferred or available from SupabaseService's usage

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentUser = signal<AuthenticatedUser | null>(null);
  userSettings = signal<UserSettings | null>(null); // New signal for user settings
  private supabaseService = inject(SupabaseService);
  private notificationService = inject(NotificationService);
  private router: Router = inject(Router);
  private ngZone: NgZone = inject(NgZone);

  constructor() {
    // Listen for Supabase auth state changes. This is the single source of truth for session state.
    // It fires immediately on subscription with the current session, so a separate getSession() call is redundant.
    this.supabaseService.supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        // Always process the session to ensure the user profile is fresh.
        // This prevents race conditions on signup where the profile might not be ready on the first check.
        this.processSession(session);
      } else {
        this.currentUser.set(null); // No session
        this.userSettings.set(null); // Clear settings on logout
        this.notificationService.clearNotifications(); // Clear persistent notifications
        // Only navigate away if explicitly logging out or if current route requires auth
        if (event === 'SIGNED_OUT') {
           this.notificationService.showToast('Logged out successfully.', 'info');
           this.ngZone.run(() => {
             this.router.navigate(['/auth']);
           });
        }
      }
    });

    // Effect to load user settings when currentUser changes
    effect(() => {
      const user = this.currentUser();
      if (user?.profile?.id) {
        this.loadUserSettings(user.profile.id);
        this.notificationService.loadNotifications(); // Load persistent notifications
      } else {
        this.userSettings.set(null);
      }
    }, { allowSignalWrites: true });
  }

  private async processSession(session: any | null): Promise<void> { // Used `any` for session to avoid circular dependency
    if (!session) {
      this.currentUser.set(null);
      this.userSettings.set(null);
      return;
    }

    // OPTIMIZATION: If we already have a full profile for this authenticated user, don't re-fetch it.
    // This prevents redundant API calls if onAuthStateChange fires multiple times on startup.
    // The `profile.id` check ensures we don't skip on a minimal/incomplete profile.
    if (this.currentUser()?.profile?.auth_id === session.user.id && this.currentUser()?.profile?.id) {
        return;
    }

    try {
      // Fetch the user's profile from our public.users table
      const { data: profiles, error } = await this.supabaseService.supabase
        .from('users')
        .select('*')
        .eq('auth_id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
        console.error('Error fetching user profile:', error);
        this.notificationService.showToast('Failed to load user profile.', 'error');
        this.currentUser.set(null);
        this.userSettings.set(null);
      } else if (profiles) {
        const userProfile: User = {
          id: profiles.id,
          auth_id: profiles.auth_id,
          username: profiles.username,
          role: profiles.role,
          created_at: profiles.created_at,
          avatar_base64: profiles.avatar_base64
        };
        this.currentUser.set({ session, profile: userProfile });
        // After setting current user, the effect will trigger loadUserSettings
      } else {
        // This case might happen if the trigger for public.users hasn't fired yet
        console.warn('User profile not found in public.users, but auth session exists.', session.user.id);
        // It's crucial not to leave currentUser as null if a session exists, even if profile is missing.
        // A minimal profile could be created here, or rely on future trigger.
        const minimalProfile: User = { id: '', auth_id: session.user.id, username: session.user.email || 'unknown', role: 'User', avatar_base64: undefined };
        this.currentUser.set({ session, profile: minimalProfile });
        this.notificationService.showToast('User profile incomplete. Defaulting to User role.', 'warning');
        // Effect will handle loading settings based on minimalProfile.id (which might be empty)
      }
    } catch (error: any) {
      console.error('Error during session processing:', error.message || error);
      this.notificationService.showToast(`Auth error: ${error.message || 'Unknown error'}`, 'error');
      this.currentUser.set(null);
      this.userSettings.set(null);
    }
  }

  private async loadUserSettings(userId: string): Promise<void> {
    if (!userId) {
      this.userSettings.set(null);
      return;
    }
    try {
      const settings = await this.supabaseService.fetchUserSettings(userId);
      if (settings) {
        this.userSettings.set(settings);
      } else {
        // If no settings exist, create default ones
        const defaultSettings: UserSettings = {
          id: userId, // Assuming id matches user_id for settings table PK
          user_id: userId,
          email_notifications_enabled: true, // Default to true
          whatsapp_notifications_enabled: false,
          whatsapp_number: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const newSettings = await this.supabaseService.updateUserSettings(defaultSettings);
        this.userSettings.set(newSettings);
      }
    } catch (error) {
      console.error('Failed to load/create user settings:', error);
      this.notificationService.showToast('Failed to load user settings.', 'error');
      this.userSettings.set(null);
    }
  }

  async updateUserProfile(updates: { username?: string; avatar_base64?: string }): Promise<void> {
    const user = this.currentUser();
    if (!user?.profile?.id) {
      this.notificationService.showToast('User not logged in.', 'error');
      throw new Error('User not logged in');
    }

    try {
      const updatedProfile = await this.supabaseService.updateUserProfile(user.profile.id, updates);
      
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
      const currentSettings = this.userSettings() || {};
      const updatedSettings = await this.supabaseService.updateUserSettings({
        ...currentSettings,
        ...settings,
        user_id: user.profile!.id,
      });
      this.userSettings.set(updatedSettings); // Update local signal
      this.notificationService.showToast('Settings updated successfully.', 'success');
      return true;
    } catch (error) {
      console.error('Error updating settings:', error);
      this.notificationService.showToast('Failed to update settings.', 'error');
      return false;
    }
  }

  async updateEmailNotificationSetting(enabled: boolean): Promise<boolean> {
    return this.updateSettings({ email_notifications_enabled: enabled });
  }

  async signUpWithEmailAndPassword(email: string, password: string, username: string, role: 'Admin' | 'User' | 'Manager' | 'Viewer'): Promise<boolean> {
    try {
      // Supabase Auth signup
      const { data: authData, error: authError } = await this.supabaseService.supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      if (authData.user) {
        // Now ensure the profile exists in our public.users table.
        // We use UPSERT to handle both cases:
        // 1. Trigger ran: It updates the existing row.
        // 2. Trigger didn't run: It inserts a new row.
        const { data: profileData, error: profileError } = await this.supabaseService.supabase
          .from('users')
          .upsert({ 
            auth_id: authData.user.id, 
            username, 
            role 
          }, { onConflict: 'auth_id' })
          .select()
          .single();

        if (profileError) {
          console.error('Error updating/upserting user profile after signup:', profileError);
          throw profileError;
        }
        
        // After user profile is created, also create default settings for them
        await this.supabaseService.updateUserSettings({
          user_id: profileData.id,
          email_notifications_enabled: true // Default to enabled for new users
        });

        this.notificationService.showToast(`Welcome, ${username}! Your account has been created.`, 'success', 5000);

        // If auto-confirmation is enabled on Supabase, a session is returned.
        // We can process it to log the user in immediately.
        if (authData.session) {
          await this.processSession(authData.session);
        }
        
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Signup failed:', error.message || error);
      let friendlyMessage = `Signup failed: ${error.message || 'Unknown error'}`;
      if (error.message && error.message.toLowerCase().includes('email rate limit exceeded')) {
        friendlyMessage = 'Signup failed due to email rate limits. To fix this, please disable "Confirm email" in your Supabase project Authentication settings.';
      }
      this.notificationService.showToast(friendlyMessage, 'error', 7000);
      return false;
    }
  }

  async signInWithEmailAndPassword(email: string, password: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseService.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        // processSession will be called by onAuthStateChange listener
        this.notificationService.showToast('Logged in successfully!', 'success');
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Sign-in failed:', error.message || error);
      this.notificationService.showToast(`Sign-in failed: ${error.message || 'Invalid credentials.'}`, 'error');
      return false;
    }
  }

  async forgotPassword(email: string): Promise<boolean> {
    try {
      const { error } = await this.supabaseService.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/#/auth?action=reset-password`, // Redirect back to your app with an access token
      });

      if (error) {
        throw error;
      }

      this.notificationService.showToast('Password reset email sent! Check your inbox.', 'info', 5000);
      return true;
    } catch (error: any) {
      console.error('Forgot password failed:', error.message || error);
      this.notificationService.showToast(`Password reset failed: ${error.message || 'Unknown error'}`, 'error');
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      // Calling signOut will trigger the onAuthStateChange listener,
      // which will handle clearing state, showing notifications, and redirecting.
      const { error } = await this.supabaseService.supabase.auth.signOut();
      if (error) {
        throw error; // Re-throw to be caught by the catch block
      }
    } catch (error: any) {
      console.error('Logout failed:', error.message || error);
      this.notificationService.showToast(`Logout failed: ${error.message || 'Unknown error'}`, 'error');
    }
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
    return this.currentUser() !== null;
  }
}
