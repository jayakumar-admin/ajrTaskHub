import { Component, inject, signal, OnInit, effect } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../services/notification.service';
import { User } from '../../shared/interfaces';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
<div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
  <div class="sm:mx-auto sm:w-full sm:max-w-md">
    <div class="flex justify-center items-center">
      <svg class="h-12 w-auto text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
      <h2 class="ml-3 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
        AJRTaskHub
      </h2>
    </div>
    <h3 class="mt-2 text-center text-lg text-gray-600 dark:text-gray-400">
      {{ isLoginMode() ? 'Sign in to your account' : 'Create a new account' }}
    </h3>
  </div>

  <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
    <div class="bg-white dark:bg-gray-800 py-8 px-4 shadow-2xl sm:rounded-lg sm:px-10">
      <form (ngSubmit)="onSubmit()" class="space-y-6">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Email address</label>
          <div class="mt-1 relative rounded-md shadow-sm">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </div>
            <input id="email" name="email" type="email" [(ngModel)]="email" autocomplete="email" required
                   class="form-input pl-10">
          </div>
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
          <div class="mt-1 relative rounded-md shadow-sm">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
              </svg>
            </div>
            <input id="password" name="password" type="password" [(ngModel)]="password" autocomplete="current-password" required
                   class="form-input pl-10">
          </div>
        </div>

        @if (!isLoginMode()) {
          <div>
            <label for="username" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
            <div class="mt-1 relative rounded-md shadow-sm">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                </svg>
              </div>
              <input id="username" name="username" type="text" [(ngModel)]="username" required
                     class="form-input pl-10">
            </div>
          </div>
          <div>
            <label for="role" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
            <select id="role" name="role" [(ngModel)]="role" required
                    class="form-select">
              <option value="User">User</option>
              <option value="Manager">Manager</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
        }

        @if (isLoginMode()) {
            <div class="flex items-center justify-end">
                <div class="text-sm">
                    <a routerLink="/forgot-password" class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
                        Forgot your password?
                    </a>
                </div>
            </div>
        }
        
        @if (errorMessage()) {
            <div class="bg-red-50 dark:bg-red-900/20 p-3 rounded-md flex items-center space-x-3">
                <svg class="h-5 w-5 text-red-500 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
                <p class="text-sm text-red-700 dark:text-red-300">{{ errorMessage() }}</p>
            </div>
        }

        <div>
          <button type="submit" [disabled]="isLoading()"
                  class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-wait dark:focus:ring-offset-gray-800 transition-colors">
            @if(isLoading()) {
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Processing...</span>
            } @else {
              <span>{{ isLoginMode() ? 'Sign in' : 'Create account' }}</span>
            }
          </button>
        </div>
      </form>

      <div class="mt-6">
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or continue with</span>
          </div>
        </div>

        <div class="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <a href="#" class="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <span class="sr-only">Sign in with Google</span>
              <svg class="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" style="color: #4285F4"></path><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" style="color: #34A853"></path><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" style="color: #FBBC05"></path><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" style="color: #EA4335"></path><path d="M1 1h22v22H1z" fill="none"></path>
              </svg>
            </a>
          </div>
          <div>
            <a href="#" class="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <span class="sr-only">Sign in with GitHub</span>
              <svg class="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.168 6.839 9.492.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.031-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.03 1.595 1.03 2.688 0 3.848-2.338 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.003 10.003 0 0022 12c0-5.523-4.477-10-10-10z" clip-rule="evenodd" />
              </svg>
            </a>
          </div>
        </div>
      </div>

       <div class="mt-6 text-center text-sm">
        <button (click)="toggleMode()" class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 focus:outline-none focus:underline">
          {{ isLoginMode() ? "Don't have an account? Sign Up" : "Already have an account? Sign In" }}
        </button>
      </div>
    </div>
  </div>
</div>
  `
})
export class AuthComponent implements OnInit {
  authService = inject(AuthService);
  router: Router = inject(Router);
  route: ActivatedRoute = inject(ActivatedRoute);
  notificationService = inject(NotificationService);

  email = signal('');
  password = signal('');
  username = signal(''); // For signup
  role = signal<'Admin' | 'User' | 'Manager'>('User'); // For signup
  errorMessage = signal<string | null>(null);
  isLoginMode = signal(true); // Toggle between login and signup
  isLoading = signal(false); // For loading state on submit button

  constructor() {
    // Automatically redirect to /tasks when user is logged in (including after successful sign-in)
    effect(() => {
      if (this.authService.isLoggedIn()) {
        this.router.navigate(['/tasks']);
      }
    });
  }

  ngOnInit(): void {
    // Check for password reset success
    this.route.queryParams.subscribe(params => {
      const action = params['action'];
      if (action === 'reset-password') {
        this.notificationService.showToast('Password reset successful! You can now sign in with your new password.', 'success', 5000);
        this.router.navigate([], {
          queryParams: { action: null }, // Clear query param
          queryParamsHandling: 'merge',
          replaceUrl: true
        });
      }
    });
  }

  toggleMode(): void {
    this.isLoginMode.update(val => !val);
    this.errorMessage.set(null);
  }

  async onSubmit(): Promise<void> {
    this.errorMessage.set(null);
    this.isLoading.set(true);

    if (!this.email() || !this.password()) {
      this.errorMessage.set('Email and password are required.');
      this.isLoading.set(false);
      return;
    }

    try {
      if (this.isLoginMode()) {
        await this.authService.signInWithEmailAndPassword(this.email(), this.password());
      } else {
        if (!this.username()) {
          this.errorMessage.set('Username is required for signup.');
          this.isLoading.set(false);
          return;
        }
        const signedUp = await this.authService.signUpWithEmailAndPassword(this.email(), this.password(), this.username(), this.role());
        if (signedUp) {
          this.isLoginMode.set(true); // Switch to login mode after successful signup
        }
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      this.errorMessage.set(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      this.isLoading.set(false); // Ensure loading state is always reset
    }
  }
}