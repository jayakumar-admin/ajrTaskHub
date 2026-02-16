
import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../services/task.service';
import { TaskCardComponent } from '../task-card/task-card.component';
import { Task, TaskStatus } from '../../shared/interfaces';
import { SkeletonLoaderComponent } from '../skeleton-loader/skeleton-loader.component';
import { PermissionService } from '../../services/permission.service';

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [CommonModule, TaskCardComponent, SkeletonLoaderComponent],
  template: `
    <div class="container mx-auto p-4 animate-fade-in">
      <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">Kanban Board</h2>

      @if (loading()) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          @for (col of [1,2,3,4]; track col) {
            <div class="bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md p-4">
              <app-skeleton-loader height="28px" width="40%" customClass="mb-4"/>
              <div class="space-y-4">
                <app-skeleton-loader height="120px" />
                <app-skeleton-loader height="120px" />
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- To Do Column -->
          <div class="bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
            <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 border-b pb-2 border-gray-200 dark:border-gray-700">
              To Do ({{ todoTasks().length }})
            </h3>
            <div class="space-y-4 min-h-[100px] p-2 rounded-lg transition-colors duration-300"
                 (dragover)="onDragOver($event)"
                 (dragenter)="onDragEnter($event)"
                 (dragleave)="onDragLeave($event)"
                 (drop)="onDrop($event, 'todo')">
              @for (task of todoTasks(); track task.id) {
                <div [draggable]="canChangeStatus()" (dragstart)="onDragStart($event, task.id)">
                  <app-task-card [task]="task" />
                </div>
              }
              @empty {
                <p class="text-gray-500 dark:text-gray-400 text-center py-4">Drop tasks here</p>
              }
            </div>
          </div>

          <!-- In Progress Column -->
          <div class="bg-blue-50 dark:bg-blue-900/40 rounded-lg shadow-md p-4 border border-blue-100 dark:border-blue-800">
            <h3 class="text-xl font-semibold text-blue-800 dark:text-blue-200 mb-4 border-b pb-2 border-blue-200 dark:border-blue-800">
              In Progress ({{ inProgressTasks().length }})
            </h3>
            <div class="space-y-4 min-h-[100px] p-2 rounded-lg transition-colors duration-300"
                 (dragover)="onDragOver($event)"
                 (dragenter)="onDragEnter($event)"
                 (dragleave)="onDragLeave($event)"
                 (drop)="onDrop($event, 'in-progress')">
              @for (task of inProgressTasks(); track task.id) {
                <div [draggable]="canChangeStatus()" (dragstart)="onDragStart($event, task.id)">
                  <app-task-card [task]="task" />
                </div>
              }
              @empty {
                <p class="text-gray-500 dark:text-gray-400 text-center py-4">Drop tasks here</p>
              }
            </div>
          </div>

          <!-- Review Column -->
          <div class="bg-purple-50 dark:bg-purple-900/40 rounded-lg shadow-md p-4 border border-purple-100 dark:border-purple-800">
            <h3 class="text-xl font-semibold text-purple-800 dark:text-purple-200 mb-4 border-b pb-2 border-purple-200 dark:border-purple-800">
              Review ({{ reviewTasks().length }})
            </h3>
            <div class="space-y-4 min-h-[100px] p-2 rounded-lg transition-colors duration-300"
                 (dragover)="onDragOver($event)"
                 (dragenter)="onDragEnter($event)"
                 (dragleave)="onDragLeave($event)"
                 (drop)="onDrop($event, 'review')">
              @for (task of reviewTasks(); track task.id) {
                <div [draggable]="canChangeStatus()" (dragstart)="onDragStart($event, task.id)">
                  <app-task-card [task]="task" />
                </div>
              }
              @empty {
                <p class="text-gray-500 dark:text-gray-400 text-center py-4">Drop tasks here</p>
              }
            </div>
          </div>

          <!-- Completed Column -->
          <div class="bg-green-50 dark:bg-green-900/40 rounded-lg shadow-md p-4 border border-green-100 dark:border-green-800">
            <h3 class="text-xl font-semibold text-green-800 dark:text-green-200 mb-4 border-b pb-2 border-green-200 dark:border-green-800">
              Completed ({{ completedTasks().length }})
            </h3>
            <div class="space-y-4 min-h-[100px] p-2 rounded-lg transition-colors duration-300"
                 (dragover)="onDragOver($event)"
                 (dragenter)="onDragEnter($event)"
                 (dragleave)="onDragLeave($event)"
                 (drop)="onDrop($event, 'completed')">
              @for (task of completedTasks(); track task.id) {
                <div [draggable]="canChangeStatus()" (dragstart)="onDragStart($event, task.id)">
                  <app-task-card [task]="task" />
                </div>
              }
              @empty {
                <p class="text-gray-500 dark:text-gray-400 text-center py-4">Drop tasks here</p>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .drag-over {
      @apply border-2 border-dashed border-primary-500 bg-primary-50 dark:bg-primary-900/50;
    }
  `]
})
export class KanbanBoardComponent {
  taskService = inject(TaskService);
  permissionService = inject(PermissionService);

  loading = this.taskService.loading;
  allTasks = this.taskService.tasks;
  canChangeStatus = this.permissionService.canChangeStatus;

  todoTasks = computed(() => this.allTasks().filter(task => task.status === 'todo'));
  inProgressTasks = computed(() => this.allTasks().filter(task => task.status === 'in-progress'));
  reviewTasks = computed(() => this.allTasks().filter(task => task.status === 'review'));
  completedTasks = computed(() => this.allTasks().filter(task => task.status === 'completed'));

  onDragStart(event: DragEvent, taskId: string): void {
    if (!this.canChangeStatus()) {
      event.preventDefault();
      return;
    }
    event.dataTransfer?.setData('text/plain', taskId);
  }

  onDragOver(event: DragEvent): void {
    if (this.canChangeStatus()) {
      event.preventDefault(); // Allow drop
    }
  }

  onDragEnter(event: DragEvent): void {
    if (this.canChangeStatus()) {
      event.preventDefault();
      (event.currentTarget as HTMLElement).classList.add('drag-over');
    }
  }

  onDragLeave(event: DragEvent): void {
    (event.currentTarget as HTMLElement).classList.remove('drag-over');
  }

  onDrop(event: DragEvent, newStatus: TaskStatus): void {
    event.preventDefault();
    (event.currentTarget as HTMLElement).classList.remove('drag-over');

    if (!this.canChangeStatus()) return;

    const taskId = event.dataTransfer?.getData('text/plain');

    if (taskId) {
      const task = this.allTasks().find(t => t.id === taskId);
      // Only update if the status is different to avoid unnecessary API calls
      if (task && task.status !== newStatus) {
        this.taskService.updateTaskStatus(taskId, newStatus);
      }
    }
  }
}
