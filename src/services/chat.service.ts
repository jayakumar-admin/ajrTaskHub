import { Injectable, signal, inject, effect, computed, NgZone } from '@angular/core';
import { Conversation, ChatMessage, User, ChatMessageReaction } from '../shared/interfaces';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  supabaseService = inject(SupabaseService);
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

  private messageChannel: RealtimeChannel | null = null;

  totalUnreadCount = computed(() => {
    return this.conversations().reduce((acc, curr) => acc + curr.unread_count, 0);
  });

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (user?.profile) {
        this.loadInitialData(user.profile.id);
        this.subscribeToMessageChanges(user.profile.id);
      } else {
        this.resetState();
      }
    }, { allowSignalWrites: true });
  }

  toggleChat(): void {
    this.isChatOpen.update(val => !val);
    if(this.isChatOpen() && this.conversations().length === 0) {
        const user = this.authService.currentUser();
        if(user?.profile) {
            this.loadConversations(user.profile.id);
        }
    }
  }

  closeChat(): void {
    this.isChatOpen.set(false);
  }
  
  private async loadInitialData(userId: string): Promise<void> {
    try {
      await this.loadConversations(userId);
    } catch(error) {
        this.notificationService.showToast('Failed to load chat data.', 'error');
    }
  }

  private async loadConversations(userId: string): Promise<void> {
    try {
      const convos = await this.supabaseService.fetchConversations(userId);
      this.conversations.set(convos.map(c => ({...c, other_user_avatar_base64: c.other_user_avatar_base64 || `https://picsum.photos/seed/${c.other_user_id}/100`})));
    } catch(e) {
      console.error("Failed to load conversations:", e);
    }
  }

  async selectConversation(otherUserId: string): Promise<void> {
    const currentUser = this.authService.currentUser()?.profile;
    if (!currentUser) return;

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
      const messages = await this.supabaseService.fetchMessages(currentUser.id, otherUserId);
      const messageIds = messages.map(m => m.id);
      const reactions = await this.supabaseService.fetchReactionsForMessages(messageIds);

      const messagesWithReactions = messages.map(message => ({
        ...message,
        reactions: reactions.filter(r => r.message_id === message.id)
      }));

      this.messages.set(messagesWithReactions);
      if (conversation.unread_count > 0) {
        this.markMessagesAsRead(otherUserId);
      }
    } catch (e) {
      console.error('Failed to fetch messages for conversation', e);
    }
  }

  async sendMessage(messageText: string, attachmentBase64?: string, attachmentType?: ChatMessage['attachment_type']): Promise<void> {
    const receiverId = this.activeConversation()?.other_user_id;
    const sender = this.authService.currentUser()?.profile;

    if (!receiverId || !sender || (!messageText.trim() && !attachmentBase64)) return;

    try {
      const newMessage = await this.supabaseService.sendMessage(sender.id, receiverId, messageText.trim(), attachmentBase64, attachmentType);
      
      // Optimistically update the UI for a snappier experience.
      // The real-time subscription's handler has a duplicate check, so this is safe.
      const isActiveConvo = this.isChatOpen() && this.activeConversation()?.other_user_id === receiverId;

      if (isActiveConvo) {
        // Add the new message to the local signal.
        if (!this.messages().some(m => m.id === newMessage.id)) {
            this.messages.update(msgs => [...msgs, { ...newMessage, reactions: [] }]);
        }
      }
      
      // Refresh conversation list to show the latest message on top.
      await this.loadConversations(sender.id);
      
    } catch (e) {
      this.notificationService.showToast('Failed to send message.', 'error');
    }
  }

  async editMessage(messageId: string, newText: string): Promise<void> {
    const userId = this.authService.currentUser()?.profile?.id;
    if (!newText.trim() || !userId) return;
    
    this.messages.update(msgs => msgs.map(msg => 
      msg.id === messageId 
        ? { ...msg, message_text: newText, updated_at: new Date().toISOString() } 
        : msg
    ));
    try {
      await this.supabaseService.editChatMessage(messageId, newText.trim(), userId);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to edit message.';
      this.notificationService.showToast(errorMessage, 'error');
      this.selectConversation(this.activeConversation()!.other_user_id);
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    const userId = this.authService.currentUser()?.profile?.id;
    if (!userId) return;

    this.messages.update(msgs => msgs.filter(msg => msg.id !== messageId));
    try {
      await this.supabaseService.deleteChatMessage(messageId, userId);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to delete message.';
      this.notificationService.showToast(errorMessage, 'error');
      this.selectConversation(this.activeConversation()!.other_user_id);
    }
  }

  async markMessagesAsRead(senderId: string): Promise<void> {
    const currentUserId = this.authService.currentUser()?.profile?.id;
    if (!currentUserId) return;
    
    try {
      await this.supabaseService.markMessagesAsRead(currentUserId, senderId);
      this.conversations.update(convos => 
        convos.map(c => c.other_user_id === senderId ? { ...c, unread_count: 0 } : c)
      );
    } catch(e) {
      console.error("Failed to mark messages as read", e);
    }
  }

  async addReaction(messageId: string, reaction: string): Promise<void> {
    const user = this.authService.currentUser()?.profile;
    if (!user) return;
    this.messages.update(msgs => msgs.map(msg => {
      if (msg.id === messageId) {
        const existingReactions = msg.reactions || [];
        const userReactionIndex = existingReactions.findIndex(r => r.user_id === user.id);
        if (userReactionIndex > -1) {
          existingReactions[userReactionIndex] = { ...existingReactions[userReactionIndex], reaction: reaction };
          return { ...msg, reactions: [...existingReactions] };
        } else {
          const newReaction: ChatMessageReaction = { id: '', message_id: messageId, user_id: user.id, reaction: reaction, created_at: new Date().toISOString() };
          return { ...msg, reactions: [...existingReactions, newReaction] };
        }
      }
      return msg;
    }));
    try {
      await this.supabaseService.addReaction(messageId, user.id, reaction);
    } catch (error) {
      this.notificationService.showToast('Failed to add reaction.', 'error');
      this.selectConversation(this.activeConversation()!.other_user_id);
    }
  }

  async removeReaction(messageId: string): Promise<void> {
    const user = this.authService.currentUser()?.profile;
    if (!user) return;
    this.messages.update(msgs => msgs.map(msg => {
      if (msg.id === messageId) {
        return { ...msg, reactions: (msg.reactions || []).filter(r => r.user_id !== user.id) };
      }
      return msg;
    }));
    try {
      await this.supabaseService.removeReaction(messageId, user.id);
    } catch (error) {
      this.notificationService.showToast('Failed to remove reaction.', 'error');
      this.selectConversation(this.activeConversation()!.other_user_id);
    }
  }

  private subscribeToMessageChanges(userId: string): void {
    this.unsubscribeFromMessages();
    this.messageChannel = this.supabaseService.supabase
      .channel(`chat-realtime-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `or(sender_id.eq.${userId},receiver_id.eq.${userId})`,
        },
        (payload: RealtimePostgresChangesPayload<ChatMessage>) => {
          this.ngZone.run(() => {
            switch (payload.eventType) {
              case 'INSERT':
                this.handleRealtimeInsert(payload.new);
                break;
              case 'UPDATE':
                this.handleRealtimeUpdate(payload.new);
                break;
              case 'DELETE':
                this.handleRealtimeDelete(payload.old as { id: string });
                break;
            }
          });
        }
      )
      .subscribe();
  }
  
  private async handleRealtimeInsert(newMessage: ChatMessage) {
    const currentUserId = this.authService.currentUser()?.profile.id;
    if (!currentUserId) return;
    const isActiveConvo = this.isChatOpen() && this.activeConversation() && (this.activeConversation()?.other_user_id === newMessage.sender_id || this.activeConversation()?.other_user_id === newMessage.receiver_id);
    if (isActiveConvo) {
      if (!this.messages().some(m => m.id === newMessage.id)) {
        this.messages.update(msgs => [...msgs, { ...newMessage, reactions: [] }]);
      }
      if (newMessage.receiver_id === currentUserId) {
        await this.markMessagesAsRead(newMessage.sender_id);
      }
    } else {
      if (newMessage.receiver_id === currentUserId) {
        const sender = this.users().find(u => u.id === newMessage.sender_id);
        if (sender) {
          this.notificationService.showChatToast(sender.username, sender.avatar_base64 || `https://picsum.photos/seed/${sender.id}/100`, newMessage.attachment_base64 ? 'Sent an attachment' : newMessage.message_text, sender.id);
        }
      }
    }
    await this.loadConversations(currentUserId);
  }
  
  private handleRealtimeUpdate(updatedMessage: ChatMessage) {
    this.messages.update(msgs => msgs.map(msg =>
      msg.id === updatedMessage.id ? { ...msg, ...updatedMessage } : msg
    ));
    const currentUserId = this.authService.currentUser()?.profile.id;
    if (currentUserId) this.loadConversations(currentUserId);
  }
  
  private handleRealtimeDelete(deletedMessage: { id: string }) {
    this.messages.update(msgs => msgs.filter(msg => msg.id !== deletedMessage.id));
    const currentUserId = this.authService.currentUser()?.profile.id;
    if (currentUserId) this.loadConversations(currentUserId);
  }

  private unsubscribeFromMessages(): void {
    if (this.messageChannel) {
      this.supabaseService.supabase.removeChannel(this.messageChannel);
      this.messageChannel = null;
    }
  }

  private resetState(): void {
    this.isChatOpen.set(false);
    this.conversations.set([]);
    this.messages.set([]);
    this.activeConversation.set(null);
    this.unsubscribeFromMessages();
  }
}