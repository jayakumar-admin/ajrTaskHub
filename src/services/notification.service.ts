import { Injectable, signal, computed, inject } from '@angular/core';
import { ChatToast, Notification } from '../shared/interfaces';
import { UuidService } from './uuid.service';
import { ApiService } from './api.service';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  toasts = signal<Toast[]>([]);
  private timeoutIds: Map<string, any> = new Map();
  
  chatToasts = signal<ChatToast[]>([]);
  private chatTimeoutIds: Map<string, any> = new Map();

  notifications = signal<Notification[]>([]);

  private uuidService = inject(UuidService);
  private apiService = inject(ApiService);

  unreadCount = computed(() => this.notifications().filter(n => !n.read).length);

  showToast(message: string, type: 'success' | 'error' | 'info' | 'warning', duration: number = 3000): void {
    const id = this.uuidService.generateUuid();
    const toast: Toast = { id, message, type, timestamp: new Date().toISOString() };
    this.toasts.update(t => [toast, ...t]);

    const timeoutId = setTimeout(() => this.removeToast(id), duration);
    this.timeoutIds.set(id, timeoutId);
  }
  
  removeToast(id: string): void {
    this.toasts.update(t => t.filter(toast => toast.id !== id));
    clearTimeout(this.timeoutIds.get(id));
    this.timeoutIds.delete(id);
  }

  showChatToast(senderUsername: string, senderAvatar: string, message: string, conversationUserId: string, duration: number = 5000): void {
    const id = this.uuidService.generateUuid();
    const chatToast: ChatToast = { id, senderUsername, senderAvatar, message, conversationUserId, timestamp: new Date().toISOString() };
    this.chatToasts.update(t => [chatToast, ...t]);

    const timeoutId = setTimeout(() => this.removeChatToast(id), duration);
    this.chatTimeoutIds.set(id, timeoutId);
  }

  removeChatToast(id: string): void {
    this.chatToasts.update(t => t.filter(toast => toast.id !== id));
    clearTimeout(this.chatTimeoutIds.get(id));
    this.chatTimeoutIds.delete(id);
  }

  async loadNotifications(): Promise<void> {
    try {
      const dbNotifications = await this.apiService.fetchNotifications();
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
      const createdNotification = await this.apiService.addNotification(newNotificationData);
      this.notifications.update(n => [createdNotification, ...n]);
    } catch(e) {
      console.error("Failed to add notification", e);
      this.showToast("Failed to create a new notification.", 'error');
    }
  }

  async markAsRead(id: string): Promise<void> {
    try {
      await this.apiService.markNotificationAsRead(id);
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
      await this.apiService.markAllNotificationsAsRead();
      this.notifications.update(notifications => 
        notifications.map(n => ({ ...n, read: true }))
      );
    } catch(e) {
      console.error("Failed to mark all notifications as read", e);
      this.showToast("Failed to update notifications.", 'error');
    }
  }
}
