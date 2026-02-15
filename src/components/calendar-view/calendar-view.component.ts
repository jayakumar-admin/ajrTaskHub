import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe, formatDate } from '@angular/common';
import { TaskService } from '../../services/task.service';
import { Task } from '../../shared/interfaces';
import { RouterLink } from '@angular/router';

interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  tasks: Task[];
}

@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink],
  template: `
<div class="container mx-auto p-4 font-sans">
    <!-- View Toggle -->
    <div class="max-w-xs mx-auto p-1 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center my-6">
      <button (click)="viewMode.set('monthly')" 
              class="w-1/2 py-2 text-sm font-semibold rounded-full transition-colors"
              [class.bg-primary-500]="viewMode() === 'monthly'"
              [class.text-white]="viewMode() === 'monthly'"
              [class.text-gray-600]="viewMode() !== 'monthly'"
              [class.dark:text-gray-300]="viewMode() !== 'monthly'">
        Monthly
      </button>
      <button (click)="viewMode.set('daily')"
              class="w-1/2 py-2 text-sm font-semibold rounded-full transition-colors"
              [class.bg-primary-500]="viewMode() === 'daily'"
              [class.text-white]="viewMode() === 'daily'"
              [class.text-gray-600]="viewMode() !== 'daily'"
              [class.dark:text-gray-300]="viewMode() !== 'daily'">
        Daily
      </button>
    </div>

    <div class="lg:grid lg:grid-cols-12 lg:gap-12">
      <!-- Left side: Calendar -->
      <div class="lg:col-span-8">
        <div class="calendar-container bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md" 
             [class.hidden]="viewMode() === 'daily'" 
             [class.lg:block]="true">
          <!-- Month Navigation -->
          <div class="flex justify-between items-center mb-4">
            <button (click)="changeMonth(-1)" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
              <svg class="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h2 class="text-lg font-bold text-gray-800 dark:text-white">{{ monthYearLabel() }}</h2>
            <button (click)="changeMonth(1)" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
              <svg class="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          <!-- Calendar Grid -->
          <div class="grid grid-cols-7 gap-y-2 text-center text-sm">
            <!-- Day Headers -->
            @for(day of weekDayHeaders; track day) {
              <div class="font-medium text-gray-500 dark:text-gray-400 py-2">{{ day }}</div>
            }

            <!-- Calendar Days -->
            @for(day of calendarGrid(); track day.date.getTime()) {
              <div (click)="selectDate(day.date)"
                   class="relative h-10 flex items-center justify-center cursor-pointer rounded-full transition-colors"
                   [class.text-gray-400]="!day.isCurrentMonth"
                   [class.dark:text-gray-500]="!day.isCurrentMonth"
                   [class.text-primary-600]="day.isToday && !day.isSelected"
                   [class.dark:text-primary-400]="day.isToday && !day.isSelected"
                   [class.font-bold]="day.isToday"
                   [class.bg-primary-500]="day.isSelected"
                   [class.text-white]="day.isSelected"
                   [class.hover:bg-gray-100]="!day.isSelected"
                   [class.dark:hover:bg-gray-700]="!day.isSelected">
                <span>{{ day.dayOfMonth }}</span>
                @if (day.tasks.length > 0) {
                  <div class="absolute bottom-1.5 h-1.5 w-1.5 rounded-full"
                       [class.bg-orange-400]="day.tasks[0]?.priority === 'High' || day.tasks[0]?.priority === 'Urgent'"
                       [class.bg-teal-400]="day.tasks[0]?.priority === 'Medium'"
                       [class.bg-blue-400]="day.tasks[0]?.priority === 'Low'"
                       [class.bg-white]="day.isSelected">
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Right side: Task List -->
      <div class="mt-8 lg:mt-0 lg:col-span-4">
        <h3 class="text-xl font-bold text-gray-800 dark:text-white">
            {{ viewMode() === 'monthly' ? 'Tasks This Month' : 'Tasks for ' + (selectedDate() | date:'mediumDate') }}
        </h3>
        <div class="space-y-3 mt-4">
            @for(task of tasksForDisplay(); track task.id) {
                <a [routerLink]="['/tasks', task.id]" class="bg-white dark:bg-gray-800 p-4 rounded-lg flex items-center justify-between shadow-sm hover:shadow-md transition-shadow cursor-pointer border-l-4"
                  [class.border-red-500]="task.priority === 'Urgent'"
                  [class.border-orange-500]="task.priority === 'High'"
                  [class.border-yellow-500]="task.priority === 'Medium'"
                  [class.border-green-500]="task.priority === 'Low'"
                  [class.border-transparent]="!task.priority"
                >
                    <div class="flex items-center">
                        <div class="h-6 w-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center mr-3"
                             [class.border-gray-300]="task.status !== 'completed'"
                             [class.bg-primary-500]="task.status === 'completed'"
                             [class.border-primary-500]="task.status === 'completed'">
                            @if (task.status === 'completed') {
                                <svg class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
                            }
                        </div>
                        <div>
                          <p class="font-medium text-gray-700 dark:text-gray-200">{{ task.title }}</p>
                          <p class="text-sm text-gray-500 dark:text-gray-400">{{ task.due_date | date:'shortTime' }}</p>
                        </div>
                    </div>
                    <span class="text-xs font-mono text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">{{ task.due_date | date:'MMM d' }}</span>
                </a>
            }
            @empty {
                <div class="text-center text-gray-500 dark:text-gray-400 py-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <p>No tasks for this period.</p>
                </div>
            }
        </div>
      </div>
    </div>
</div>
  `,
  styles: []
})
export class CalendarViewComponent {
  taskService = inject(TaskService);
  allTasks = this.taskService.tasks;

  viewMode = signal<'monthly' | 'daily'>('monthly');
  currentDate = signal(new Date()); // Controls the month being viewed
  selectedDate = signal(new Date()); // The specific day the user clicks on

  weekDayHeaders = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  tasksByDay = computed(() => {
    const map = new Map<string, Task[]>();
    this.allTasks().forEach(task => {
        const dateKey = formatDate(task.due_date, 'yyyy-MM-dd', 'en-US');
        if (!map.has(dateKey)) {
            map.set(dateKey, []);
        }
        map.get(dateKey)!.push(task);
    });
    return map;
  });

  calendarGrid = computed<CalendarDay[]>(() => {
    const grid: CalendarDay[] = [];
    const date = this.currentDate();
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selDate = new Date(this.selectedDate());
    selDate.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // 0 = Monday
    const daysInMonth = lastDayOfMonth.getDate();

    // Days from previous month
    for (let i = startDayOfWeek; i > 0; i--) {
        const d = new Date(firstDayOfMonth);
        d.setDate(d.getDate() - i);
        grid.push(this.createCalendarDay(d, today, selDate, false));
    }

    // Days of current month
    for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(year, month, i);
        grid.push(this.createCalendarDay(d, today, selDate, true));
    }

    // Days from next month
    const gridEndIndex = grid.length;
    for (let i = 1; grid.length < 42; i++) {
        const d = new Date(lastDayOfMonth);
        d.setDate(d.getDate() + i);
        grid.push(this.createCalendarDay(d, today, selDate, false));
    }

    return grid;
  });

  tasksForDisplay = computed(() => {
    if (this.viewMode() === 'daily') {
        const dateKey = formatDate(this.selectedDate(), 'yyyy-MM-dd', 'en-US');
        return this.tasksByDay().get(dateKey) || [];
    } else { // monthly view
        const year = this.currentDate().getFullYear();
        const month = this.currentDate().getMonth();
        return this.allTasks().filter(task => {
            const taskDate = new Date(task.due_date);
            return taskDate.getFullYear() === year && taskDate.getMonth() === month;
        }).sort((a,b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
    }
  });

  monthYearLabel = computed(() => {
    return this.currentDate().toLocaleString('en-US', { month: 'long', year: 'numeric' });
  });

  private createCalendarDay(date: Date, today: Date, selected: Date, isCurrentMonth: boolean): CalendarDay {
      const dateKey = formatDate(date, 'yyyy-MM-dd', 'en-US');
      return {
          date: date,
          dayOfMonth: date.getDate(),
          isCurrentMonth,
          isToday: date.getTime() === today.getTime(),
          isSelected: date.getTime() === selected.getTime(),
          tasks: this.tasksByDay().get(dateKey) || []
      };
  }

  selectDate(date: Date): void {
    this.selectedDate.set(date);
    if(this.viewMode() === 'monthly') {
        this.currentDate.set(date);
    }
  }

  changeMonth(direction: number): void {
    this.currentDate.update(d => {
        const newDate = new Date(d);
        newDate.setMonth(newDate.getMonth() + direction, 1); // Set to day 1 to avoid month skipping issues
        return newDate;
    });
  }
}
