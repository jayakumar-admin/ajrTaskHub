import { Component, inject, OnInit, OnDestroy } from '@angular/core';
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

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, NavbarComponent, ChatComponent, CommonModule, StatusChangeOverlayComponent, LoadingSpinnerComponent],
  templateUrl: './layout.component.html',
})
export class LayoutComponent implements OnInit, OnDestroy {
  chatService = inject(ChatService);
  permissionService = inject(PermissionService);
  sessionTimeoutService = inject(SessionTimeoutService);
  authService = inject(AuthService);
  
  isInitializing = this.authService.isInitializing;
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
