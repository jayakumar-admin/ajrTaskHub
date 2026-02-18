import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PermissionService } from '../../services/permission.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
<!-- Desktop Sidebar: hidden on mobile, flex on desktop -->
<div class="hidden md:flex md:flex-col md:w-64 md:h-full md:fixed md:bg-white md:dark:bg-gray-800 md:border-r md:border-gray-200 md:dark:border-gray-700 md:z-30 p-4 space-y-6">
  
  <!-- Logo/Title -->
  <div class="flex items-center gap-2 p-2">
    <svg class="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
    <h1 class="text-xl font-bold text-gray-900 dark:text-white">AJRTaskHub</h1>
  </div>

  <!-- New Task Button -->
  @if(canCreateTasks()){
    <a routerLink="/tasks/new" class="flex items-center justify-center w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      New Task
    </a>
  }

  <!-- Navigation Links -->
  <nav class="flex-grow flex flex-col space-y-2">
    <a routerLink="/tasks" routerLinkActive="bg-primary-100 dark:bg-gray-700 text-primary-600 dark:text-white" [routerLinkActiveOptions]="{exact: true}"
      class="group flex items-center p-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 font-medium">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-3 transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
      <span class="transition-transform duration-200 group-hover:translate-x-1">Task List</span>
    </a>
     <a routerLink="/projects" routerLinkActive="bg-primary-100 dark:bg-gray-700 text-primary-600 dark:text-white"
      class="group flex items-center p-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 font-medium">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-3 transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
      <span class="transition-transform duration-200 group-hover:translate-x-1">Projects</span>
    </a>
    @if (canAccessKanban()) {
      <a routerLink="/kanban" routerLinkActive="bg-primary-100 dark:bg-gray-700 text-primary-600 dark:text-white"
        class="group flex items-center p-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 font-medium">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-3 transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        <span class="transition-transform duration-200 group-hover:translate-x-1">Kanban Board</span>
      </a>
    }
    @if (canAccessCalendar()) {
      <a routerLink="/calendar" routerLinkActive="bg-primary-100 dark:bg-gray-700 text-primary-600 dark:text-white"
        class="group flex items-center p-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 font-medium">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-3 transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        <span class="transition-transform duration-200 group-hover:translate-x-1">Calendar</span>
      </a>
    }
    @if(canAccessTools()) {
      <a routerLink="/ajr-tools" routerLinkActive="bg-primary-100 dark:bg-gray-700 text-primary-600 dark:text-white"
        class="group flex items-center p-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 font-medium">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-3 transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg>
        <span class="transition-transform duration-200 group-hover:translate-x-1">AJR Tools</span>
      </a>
    }
    <a routerLink="/settings" routerLinkActive="bg-primary-100 dark:bg-gray-700 text-primary-600 dark:text-white"
      class="group flex items-center p-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 font-medium">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-3 transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
      <span class="transition-transform duration-200 group-hover:translate-x-1">Settings</span>
    </a>
    @if (isAdmin()) {
      <a routerLink="/admin" routerLinkActive="bg-primary-100 dark:bg-gray-700 text-primary-600 dark:text-white"
        class="group flex items-center p-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 font-medium">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-3 transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span class="transition-transform duration-200 group-hover:translate-x-1">Admin Panel</span>
      </a>
    }
  </nav>

  <!-- User/Logout at bottom -->
  <div class="mt-auto">
    <button (click)="logout()" class="w-full flex items-center p-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      <span>Logout</span>
    </button>
  </div>
</div>

<!-- Mobile Bottom Nav: hidden on desktop -->
<div class="md:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none">
   <!-- Backdrop for mobile menu -->
  @if (isMobileMenuOpen()) {
    <div class="fixed inset-0 bg-black/30 z-40" (click)="isMobileMenuOpen.set(false)"></div>
  }

  <div class="relative w-full max-w-lg h-24 pointer-events-auto">
    <!-- Mobile Menu Popup -->
    @if (isMobileMenuOpen()) {
      <div class="absolute bottom-20 right-4 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl py-2 z-50 border border-gray-200 dark:border-gray-700">
        <a routerLink="/projects" (click)="isMobileMenuOpen.set(false)" class="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
          <span>Projects</span>
        </a>
        @if(canAccessTools()) {
          <a routerLink="/ajr-tools" (click)="isMobileMenuOpen.set(false)" class="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg>
            <span>AJR Tools</span>
          </a>
        }
        <a routerLink="/settings" (click)="isMobileMenuOpen.set(false)" class="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>Settings</span>
        </a>
        @if (isAdmin()) {
          <a routerLink="/admin" (click)="isMobileMenuOpen.set(false)" class="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Admin Panel</span>
          </a>
        }
        <div class="my-1 border-t border-gray-100 dark:border-gray-700"></div>
        <button (click)="logout()" class="flex items-center w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Logout</span>
        </button>
      </div>
    }
    
    <!-- Floating Action Button -->
    @if (canCreateTasks()) {
      <a routerLink="/tasks/new"
        class="absolute top-0 left-1/2 -translate-x-1/2 z-10 h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-primary-700 hover:scale-110 active:scale-95 transition-transform duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </a>
    }

    <!-- Bottom Nav Bar -->
    <nav class="absolute bottom-0 w-full bg-white dark:bg-gray-800 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.1)] h-16 rounded-t-2xl flex items-center justify-around">
      <!-- Left side icons -->
      <a routerLink="/tasks" routerLinkActive="text-primary-500" [routerLinkActiveOptions]="{exact: true}"
        class="p-2 text-gray-400 hover:text-primary-500 transition-colors" title="Task List">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
      </a>
      @if(canAccessKanban()) {
        <a routerLink="/kanban" routerLinkActive="text-primary-500"
          class="p-2 text-gray-400 hover:text-primary-500 transition-colors" title="Kanban Board">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </a>
      }

      <!-- Placeholder for spacing -->
      <div class="w-16"></div>
      
      <!-- Right side icons -->
      @if(canAccessCalendar()){
        <a routerLink="/calendar" routerLinkActive="text-primary-500"
          class="p-2 text-gray-400 hover:text-primary-500 transition-colors" title="Calendar">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        </a>
      }
      
      <button (click)="isMobileMenuOpen.set(!isMobileMenuOpen())" class="p-2 text-gray-400 hover:text-primary-500 transition-colors" title="More options">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v.01M12 12v.01M12 19v.01" />
        </svg>
      </button>
    </nav>
  </div>
</div>
`,
  styles: []
})
export class NavbarComponent {
  authService = inject(AuthService);
  permissionService = inject(PermissionService);
  isAdmin = computed(() => this.authService.isAdmin());
  isMobileMenuOpen = signal(false);

  canCreateTasks = this.permissionService.canCreateTasks;
  canAccessKanban = this.permissionService.canAccessKanban;
  canAccessCalendar = this.permissionService.canAccessCalendar;
  canAccessTools = this.permissionService.canAccessTools;


  logout(): void {
    this.isMobileMenuOpen.set(false);
    this.authService.logout();
  }
}
