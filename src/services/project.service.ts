

import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { Project } from '../shared/interfaces';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  private _projects = signal<Project[]>([]);
  loading = signal(true);

  projects = computed(() => this._projects());

  constructor() {
    effect(() => {
      if (this.authService.currentUser()) {
        this.loadProjects();
      } else {
        this._projects.set([]);
      }
    });
  }

  async loadProjects(): Promise<void> {
    this.loading.set(true);
    try {
      const projects = await this.apiService.fetchProjects();
      this._projects.set(projects);
    } catch (error) {
      this.handleError(error, 'Failed to load projects.');
    } finally {
      this.loading.set(false);
    }
  }
  
  getProjectById(id: string) {
    return computed(() => this._projects().find(p => p.id === id));
  }

  async createProject(projectData: { name: string; description: string; image_url?: string | null }, member_ids: string[]): Promise<void> {
    try {
      const newProject = await this.apiService.addProject(projectData, member_ids);
      this._projects.update(projects => [...projects, newProject]);
      this.notificationService.showToast('Project created successfully!', 'success');
      this.router.navigate(['/projects', newProject.id]);
    } catch (error) {
      this.handleError(error, 'Failed to create project.');
      throw error;
    }
  }

  async updateProject(id: string, projectData: { name: string; description: string; image_url?: string | null }, member_ids: string[]): Promise<void> {
    try {
      const oldProject = this._projects().find(p => p.id === id);
      const updatedProject = await this.apiService.updateProject(id, projectData, member_ids);
      this._projects.update(projects => projects.map(p => p.id === id ? updatedProject : p));
      this.notificationService.showToast('Project updated successfully!', 'success');
      
      // Delete old image if it was changed and exists in Firebase storage
      if (oldProject?.image_url && oldProject.image_url !== updatedProject.image_url && oldProject.image_url.includes('storage.googleapis.com')) {
          this.apiService.deleteFile(oldProject.image_url).catch(err => console.error('Failed to delete old project image:', err));
      }

      this.router.navigate(['/projects', updatedProject.id]);
    } catch (error) {
      this.handleError(error, 'Failed to update project.');
      throw error;
    }
  }

  async deleteProject(id: string): Promise<void> {
    try {
      const projectToDelete = this._projects().find(p => p.id === id);
      await this.apiService.deleteProject(id);
      this._projects.update(projects => projects.filter(p => p.id !== id));
      this.notificationService.showToast('Project deleted successfully.', 'success');

      // Delete image from storage if it exists
      if (projectToDelete?.image_url && projectToDelete.image_url.includes('storage.googleapis.com')) {
          this.apiService.deleteFile(projectToDelete.image_url).catch(err => console.error('Failed to delete project image:', err));
      }

      this.router.navigate(['/projects']);
    } catch (error) {
      this.handleError(error, 'Failed to delete project.');
      throw error;
    }
  }

  private handleError(error: any, defaultMessage: string) {
    console.error(`Error in ProjectService:`, error);
    const message = error?.error?.error || defaultMessage;
    this.notificationService.showToast(message, 'error');
  }
}