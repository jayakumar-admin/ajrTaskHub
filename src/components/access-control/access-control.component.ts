import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PermissionService } from '../../services/permission.service';
import { RolePermissions } from '../../shared/interfaces';
import { SkeletonLoaderComponent } from '../skeleton-loader/skeleton-loader.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-access-control',
  standalone: true,
  imports: [CommonModule, FormsModule, SkeletonLoaderComponent, RouterLink],
  template: `
<div class="container mx-auto p-4">
  <div class="flex items-center mb-6">
     <a routerLink="/admin" class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 mr-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
    </a>
    <h2 class="text-3xl font-bold text-gray-900 dark:text-white">Role Access Control</h2>
  </div>
  
  <p class="text-gray-600 dark:text-gray-400 mb-6">
    Manage feature access for different user roles. Changes are applied in real-time to all logged-in users. The 'Admin' role permissions are locked.
  </p>

  @if (loading()) {
    <app-skeleton-loader height="400px" customClass="rounded-lg"/>
  } @else {
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th scope="col" class="sticky left-0 bg-gray-50 dark:bg-gray-700 px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
            @for(permission of permissionKeys(); track permission.key) {
               <th scope="col" class="py-3 px-2 align-bottom w-24">
                  <div class="flex items-end justify-center h-32">
                    <span class="transform -rotate-45 origin-bottom-left whitespace-nowrap pb-1 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {{ permission.label }}
                    </span>
                  </div>
                </th>
            }
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          @for (rolePerms of permissions(); track rolePerms.role) {
            <tr>
              <td class="sticky left-0 bg-white dark:bg-gray-800 px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{{ rolePerms.role }}</td>
              @for(permission of permissionKeys(); track permission.key) {
                <td class="px-6 py-4 whitespace-nowrap text-center">
                  <input type="checkbox" 
                         [checked]="rolePerms[permission.key]"
                         [disabled]="rolePerms.role === 'Admin'"
                         (change)="updatePermission(rolePerms.role, permission.key, $event)"
                         class="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed">
                </td>
              }
            </tr>
          }
        </tbody>
      </table>
    </div>
  }
</div>
`,
})
export class AccessControlComponent {
  permissionService = inject(PermissionService);

  permissions = this.permissionService.allRolePermissions;
  loading = this.permissionService.loading;
  
  permissionKeys = computed(() => {
    if (this.permissions().length === 0) return [];
    // Dynamically generate headers from the keys of the permissions object, excluding 'role'
    const keys = Object.keys(this.permissions()[0]).filter(k => k !== 'role') as Array<keyof Omit<RolePermissions, 'role'>>;
    return keys.map(key => ({
      key,
      label: key.replace(/_/g, ' ').replace('can ', '').replace(/\b\w/g, l => l.toUpperCase()) // Format for display
    }));
  });

  updatePermission(role: RolePermissions['role'], permissionKey: keyof Omit<RolePermissions, 'role'>, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.permissionService.updatePermissions(role, { [permissionKey]: isChecked });
  }
}
