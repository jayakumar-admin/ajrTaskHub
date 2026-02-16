
import { Injectable, inject, NgZone } from '@angular/core';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { Router } from '@angular/router';

const TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutes

@Injectable({
  providedIn: 'root'
})
export class SessionTimeoutService {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private ngZone = inject(NgZone);
  
  private timeoutId: any;
  private readonly activityEvents: (keyof DocumentEventMap)[] = ['mousemove', 'keydown', 'click', 'scroll'];

  constructor() {
    // Bind 'this' to the resetTimer method for event listeners
    this.resetTimer = this.resetTimer.bind(this);
  }

  start(): void {
    this.ngZone.runOutsideAngular(() => {
      this.activityEvents.forEach(event => {
        document.addEventListener(event, this.resetTimer, true);
      });
    });
    this.resetTimer();
  }

  stop(): void {
    this.ngZone.runOutsideAngular(() => {
      this.activityEvents.forEach(event => {
        document.removeEventListener(event, this.resetTimer, true);
      });
    });
    clearTimeout(this.timeoutId);
  }

  resetTimer(): void {
    clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(() => {
      this.ngZone.run(() => {
        if (this.authService.isLoggedIn()) {
          this.notificationService.showToast('You have been logged out due to inactivity.', 'warning');
          this.authService.logout();
        }
      });
    }, TIMEOUT_DURATION);
  }
}
