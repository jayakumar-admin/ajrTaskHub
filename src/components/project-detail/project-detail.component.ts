import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { TaskService } from '../../services/task.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { Task, User } from '../../shared/interfaces';
import { SkeletonLoaderComponent } from '../skeleton-loader/skeleton-loader.component';
import { TaskCardComponent } from '../task-card/task-card.component';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, SkeletonLoaderComponent, TaskCardComponent],
  template: `
    <div class="container mx-auto p-4">
      @if (loading()) {
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
          <app-skeleton-loader height="36px" width="60%" customClass="mb-2"/>
          <app-skeleton-loader height="20px" width="80%"/>
          <app-skeleton-loader height="150px" customClass="mt-6"/>
        </div>
      } @else if (project()) {
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
          <div class="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
            <div>
              <h2 class="text-3xl font-bold text-gray-900 dark:text-white">{{ project()!.name }}</h2>
              <p class="text-gray-600 dark:text-gray-400 mt-2">{{ project()!.description }}</p>
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
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-2xl font-semibold text-gray-900 dark:text-white">Tasks in this Project ({{ projectTasks().length }})</h3>
              <a [routerLink]="['/tasks/new']" [queryParams]="{ projectId: project()!.id }" class="inline-block px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md">Add Task to Project</a>
            </div>
             <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                @for (task of projectTasks(); track task.id) {
                    <app-task-card [task]="task" />
                }
                @empty {
                    <div class="col-span-full text-center p-12 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <p class="text-lg text-gray-700 dark:text-gray-300">No tasks have been added to this project yet.</p>
                        <a [routerLink]="['/tasks/new']" [queryParams]="{ projectId: project()!.id }" class="mt-4 inline-block px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md">Add a Task</a>
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

  projectId = signal<string | null>(null);

  project = computed(() => {
    const id = this.projectId();
    return id ? this.projectService.getProjectById(id)() : undefined;
  });

  loading = computed(() => this.projectService.loading() || this.taskService.loading());
  
  canManage = computed(() => {
      const proj = this.project();
      const currentUser = this.authService.currentUser()?.profile;
      if (!proj || !currentUser) return false;
      // Admins and project creators can manage the project
      return currentUser.role === 'Admin' || proj.created_by === currentUser.id;
  });

  projectTasks = computed(() => {
    const id = this.projectId();
    if (!id) return [];
    return this.taskService.tasks().filter(task => task.project_id === id);
  });

  constructor() {
    this.route.paramMap.subscribe(params => {
      this.projectId.set(params.get('id'));
    });
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
          // The service already shows a toast, so we can just log for debugging if needed.
          console.error('Project deletion failed (handled in component):', err);
        });
      }
  }
}