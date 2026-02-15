import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { SkeletonLoaderComponent } from '../skeleton-loader/skeleton-loader.component';
import { UserService } from '../../services/user.service';
import { User } from '../../shared/interfaces';
import { PermissionService } from '../../services/permission.service';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, RouterLink, SkeletonLoaderComponent],
  template: `
    <div class="container mx-auto p-4">
      <div class="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 class="text-3xl font-bold text-gray-900 dark:text-white">Projects</h2>
        @if(canCreateProjects()) {
          <a routerLink="/projects/new"
            class="w-full sm:w-auto px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Create Project
          </a>
        }
      </div>

      @if (loading()) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (_ of [1,2,3]; track _) {
            <app-skeleton-loader height="200px" customClass="rounded-lg"/>
          }
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (project of projects(); track project.id) {
            <a [routerLink]="['/projects', project.id]" class="block bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow p-6 group">
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400">{{ project.name }}</h3>
              <p class="text-gray-600 dark:text-gray-400 mt-2 h-16 overflow-hidden text-ellipsis">{{ project.description }}</p>
              <div class="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div class="flex items-center -space-x-2">
                  @for (member of getProjectMembers(project.member_ids); track member.id) {
                    <img [src]="getAvatar(member)" [title]="member.username" alt="member avatar" class="w-8 h-8 rounded-full object-cover ring-2 ring-white dark:ring-gray-800">
                  }
                </div>
                <span class="text-sm text-gray-500 dark:text-gray-400">Created by {{ project.created_by_username }}</span>
              </div>
            </a>
          }
          @empty {
            <div class="col-span-full text-center p-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">No projects</h3>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new project.</p>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class ProjectListComponent {
  projectService = inject(ProjectService);
  userService = inject(UserService);
  permissionService = inject(PermissionService);

  projects = this.projectService.projects;
  loading = this.projectService.loading;
  canCreateProjects = this.permissionService.canCreateProjects;
  
  getProjectMembers(memberIds: string[]): User[] {
    if (!memberIds) return [];
    return this.userService.users().filter(u => memberIds.includes(u.id));
  }
  
  getAvatar(user: User): string {
    return user.avatar_base64 || `https://picsum.photos/seed/${user.id}/40`;
  }
}
