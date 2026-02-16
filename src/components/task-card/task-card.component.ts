
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
  template: `
    <div [routerLink]="['/tasks', task().id]"
         class="relative group bg-white dark:bg-gray-700 rounded-lg shadow-md p-5 border-l-4 hover:shadow-xl transition-all duration-200 ease-in-out hover:scale-[1.03] cursor-pointer flex flex-col justify-between"
         [class]="getPriorityBorderClass(task().priority)">
      
      <span class="absolute top-3 right-3 text-xs font-mono text-gray-400 dark:text-gray-500 group-hover:text-primary-500 transition-colors">
        #AJR-{{ formatTicketId(task().ticket_id) }}
      </span>

      <!-- Tooltip -->
      <div class="absolute bottom-full left-0 mb-2 w-full max-w-sm p-3 bg-gray-900 dark:bg-black text-white text-sm rounded-lg shadow-lg z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <h4 class="font-bold text-base mb-1 border-b border-gray-700 pb-1">Full Details</h4>
        <p class="font-semibold mt-2">Assignee:</p>
        <p class="font-normal text-gray-300">{{ task().assigned_to_username }}</p>
        <p class="font-semibold mt-2">Description:</p>
        <p class="font-normal text-gray-300 whitespace-pre-wrap">{{ task().description }}</p>
        <div class="absolute -bottom-1 left-4 w-3 h-3 bg-gray-900 dark:bg-black rotate-45"></div> <!-- Arrow -->
      </div>

      <div>
        <div class="flex justify-between items-start mb-2">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white pr-20">{{ task().title }}</h3>
          <span class="flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium" [class]="getStatusClasses(task().status)">{{ task().status | uppercase }}</span>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 h-10">{{ task().description }}</p>

        <div class="space-y-1 text-sm text-gray-700 dark:text-gray-300">
          <p class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h.01M7 12h.01M7 15h.01M17 12h.01M17 15h.01M12 12h.01M12 15h.01M9 19H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2h-4a2 2 0 00-2 2z" />
            </svg>
            Due: {{ task().due_date | date:'shortDate' }}
          </p>
          <p class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5.121 17.804A13.937 13.0 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Assigned To: {{ task().assigned_to_username }}
          </p>
          <p class="flex items-center">
            <span class="font-medium">Priority:</span>
            <span class="ml-2 px-2 py-1 rounded-full text-xs font-medium" [class]="getPriorityClasses(task().priority)">{{ task().priority }}</span>
          </p>
        </div>
        @if (task().approval_required) {
          <div class="mt-2 flex items-center text-sm">
            <span class="font-medium text-gray-800 dark:text-gray-200">Approval:</span>
            <span class="ml-2 px-2 py-1 rounded-full text-xs font-medium" [class]="getApprovalStatusClasses(task().approval_status)">
              {{ task().approval_status }}
            </span>
          </div>
        }
      </div>

      <div class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-600 flex justify-between items-center">
        <div class="flex items-center space-x-2">
          <button (click)="toggleLikeTask($event)" class="hover:text-pink-700 flex items-center focus:outline-none focus:ring-2 focus:ring-pink-500 rounded-full p-1 -ml-1 transition-colors"
                  [class.text-pink-600]="hasLiked()"
                  [class.text-gray-400]="!hasLiked()"
                  [class.dark:text-pink-400]="hasLiked()"
                  [class.dark:text-gray-500]="!hasLiked()"
                  [class.dark:hover:text-pink-300]="hasLiked()"
                  [class.dark:hover:text-gray-400]="!hasLiked()">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
            </svg>
            <span class="text-sm font-medium">{{ task().like_count }}</span>
          </button>
        </div>

        @if (canChangeStatus() && task().status !== 'completed') {
          <button (click)="markComplete($event)"
                  class="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
            Complete
          </button>
        }
      </div>
    </div>
  `,
  styles: []
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