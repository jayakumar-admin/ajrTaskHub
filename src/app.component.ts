import { Component, ViewChild, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NotificationToastComponent } from './components/notification-toast/notification-toast.component';
import { AiTaskAssistantComponent } from './components/ai-task-assistant/ai-task-assistant.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NotificationToastComponent, AiTaskAssistantComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  host: {
  }
})
export class AppComponent {
  @ViewChild('aiAssistant') aiAssistant!: AiTaskAssistantComponent;
}
