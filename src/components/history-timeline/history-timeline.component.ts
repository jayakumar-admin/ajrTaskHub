import { Component, input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HistoryEntry } from '../../shared/interfaces';

@Component({
  selector: 'app-history-timeline',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './history-timeline.component.html',
  styleUrls: ['./history-timeline.component.css']
})
export class HistoryTimelineComponent {
  history = input.required<HistoryEntry[]>();
}
