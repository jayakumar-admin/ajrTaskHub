import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { Project } from '../shared/interfaces';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  private _projects = signal<Project[]>([]);
  loading = signal(true);

  // Projects visible to the current user
  projects = computed(() => this._projects());

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.loadProjects();
      } else {
        this._projects.set([]);
      }
    }, { allowSignalWrites: true });
  }

  async loadProjects(): Promise<void> {
    this.loading.set(true);
    try {
      const projects = await this.supabaseService.fetchProjects();
      this._projects.set(projects);
    } catch (error) {
      console.error('Error loading projects:', error);
      this.notificationService.showToast('Failed to load projects.', 'error');
    } finally {
      this.loading.set(false);
    }
  }
  
  getProjectById(id: string) {
    return computed(() => this._projects().find(p => p.id === id));
  }

  async createProject(name: string, description: string, member_ids: string[]): Promise<void> {
    const creatorId = this.authService.currentUser()?.profile.id;
    if (!creatorId) {
      this.notificationService.showToast('You must be logged in to create a project.', 'error');
      return;
    }
    
    // The creator is always a member
    const finalMemberIds = Array.from(new Set([...member_ids, creatorId]));

    try {
      const newProject = await this.supabaseService.addProject({ name, description, created_by: creatorId }, finalMemberIds);
      this._projects.update(projects => [...projects, newProject]);
      this.notificationService.showToast('Project created successfully!', 'success');
      this.router.navigate(['/projects', newProject.id]);
    } catch (error) {
      console.error('Error creating project:', error);
      this.notificationService.showToast('Failed to create project.', 'error');
    }
  }

  async updateProject(id: string, name: string, description: string, member_ids: string[]): Promise<void> {
    const creatorId = this.authService.currentUser()?.profile.id;
    if (!creatorId) {
      this.notificationService.showToast('You must be logged in to update a project.', 'error');
      return;
    }
    
    const finalMemberIds = Array.from(new Set([...member_ids, creatorId]));

    try {
      const updatedProject = await this.supabaseService.updateProject({ id, name, description }, finalMemberIds);
      this._projects.update(projects => projects.map(p => p.id === id ? updatedProject : p));
      this.notificationService.showToast('Project updated successfully!', 'success');
      this.router.navigate(['/projects', updatedProject.id]);
    } catch (error) {
      console.error('Error updating project:', error);
      this.notificationService.showToast('Failed to update project.', 'error');
    }
  }

  async deleteProject(id: string): Promise<void> {
    try {
      await this.supabaseService.deleteProject(id);
      this._projects.update(projects => projects.filter(p => p.id !== id));
      this.notificationService.showToast('Project deleted successfully.', 'success');
      this.router.navigate(['/projects']);
    } catch (error) {
      console.error('Error deleting project:', error);
      this.notificationService.showToast('Failed to delete project.', 'error');
      throw error;
    }
  }
}