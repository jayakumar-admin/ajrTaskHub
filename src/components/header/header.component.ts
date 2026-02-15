import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
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
  template: `
    <header class="sticky top-0 z-30 bg-white dark:bg-gray-800 shadow-md py-4 border-b border-gray-200 dark:border-gray-700">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex flex-wrap justify-between items-center gap-4">
                <!-- Title -->
                <div class="flex items-center gap-2">
                    <svg class="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                    <h1 class="text-1xl font-extrabold text-gray-900 dark:text-white tracking-tight">AJRTaskHub</h1>
                </div>
                
                <!-- Right side controls -->
                <div class="flex items-center space-x-2 md:space-x-4">
                    <!-- Dark Mode Toggle -->
                    <button (click)="toggleDarkMode()" class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        @if (isDarkMode()) {
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        } @else {
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                        }
                    </button>

                    <!-- Chat -->
                    @if(canUseChat()) {
                      <button (click)="toggleChatPanel()" class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors relative">
                        @if(totalUnreadCount() > 0) {
                          <span class="absolute top-1 right-1 h-3 w-3">
                              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                          </span>
                        }
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </button>
                    }

                     <!-- Notifications -->
                    <div class="relative">
                      <button (click)="toggleNotificationsPanel()" class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors relative">
                        @if(unreadCount() > 0) {
                          <span class="absolute top-1 right-1 h-3 w-3">
                              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                          </span>
                        }
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                      </button>

                      @if (showNotificationsPanel()) {
                        <div class="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                          <div class="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                            <h4 class="font-semibold text-gray-900 dark:text-white">Notifications</h4>
                            @if (unreadCount() > 0) {
                              <button (click)="markAllNotificationsAsRead()" class="text-sm text-primary-600 dark:text-primary-400 hover:underline">Mark all as read</button>
                            }
                          </div>
                          <div class="max-h-96 overflow-y-auto">
                            @for(notification of notifications(); track notification.id) {
                              <div [class]="'p-4 border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 ' + (!notification.read ? 'bg-primary-50 dark:bg-primary-900/20' : '')">
                                <div class="flex items-start">
                                  <div class="flex-shrink-0 pt-1">
                                      <div class="h-2 w-2 rounded-full" [class.bg-primary-500]="!notification.read"></div>
                                  </div>
                                  <div class="ml-3 w-0 flex-1">
                                    <p class="text-sm text-gray-700 dark:text-gray-300">{{ notification.message }}</p>
                                    <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ notification.created_at | date:'short' }}</p>
                                  </div>
                                  <div class="ml-4 flex-shrink-0 flex items-center">
                                      @if (!notification.read) {
                                        <button (click)="markNotificationAsRead(notification.id)" title="Mark as read" class="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
                                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500 dark:text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                          </svg>
                                        </button>
                                      }
                                  </div>
                                </div>
                              </div>
                            }
                            @empty {
                              <p class="text-center text-gray-500 dark:text-gray-400 py-8">No recent notifications.</p>
                            }
                          </div>
                        </div>
                      }
                    </div>

                    <!-- Search Bar -->
                    <div class="relative hidden sm:block">
                      <input type="text" 
                             placeholder="Search all tasks..." 
                             [ngModel]="searchTerm()"
                             (ngModelChange)="onSearchChange($event)"
                             class="w-full sm:w-48 bg-gray-100 dark:bg-gray-700 border border-transparent rounded-lg py-2 px-4 pl-10 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 focus:w-72 focus:bg-white dark:focus:bg-gray-800">
                      <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>

                    <!-- User Greeting and Avatar -->
                    <div class="flex items-center space-x-3">
                        <div class="hidden md:block text-right">
                            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ currentUser()?.profile?.username }}</p>
                            <p class="text-xs text-gray-500 dark:text-gray-400">Welcome back!</p>
                        </div>
                        <div class="relative">
                            <button (click)="toggleUserMenu()" class="cursor-pointer flex-shrink-0 block rounded-full focus:outline-none ring-2 ring-offset-2 ring-offset-gray-100 dark:ring-offset-gray-900 ring-primary-500">
                                <img class="h-12 w-12 rounded-full object-cover" [src]="avatarUrl()" alt="User Avatar">
                            </button>

                            @if (showUserMenu()) {
                                <!-- Backdrop to close menu on outside click -->
                                <div class="fixed inset-0 z-40" (click)="showUserMenu.set(false)"></div>
                                
                                <!-- Dropdown Menu -->
                                <div class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-xl py-1 border border-gray-200 dark:border-gray-700 z-50">
                                    @if (canAccessTools()) {
                                      <a routerLink="/ajr-tools" (click)="showUserMenu.set(false)" class="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg>
                                        AJR Tools
                                      </a>
                                    }
                                    <a routerLink="/settings" (click)="showUserMenu.set(false)" class="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      </svg>
                                      Settings
                                    </a>
                                    <button (click)="logout()" class="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                      </svg>
                                      Logout
                                    </button>
                                </div>
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </header>
  `,
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
    this.searchTerm.set(term);
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
