import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { RolePermissions } from '../shared/interfaces';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { RealtimeChannel } from '@supabase/supabase-js';

const DEFAULT_PERMISSIONS: Omit<RolePermissions, 'role'> = {
  can_create_tasks: false,
  can_create_projects: false,
  can_use_chat: false,
  can_change_status: false,
  can_access_tools: false,
  can_access_calendar: false,
  can_access_kanban: false,
  can_assign_tasks: false,
  can_add_comment_attachment: false,
};

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private supabase = inject(SupabaseService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  private allPermissions = signal<RolePermissions[]>([]);
  private currentUserPermissions = signal<Omit<RolePermissions, 'role'>>(DEFAULT_PERMISSIONS);
  private permissionChannel: RealtimeChannel | null = null;
  
  loading = signal(true);

  // Expose all permissions for the admin panel
  public allRolePermissions = computed(() => this.allPermissions());

  // Expose individual permissions as computed signals for easy use in components
  canCreateTasks = computed(() => this.currentUserPermissions().can_create_tasks);
  canCreateProjects = computed(() => this.currentUserPermissions().can_create_projects);
  canUseChat = computed(() => this.currentUserPermissions().can_use_chat);
  canChangeStatus = computed(() => this.currentUserPermissions().can_change_status);
  canAccessTools = computed(() => this.currentUserPermissions().can_access_tools);
  canAccessCalendar = computed(() => this.currentUserPermissions().can_access_calendar);
  canAccessKanban = computed(() => this.currentUserPermissions().can_access_kanban);
  canAssignTasks = computed(() => this.currentUserPermissions().can_assign_tasks);
  canAddCommentAttachment = computed(() => this.currentUserPermissions().can_add_comment_attachment);

  constructor() {
    this.initializePermissions();
    this.subscribeToPermissionChanges();
  }

  private initializePermissions() {
    effect(() => {
      const user = this.authService.currentUser();
      const allPerms = this.allPermissions();

      if (user?.profile?.role && allPerms.length > 0) {
        const userPerms = allPerms.find(p => p.role === user.profile.role);
        this.currentUserPermissions.set(userPerms || DEFAULT_PERMISSIONS);
      } else if (!user) {
        this.currentUserPermissions.set(DEFAULT_PERMISSIONS);
      }
    }, { allowSignalWrites: true });
  }

  async loadAllPermissions() {
    this.loading.set(true);
    try {
      const perms = await this.supabase.fetchRolePermissions();
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
      await this.supabase.updateRolePermissions(role, permissions);
      this.notificationService.showToast(`Permissions for ${role} updated.`, 'success');
      // The real-time subscription will handle updating the local state.
    } catch (error) {
       console.error(`Failed to update permissions for ${role}`, error);
      this.notificationService.showToast(`Failed to update permissions for ${role}.`, 'error');
    }
  }

  private subscribeToPermissionChanges() {
    // Unsubscribe from any existing channel first
    if (this.permissionChannel) {
      this.supabase.supabase.removeChannel(this.permissionChannel);
    }
    
    this.permissionChannel = this.supabase.supabase
      .channel('public:role_permissions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'role_permissions' },
        (payload) => {
          console.log('Permission change detected, reloading permissions.', payload);
          this.loadAllPermissions();
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          // Once subscribed, do an initial fetch
          this.loadAllPermissions();
        }
        if (err) {
            console.error('Real-time permission subscription error:', err);
        }
      });
  }
}