import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, map } from 'rxjs';
import { User, Task, Project, SystemConfig, RolePermissions, Comment, Attachment, HistoryEntry, UserSettings, Notification, Conversation, ChatMessage, ChatMessageReaction, CronJob, WhatsAppLog } from '../shared/interfaces';

// In a real app, this would be an environment variable
const API_URL = 'https://api-g7tx7czgqq-uc.a.run.app/api'; // Using relative URL for proxying

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http: HttpClient = inject(HttpClient);

  // --- Mappers ---
  private mapTask(t: any): Task {
    return {
      id: t.id,
      ticket_id: t.ticket_id,
      title: t.title,
      description: t.description,
      type: t.type,
      priority: t.priority,
      duration: t.duration,
      start_date: t.start_date,
      due_date: t.due_date,
      status: t.status,
      assign_to: t.assign_to,
      assigned_to_username: t.assigned_to_username,
      assigned_by: t.assigned_by,
      assigned_by_username: t.assigned_by_username,
      approval_required: t.approval_required,
      approval_status: t.approval_status,
      updated_by: t.updated_by,
      updated_by_username: t.updated_by_username,
      created_at: t.created_at,
      like_count: (t.liked_by_users || []).length,
      tags: t.tags || [],
      tagged_users: t.tagged_users || [],
      subtasks: t.subtasks || [],
      reminder_option: t.reminder_option,
      repeat_option: t.repeat_option,
      liked_by_users: t.liked_by_users || [],
      project_id: t.project_id
    };
  }
  
  private mapComment(c: any): Comment {
    return {
        id: c.id,
        taskId: c.task_id,
        userId: c.user_id,
        username: c.username,
        text: c.text,
        createdAt: c.created_at
    };
  }

  private mapAttachment(a: any): Attachment {
    return {
        id: a.id,
        taskId: a.task_id,
        fileName: a.file_name,
        file_url: a.file_url,
        uploadedBy: a.uploaded_by,
        uploaded_by_username: a.uploaded_by_username,
        uploadedAt: a.uploaded_at
    };
  }
  
  private mapHistoryEntry(h: any): HistoryEntry {
    return {
        id: h.id,
        taskId: h.task_id,
        action: h.action,
        userId: h.user_id,
        username: h.username,
        timestamp: h.timestamp,
        details: h.details
    };
  }

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
    return firstValueFrom(this.http.get<any[]>(`${API_URL}/tasks`).pipe(
      map(tasks => tasks.map(t => this.mapTask(t)))
    ));
  }

  addTask(taskData: Partial<Task>): Promise<Task> {
    return firstValueFrom(this.http.post<any>(`${API_URL}/tasks`, taskData).pipe(
      map(t => this.mapTask(t))
    ));
  }

  updateTask(taskId: string, taskData: Partial<Task>): Promise<Task> {
    return firstValueFrom(this.http.put<any>(`${API_URL}/tasks/${taskId}`, taskData).pipe(
      map(t => this.mapTask(t))
    ));
  }

  deleteTask(taskId: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${API_URL}/tasks/${taskId}`));
  }
  
  // --- Task Sub-resources ---
  fetchComments(taskId: string): Promise<Comment[]> {
    return firstValueFrom(this.http.get<any[]>(`${API_URL}/tasks/${taskId}/comments`).pipe(
      map(comments => comments.map(c => this.mapComment(c)))
    ));
  }

  fetchAllComments(): Promise<Comment[]> {
    return firstValueFrom(this.http.get<any[]>(`${API_URL}/comments/all`).pipe(
      map(comments => comments.map(c => this.mapComment(c)))
    ));
  }

  addComment(taskId: string, text: string): Promise<Comment> {
    return firstValueFrom(this.http.post<any>(`${API_URL}/tasks/${taskId}/comments`, { text }).pipe(
      map(c => this.mapComment(c))
    ));
  }

  fetchAttachments(taskId: string): Promise<Attachment[]> {
    return firstValueFrom(this.http.get<any[]>(`${API_URL}/tasks/${taskId}/attachments`).pipe(
      map(attachments => attachments.map(a => this.mapAttachment(a)))
    ));
  }

  addAttachment(taskId: string, file_url: string, fileName: string): Promise<Attachment> {
      return firstValueFrom(this.http.post<any>(`${API_URL}/tasks/${taskId}/attachments`, { file_url, fileName }).pipe(
        map(a => this.mapAttachment(a))
      ));
  }

  fetchHistory(taskId: string): Promise<HistoryEntry[]> {
    return firstValueFrom(this.http.get<any[]>(`${API_URL}/tasks/${taskId}/history`).pipe(
      map(historyEntries => historyEntries.map(h => this.mapHistoryEntry(h)))
    ));
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
  
  fetchWhatsAppLogs(): Promise<WhatsAppLog[]> {
    return firstValueFrom(this.http.get<WhatsAppLog[]>(`${API_URL}/admin/whatsapp-logs`));
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