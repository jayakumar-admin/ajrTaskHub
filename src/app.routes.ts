import { Routes } from '@angular/router';
import { AuthComponent } from './components/auth/auth.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { AdminPanelComponent } from './components/admin-panel/admin-panel.component';
import { TaskListComponent } from './components/task-list/task-list.component';
import { TaskDetailComponent } from './components/task-detail/task-detail.component';
import { TaskFormComponent } from './components/task-form/task-form.component';
import { KanbanBoardComponent } from './components/kanban-board/kanban-board.component';
import { CalendarViewComponent } from './components/calendar-view/calendar-view.component';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';
import { SettingsComponent } from './components/settings/settings.component';
import { LayoutComponent } from './components/layout/layout.component';
import { Router } from '@angular/router';
import { AjrToolsComponent } from './components/ajr-tools/ajr-tools.component';
import { ProjectListComponent } from './components/project-list/project-list.component';
import { ProjectDetailComponent } from './components/project-detail/project-detail.component';
import { ProjectFormComponent } from './components/project-form/project-form.component';
import { AccessControlComponent } from './components/access-control/access-control.component';
import { PermissionService } from './services/permission.service';

const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router) as Router;
  if (authService.isLoggedIn()) {
    return true;
  }
  return router.parseUrl('/auth');
};

const adminGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router) as Router;
  if (authService.isAdmin()) {
    return true;
  }
  return router.parseUrl('/tasks');
};

const canCreateTasksGuard = () => {
  const permissionService = inject(PermissionService);
  const router = inject(Router);
  if (permissionService.canCreateTasks()) return true;
  return router.parseUrl('/tasks');
};

const canCreateProjectsGuard = () => {
  const permissionService = inject(PermissionService);
  const router = inject(Router);
  if (permissionService.canCreateProjects()) return true;
  return router.parseUrl('/projects');
};

const canAccessKanbanGuard = () => {
  const permissionService = inject(PermissionService);
  const router = inject(Router);
  if (permissionService.canAccessKanban()) return true;
  return router.parseUrl('/tasks');
};

const canAccessCalendarGuard = () => {
  const permissionService = inject(PermissionService);
  const router = inject(Router);
  if (permissionService.canAccessCalendar()) return true;
  return router.parseUrl('/tasks');
};

const canAccessToolsGuard = () => {
  const permissionService = inject(PermissionService);
  const router = inject(Router);
  if (permissionService.canAccessTools()) return true;
  return router.parseUrl('/tasks');
};


export const routes: Routes = [
  // Standalone routes (no layout for auth pages)
  { path: 'auth', component: AuthComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },

  // Main application layout for authenticated users
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'tasks', component: TaskListComponent },
      { path: 'tasks/new', component: TaskFormComponent, canActivate: [canCreateTasksGuard] },
      { path: 'tasks/:id/edit', component: TaskFormComponent },
      { path: 'tasks/:id', component: TaskDetailComponent },
      { path: 'kanban', component: KanbanBoardComponent, canActivate: [canAccessKanbanGuard] },
      { path: 'calendar', component: CalendarViewComponent, canActivate: [canAccessCalendarGuard] },
      { path: 'ajr-tools', component: AjrToolsComponent, canActivate: [canAccessToolsGuard] },
      { path: 'projects', component: ProjectListComponent },
      { path: 'projects/new', component: ProjectFormComponent, canActivate: [canCreateProjectsGuard] },
      { path: 'projects/:id', component: ProjectDetailComponent },
      { path: 'projects/:id/edit', component: ProjectFormComponent },
      { path: 'admin', component: AdminPanelComponent, canActivate: [adminGuard] },
      { path: 'admin/access-control', component: AccessControlComponent, canActivate: [adminGuard] },
      { path: 'settings', component: SettingsComponent },
      { path: '', redirectTo: 'tasks', pathMatch: 'full' } // Default route for the layout
    ]
  },
  
  // Wildcard route should be last to catch any other URL
  { path: '**', redirectTo: '', pathMatch: 'full' }
];