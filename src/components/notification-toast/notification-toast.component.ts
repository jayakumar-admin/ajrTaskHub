import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification.service';
import { ChatToast, Notification } from '../../shared/interfaces';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-toast.component.html',
  styleUrls: ['./notification-toast.component.css']
})
export class NotificationToastComponent {
  notificationService = inject(NotificationService);
  chatService = inject(ChatService);

  toasts = this.notificationService.toasts;
  chatToasts = this.notificationService.chatToasts;

  openChat(chatToast: ChatToast): void {
    if (!this.chatService.isChatOpen()) {
      this.chatService.toggleChat();
    }
    this.chatService.selectConversation(chatToast.conversationUserId);
    this.notificationService.removeChatToast(chatToast.id);
  }

  removeChatToast(id: string, event: MouseEvent): void {
    event.stopPropagation(); // Prevent openChat from firing when closing
    this.notificationService.removeChatToast(id);
  }

  getNotificationClasses(toast: { type: 'success' | 'error' | 'info' | 'warning' }): string {
    let baseClasses = '';
    switch (toast.type) {
      case 'success':
        baseClasses = 'bg-green-500 text-white';
        break;
      case 'error':
        baseClasses = 'bg-red-500 text-white';
        break;
      case 'info':
        baseClasses = 'bg-blue-500 text-white';
        break;
      case 'warning':
        baseClasses = 'bg-yellow-500 text-white';
        break;
      default:
        baseClasses = 'bg-gray-700 text-white';
    }
    return baseClasses;
  }
}
