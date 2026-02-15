import { Injectable, signal, inject, effect } from '@angular/core';
import { User } from '../shared/interfaces';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  users = signal<User[]>([]);
  loading = signal(true);

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.loadUsers();
      } else {
        this.users.set([]);
        this.loading.set(false);
      }
    }, { allowSignalWrites: true });
  }

  private async loadUsers(): Promise<void> {
    this.loading.set(true);
    try {
      const allUsers = await this.supabaseService.fetchUsers();
      this.users.set(allUsers);
    } catch (error) {
      console.error('Error fetching users in UserService:', error);
      this.notificationService.showToast('Failed to load user data.', 'error');
      this.users.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  public getUserById(id: string): User | undefined {
    return this.users().find(u => u.id === id);
  }
}
