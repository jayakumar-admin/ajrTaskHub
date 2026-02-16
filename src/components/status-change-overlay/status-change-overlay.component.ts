import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusAnimationService } from '../../services/status-animation.service';

@Component({
  selector: 'app-status-change-overlay',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-change-overlay.component.html',
  styleUrls: ['./status-change-overlay.component.css']
})
export class StatusChangeOverlayComponent {
  animationService = inject(StatusAnimationService);
}
