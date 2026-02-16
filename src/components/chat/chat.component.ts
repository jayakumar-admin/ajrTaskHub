import { Component, inject, input, output, signal, EventEmitter, ViewChild, ElementRef, effect, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
// FIX: The supabase service file was missing. It is now added and can be imported.
import { SupabaseService } from '../../services/supabase.service';
import { Conversation, User, ChatMessageReaction, ChatMessage } from '../../shared/interfaces';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  templateUrl: './chat.component.html',
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
