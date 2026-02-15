
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusAnimationService } from '../../services/status-animation.service';

@Component({
  selector: 'app-status-change-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if(animationService.isVisible()) {
      <div class="fixed inset-0 flex items-center justify-center z-[200] pointer-events-none">
        <div class="status-overlay bg-gray-900/80 dark:bg-black/80 text-white rounded-lg shadow-2xl p-4 flex items-center space-x-3">
          <svg class="h-6 w-6 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="font-semibold capitalize">{{ animationService.message() }}</span>
        </div>
      </div>
    }
  `,
  styles: [`
    .status-overlay {
      animation: fadeInOut 2.5s ease-in-out forwards;
    }

    @keyframes fadeInOut {
      0% { opacity: 0; transform: translateY(20px) scale(0.95); }
      15% { opacity: 1; transform: translateY(0) scale(1); }
      85% { opacity: 1; transform: translateY(0) scale(1); }
      100% { opacity: 0; transform: translateY(-20px) scale(0.95); }
    }
  `]
})
export class StatusChangeOverlayComponent {
  animationService = inject(StatusAnimationService);
}
