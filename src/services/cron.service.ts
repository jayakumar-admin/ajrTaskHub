import { Injectable, signal, effect, inject } from '@angular/core';
import { CronJob } from '../shared/interfaces';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class CronService {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  cronJobs = signal<CronJob[]>([]);
  loading = signal(true);

  constructor() {
    effect(() => {
      if (this.authService.isAdmin()) {
        this.loadCronJobs();
      } else {
        this.cronJobs.set([]);
      }
    });
  }

  async loadCronJobs(): Promise<void> {
    this.loading.set(true);
    try {
      const jobs = await this.apiService.fetchCronJobs();
      this.cronJobs.set(jobs);
    } catch (error) {
      console.error('Error loading cron jobs:', error);
      this.notificationService.showToast('Failed to load scheduled jobs.', 'error');
    } finally {
      this.loading.set(false);
    }
  }

  async updateCronJob(job: CronJob): Promise<void> {
    try {
      const updatedJob = await this.apiService.updateCronJob(job);
      this.cronJobs.update(jobs => jobs.map(j => j.id === updatedJob.id ? updatedJob : j));
      this.notificationService.showToast(`Job "${job.name}" updated successfully.`, 'success');
    } catch (error) {
      console.error(`Error updating cron job ${job.id}:`, error);
      this.notificationService.showToast('Failed to update scheduled job.', 'error');
    }
  }
}
