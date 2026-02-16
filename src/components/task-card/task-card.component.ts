import { Component, input, inject, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Task, TaskStatus, TaskPriority } from '../../shared/interfaces';
import { TaskService } from '../../services/task.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink],
  templateUrl: './task-card.component.html',
  styleUrls: ['./task-card.component.css']
})
export class TaskCardComponent {
  task = input.required<Task>();
  taskService: TaskService = inject(TaskService);
  authService: AuthService = inject(AuthService);
  notificationService = inject(NotificationService);

  canChangeStatus = computed(() => {
    const currentTask = this.task();
    return currentTask ? this.taskService.canChangeStatus(currentTask) : false;
  });

  hasLiked = computed(() => {
    const userId = this.authService.currentUser()?.profile?.id;
    if (!userId) return false;
    return this.task().liked_by_users.includes(userId);
  });

  formatTicketId(id: number): string {
    if (id === null || id === undefined) return '----';
    return id.toString().padStart(4, '0');
  }

  getPriorityBorderClass(priority: TaskPriority): string {
    switch (priority) {
      case 'Urgent': return 'border-red-500';
      case 'High': return 'border-orange-500';
      case 'Medium': return 'border-yellow-500';
      case 'Low': return 'border-green-500';
      default: return 'border-gray-300';
    }
  }

  getPriorityClasses(priority: string): string {
    switch (priority) {
      case 'Urgent': return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      case 'High': return 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
      case 'Low': return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  }

  getStatusClasses(status: TaskStatus): string {
    switch (status) {
      case 'todo': return 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200';
      case 'in-progress': return 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200';
      case 'review': return 'bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-purple-200';
      case 'completed': return 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200';
      default: return 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200';
    }
  }

  getApprovalStatusClasses(status: string | null): string {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
      case 'Approved': return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'Rejected': return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }

  async markComplete(event: Event): Promise<void> {
    this.stopPropagation(event);
    if (this.canChangeStatus()) {
      this.taskService.updateTaskStatus(this.task().id, 'completed');
    } else {
      this.notificationService.showToast('You do not have permission to complete this task.', 'error');
    }
  }

  async toggleLikeTask(event: Event): Promise<void> {
    this.stopPropagation(event);
    this.taskService.toggleLikeTask(this.task().id);
  }
}
