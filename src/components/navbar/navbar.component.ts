import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PermissionService } from '../../services/permission.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  authService = inject(AuthService);
  permissionService = inject(PermissionService);
  isAdmin = computed(() => this.authService.isAdmin());
  isMobileMenuOpen = signal(false);

  canCreateTasks = this.permissionService.canCreateTasks;
  canAccessKanban = this.permissionService.canAccessKanban;
  canAccessCalendar = this.permissionService.canAccessCalendar;
  canAccessTools = this.permissionService.canAccessTools;


  logout(): void {
    this.isMobileMenuOpen.set(false);
    this.authService.logout();
  }
}
