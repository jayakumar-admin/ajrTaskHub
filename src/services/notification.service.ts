
import { Injectable, signal, computed, inject } from '@angular/core';
import { ChatToast, Notification } from '../shared/interfaces';
import { UuidService } from './uuid.service';
import { SupabaseService } from './supabase.service';

interface Toast extends Omit<Notification, 'read' | 'user_id' | 'task_id' | 'created_at'> {
  timestamp: string; // Toasts use a simple timestamp
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  // Signal for transient toast messages
  toasts = signal<Toast[]>([]);
  private timeoutIds: Map<string, any> = new Map();
  
  // New signal for transient chat notifications
  chatToasts = signal<ChatToast[]>([]);
  private chatTimeoutIds: Map<string, any> = new Map();

  // Signal for persistent notifications from the database
  notifications = signal<Notification[]>([]);

  private uuidService = inject(UuidService);
  private supabaseService = inject(SupabaseService);

  unreadCount = computed(() => this.notifications().filter(n => !n.read).length);

  /**
   * Shows a temporary toast message that disappears automatically.
   */
  showToast(message: string, type: 'success' | 'error' | 'info' | 'warning', duration: number = 3000): void {
    const id = this.uuidService.generateUuid();
    const toast: Toast = {
      id,
      message,
      type,
      timestamp: new Date().toISOString()
    };
    // Add to the beginning of the array so it appears on top
    this.toasts.update(t => [toast, ...t]);

    const timeoutId = setTimeout(() => {
      this.removeToast(id);
    }, duration);
    this.timeoutIds.set(id, timeoutId);
  }
  
  removeToast(id: string): void {
    this.toasts.update(t => t.filter(toast => toast.id !== id));
    clearTimeout(this.timeoutIds.get(id));
    this.timeoutIds.delete(id);
  }

  /**
   * Shows a temporary WhatsApp-style toast for new chat messages.
   */
  showChatToast(
    senderUsername: string,
    senderAvatar: string,
    message: string,
    conversationUserId: string,
    duration: number = 5000
  ): void {
    const id = this.uuidService.generateUuid();
    const chatToast: ChatToast = {
      id,
      senderUsername,
      senderAvatar,
      message,
      conversationUserId,
      timestamp: new Date().toISOString()
    };
    
    // Add to the beginning of the array so it appears on top
    this.chatToasts.update(t => [chatToast, ...t]);

    const timeoutId = setTimeout(() => {
      this.removeChatToast(id);
    }, duration);
    this.chatTimeoutIds.set(id, timeoutId);
  }

  removeChatToast(id: string): void {
    this.chatToasts.update(t => t.filter(toast => toast.id !== id));
    clearTimeout(this.chatTimeoutIds.get(id));
    this.chatTimeoutIds.delete(id);
  }

  // --- Persistent Notifications ---

  async loadNotifications(): Promise<void> {
    try {
      const dbNotifications = await this.supabaseService.fetchNotifications();
      this.notifications.set(dbNotifications);
    } catch(e) {
      console.error("Failed to load notifications", e);
      this.showToast("Could not load notifications from server.", 'error');
    }
  }

  clearNotifications(): void {
    this.notifications.set([]);
  }

  async addNotification(userId: string, message: string, type: 'info' | 'warning', taskId?: string): Promise<void> {
    try {
      const newNotificationData = { user_id: userId, message, type, task_id: taskId };
      const createdNotification = await this.supabaseService.addNotification(newNotificationData);
      this.notifications.update(n => [createdNotification, ...n]);
    } catch(e) {
      console.error("Failed to add notification", e);
      this.showToast("Failed to create a new notification.", 'error');
    }
  }

  async markAsRead(id: string): Promise<void> {
    try {
      await this.supabaseService.markNotificationAsRead(id);
      this.notifications.update(notifications => 
        notifications.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch(e) {
      console.error("Failed to mark notification as read", e);
      this.showToast("Failed to update notification.", 'error');
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      await this.supabaseService.markAllNotificationsAsRead();
      this.notifications.update(notifications => 
        notifications.map(n => ({ ...n, read: true }))
      );
    } catch(e) {
      console.error("Failed to mark all notifications as read", e);
      this.showToast("Failed to update notifications.", 'error');
    }
  }
}