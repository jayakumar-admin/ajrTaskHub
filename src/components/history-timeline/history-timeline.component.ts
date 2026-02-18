import { Component, input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HistoryEntry } from '../../shared/interfaces';

@Component({
  selector: 'app-history-timeline',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
<div class="flow-root">
  <ul role="list" class="-mb-8">
    @for (entry of history(); track entry.id) {
      <li>
        <div class="relative pb-8">
          @if (!$last) {
            <span class="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-600" aria-hidden="true"></span>
          }
          <div class="relative flex space-x-3">
            <div>
              <span class="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center ring-8 ring-white dark:ring-gray-800">
                <svg class="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                </svg>
              </span>
            </div>
            <div class="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
              <div>
                <p class="text-sm text-gray-700 dark:text-gray-300">
                  <span class="font-medium text-indigo-600 dark:text-indigo-400">{{ entry.username }}</span>
                  <span class="text-gray-500 dark:text-gray-400"> {{ entry.action }}</span>
                  @if (entry.details) {
                    <span class="ml-1 text-gray-500 dark:text-gray-400 italic">({{ entry.details }})</span>
                  }
                </p>
              </div>
              <div class="text-right text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                <time dateTime="{{ entry.timestamp | date:'yyyy-MM-ddTHH:mm:ssZ' }}">
                  {{ entry.timestamp | date:'medium' }}
                </time>
              </div>
            </div>
          </div>
        </div>
      </li>
    }
    @empty {
      <p class="text-center text-gray-500 dark:text-gray-400 py-4">No history available for this task.</p>
    }
  </ul>
</div>
`,
  styles: []
})
export class HistoryTimelineComponent {
  history = input.required<HistoryEntry[]>();
}
