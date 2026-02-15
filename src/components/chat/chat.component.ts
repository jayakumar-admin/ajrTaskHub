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
        class="fixed top-0 left-0 h-full w-full max-w-lg bg-gray-50 dark:bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out"
        [class.translate-x-0]="isOpen()"
        [class.-translate-x-full]="!isOpen()">
        
        <button (click)="closeChat.emit()" class="absolute top-3 right-3 z-10 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title="Close chat">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>

        <div class="flex h-full">
          <!-- Conversation List -->
          <div class="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 flex-shrink-0"
               [class.w-[240px]]="!isConversationListCollapsed()"
               [class.w-[80px]]="isConversationListCollapsed()">
            <header class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white" [class.hidden]="isConversationListCollapsed()">Chats</h3>
              <button (click)="toggleConversationList()" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 transition-transform" [class.rotate-180]="isConversationListCollapsed()" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
              </button>
            </header>
            
            <div class="p-2 border-b border-gray-200 dark:border-gray-700" [class.hidden]="isConversationListCollapsed()">
                <input type="text" placeholder="Start new chat..." class="w-full px-2 py-1 text-sm border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 focus:ring-primary-500 focus:border-primary-500"
                (focus)="showUserList.set(true)" (blur)="hideUserListWithDelay()" [(ngModel)]="userSearchTerm">
            </div>

            @if(showUserList() && !isConversationListCollapsed()){
              <div class="overflow-y-auto flex-1">
                @for(user of filteredUsers(); track user.id) {
                  <div (mousedown)="selectConversation(user.id); showUserList.set(false)" class="p-3 flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                      <img [src]="getUserAvatar(user.avatar_base64, user.id)" alt="avatar" class="w-10 h-10 rounded-full object-cover">
                      <div>
                          <h4 class="font-semibold text-sm text-gray-800 dark:text-gray-200">{{ user.username }}</h4>
                      </div>
                  </div>
                } @empty {
                  <p class="text-center text-sm text-gray-500 dark:text-gray-400 p-4">No users found</p>
                }
              </div>
            } @else {
              <div class="overflow-y-auto flex-1">
                  @for (convo of conversations(); track convo.other_user_id) {
                    <div (click)="selectConversation(convo.other_user_id)" 
                        [class.bg-gray-200]="isActive(convo.other_user_id)"
                        [class.dark:bg-gray-600]="isActive(convo.other_user_id)"
                        class="p-3 flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                        [class.justify-center]="isConversationListCollapsed()">
                        <img [src]="convo.other_user_avatar_base64" alt="avatar" class="w-10 h-10 rounded-full object-cover">
                        <div [class.hidden]="isConversationListCollapsed()" class="flex-1 overflow-hidden">
                            <div class="flex justify-between items-center">
                                <h4 class="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate">{{ convo.other_user_username }}</h4>
                                <span class="text-xs text-gray-400">{{ convo.last_message_timestamp | date:'shortTime' }}</span>
                            </div>
                            <div class="flex justify-between items-start">
                                <p class="text-sm text-gray-500 dark:text-gray-400 truncate">{{ convo.last_message_text }}</p>
                                @if (convo.unread_count > 0) {
                                  <span class="ml-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{{ convo.unread_count }}</span>
                                }
                            </div>
                        </div>
                    </div>
                  } @empty {
                    <p class="text-center text-sm text-gray-500 dark:text-gray-400 p-4" [class.hidden]="isConversationListCollapsed()">No conversations yet.</p>
                  }
              </div>
            }
          </div>

          <div class="flex-1 flex flex-col bg-gray-100 dark:bg-gray-900 overflow-hidden">
            @if (activeConversation(); as convo) {
              <header class="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center space-x-3 bg-white dark:bg-gray-800">
                  @if(isConversationListCollapsed()) {
                    <button (click)="toggleConversationList()" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 md:hidden" title="Back to conversations">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                  }
                  <img [src]="convo.other_user_avatar_base64" alt="avatar" class="w-10 h-10 rounded-full object-cover">
                  <div><h3 class="font-semibold text-gray-900 dark:text-white">{{ convo.other_user_username }}</h3></div>
              </header>

              <div #messageContainer class="flex-1 p-4 overflow-y-auto space-y-2 chat-bg-pattern">
                @for (msg of messages(); track msg.id) {
                  <div class="flex group" [class.justify-end]="msg.sender_id === currentUserId()">
                    <div class="max-w-xs lg:max-w-md px-3 py-2 rounded-xl relative shadow" [class.bg-green-200]="msg.sender_id === currentUserId()" [class.dark:bg-green-900]="msg.sender_id === currentUserId()" [class.text-gray-800]="msg.sender_id === currentUserId()" [class.dark:text-gray-100]="msg.sender_id === currentUserId()" [class.rounded-br-md]="msg.sender_id === currentUserId()" [class.bg-white]="msg.sender_id !== currentUserId()" [class.dark:bg-gray-700]="msg.sender_id !== currentUserId()" [class.text-gray-800]="msg.sender_id !== currentUserId()" [class.dark:text-gray-200]="msg.sender_id !== currentUserId()" [class.rounded-tl-md]="msg.sender_id !== currentUserId()">
                      @if (msg.sender_id === currentUserId()) {
                        <button (click)="toggleMessageMenu(msg.id)" class="absolute top-1 right-1 hidden group-hover:block p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 z-10">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                        </button>
                        @if (activeMessageMenuId() === msg.id) {
                          <div class="absolute top-8 right-1 bg-white dark:bg-gray-600 rounded-md shadow-lg z-20 py-1 w-24">
                            <button (click)="startEditing(msg)" class="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-500">Edit</button>
                            <button (click)="deleteMessage(msg.id)" class="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50">Delete</button>
                          </div>
                        }
                      }
                      <button (click)="openReactionPicker(msg.id)" class="absolute -top-4 right-2 hidden group-hover:block bg-white dark:bg-gray-600 p-1 rounded-full shadow text-sm">🙂</button>
                      @if (reactionPickerMessageId() === msg.id) {
                        <div class="absolute -top-10 right-0 flex space-x-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg z-10">
                          @for (reaction of availableReactions; track reaction) { <button (click)="toggleReaction(msg, reaction)" class="text-lg hover:scale-125 transition-transform">{{ reaction }}</button> }
                        </div>
                      }
                      
                      @if (editingMessageId() === msg.id) {
                        <div>
                          <textarea [(ngModel)]="editingMessageText" (keydown.enter)="saveEdit(); $event.preventDefault()" (keydown.escape)="cancelEditing()" class="w-full p-2 text-sm border-gray-300 dark:border-gray-500 rounded-md bg-white dark:bg-gray-600 focus:ring-primary-500 focus:border-primary-500" rows="3"></textarea>
                          <div class="flex justify-end space-x-2 mt-2">
                            <button (click)="cancelEditing()" class="px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:underline">Cancel</button>
                            <button (click)="saveEdit()" class="px-3 py-1 text-xs bg-primary-600 text-white rounded-md hover:bg-primary-700">Save</button>
                          </div>
                        </div>
                      } @else {
                        @if(msg.attachment_base64) {
                          @if(msg.attachment_type === 'image') { <img [src]="msg.attachment_base64" alt="attachment" class="rounded-md max-w-full mb-2 cursor-pointer" (click)="previewAttachment(msg)"> }
                          @else { <a [href]="msg.attachment_base64" target="_blank" class="flex items-center p-2 bg-black/10 dark:bg-white/10 rounded-md hover:bg-black/20 dark:hover:bg-white/20"> <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg> <span class="text-sm underline">{{ msg.message_text || 'Attachment' }}</span> </a> }
                        } @if(msg.message_text) { <p class="text-sm whitespace-pre-wrap break-words pb-5 pr-16">{{ msg.message_text }}</p> }
                        
                        <div class="absolute bottom-1.5 right-2 flex items-center space-x-1">
                          @if (msg.updated_at) { <span class="text-xs opacity-60 italic mr-1">(edited)</span> }
                          <span class="text-xs opacity-75">{{ msg.created_at | date:'shortTime' }}</span>
                          @if (msg.sender_id === currentUserId()) { <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" [class.text-blue-500]="msg.is_read" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /><path d="M4.293 8.707a1 1 0 010-1.414l4-4a1 1 0 111.414 1.414L6.414 8l3.293 3.293a1 1 0 11-1.414 1.414l-4-4z" /></svg> }
                        </div>
                      }

                      @if(getReactionSummary(msg.reactions).length > 0) {
                        <div class="absolute -bottom-3 right-1 flex space-x-1 bg-gray-200/80 dark:bg-gray-600/80 backdrop-blur-sm rounded-full px-1.5 py-0.5 shadow-sm text-xs">
                           @for(reaction of getReactionSummary(msg.reactions); track reaction.emoji) { <span [title]="reaction.users.join(', ')" class="cursor-default">{{reaction.emoji}}{{reaction.count > 1 ? reaction.count : ''}}</span> }
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>

              <footer class="p-4 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <form (ngSubmit)="sendMessage()" class="flex items-center space-x-2">
                  <input type="file" #fileInput class="hidden" (change)="onAttachmentSelected($event)" accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt">
                  <button type="button" (click)="fileInput.click()" class="w-10 h-10 flex-shrink-0 text-gray-500 dark:text-gray-400 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a3 3 0 00-3 3v4a3 3 0 006 0V7a3 3 0 00-3-3zM8 1a1 1 0 00-1 1v4a1 1 0 102 0V2a1 1 0 00-1-1zM4 9a4 4 0 118 0v3a1 1 0 11-2 0V9a2 2 0 10-4 0v3a3 3 0 006 0v-1a1 1 0 10-2 0v1a1 1 0 102 0V9a4 4 0 00-8 0z" clip-rule="evenodd" /></svg>
                  </button>
                  <input type="text" [(ngModel)]="newMessage" name="newMessage" placeholder="Type a message..." class="flex-1 px-4 py-2 border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 focus:ring-primary-500 focus:border-primary-500">
                  <button type="submit" [disabled]="!newMessage.trim() && !fileInput.files?.length" class="w-10 h-10 flex-shrink-0 bg-primary-600 text-white rounded-full flex items-center justify-center hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                  </button>
                </form>
              </footer>
            } @else {
              <div class="flex-1 flex items-center justify-center text-center text-gray-500 dark:text-gray-400 chat-bg-pattern">
                <div>
                  <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  <p class="mt-2">Select a conversation or start a new one.</p>
                </div>
              </div>
            }
          </div>
        </div>
      </aside>
    }
  `,
  styles: [`
    .chat-bg-pattern {
      background-color: #e5ddd5;
      background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    }
    .dark .chat-bg-pattern {
      background-color: #0d1418;
      background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    }
  `]
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
  allUsers = this.chatService.users;
  
  isConversationListCollapsed = signal(false);
  newMessage = '';
  showUserList = signal(false);
  userSearchTerm = '';

  reactionPickerMessageId = signal<string | null>(null);
  availableReactions = ['👍', '❤️', '😂', '😮', '😢', '😠'];

  editingMessageId = signal<string | null>(null);
  editingMessageText = signal<string>('');
  activeMessageMenuId = signal<string | null>(null);

  @ViewChild('messageContainer') private messageContainer!: ElementRef;
  @ViewChild('fileInput') private fileInput!: ElementRef;

  constructor() {
    effect(() => {
      if (this.messages() && this.messageContainer) {
        setTimeout(() => this.scrollToBottom(), 0);
      }
    });
  }
  
  toggleConversationList(): void {
    this.isConversationListCollapsed.update(v => !v);
  }

  filteredUsers = computed(() => {
      const term = this.userSearchTerm.toLowerCase();
      if (!term) return this.allUsers();
      return this.allUsers().filter(u => u.username.toLowerCase().includes(term));
  });

  hideUserListWithDelay() {
      setTimeout(() => this.showUserList.set(false), 200);
  }

  getUserAvatar(avatarBase64: string | undefined, userId: string): string {
    return avatarBase64 || `https://picsum.photos/seed/${userId}/100`;
  }

  selectConversation(userId: string): void {
    this.chatService.selectConversation(userId);
    this.isConversationListCollapsed.set(true);
  }

  isActive(userId: string): boolean {
    return this.activeConversation()?.other_user_id === userId;
  }

  sendMessage(): void {
    if (!this.newMessage.trim()) return;
    this.chatService.sendMessage(this.newMessage);
    this.newMessage = '';
  }

  async onAttachmentSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e: any) => {
      const base64 = e.target.result;
      const attachmentType = file.type.startsWith('image/') ? 'image' : (file.type.startsWith('video/') ? 'video' : 'file');
      try {
        await this.chatService.sendMessage(file.name, base64, attachmentType);
      } catch (error: any) {
        this.notificationService.showToast(`Attachment upload failed: ${error.message}`, 'error');
      } finally {
        this.fileInput.nativeElement.value = '';
      }
    };
    reader.onerror = (error) => {
      this.notificationService.showToast('Failed to read file.', 'error');
      console.error('FileReader error:', error);
      this.fileInput.nativeElement.value = '';
    };
    reader.readAsDataURL(file);
  }
  
  previewAttachment(message: ChatMessage): void {
    if (message.attachment_base64) {
      window.open(message.attachment_base64, '_blank');
    }
  }

  openReactionPicker(messageId: string): void {
    this.reactionPickerMessageId.set(this.reactionPickerMessageId() === messageId ? null : messageId);
  }

  toggleReaction(message: ChatMessage, reaction: string): void {
    const userId = this.currentUserId();
    if (!userId) return;

    const existingReaction = message.reactions?.find(r => r.user_id === userId);
    if (existingReaction && existingReaction.reaction === reaction) {
      this.chatService.removeReaction(message.id);
    } else {
      this.chatService.addReaction(message.id, reaction);
    }
    this.reactionPickerMessageId.set(null);
  }

  getReactionSummary(reactions: ChatMessageReaction[] | undefined): { emoji: string, count: number, users: string[] }[] {
    if (!reactions) return [];
    const summary = new Map<string, { count: number, users: string[] }>();
    reactions.forEach(r => {
      if (!summary.has(r.reaction)) {
        summary.set(r.reaction, { count: 0, users: [] });
      }
      const current = summary.get(r.reaction)!;
      current.count++;
      const username = this.allUsers().find(u => u.id === r.user_id)?.username || this.authService.currentUser()?.profile.username || 'You';
      current.users.push(username);
    });
    return Array.from(summary.entries()).map(([emoji, data]) => ({ emoji, ...data }));
  }

  toggleMessageMenu(messageId: string): void {
    this.activeMessageMenuId.update(id => id === messageId ? null : messageId);
  }

  startEditing(message: ChatMessage): void {
    this.editingMessageId.set(message.id);
    this.editingMessageText.set(message.message_text);
    this.activeMessageMenuId.set(null);
  }

  cancelEditing(): void {
    this.editingMessageId.set(null);
    this.editingMessageText.set('');
  }

  saveEdit(): void {
    const messageId = this.editingMessageId();
    if (!messageId) return;
    this.chatService.editMessage(messageId, this.editingMessageText());
    this.cancelEditing();
  }

  deleteMessage(messageId: string): void {
    if (confirm('Are you sure you want to delete this message?')) {
      this.chatService.deleteMessage(messageId);
    }
    this.activeMessageMenuId.set(null);
  }

  private scrollToBottom(): void {
    try {
      this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
    } catch (err) {
      console.warn("Could not scroll to bottom of chat", err);
    }
  }
}