
import { Component, ViewChild, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NotificationToastComponent } from './components/notification-toast/notification-toast.component';
import { AiTaskAssistantComponent } from './components/ai-task-assistant/ai-task-assistant.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NotificationToastComponent, AiTaskAssistantComponent],
  template: `
    <router-outlet></router-outlet>
    <app-notification-toast />
    <app-ai-task-assistant #aiAssistant />

    <!-- AI Assistant FAB -->
    <button (click)="aiAssistant.toggle()" 
            title="Open AI Assistant"
            class="fixed bottom-28 right-5 z-40 h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-primary-700 hover:scale-110 active:scale-95 transition-transform duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    </button>
  `,
  styles: [],
  host: {
  }
})
export class AppComponent {
  @ViewChild('aiAssistant') aiAssistant!: AiTaskAssistantComponent;
}
