import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
<div class="flex items-center justify-center min-h-[calc(100vh-64px)] bg-gray-100 dark:bg-gray-800 p-4">
  <div class="w-full max-w-md bg-white dark:bg-gray-700 rounded-lg shadow-xl p-8 space-y-6">
    <h2 class="text-3xl font-extrabold text-center text-gray-900 dark:text-white">
      Forgot Your Password?
    </h2>
    <p class="text-center text-gray-700 dark:text-gray-300">
      Enter your email address below and we'll send you a link to reset your password.
    </p>

    <form (ngSubmit)="onSubmit()" class="space-y-6">
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          [(ngModel)]="email"
          required
          class="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
          placeholder="your@example.com"
        >
      </div>

      <button
        type="submit"
        class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-primary-700 dark:hover:bg-primary-600 dark:focus:ring-offset-gray-800 transition-colors"
      >
        Send Reset Link
      </button>
    </form>

    @if (errorMessage()) {
      <div class="mt-4 text-red-600 dark:text-red-400 text-center">
        {{ errorMessage() }}
      </div>
    }

    <div class="text-center text-sm mt-4">
      <a routerLink="/auth" class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 focus:outline-none focus:underline">
        Back to Sign In
      </a>
    </div>
  </div>
</div>
  `,
  styles: []
})
export class ForgotPasswordComponent {
  authService = inject(AuthService);
  notificationService = inject(NotificationService);

  email = signal('');
  errorMessage = signal<string | null>(null);

  async onSubmit(): Promise<void> {
    this.errorMessage.set(null);

    if (!this.email()) {
      this.errorMessage.set('Email is required.');
      return;
    }

    try {
      const success = await this.authService.forgotPassword(this.email());
      if (success) {
        this.email.set('');
      }
    } catch (error: any) {
      console.error('Forgot password submission error:', error);
      this.errorMessage.set(error.message || 'An error occurred. Please try again.');
    }
  }
}