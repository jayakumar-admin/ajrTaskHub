
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification.service';
import { ChatToast, Notification } from '../../shared/interfaces';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="fixed bottom-4 right-4 z-[100] space-y-3">
  <!-- Chat Toasts (New) -->
  @for (chatToast of chatToasts(); track chatToast.id) {
    <div (click)="openChat(chatToast)" class="max-w-sm w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 dark:ring-white dark:ring-opacity-10 cursor-pointer animate-toast-in">
      <div class="w-full p-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <img class="h-10 w-10 rounded-full object-cover" [src]="chatToast.senderAvatar" alt="Sender Avatar">
          </div>
          <div class="ml-3 w-0 flex-1">
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ chatToast.senderUsername }}</p>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400 truncate">{{ chatToast.message }}</p>
          </div>
          <div class="ml-4 flex-shrink-0 flex">
            <button (click)="removeChatToast(chatToast.id, $event)" class="inline-flex text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
              <span class="sr-only">Close</span>
              <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  }
  <!-- Regular Toasts -->
  @for (toast of toasts(); track toast.id) {
    <div [class]="getNotificationClasses(toast)"
         class="flex items-center justify-between p-4 rounded-lg shadow-lg min-w-[250px] max-w-sm animate-toast-in">
      <p class="text-sm font-medium">{{ toast.message }}</p>
      <button (click)="notificationService.removeToast(toast.id)" class="ml-4 text-white hover:text-opacity-75 focus:outline-none">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  }
</div>
  `,
  styles: []
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
