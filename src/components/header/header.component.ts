import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
// FIX: The supabase service file was missing. It is now added and can be imported.
import { SupabaseService } from '../../services/supabase.service';
import { ThemeService } from '../../services/theme.service';
import { NotificationService } from '../../services/notification.service';
import { SearchService } from '../../services/search.service';
import { Notification } from '../../shared/interfaces';
import { ChatService } from '../../services/chat.service';
import { PermissionService } from '../../services/permission.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, FormsModule],
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  authService = inject(AuthService);
  supabaseService = inject(SupabaseService);
  themeService = inject(ThemeService);
  notificationService = inject(NotificationService);
  searchService = inject(SearchService);
  chatService = inject(ChatService);
  permissionService = inject(PermissionService);
  router = inject(Router);

  currentUser = this.authService.currentUser;
  isDarkMode = this.themeService.isDarkMode;
  canUseChat = this.permissionService.canUseChat;
  canAccessTools = this.permissionService.canAccessTools;

  searchTerm = this.searchService.searchTerm;

  showNotificationsPanel = signal(false);
  notifications = this.notificationService.notifications;
  unreadCount = this.notificationService.unreadCount;
  totalUnreadCount = this.chatService.totalUnreadCount;

  showUserMenu = signal(false);

  avatarUrl = computed(() => {
    const user = this.currentUser()?.profile;
    if (user?.avatar_base64) {
      return user.avatar_base64;
    }
    return `https://picsum.photos/seed/${user?.id}/100`;
  });
  
  onSearchChange(term: string): void {
    this.searchService.searchTerm.set(term);
    // If user is searching, navigate them to the tasks page to see results
    if (term.length > 0) {
      this.router.navigate(['/tasks'], { fragment: 'all-tasks' });
    }
  }

  toggleDarkMode() {
    this.themeService.toggleDarkMode();
  }

  toggleChatPanel(): void {
    this.chatService.toggleChat();
  }

  toggleNotificationsPanel(): void {
    this.showNotificationsPanel.update(val => !val);
  }

  markNotificationAsRead(id: string): void {
    this.notificationService.markAsRead(id);
  }

  markAllNotificationsAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  toggleUserMenu(): void {
    this.showUserMenu.update(v => !v);
  }

  logout(): void {
    this.showUserMenu.set(false);
    this.authService.logout();
  }
}
