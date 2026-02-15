
import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StatusAnimationService {
  isVisible = signal(false);
  message = signal('');
  
  private timeoutId: any;

  /**
   * Shows the status overlay with a message for a short duration.
   * @param message The message to display in the overlay.
   */
  show(message: string) {
    this.message.set(message);
    this.isVisible.set(true);

    clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(() => {
      this.isVisible.set(false);
    }, 2500); // The total duration of the animation
  }
}
