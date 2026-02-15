

import { Injectable, computed, signal, effect, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Task, Comment, Attachment, HistoryEntry, Subtask, ApprovalStatus, TaskStatus, User, AuthenticatedUser } from '../shared/interfaces';
import { NotificationService } from './notification.service';
import { AuthService } from './auth.service';
import { UuidService } from './uuid.service';
import { WhatsAppService } from './whatsapp.service';
import { UserService } from './user.service';
import { ProjectService } from './project.service';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  // Internal signals to hold application state
  private _allTasks = signal<Task[]>([]);
  private _allComments = signal<Comment[]>([]);
  private _allAttachments = signal<Attachment[]>([]);
  private _allHistory = signal<HistoryEntry[]>([]);

  // Loading signal for skeleton loaders
  public loading = signal(true);

  // Public computed signals for components to consume
  public tasks = computed(() => {
    const allTasks = this._allTasks();
    const allComments = this._allComments();
    const currentUser = this.authService.currentUser()?.profile;
    const userProjects = this.projectService.projects(); // Projects visible to the user

    if (!currentUser) {
      return [];
    }

    // Admins, Managers, and Viewers see all tasks
    if (['Admin', 'Manager', 'Viewer'].includes(currentUser.role)) {
      return allTasks;
    }

    // 'User' role sees only relevant tasks
    const userCommentedTaskIds = new Set(
      allComments
        .filter(comment => comment.userId === currentUser.id)
        .map(comment => comment.taskId)
    );
    
    const userProjectIds = new Set(userProjects.map(p => p.id));

    return allTasks.filter(task =>
      task.assign_to === currentUser.id ||
      task.assigned_by === currentUser.id ||
      (task.tagged_users && task.tagged_users.includes(currentUser.id)) ||
      (task.project_id && userProjectIds.has(task.project_id)) || // New: Check for project membership
      userCommentedTaskIds.has(task.id)
    );
  });
  
  private authService = inject(AuthService);
  private supabaseService = inject(SupabaseService);
  private notificationService = inject(NotificationService);
  private uuidService = inject(UuidService);
  private whatsappService = inject(WhatsAppService);
  private userService = inject(UserService);
  private projectService = inject(ProjectService);

  public users = this.userService.users;
  private taskChannel: any = null; // For Supabase real-time subscription

  constructor() {
    // Reactive data fetching: fetch data and set up subscriptions ONLY when a user is logged in
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.fetchInitialData();
        this.subscribeToTaskChanges();
      } else {
        this.resetState(); // Clear data and unsubscribe if user logs out
      }
    }, { allowSignalWrites: true });

    // Reminder effect
    effect(() => {
      const tasks = this.tasks();
      const currentUser = this.authService.currentUser();
      if (!currentUser || !currentUser.profile) return; // Check for profile existence

      tasks.forEach(task => {
        if (task.assign_to === currentUser.profile.id && task.status !== 'completed' && task.reminder_option === '1 Day Before') {
          const dueDate = new Date(task.due_date);
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(0,0,0,0); // Normalize for comparison
          dueDate.setHours(0,0,0,0); // Normalize for comparison

          if (dueDate.toDateString() === tomorrow.toDateString()) {
            if (!localStorage.getItem(`notified-${task.id}-duedate-${tomorrow.toDateString()}-${currentUser!.profile!.id}`)) {
              this.notificationService.showToast(`Task "${task.title}" is due tomorrow!`, 'warning');
              localStorage.setItem(`notified-${task.id}-duedate-${tomorrow.toDateString()}-${currentUser!.profile!.id}`, 'true');
            }
          }
        }
      });
    }, { allowSignalWrites: true });
  }

  /**
   * Resets all internal data signals and unsubscribes from real-time channels.
   */
  public resetState(): void {
    this._allTasks.set([]);
    this._allComments.set([]);
    this._allAttachments.set([]);
    this._allHistory.set([]);
    this.unsubscribeFromTaskChanges();
  }

  /**
   * Fetches initial task data from Supabase and updates signals. User data is handled by UserService.
   */
  public async fetchInitialData(): Promise<void> {
    this.loading.set(true);
    try {
      // Simulate network delay for skeleton loader visibility
      await new Promise(resolve => setTimeout(resolve, 500));
      const [tasks, comments] = await Promise.all([
        this.supabaseService.fetchTasks(),
        this.supabaseService.fetchAllComments()
      ]);
      this._allTasks.set(tasks);
      this._allComments.set(comments);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      this.notificationService.showToast('Failed to load initial data.', 'error');
    } finally {
      this.loading.set(false);
    }
  }
  
  /**
   * Subscribes to new task creations in real-time.
   */
  private subscribeToTaskChanges(): void {
    // Ensure we don't have duplicate subscriptions
    this.unsubscribeFromTaskChanges();

    const currentUser = this.authService.currentUser();
    if (!currentUser?.profile) return;

    this.taskChannel = this.supabaseService.supabase
      .channel('public:tasks')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tasks' },
        (payload) => {
          const newTask = payload.new as Task;

          // Add the new task to the local state so the UI updates in real-time
          this._allTasks.update(tasks => {
            // Prevent duplicates if the task somehow already exists
            if (tasks.some(t => t.id === newTask.id)) {
              return tasks;
            }
            return [...tasks, this.hydrateTaskWithUsernames(newTask)];
          });
          
          // Check if the task is assigned to the current user by someone else
          if (newTask.assign_to === currentUser.profile.id && newTask.assigned_by !== currentUser.profile.id) {
            const assigner = this.users().find(u => u.id === newTask.assigned_by);
            const assignerName = assigner ? assigner.username : 'Someone';
            
            // Create a persistent notification
            this.notificationService.addNotification(
              currentUser.profile.id,
              `${assignerName} assigned you a new task: "${newTask.title}"`,
              'info',
              newTask.id
            );
          }
        }
      )
      .subscribe();
  }

  /**
   * Unsubscribes from the real-time task channel.
   */
  private unsubscribeFromTaskChanges(): void {
    if (this.taskChannel) {
      this.supabaseService.supabase.removeChannel(this.taskChannel);
      this.taskChannel = null;
    }
  }

  /**
   * Public method to explicitly refresh all data.
   */
  public async refreshData(): Promise<void> {
    await this.fetchInitialData();
    this.notificationService.showToast('Data refreshed.', 'info');
  }

  /**
   * Hydrates a task object with username fields from the internal users list.
   * @param task The task object to hydrate.
   * @returns The hydrated task object.
   */
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

  /**
   * Returns a computed signal for a specific task by its ID.
   * @param id The ID of the task.
   * @returns A computed signal for the task or undefined if not found.
   */
  public getTaskById(id: string) {
    return computed(() => {
      const task = this._allTasks().find(t => t.id === id);
      return task ? this.hydrateTaskWithUsernames(task) : undefined;
    });
  }

  /**
   * Returns a computed signal for comments related to a specific task.
   * @param taskId The ID of the task.
   * @returns A computed signal for an array of comments.
   */
  public getCommentsForTask(taskId: string) {
    return computed(() => this._allComments().filter(c => c.taskId === taskId));
  }

  /**
   * Returns a computed signal for attachments related to a specific task.
   * @param taskId The ID of the task.
   * @returns A computed signal for an array of attachments.
   */
  public getAttachmentsForTask(taskId: string) {
    return computed(() => this._allAttachments().filter(a => a.taskId === taskId));
  }

  /**
   * Returns a computed signal for history entries related to a specific task, sorted by timestamp.
   * @param taskId The ID of the task.
   * @returns A computed signal for an array of history entries.
   */
  public getHistoryForTask(taskId: string) {
    return computed(() => this._allHistory().filter(h => h.taskId === taskId).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
  }

  /**
   * Fetches comments for a specific task from Supabase and updates the internal signal.
   * @param taskId The ID of the task.
   */
  public async fetchCommentsForTask(taskId: string): Promise<void> {
    try {
      const comments = await this.supabaseService.fetchComments(taskId);
      this._allComments.update(currentComments => {
        const filtered = currentComments.filter(c => c.taskId !== taskId);
        return [...filtered, ...comments];
      });
    } catch (error) {
      console.error('Error loading comments:', error);
      this.notificationService.showToast('Failed to load comments.', 'error');
    }
  }

  /**
   * Fetches attachments for a specific task from Supabase and updates the internal signal.
   * @param taskId The ID of the task.
   */
  public async fetchAttachmentsForTask(taskId: string): Promise<void> {
    try {
      const attachments = await this.supabaseService.fetchAttachments(taskId);
      this._allAttachments.update(currentAttachments => {
        const filtered = currentAttachments.filter(a => a.taskId !== taskId);
        return [...filtered, ...attachments];
      });
    } catch (error) {
      console.error('Error loading attachments:', error);
      this.notificationService.showToast('Failed to load attachments.', 'error');
    }
  }

  /**
   * Fetches history entries for a specific task from Supabase and updates the internal signal.
   * @param taskId The ID of the task.
   */
  public async fetchHistoryForTask(taskId: string): Promise<void> {
    try {
      const history = await this.supabaseService.fetchHistory(taskId);
      this._allHistory.update(currentHistory => {
        const filtered = currentHistory.filter(h => h.taskId !== taskId);
        return [...filtered, ...history];
      });
    } catch (error) {
      console.error('Error loading history:', error);
      this.notificationService.showToast('Failed to load history.', 'error');
    }
  }

  /**
   * Adds a new task to Supabase and updates the internal tasks signal.
   * @param task The task data to add.
   * @returns The newly added task with full details.
   */
  public async addTask(task: Omit<Task, 'id' | 'created_at' | 'updated_by' | 'updated_by_username' | 'assigned_by_username' | 'assigned_to_username' | 'like_count' | 'liked_by_users'>): Promise<Task> {
    const currentUser = this.authService.currentUser();
    if (!currentUser || !currentUser.profile) throw new Error('User not logged in');

    const newTaskData = {
      ...task,
      assigned_by: currentUser.profile.id,
      updated_by: currentUser.profile.id,
      subtasks: task.subtasks.map(sub => ({ ...sub, id: sub.id || this.uuidService.generateUuid() }))
    };

    try {
      const addedTask = await this.supabaseService.addTask(newTaskData);
      this._allTasks.update(tasks => [...tasks, this.hydrateTaskWithUsernames(addedTask)]); // Optimistic update
      await this.supabaseService.addHistoryEntry(addedTask.id, 'Created', currentUser.profile.id, currentUser.profile.username);
      this.notificationService.showToast(`Task "${addedTask.title}" created successfully!`, 'success');

      return this.hydrateTaskWithUsernames(addedTask);
    } catch (error) {
      console.error('Error in TaskService.addTask:', error);
      this.notificationService.showToast('Failed to create task.', 'error');
      throw error;
    }
  }

  /**
   * Updates an existing task in Supabase and the internal tasks signal.
   * @param updatedTask The full task object with updated data.
   * @returns The updated task.
   */
  public async updateTask(updatedTask: Task): Promise<Task> {
    const currentUser = this.authService.currentUser();
    if (!currentUser || !currentUser.profile) throw new Error('User not logged in');

    const originalTask = this._allTasks().find(t => t.id === updatedTask.id);
    if (!originalTask) {
      this.notificationService.showToast('Error: Task not found!', 'error');
      throw new Error('Task not found');
    }

    const taskToUpdateInDB = {
      ...updatedTask,
      updated_by: currentUser.profile.id,
    };

    try {
      const modifiedTask = await this.supabaseService.updateTask(taskToUpdateInDB);
      this._allTasks.update(tasks => tasks.map(t => t.id === modifiedTask.id ? this.hydrateTaskWithUsernames(modifiedTask) : t));
      this.notificationService.showToast(`Task "${modifiedTask.title}" updated!`, 'success');

      if (originalTask.status !== modifiedTask.status) {
        await this.supabaseService.addHistoryEntry(modifiedTask.id, `Status changed from ${originalTask.status} to ${modifiedTask.status}`, currentUser.profile.id, currentUser.profile.username);
        this.checkAndSendWhatsAppNotification(modifiedTask);
      }
      
      await this.fetchCommentsForTask(modifiedTask.id);
      await this.fetchAttachmentsForTask(modifiedTask.id);
      await this.fetchHistoryForTask(modifiedTask.id);

      return this.hydrateTaskWithUsernames(modifiedTask);
    } catch (error) {
      console.error('Error in TaskService.updateTask:', error);
      this.notificationService.showToast('Failed to update task.', 'error');
      throw error;
    }
  }

  private async checkAndSendWhatsAppNotification(task: Task) {
    try {
      const assigneeSettings = await this.supabaseService.fetchUserSettings(task.assign_to);
      if (assigneeSettings && assigneeSettings.whatsapp_notifications_enabled && assigneeSettings.whatsapp_number) {
        await this.whatsappService.sendStatusUpdate(assigneeSettings.whatsapp_number, task.title, task.status);
      }
    } catch (err) {
      console.warn('Failed to send WhatsApp notification:', err);
    }
  }

  /**
   * Deletes a task from Supabase and removes it from internal signals.
   * Also deletes associated comments, attachments, and history.
   * @param taskId The ID of the task to delete.
   */
  public async deleteTask(taskId: string): Promise<void> {
    try {
      await this.supabaseService.deleteTask(taskId);
      this._allTasks.update(tasks => tasks.filter(t => t.id !== taskId));
      this._allComments.update(comments => comments.filter(c => c.taskId !== taskId));
      this._allAttachments.update(attachments => attachments.filter(a => a.taskId !== taskId));
      this._allHistory.update(history => history.filter(h => h.taskId !== taskId));
      this.notificationService.showToast('Task deleted successfully!', 'success');
    } catch (error) {
      console.error('Error in TaskService.deleteTask:', error);
      this.notificationService.showToast('Failed to delete task.', 'error');
      throw error;
    }
  }

  /**
   * Adds a comment to a task in Supabase and updates the internal comments signal.
   * @param taskId The ID of the task to add the comment to.
   * @param text The comment text.
   * @returns The newly added comment.
   */
  public async addComment(taskId: string, text: string): Promise<Comment> {
    const currentUser = this.authService.currentUser();
    if (!currentUser || !currentUser.profile) throw new Error('User not logged in');

    try {
      const newComment = await this.supabaseService.addComment(taskId, currentUser.profile.id, currentUser.profile.username, text);
      this._allComments.update(comments => [...comments, newComment]);
      await this.supabaseService.addHistoryEntry(taskId, 'Comment added', currentUser.profile.id, currentUser.profile.username, `"${text.substring(0, 50)}..."`);
      this.notificationService.showToast('Comment added!', 'success');
      return newComment;
    } catch (error) {
      console.error('Error in TaskService.addComment:', error);
      this.notificationService.showToast('Failed to add comment.', 'error');
      throw error;
    }
  }

  /**
   * Adds an attachment to a task.
   * @param taskId The ID of the task.
   * @param fileName The name of the file.
   * @param fileBase64 The base64-encoded content of the file.
   * @returns The newly added attachment.
   */
  public async addAttachment(taskId: string, fileName: string, fileBase64: string): Promise<Attachment> {
    const currentUser = this.authService.currentUser();
    if (!currentUser || !currentUser.profile) throw new Error('User not logged in');

    try {
      const newAttachment = await this.supabaseService.addAttachment(taskId, fileName, fileBase64, currentUser.profile.id);
      this._allAttachments.update(attachments => [...attachments, newAttachment]);
      await this.supabaseService.addHistoryEntry(taskId, 'Attachment added', currentUser.profile.id, currentUser.profile.username, fileName);
      this.notificationService.showToast('Attachment uploaded!', 'success');
      return newAttachment;
    } catch (error) {
      console.error('Error in TaskService.addAttachment:', error);
      this.notificationService.showToast('Failed to upload attachment.', 'error');
      throw error;
    }
  }

  /**
   * Updates the status of a specific task.
   * @param taskId The ID of the task to update.
   * @param newStatus The new status.
   */
  public async updateTaskStatus(taskId: string, newStatus: TaskStatus): Promise<void> {
    const task = this.getTaskById(taskId)();
    if (task) {
      await this.updateTask({ ...task, status: newStatus });
    }
  }

  /**
   * Approves a task if it's pending and approval is required.
   * @param taskId The ID of the task to approve.
   */
  public async approveTask(taskId: string): Promise<void> {
    const task = this.getTaskById(taskId)();
    if (task && task.approval_required && task.approval_status === 'Pending') {
      await this.updateTask({ ...task, approval_status: 'Approved' });
    }
  }

  /**
   * Rejects a task if it's pending and approval is required.
   * @param taskId The ID of the task to reject.
   */
  public async rejectTask(taskId: string): Promise<void> {
    const task = this.getTaskById(taskId)();
    if (task && task.approval_required && task.approval_status === 'Pending') {
      await this.updateTask({ ...task, approval_status: 'Rejected' });
    }
  }

  /**
   * Reassigns a task to a new user.
   * @param taskId The ID of the task to reassign.
   * @param newAssigneeId The ID of the new assignee.
   */
  public async reassignTask(taskId: string, newAssigneeId: string): Promise<void> {
    const task = this.getTaskById(taskId)();
    if (task) {
      await this.updateTask({ ...task, assign_to: newAssigneeId });
    }
  }

  /**
   * Toggles the completion status of a subtask within a task.
   * @param taskId The ID of the parent task.
   * @param subtaskId The ID of the subtask to toggle.
   */
  public async toggleSubtask(taskId: string, subtaskId: string): Promise<void> {
    const task = this.getTaskById(taskId)();
    if (task) {
      const updatedSubtasks: Subtask[] = task.subtasks.map(sub =>
        sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub
      );
      await this.updateTask({ ...task, subtasks: updatedSubtasks });
    }
  }

  /**
   * Toggles the like status of a task for the current user.
   * @param taskId The ID of the task to like/unlike.
   */
  public async toggleLikeTask(taskId: string): Promise<void> {
    const currentUser = this.authService.currentUser()?.profile;
    if (!currentUser) {
        this.notificationService.showToast('You must be logged in to like a task.', 'error');
        return;
    }
    const task = this._allTasks().find(t => t.id === taskId);
    if (!task) return;

    const userId = currentUser.id;
    const hasLiked = task.liked_by_users.includes(userId);

    // Optimistic UI update
    this._allTasks.update(tasks => tasks.map(t => {
        if (t.id === taskId) {
            const newLikedByUsers = hasLiked
                ? t.liked_by_users.filter(id => id !== userId)
                : [...t.liked_by_users, userId];
            return {
                ...t,
                liked_by_users: newLikedByUsers,
                like_count: newLikedByUsers.length,
            };
        }
        return t;
    }));

    try {
        if (hasLiked) {
            await this.supabaseService.unlikeTask(taskId, userId);
        } else {
            await this.supabaseService.likeTask(taskId, userId);
        }
    } catch (error) {
        // Revert optimistic update on failure
        this.notificationService.showToast('Failed to update like status.', 'error');
        this._allTasks.update(tasks => tasks.map(t => t.id === taskId ? task : t));
    }
  }

  /**
   * Checks if the current user can edit a given task.
   * @param task The task to check permissions for.
   * @returns True if the user can edit, false otherwise.
   */
  public canEditTask(task: Task): boolean {
    const currentUser = this.authService.currentUser();
    if (!currentUser || !currentUser.profile) return false;
    return currentUser.profile.role === 'Admin' || task.assigned_by === currentUser.profile.id || task.assign_to === currentUser.profile.id;
  }

  /**
   * Checks if the current user can delete a given task.
   * @param task The task to check permissions for.
   * @returns True if the user can delete, false otherwise.
   */
  public canDeleteTask(task: Task): boolean {
    const currentUser = this.authService.currentUser();
    if (!currentUser || !currentUser.profile) return false;
    return currentUser.profile.role === 'Admin' || task.assigned_by === currentUser.profile.id;
  }

  /**
   * Checks if the current user can approve/reject a given task.
   * @param task The task to check permissions for.
   * @returns True if the user can approve/reject, false otherwise.
   */
  public canApproveReject(task: Task): boolean {
    const currentUser = this.authService.currentUser();
    if (!currentUser || !currentUser.profile) return false;
    return task.approval_required && task.approval_status === 'Pending' && (currentUser.profile.role === 'Admin' || currentUser.profile.role === 'Manager');
  }

  /**
   * Checks if the current user can change the status of a given task.
   * @param task The task to check permissions for.
   * @returns True if the user can change status, false otherwise.
   */
  public canChangeStatus(task: Task): boolean {
    const currentUser = this.authService.currentUser();
    if (!currentUser || !currentUser.profile) return false;
    return currentUser.profile.role === 'Admin' || task.assign_to === currentUser.profile.id || task.assigned_by === currentUser.profile.id;
  }
}