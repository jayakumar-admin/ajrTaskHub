
import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { RolePermissions } from '../shared/interfaces';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';

const DEFAULT_PERMISSIONS: Omit<RolePermissions, 'role'> = {
  can_create_tasks: false,
  can_create_projects: false,
  can_use_chat: false,
  can_change_status: false,
  can_access_tools: false,
  can_access_calendar: false,
  can_access_kanban: false,
  can_assign_tasks: false,
  can_add_comments: false,
  can_add_attachments: false,
  can_preview_attachments: false,
  can_download_attachments: false,
};

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  private allPermissions = signal<RolePermissions[]>([]);
  private currentUserPermissions = signal<Omit<RolePermissions, 'role'>>(DEFAULT_PERMISSIONS);
  
  loading = signal(true);

  public allRolePermissions = computed(() => this.allPermissions());

  canCreateTasks = computed(() => this.currentUserPermissions().can_create_tasks);
  canCreateProjects = computed(() => this.currentUserPermissions().can_create_projects);
  canUseChat = computed(() => this.currentUserPermissions().can_use_chat);
  canChangeStatus = computed(() => this.currentUserPermissions().can_change_status);
  canAccessTools = computed(() => this.currentUserPermissions().can_access_tools);
  canAccessCalendar = computed(() => this.currentUserPermissions().can_access_calendar);
  canAccessKanban = computed(() => this.currentUserPermissions().can_access_kanban);
  canAssignTasks = computed(() => this.currentUserPermissions().can_assign_tasks);
  canAddComments = computed(() => this.currentUserPermissions().can_add_comments);
  canAddAttachments = computed(() => this.currentUserPermissions().can_add_attachments);
  canPreviewAttachments = computed(() => this.currentUserPermissions().can_preview_attachments);
  canDownloadAttachments = computed(() => this.currentUserPermissions().can_download_attachments);

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.loadAllPermissions();
      } else {
        this.allPermissions.set([]);
        this.currentUserPermissions.set(DEFAULT_PERMISSIONS);
      }
    });
    
    effect(() => {
      const user = this.authService.currentUser();
      const allPerms = this.allPermissions();

      if (user?.profile?.role && allPerms.length > 0) {
        const userPerms = allPerms.find(p => p.role === user.profile.role);
        this.currentUserPermissions.set(userPerms || DEFAULT_PERMISSIONS);
      } else {
        this.currentUserPermissions.set(DEFAULT_PERMISSIONS);
      }
    });
  }

  async loadAllPermissions() {
    this.loading.set(true);
    try {
      const perms = await this.apiService.fetchRolePermissions();
      this.allPermissions.set(perms);
    } catch (error) {
      console.error("Failed to load role permissions", error);
      this.notificationService.showToast("Error loading system permissions.", 'error');
    } finally {
      this.loading.set(false);
    }
  }

  async updatePermissions(role: string, permissions: Partial<RolePermissions>) {
    try {
      await this.apiService.updateRolePermissions(role, permissions);
      // Manually update local state after successful API call
      this.allPermissions.update(perms => 
        perms.map(p => p.role === role ? { ...p, ...permissions } : p)
      );
      this.notificationService.showToast(`Permissions for ${role} updated.`, 'success');
    } catch (error) {
       console.error(`Failed to update permissions for ${role}`, error);
      this.notificationService.showToast(`Failed to update permissions for ${role}.`, 'error');
    }
  }
}
