import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { combineLatest } from 'rxjs';
import { ProjectService } from '../../services/project.service';
import { TaskService } from '../../services/task.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { Task, User } from '../../shared/interfaces';
import { SkeletonLoaderComponent } from '../skeleton-loader/skeleton-loader.component';
import { TaskCardComponent } from '../task-card/task-card.component';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, FormsModule, SkeletonLoaderComponent, TaskCardComponent],
  template: `
    <div class="container mx-auto p-4">
      @if (loading()) {
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
          <app-skeleton-loader height="36px" width="60%" customClass="mb-2"/>
          <app-skeleton-loader height="20px" width="80%"/>
          <app-skeleton-loader height="150px" customClass="mt-6"/>
        </div>
      } @else if (project()) {
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
           @if(project()!.image_url) {
            <div class="h-48 md:h-64 bg-cover bg-center" [style.background-image]="'url(' + project()!.image_url + ')'"></div>
           }
          <div class="p-6">
            <div class="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
              <div>
                <h2 class="text-3xl font-bold text-gray-900 dark:text-white">{{ project()!.name }}</h2>
                <p class="text-gray-600 dark:text-gray-400 mt-2 max-w-2xl">{{ project()!.description }}</p>
                <div class="flex items-center -space-x-2 mt-4">
                  @for(member of getProjectMembers(project()!.member_ids); track member.id) {
                    <img [src]="getAvatar(member)" [title]="member.username" class="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-gray-800" alt="member avatar">
                  }
                </div>
              </div>
              @if(canManage()) {
                <div class="flex-shrink-0 flex items-center gap-2">
                  <a [routerLink]="['/projects', project()!.id, 'edit']" class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md flex items-center">Edit</a>
                  <button (click)="deleteProject(project()!.id)" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center">Delete</button>
                </div>
              }
            </div>

            <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h3 class="text-2xl font-semibold text-gray-900 dark:text-white">Tasks ({{ tasks().length }})</h3>
                <a [routerLink]="['/tasks/new']" [queryParams]="{ projectId: project()!.id }" class="inline-block px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md">Add Task</a>
              </div>

              <!-- Filters -->
              <div class="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg mb-6 border border-gray-200 dark:border-gray-700">
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <!-- Status Filter -->
                  <div>
                    <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
                    <select [(ngModel)]="filters().status" (ngModelChange)="updateFilters()" class="w-full text-sm rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-primary-500 focus:ring-primary-500">
                      <option value="">All Statuses</option>
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="done">Done</option>
                    </select>
                  </div>

                  <!-- Priority Filter -->
                  <div>
                    <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Priority</label>
                    <select [(ngModel)]="filters().priority" (ngModelChange)="updateFilters()" class="w-full text-sm rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-primary-500 focus:ring-primary-500">
                      <option value="">All Priorities</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>

                  <!-- Assignee Filter -->
                  <div>
                    <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Assigned To</label>
                    <select [(ngModel)]="filters().assign_to" (ngModelChange)="updateFilters()" class="w-full text-sm rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-primary-500 focus:ring-primary-500">
                      <option value="">All Users</option>
                      @for(user of projectUsers(); track user.id) {
                        <option [value]="user.id">{{ user.username }}</option>
                      }
                    </select>
                  </div>

                  <!-- Due Date Start -->
                  <div>
                    <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Due After</label>
                    <input type="date" [(ngModel)]="filters().due_date_start" (ngModelChange)="updateFilters()" class="w-full text-sm rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-primary-500 focus:ring-primary-500">
                  </div>

                  <!-- Due Date End -->
                  <div>
                    <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Due Before</label>
                    <input type="date" [(ngModel)]="filters().due_date_end" (ngModelChange)="updateFilters()" class="w-full text-sm rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-primary-500 focus:ring-primary-500">
                  </div>
                </div>
                
                <div class="mt-4 flex justify-end">
                    <button (click)="clearFilters()" class="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 underline">Clear Filters</button>
                </div>
              </div>

              @if (tasksLoading()) {
                 <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <app-skeleton-loader height="200px" />
                    <app-skeleton-loader height="200px" />
                    <app-skeleton-loader height="200px" />
                 </div>
              } @else {
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      @for (task of tasks(); track task.id) {
                          <app-task-card [task]="task" />
                      }
                      @empty {
                          <div class="col-span-full text-center p-12 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                              </svg>
                              <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">No tasks match your filters.</p>
                              <button (click)="clearFilters()" class="mt-2 text-sm font-medium text-primary-600 hover:text-primary-500">Clear filters</button>
                          </div>
                      }
                  </div>
              }
            </div>
          </div>
        </div>
      } @else {
         <div class="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
          <p class="text-xl text-gray-700 dark:text-gray-300">Project not found or you do not have access.</p>
          <button (click)="router.navigateByUrl('/projects')" class="mt-6 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-md">Back to Projects</button>
        </div>
      }
    </div>
  `
})
export class ProjectDetailComponent {
  route = inject(ActivatedRoute);
  router = inject(Router);
  projectService = inject(ProjectService);
  taskService = inject(TaskService);
  userService = inject(UserService);
  authService = inject(AuthService);
  apiService = inject(ApiService);

  projectId = signal<string | null>(null);
  
  tasks = signal<Task[]>([]);
  tasksLoading = signal(false);

  filters = signal({
    status: '',
    priority: '',
    assign_to: '',
    due_date_start: '',
    due_date_end: ''
  });

  project = computed(() => {
    const id = this.projectId();
    return id ? this.projectService.getProjectById(id)() : undefined;
  });

  loading = computed(() => this.projectService.loading());
  
  canManage = computed(() => {
      const proj = this.project();
      const currentUser = this.authService.currentUser()?.profile;
      if (!proj || !currentUser) return false;
      return currentUser.role === 'Admin' || proj.created_by === currentUser.id;
  });

  projectUsers = computed(() => {
     const proj = this.project();
     if (!proj) return [];
     return this.userService.users().filter(u => proj.member_ids.includes(u.id));
  });

  constructor() {
    combineLatest([this.route.paramMap, this.route.queryParams]).subscribe(([params, queryParams]) => {
        const id = params.get('id');
        this.projectId.set(id);
        
        const newFilters = {
            status: queryParams['status'] || '',
            priority: queryParams['priority'] || '',
            assign_to: queryParams['assign_to'] || '',
            due_date_start: queryParams['due_date_start'] || '',
            due_date_end: queryParams['due_date_end'] || ''
        };
        this.filters.set(newFilters);
        
        if (id) {
            this.loadProjectTasks(id);
        }
    });
  }

  updateFilters() {
      this.router.navigate([], {
          relativeTo: this.route,
          queryParams: this.filters(),
          queryParamsHandling: 'merge',
      });
  }

  clearFilters() {
      this.filters.set({
        status: '',
        priority: '',
        assign_to: '',
        due_date_start: '',
        due_date_end: ''
      });
      this.updateFilters();
  }

  async loadProjectTasks(projectId: string) {
    this.tasksLoading.set(true);
    try {
      const currentFilters = this.filters();
      const tasks = await this.apiService.fetchTasks({ ...currentFilters, project_id: projectId });
      this.tasks.set(tasks);
    } catch (err) {
        console.error('Failed to load tasks', err);
    } finally {
      this.tasksLoading.set(false);
    }
  }
  
  getProjectMembers(memberIds: string[]): User[] {
    if (!memberIds) return [];
    return this.userService.users().filter(u => memberIds.includes(u.id));
  }

  getAvatar(user: User): string {
    return user.avatar_base64 || `https://picsum.photos/seed/${user.id}/40`;
  }
  
  deleteProject(id: string): void {
      if (confirm('Are you sure you want to delete this project? This will not delete its tasks but will unlink them.')) {
        this.projectService.deleteProject(id).catch(err => {
          console.error('Project deletion failed (handled in component):', err);
        });
      }
  }
}