import { Component, inject, input, output, signal, EventEmitter, ViewChild, ElementRef, effect, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { SupabaseService } from '../../services/supabase.service';
import { Conversation, User, ChatMessageReaction, ChatMessage } from '../../shared/interfaces';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  template: `
@if (isOpen()) {
  <div class="fixed inset-0 bg-black/30 z-40" (click)="closeChat.emit()"></div>
  <aside
    class="fixed top-0 left-0 h-full w-full max-w-lg bg-gray-50 dark:bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col"
    [class.translate-x-0]="isOpen()"
    [class.-translate-x-full]="!isOpen()">

    <div class="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Conversations</h3>
      <button (click)="closeChat.emit()" class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="Close chat">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
    
    <div class="flex-grow flex overflow-hidden">
      <!-- Conversation List -->
      <div class="w-1/3 border-r border-gray-200 dark:border-gray-700 overflow-y-auto bg-white dark:bg-gray-800/50">
        @for(convo of conversations(); track convo.other_user_id) {
          <div (click)="selectConversation(convo.other_user_id)" 
              class="flex items-center p-3 cursor-pointer border-b border-gray-100 dark:border-gray-800"
              [class.bg-primary-50]="activeConversation()?.other_user_id === convo.other_user_id"
              [class.dark:bg-gray-700]="activeConversation()?.other_user_id === convo.other_user_id"
              [class.hover:bg-gray-100]="activeConversation()?.other_user_id !== convo.other_user_id"
              [class.dark:hover:bg-gray-800]="activeConversation()?.other_user_id !== convo.other_user_id">
            <div class="relative flex-shrink-0">
                <img class="h-10 w-10 rounded-full object-cover" [src]="convo.other_user_avatar_base64" alt="avatar">
                @if(convo.unread_count > 0) {
                  <span class="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-xs ring-2 ring-white dark:ring-gray-800/50">
                    {{ convo.unread_count }}
                  </span>
                }
            </div>
            <div class="ml-3 flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ convo.other_user_username }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400 truncate">{{ convo.last_message_text }}</p>
            </div>
          </div>
        }
        @empty {
            <p class="p-4 text-center text-sm text-gray-500 dark:text-gray-400">No conversations yet.</p>
        }
      </div>

      <!-- Message View -->
      <div class="flex-1 flex flex-col bg-gray-100 dark:bg-gray-800">
        @if(activeConversation(); as convo) {
          <!-- Header -->
          <div class="flex-shrink-0 flex items-center p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 shadow-sm">
            <img class="h-10 w-10 rounded-full object-cover" [src]="convo.other_user_avatar_base64" alt="avatar">
            <div class="ml-3">
                <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ convo.other_user_username }}</p>
            </div>
          </div>

          <!-- Message List -->
          <div #messageContainer class="flex-grow p-4 overflow-y-auto">
              @for(group of groupedMessages(); track group.date) {
                <!-- Date Separator -->
                <div class="flex justify-center my-4">
                  <span class="bg-gray-200 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400 rounded-full px-3 py-1">{{ group.date }}</span>
                </div>
                <!-- Messages in Group -->
                <div class="space-y-2">
                  @for(message of group.messages; track message.id) {
                      <div class="flex items-end" [class.justify-end]="message.sender_id === currentUserId()">
                          <div 
                              class="max-w-xs lg:max-w-md p-3 rounded-xl shadow-sm text-gray-900 dark:text-gray-100"
                              [class]="message.sender_id === currentUserId() 
                                  ? 'bg-green-100 dark:bg-green-900/80 rounded-br-none' 
                                  : 'bg-white dark:bg-gray-700 rounded-bl-none'">
                              
                              <p class="text-sm whitespace-pre-wrap">{{ message.message_text }}</p>
                              <p 
                                  class="text-xs mt-1 text-right dark:text-gray-400"
                                  [class]="message.sender_id === currentUserId() ? 'text-green-800/70' : 'text-gray-500/80'">
                                  {{ message.created_at | date:'shortTime' }}
                              </p>
                          </div>
                      </div>
                  }
                </div>
              }
          </div>

          <!-- Input Area -->
          <div class="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-200 dark:bg-gray-800/80">
            <div class="relative">
              <input type="text" [(ngModel)]="newMessage" (keydown.enter)="sendMessage()" placeholder="Type a message..."
                    class="w-full pl-4 pr-12 py-3 border rounded-full bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 shadow-sm">
              <button (click)="sendMessage()" [disabled]="!newMessage.trim()" class="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-primary-500 text-white hover:bg-primary-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-transform duration-200 active:scale-90">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
              </button>
            </div>
          </div>
        } @else {
          <div class="h-full flex items-center justify-center">
            <p class="text-gray-500 dark:text-gray-400">Select a conversation to start chatting.</p>
          </div>
        }
      </div>
    </div>
  </aside>
}
`,
})
export class ChatComponent {
  isOpen = input.required<boolean>();
  closeChat = output<void>();
  
  chatService = inject(ChatService);
  authService = inject(AuthService);
  notificationService = inject(NotificationService);

  conversations = this.chatService.conversations;
  messages = this.chatService.messages;
  activeConversation = this.chatService.activeConversation;
  currentUserId = computed(() => this.authService.currentUser()?.profile?.id);

  newMessage = '';

  @ViewChild('messageContainer') private messageContainer!: ElementRef;

  constructor() {
    effect(() => {
      // Auto-scroll when new messages are added
      this.messages(); // Depend on messages signal
      this.scrollToBottom();
    });
  }

  private formatDateSeparator(date: Date): string {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    // Reset time portion for accurate date comparison
    const dateToCompare = new Date(date);
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    dateToCompare.setHours(0, 0, 0, 0);

    if (dateToCompare.getTime() === today.getTime()) {
      return 'Today';
    }
    if (dateToCompare.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    }
    // Using toLocaleDateString for a more readable format like "August 22, 2024"
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  groupedMessages = computed(() => {
    const groups: { date: string; messages: ChatMessage[] }[] = [];
    const msgs = this.messages();
    if (!msgs || msgs.length === 0) {
        return groups;
    }

    let lastDateKey = '';
    msgs.forEach(message => {
        const messageDate = new Date(message.created_at);
        const dateKey = messageDate.toDateString(); // Group by day e.g., "Thu Aug 22 2024"

        if (dateKey !== lastDateKey) {
            lastDateKey = dateKey;
            groups.push({
                date: this.formatDateSeparator(messageDate),
                messages: []
            });
        }
        groups[groups.length - 1].messages.push(message);
    });

    return groups;
  });

  selectConversation(otherUserId: string): void {
    this.chatService.selectConversation(otherUserId);
  }

  sendMessage(): void {
    if (this.newMessage.trim()) {
      this.chatService.sendMessage(this.newMessage);
      this.newMessage = '';
    }
  }

  private scrollToBottom(): void {
    try {
        setTimeout(() => {
            if (this.messageContainer?.nativeElement) {
                this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
            }
        }, 100);
    } catch (err) {
        console.error('Could not scroll to bottom:', err);
    }
  }
}
