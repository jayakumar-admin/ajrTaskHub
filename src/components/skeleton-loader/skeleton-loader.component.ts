import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [style.height]="height()" 
         [style.width]="width()"
         [class]="'bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse ' + customClass()">
    </div>
  `,
  styles: [`
    @keyframes pulse {
      50% {
        opacity: .5;
      }
    }
    .animate-pulse {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
  `]
})
export class SkeletonLoaderComponent {
  height = input<string>('100%');
  width = input<string>('100%');
  customClass = input<string>(''); // For margins, etc.
}
