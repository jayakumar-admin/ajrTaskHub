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
  templateUrl: './access-control.component.html',
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
