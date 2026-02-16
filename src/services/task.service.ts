
import { Injectable, computed, signal, effect, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Task, Comment, Attachment, HistoryEntry, Subtask, TaskStatus } from '../shared/interfaces';
import { NotificationService } from './notification.service';
import { AuthService } from './auth.service';
import { UuidService } from './uuid.service';
import { WhatsAppService } from './whatsapp.service';
import { UserService } from './user.service';
import { ProjectService } from './project.service';
import { StatusAnimationService } from './status-animation.service';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private _allTasks = signal<Task[]>([]);
  private _allComments = signal<Comment[]>([]);
  private _allAttachments = signal<Attachment[]>([]);
  private _allHistory = signal<HistoryEntry[]>([]);
  public loading = signal(true);

  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private notificationService = inject(NotificationService);
  private uuidService = inject(UuidService);
  private whatsappService = inject(WhatsAppService);
  private userService = inject(UserService);
  private projectService = inject(ProjectService);
  private statusAnimationService = inject(StatusAnimationService);

  public users = this.userService.users;

  public tasks = computed(() => {
    const allTasks = this._allTasks();
    const allComments = this._allComments();
    const currentUser = this.authService.currentUser()?.profile;
    const userProjects = this.projectService.projects();

    if (!currentUser) return [];
    if (['Admin', 'Manager', 'Viewer'].includes(currentUser.role)) return allTasks;

    const userCommentedTaskIds = new Set(allComments.filter(c => c.userId === currentUser.id).map(c => c.taskId));
    const userProjectIds = new Set(userProjects.map(p => p.id));

    return allTasks.filter(task =>
      task.assign_to === currentUser.id ||
      task.assigned_by === currentUser.id ||
      task.tagged_users?.includes(currentUser.id) ||
      (task.project_id && userProjectIds.has(task.project_id)) ||
      userCommentedTaskIds.has(task.id)
    );
  });

  constructor() {
    effect(() => {
      if (this.authService.currentUser()) {
        this.fetchInitialData();
      } else {
        this.resetState();
      }
    });
  }

  public resetState(): void {
    this._allTasks.set([]);
    this._allComments.set([]);
    this._allAttachments.set([]);
    this._allHistory.set([]);
  }

  public async fetchInitialData(): Promise<void> {
    this.loading.set(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const [tasks, comments] = await Promise.all([
        this.apiService.fetchTasks(),
        this.apiService.fetchAllComments()
      ]);
      this._allTasks.set(this.hydrateTasksWithUsernames(tasks));
      this._allComments.set(comments);
    } catch (error) {
      this.handleError(error, 'Failed to load initial data.');
    } finally {
      this.loading.set(false);
    }
  }

  public async refreshData(): Promise<void> {
    await this.fetchInitialData();
    this.notificationService.showToast('Data refreshed.', 'info');
  }

  private hydrateTasksWithUsernames(tasks: Task[]): Task[] {
      return tasks.map(task => this.hydrateTaskWithUsernames(task));
  }

  private hydrateTaskWithUsernames(task: Task): Task {
    const assignedToUser = this.userService.users().find(u => u.id === task.assign_to);
    const assignedByUser = this.userService.users().find(u => u.id === task.assigned_by);
    const updatedByUser = this.userService.users().find(u => u.id === task.updated_by);
    return {
      ...task,
      assigned_to_username: assignedToUser?.username,
      assigned_by_username: assignedByUser?.username,
      updated_by_username: updatedByUser?.username,
    };
  }

  public getTaskById(id: string) {
    return computed(() => {
      const task = this._allTasks().find(t => t.id === id);
      return task ? this.hydrateTaskWithUsernames(task) : undefined;
    });
  }
  
  public getCommentsForTask(taskId: string) {
    return computed(() => this._allComments().filter(c => c.taskId === taskId));
  }
  
  public getAttachmentsForTask(taskId: string) {
    return computed(() => this._allAttachments().filter(a => a.taskId == taskId));
  }

  public getHistoryForTask(taskId: string) {
    return computed(() => this._allHistory().filter(h => h.taskId === taskId).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
  }

  public async fetchCommentsForTask(taskId: string): Promise<void> {
    try {
      const comments = await this.apiService.fetchComments(taskId);
      this._allComments.update(current => [...current.filter(c => c.taskId !== taskId), ...comments]);
    } catch (error) { this.handleError(error, 'Failed to load comments.'); }
  }

  public async fetchAttachmentsForTask(taskId: string): Promise<void> {
    try {
      const attachments = await this.apiService.fetchAttachments(taskId);
      this._allAttachments.update(current => [...current.filter(a => a.taskId !== taskId), ...attachments]);
    } catch (error) { this.handleError(error, 'Failed to load attachments.'); }
  }

  public async fetchHistoryForTask(taskId: string): Promise<void> {
    try {
      const history = await this.apiService.fetchHistory(taskId);
      this._allHistory.update(current => [...current.filter(h => h.taskId !== taskId), ...history]);
    } catch (error) { this.handleError(error, 'Failed to load history.'); }
  }

  public async addTask(task: Omit<Task, 'id' | 'ticket_id' | 'created_at' | 'updated_by' | 'updated_by_username' | 'assigned_by_username' | 'assigned_to_username' | 'like_count' | 'liked_by_users'>): Promise<Task> {
    try {
      const addedTask = await this.apiService.addTask(task);
      const hydratedTask = this.hydrateTaskWithUsernames(addedTask);
      this._allTasks.update(tasks => [...tasks, hydratedTask]);
      this.notificationService.showToast(`Task "${addedTask.title}" created!`, 'success');
      return hydratedTask;
    } catch (error) {
      this.handleError(error, 'Failed to create task.');
      throw error;
    }
  }

  public async updateTask(updatedTask: Task): Promise<Task> {
    const originalTask = this._allTasks().find(t => t.id === updatedTask.id);
    try {
      const modifiedTask = await this.apiService.updateTask(updatedTask.id, updatedTask);
      const hydratedTask = this.hydrateTaskWithUsernames(modifiedTask);
      this._allTasks.update(tasks => tasks.map(t => t.id === modifiedTask.id ? hydratedTask : t));
      this.notificationService.showToast(`Task "${modifiedTask.title}" updated!`, 'success');

      if (originalTask && originalTask.status !== modifiedTask.status) {
        this.statusAnimationService.show(`Status changed to ${modifiedTask.status.replace('-', ' ')}`);
        this.checkAndSendWhatsAppNotification(modifiedTask);
      }
      return hydratedTask;
    } catch (error) {
      this.handleError(error, 'Failed to update task.');
      throw error;
    }
  }

  public async deleteTask(taskId: string): Promise<void> {
    try {
      await this.apiService.deleteTask(taskId);
      this._allTasks.update(tasks => tasks.filter(t => t.id !== taskId));
      this.notificationService.showToast('Task deleted successfully!', 'success');
    } catch (error) {
      this.handleError(error, 'Failed to delete task.');
      throw error;
    }
  }
  
  public async addComment(taskId: string, text: string): Promise<Comment> {
    try {
      const newComment = await this.apiService.addComment(taskId, text);
      this._allComments.update(comments => [...comments, newComment]);
      this.notificationService.showToast('Comment added!', 'success');
      return newComment;
    } catch (error) {
      this.handleError(error, 'Failed to add comment.');
      throw error;
    }
  }

  public async addAttachment(taskId: string, fileName: string, file_base64: string): Promise<Attachment> {
    try {
      // In the new architecture, we first upload the file, then link the URL.
      const { url } = await this.apiService.uploadFile(this.base64ToFile(file_base64, fileName));
      const newAttachment = await this.apiService.addAttachment(taskId, url, fileName);
      this._allAttachments.update(attachments => [...attachments, newAttachment]);
      this.notificationService.showToast('Attachment uploaded!', 'success');
      return newAttachment;
    } catch (error) {
      this.handleError(error, 'Failed to upload attachment.');
      throw error;
    }
  }

  public async updateTaskStatus(taskId: string, newStatus: TaskStatus): Promise<void> {
    const task = this.getTaskById(taskId)();
    if (task) await this.updateTask({ ...task, status: newStatus });
  }

  public async approveTask(taskId: string): Promise<void> {
    const task = this.getTaskById(taskId)();
    if (task) await this.updateTask({ ...task, approval_status: 'Approved' });
  }

  public async rejectTask(taskId: string): Promise<void> {
    const task = this.getTaskById(taskId)();
    if (task) await this.updateTask({ ...task, approval_status: 'Rejected' });
  }
  
  public async reassignTask(taskId: string, newAssigneeId: string): Promise<void> {
    const task = this.getTaskById(taskId)();
    if (task) await this.updateTask({ ...task, assign_to: newAssigneeId });
  }

  public async toggleSubtask(taskId: string, subtaskId: string): Promise<void> {
    const task = this.getTaskById(taskId)();
    if (task) {
      const updatedSubtasks: Subtask[] = task.subtasks.map(sub => 
        sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub
      );
      await this.updateTask({ ...task, subtasks: updatedSubtasks });
    }
  }

  public async toggleLikeTask(taskId: string): Promise<void> {
    const task = this._allTasks().find(t => t.id === taskId);
    if (!task) return;

    const hasLiked = task.liked_by_users.includes(this.authService.currentUser()!.profile.id);
    
    // Optimistic update
    this._allTasks.update(tasks => tasks.map(t => {
      if (t.id === taskId) {
        const userId = this.authService.currentUser()!.profile.id;
        const newLikedByUsers = hasLiked ? t.liked_by_users.filter(id => id !== userId) : [...t.liked_by_users, userId];
        return { ...t, liked_by_users: newLikedByUsers, like_count: newLikedByUsers.length };
      }
      return t;
    }));

    try {
      if (hasLiked) {
        await this.apiService.unlikeTask(taskId);
      } else {
        await this.apiService.likeTask(taskId);
      }
    } catch (error) {
      this.handleError(error, 'Failed to update like status.');
      this._allTasks.update(tasks => tasks.map(t => t.id === taskId ? task : t)); // Revert
    }
  }

  private async checkAndSendWhatsAppNotification(task: Task) {
    try {
      const assigneeSettings = await this.apiService.fetchUserSettings(); // Assuming this fetches for current user if target is not specified, or needs adjustment
      if (assigneeSettings && assigneeSettings.whatsapp_notifications_enabled && assigneeSettings.whatsapp_number) {
        await this.whatsappService.sendStatusUpdate(assigneeSettings.whatsapp_number, task.title, task.status);
      }
    } catch (err) { console.warn('Failed to send WhatsApp notification:', err); }
  }

  private handleError(error: any, defaultMessage: string) {
    console.error(`Error in TaskService:`, error);
    const message = error?.error?.error || defaultMessage;
    this.notificationService.showToast(message, 'error');
  }

  private base64ToFile(dataUrl: string, filename: string): File {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }

  public canEditTask(task: Task): boolean {
    const profile = this.authService.currentUser()?.profile;
    if (!profile) return false;
    return profile.role === 'Admin' || task.assigned_by === profile.id || task.assign_to === profile.id;
  }

  public canDeleteTask(task: Task): boolean {
    const profile = this.authService.currentUser()?.profile;
    if (!profile) return false;
    return profile.role === 'Admin' || task.assigned_by === profile.id;
  }

  public canApproveReject(task: Task): boolean {
    const profile = this.authService.currentUser()?.profile;
    if (!profile) return false;
    return task.approval_required && task.approval_status === 'Pending' && (profile.role === 'Admin' || profile.role === 'Manager');
  }

  public canChangeStatus(task: Task): boolean {
    const profile = this.authService.currentUser()?.profile;
    if (!profile) return false;
    return profile.role === 'Admin' || task.assign_to === profile.id || task.assigned_by === profile.id;
  }
}
