import { Injectable, signal, inject, effect, computed, NgZone } from '@angular/core';
import { Conversation, ChatMessage, User, ChatMessageReaction } from '../shared/interfaces';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  apiService = inject(ApiService);
  authService = inject(AuthService);
  notificationService = inject(NotificationService);
  ngZone = inject(NgZone);
  private userService = inject(UserService);

  isChatOpen = signal(false);
  conversations = signal<Conversation[]>([]);
  messages = signal<ChatMessage[]>([]);
  activeConversation = signal<Conversation | null>(null);
  
  users = computed(() => {
    const currentUserId = this.authService.currentUser()?.profile?.id;
    if (!currentUserId) return [];
    return this.userService.users().filter(u => u.id !== currentUserId);
  });

  totalUnreadCount = computed(() => {
    return this.conversations().reduce((acc, curr) => acc + (curr.unread_count || 0), 0);
  });

  constructor() {
    effect(() => {
      if (this.authService.currentUser()) {
        this.loadConversations();
      } else {
        this.resetState();
      }
    }, { allowSignalWrites: true });
  }

  toggleChat(): void {
    this.isChatOpen.update(val => !val);
    if(this.isChatOpen()) {
        this.loadConversations();
    }
  }

  closeChat(): void {
    this.isChatOpen.set(false);
  }

  private async loadConversations(): Promise<void> {
    try {
      const convos = await this.apiService.fetchConversations();
      this.conversations.set(convos.map(c => ({...c, other_user_avatar_base64: c.other_user_avatar_base64 || `https://picsum.photos/seed/${c.other_user_id}/100`})));
    } catch(e) {
      this.handleError(e, 'Failed to load conversations');
    }
  }

  async selectConversation(otherUserId: string): Promise<void> {
    let conversation = this.conversations().find(c => c.other_user_id === otherUserId);
    if (!conversation) {
        const otherUser = this.users().find(u => u.id === otherUserId);
        if(!otherUser) return;
        conversation = {
            other_user_id: otherUser.id,
            other_user_username: otherUser.username,
            other_user_avatar_base64: otherUser.avatar_base64 || `https://picsum.photos/seed/${otherUser.id}/100`,
            last_message_text: 'Start a new conversation!',
            last_message_timestamp: new Date().toISOString(),
            unread_count: 0
        };
        this.conversations.update(convos => [conversation!, ...convos]);
    }

    this.activeConversation.set(conversation);
    this.messages.set([]); 

    try {
      const messages = await this.apiService.fetchMessages(otherUserId);
      this.messages.set(messages);
      // if (conversation.unread_count > 0) {
      //   this.markMessagesAsRead(otherUserId);
      // }
    } catch (e) {
      this.handleError(e, 'Failed to fetch messages');
    }
  }

  async sendMessage(messageText: string, attachmentUrl?: string, attachmentType?: ChatMessage['attachment_type']): Promise<void> {
    const receiverId = this.activeConversation()?.other_user_id;
    if (!receiverId || (!messageText.trim() && !attachmentUrl)) return;

    try {
      const newMessage = await this.apiService.sendMessage(receiverId, messageText.trim(), attachmentUrl, attachmentType);
      this.messages.update(msgs => [...msgs, newMessage]);
      await this.loadConversations(); // Refresh conversation list
    } catch (e) {
      this.handleError(e, 'Failed to send message');
    }
  }
  
  private handleError(error: any, defaultMessage: string) {
    console.error(`Error in ChatService:`, error);
    const message = error?.error?.error || defaultMessage;
    this.notificationService.showToast(message, 'error');
  }

  private resetState(): void {
    this.isChatOpen.set(false);
    this.conversations.set([]);
    this.messages.set([]);
    this.activeConversation.set(null);
  }
}
