import { Component, inject, OnInit, OnDestroy, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { ChatComponent } from '../chat/chat.component';
import { ChatService } from '../../services/chat.service';
import { CommonModule } from '@angular/common';
import { PermissionService } from '../../services/permission.service';
import { StatusChangeOverlayComponent } from '../status-change-overlay/status-change-overlay.component';
import { SessionTimeoutService } from '../../services/session-timeout.service';
import { AuthService } from '../../services/auth.service';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';
import { UserService } from '../../services/user.service';
import { TaskService } from '../../services/task.service';
import { ProjectService } from '../../services/project.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, NavbarComponent, ChatComponent, CommonModule, StatusChangeOverlayComponent, LoadingSpinnerComponent],
  template: `
@if (isInitializing()) {
  <div class="fixed inset-0 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 z-[200] transition-opacity duration-300">
    <div class="animate-pulse">
        <svg class="h-16 w-16 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
    </div>
    <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200 mt-4">AJR Task Hub</h2>
    <p class="text-gray-600 dark:text-gray-400 animate-pulse">Loading your workspace...</p>
  </div>
} @else {
  <div class="bg-gray-50 dark:bg-gray-900 min-h-screen font-sans antialiased">
    <div class="relative min-h-screen md:flex">
      <!-- Sidebar for Desktop / Bottom Nav for Mobile -->
      <app-navbar></app-navbar>

      <!-- Main Content Area -->
      <div class="flex-1 flex flex-col md:ml-64">
        <app-header></app-header>
        <main class="flex-grow p-4 sm:p-6 pb-24 md:pb-6">
          <router-outlet></router-outlet>
        </main>
      </div>

      <!-- Global Chat Component -->
      @if(canUseChat()) {
        <app-chat [isOpen]="isChatOpen()" (closeChat)="closeChatPanel()"/>
      }

      <!-- Global Status Change Animation Overlay -->
      <app-status-change-overlay />
    </div>
  </div>
}
`,
})
export class LayoutComponent implements OnInit, OnDestroy {
  chatService = inject(ChatService);
  permissionService = inject(PermissionService);
  sessionTimeoutService = inject(SessionTimeoutService);
  authService = inject(AuthService);
  userService = inject(UserService);
  taskService = inject(TaskService);
  projectService = inject(ProjectService);
  
  isInitializing = computed(() => {
    return this.authService.isInitializing() ||
           this.userService.loading() ||
           this.taskService.loading() ||
           this.projectService.loading() ||
           this.permissionService.loading();
  });

  isChatOpen = this.chatService.isChatOpen;
  canUseChat = this.permissionService.canUseChat;

  ngOnInit(): void {
    this.sessionTimeoutService.start();
  }

  ngOnDestroy(): void {
    this.sessionTimeoutService.stop();
  }

  closeChatPanel(): void {
    this.chatService.closeChat();
  }
}
