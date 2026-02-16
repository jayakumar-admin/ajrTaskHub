import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { User, Task, Project, SystemConfig, RolePermissions, Comment, Attachment, HistoryEntry, UserSettings, Notification, Conversation, ChatMessage, ChatMessageReaction, CronJob } from '../shared/interfaces';

// In a real app, this would be an environment variable
// const API_URL = 'https://api-g7tx7czgqq-uc.a.run.app/api'; // Using relative URL for proxying
const API_URL = 'http://localhost:3000/api'; // Using relative URL for proxying


@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);

  // --- Auth ---
  login(credentials: {email: string, password: string}): Promise<{token: string, user: User}> {
    return firstValueFrom(this.http.post<{token: string, user: User}>(`${API_URL}/auth/login`, credentials));
  }

  register(userData: any): Promise<{user: User}> {
    return firstValueFrom(this.http.post<{user: User}>(`${API_URL}/auth/register`, userData));
  }

  getProfile(): Promise<User> {
    return firstValueFrom(this.http.get<User>(`${API_URL}/auth/me`));
  }

  // --- Tasks ---
  fetchTasks(): Promise<Task[]> {
    return firstValueFrom(this.http.get<Task[]>(`${API_URL}/tasks`));
  }

  addTask(taskData: Partial<Task>): Promise<Task> {
    return firstValueFrom(this.http.post<Task>(`${API_URL}/tasks`, taskData));
  }

  updateTask(taskId: string, taskData: Partial<Task>): Promise<Task> {
    return firstValueFrom(this.http.put<Task>(`${API_URL}/tasks/${taskId}`, taskData));
  }

  deleteTask(taskId: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${API_URL}/tasks/${taskId}`));
  }
  
  // --- Task Sub-resources ---
  fetchComments(taskId: string): Promise<Comment[]> {
    return firstValueFrom(this.http.get<Comment[]>(`${API_URL}/tasks/${taskId}/comments`));
  }

  fetchAllComments(): Promise<Comment[]> {
    return firstValueFrom(this.http.get<Comment[]>(`${API_URL}/comments/all`));
  }

  addComment(taskId: string, text: string): Promise<Comment> {
    return firstValueFrom(this.http.post<Comment>(`${API_URL}/tasks/${taskId}/comments`, { text }));
  }

  fetchAttachments(taskId: string): Promise<Attachment[]> {
    return firstValueFrom(this.http.get<Attachment[]>(`${API_URL}/tasks/${taskId}/attachments`));
  }

  addAttachment(taskId: string, file_url: string, fileName: string): Promise<Attachment> {
      return firstValueFrom(this.http.post<Attachment>(`${API_URL}/tasks/${taskId}/attachments`, { file_url, fileName }));
  }

  fetchHistory(taskId: string): Promise<HistoryEntry[]> {
    return firstValueFrom(this.http.get<HistoryEntry[]>(`${API_URL}/tasks/${taskId}/history`));
  }

  likeTask(taskId: string): Promise<void> {
    return firstValueFrom(this.http.post<void>(`${API_URL}/tasks/${taskId}/like`, {}));
  }

  unlikeTask(taskId: string): Promise<void> {
    return firstValueFrom(this.http.post<void>(`${API_URL}/tasks/${taskId}/unlike`, {}));
  }

  // --- Users ---
  fetchUsers(): Promise<User[]> {
    return firstValueFrom(this.http.get<User[]>(`${API_URL}/users`));
  }
  
  updateUserProfile(userId: string, updates: { username?: string; avatar_url?: string }): Promise<User> {
    return firstValueFrom(this.http.put<User>(`${API_URL}/users/${userId}/profile`, updates));
  }

  fetchUserSettings(): Promise<UserSettings | null> {
    return firstValueFrom(this.http.get<UserSettings | null>(`${API_URL}/users/settings`));
  }

  updateUserSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    return firstValueFrom(this.http.post<UserSettings>(`${API_URL}/users/settings`, settings));
  }

  // --- Projects ---
  fetchProjects(): Promise<Project[]> {
    return firstValueFrom(this.http.get<Project[]>(`${API_URL}/projects`));
  }

  addProject(projectData: Partial<Project>, memberIds: string[]): Promise<Project> {
      return firstValueFrom(this.http.post<Project>(`${API_URL}/projects`, { ...projectData, memberIds }));
  }

  updateProject(projectId: string, projectData: Partial<Project>, memberIds: string[]): Promise<Project> {
      return firstValueFrom(this.http.put<Project>(`${API_URL}/projects/${projectId}`, { ...projectData, memberIds }));
  }

  deleteProject(projectId: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${API_URL}/projects/${projectId}`));
  }

  // --- Admin / Config ---
  adminUpdateUserRole(userId: string, role: string): Promise<User> {
     return firstValueFrom(this.http.put<User>(`${API_URL}/admin/users/${userId}/role`, { role }));
  }

  adminDeleteUser(userId: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${API_URL}/admin/users/${userId}`));
  }

  getWhatsAppConfig(): Promise<SystemConfig> {
    return firstValueFrom(this.http.get<SystemConfig>(`${API_URL}/admin/whatsapp-config`));
  }

  saveWhatsAppConfig(config: SystemConfig): Promise<void> {
    return firstValueFrom(this.http.post<void>(`${API_URL}/admin/whatsapp-config`, config));
  }

  fetchRolePermissions(): Promise<RolePermissions[]> {
    return firstValueFrom(this.http.get<RolePermissions[]>(`${API_URL}/admin/permissions`));
  }

  updateRolePermissions(role: string, permissions: Partial<RolePermissions>): Promise<void> {
    return firstValueFrom(this.http.put<void>(`${API_URL}/admin/permissions/${role}`, permissions));
  }
  
  fetchCronJobs(): Promise<CronJob[]> {
    return firstValueFrom(this.http.get<CronJob[]>(`${API_URL}/admin/cron-jobs`));
  }

  updateCronJob(job: CronJob): Promise<CronJob> {
    return firstValueFrom(this.http.put<CronJob>(`${API_URL}/admin/cron-jobs/${job.id}`, job));
  }
  
  // --- Notifications ---
  fetchNotifications(): Promise<Notification[]> {
      return firstValueFrom(this.http.get<Notification[]>(`${API_URL}/notifications`));
  }

  addNotification(notificationData: Partial<Notification>): Promise<Notification> {
      return firstValueFrom(this.http.post<Notification>(`${API_URL}/notifications`, notificationData));
  }

  markNotificationAsRead(id: string): Promise<void> {
      return firstValueFrom(this.http.post<void>(`${API_URL}/notifications/${id}/read`, {}));
  }

  markAllNotificationsAsRead(): Promise<void> {
      return firstValueFrom(this.http.post<void>(`${API_URL}/notifications/read-all`, {}));
  }

  // --- Chat ---
  fetchConversations(): Promise<Conversation[]> {
    return firstValueFrom(this.http.get<Conversation[]>(`${API_URL}/chat/conversations`));
  }

  fetchMessages(otherUserId: string): Promise<ChatMessage[]> {
    return firstValueFrom(this.http.get<ChatMessage[]>(`${API_URL}/chat/messages/${otherUserId}`));
  }

  sendMessage(receiverId: string, messageText: string, attachmentUrl?: string, attachmentType?: string): Promise<ChatMessage> {
    return firstValueFrom(this.http.post<ChatMessage>(`${API_URL}/chat/messages`, { receiverId, messageText, attachmentUrl, attachmentType }));
  }
  
  // ... other chat methods
  
  // --- File Upload ---
  uploadFile(file: File, path: 'avatars' | 'projects' | 'general' = 'general'): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('image', file); // Use 'image' to match busboy field name
    formData.append('path', path);
    return firstValueFrom(this.http.post<{ url: string }>(`${API_URL}/upload`, formData));
  }

  deleteFile(url: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${API_URL}/upload`, { body: { url } }));
  }

  // --- WhatsApp ---
  sendWhatsAppMessage(phoneNumber: string, message: string): Promise<any> {
    return firstValueFrom(this.http.post<any>(`${API_URL}/whatsapp/send`, { phoneNumber, message }));
  }
}