

import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { ChatComponent } from '../chat/chat.component';
import { ChatService } from '../../services/chat.service';
import { CommonModule } from '@angular/common';
import { PermissionService } from '../../services/permission.service';
import { StatusChangeOverlayComponent } from '../status-change-overlay/status-change-overlay.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, NavbarComponent, ChatComponent, CommonModule, StatusChangeOverlayComponent],
  template: `
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
  `,
})
export class LayoutComponent {
  chatService = inject(ChatService);
  permissionService = inject(PermissionService);
  
  isChatOpen = this.chatService.isChatOpen;
  canUseChat = this.permissionService.canUseChat;

  closeChatPanel(): void {
    this.chatService.closeChat();
  }
}
