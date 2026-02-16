
import { Component, inject, computed, signal, effect, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TaskService } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';
import { Task, TaskPriority, TaskType, TaskStatus } from '../../shared/interfaces';
// FIX: The supabase service file was missing. It is now added and can be imported.
import { SupabaseService } from '../../services/supabase.service';
import { TaskCardComponent } from '../task-card/task-card.component';
import { ThemeService } from '../../services/theme.service';
import { SkeletonLoaderComponent } from '../skeleton-loader/skeleton-loader.component';
import { SearchService } from '../../services/search.service';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, RouterLink, TaskCardComponent, FormsModule, SkeletonLoaderComponent],
  template: `
@if (loading()) {
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
    <!-- Welcome Header Skeleton -->
    <section>
      <app-skeleton-loader height="120px" customClass="rounded-xl"/>
    </section>

    <!-- Categories Section Skeleton -->
    <section>
      <app-skeleton-loader height="36px" width="200px" customClass="mb-4 rounded-lg"/>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        @for (_ of [1,2,3,4,5]; track $index) {
          <app-skeleton-loader height="150px" customClass="rounded-xl"/>
        }
      </div>
    </section>

    <!-- My Active Tasks Section Skeleton -->
    <section>
      <app-skeleton-loader height="36px" width="250px" customClass="mb-4 rounded-lg"/>
      <div class="flex overflow-x-auto space-x-6 pb-4 -mx-4 px-4">
        @for (_ of [1,2,3]; track $index) {
          <div class="flex-shrink-0 w-80">
            <app-skeleton-loader height="220px" customClass="rounded-lg"/>
          </div>
        }
      </div>
    </section>

    <!-- Today's & Upcoming Tasks Section Skeleton -->
    <section class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div>
        <app-skeleton-loader height="36px" width="200px" customClass="mb-4 rounded-lg"/>
        <div class="space-y-4">
          @for (_ of [1,2]; track $index) {
            <app-skeleton-loader height="80px" customClass="rounded-xl"/>
          }
        </div>
      </div>
      <div>
        <app-skeleton-loader height="36px" width="180px" customClass="mb-4 rounded-lg"/>
        <div class="space-y-4">
          @for (_ of [1,2,3]; track $index) {
            <app-skeleton-loader height="80px" customClass="rounded-xl"/>
          }
        </div>
      </div>
    </section>

    <!-- All Tasks & Filters Section Skeleton -->
    <section id="all-tasks" class="pt-10">
       <div class="flex justify-between items-center mb-6">
        <app-skeleton-loader height="36px" width="200px" customClass="rounded-lg"/>
        <app-skeleton-loader height="44px" width="250px" customClass="rounded-lg"/>
      </div>

      <div class="mb-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-inner">
         <app-skeleton-loader height="60px" customClass="rounded-lg"/>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (_ of [1,2,3,4,5,6]; track $index) {
          <app-skeleton-loader height="220px" customClass="rounded-lg"/>
        }
      </div>
    </section>
  </div>
} @else {
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <!-- Welcome Header -->
      <section class="bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-700 dark:to-primary-800 text-white rounded-xl shadow-lg p-6 flex justify-between items-center">
          <div>
              <h1 class="text-3xl font-bold">Welcome Back, {{ currentUser()?.profile?.username }}! <span class="wave">👩‍💻</span></h1>
              <p class="text-md text-primary-100 dark:text-primary-200 mt-2">{{ welcomeMessage() }}</p>
          </div>
          <div class="hidden sm:block">
              <a routerLink="/tasks/new" class="inline-flex items-center justify-center px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors shadow font-semibold">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"></path>
                  </svg>
                  New Task
              </a>
          </div>
      </section>

      <!-- Categories Section -->
      <section>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Categories</h2>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          @for (category of taskCategories(); track category.name) {
            <div (click)="filterByCategory(category.name)" class="bg-white dark:bg-gray-800 rounded-xl shadow p-6 hover:shadow-lg transition-shadow duration-300 cursor-pointer">
              <div class="flex items-center justify-between mb-4">
                <div class="w-12 h-12 rounded-full flex items-center justify-center" [class]="category.bgColor">
                  @if(category.icon === 'Task') { <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" [class]="category.color" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg> }
                  @if(category.icon === 'Order') { <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" [class]="category.color" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> }
                  @if(category.icon === 'Bugfix') { <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" [class]="category.color" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8v8m-3-5v5m-3-8v8M9 9H5a2 2 0 00-2 2v4a2 2 0 002 2h4a2 2 0 002-2v-4a2 2 0 00-2-2z" /></svg> }
                  @if(category.icon === 'Shopping') { <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" [class]="category.color" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg> }
                  @if(category.icon === 'Others') { <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" [class]="category.color" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg> }
                </div>
                <span class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ category.taskCount }} Tasks</span>
              </div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">{{ category.name }}</h3>
              <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div class="h-2 rounded-full" [class]="getCategoryProgressColor(category.color)" [style.width]="category.progress + '%'"></div>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- My Active Tasks Section -->
      <section>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">My Active Tasks</h2>
        @if(myTasks().length > 0) {
          <div class="flex overflow-x-auto space-x-6 pb-4 -mx-4 px-4">
            @for (task of myTasks(); track task.id) {
              <div class="flex-shrink-0 w-80">
                <app-task-card [task]="task" />
              </div>
            }
          </div>
        } @else {
          <div class="text-center p-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <p class="text-lg text-gray-700 dark:text-gray-300">You have no active tasks assigned to you. Great job!</p>
          </div>
        }
      </section>

      <!-- Today's & Upcoming Tasks Section -->
      <section class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Today's Tasks</h2>
            <a href="#all-tasks" (click)="scrollToAllTasks($event)" class="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">View All</a>
          </div>
          
          @if(todaysTasks().length > 0) {
            <div class="space-y-4">
              @for (task of todaysTasks(); track task.id) {
                <div [routerLink]="['/tasks', task.id]" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 p-4 flex items-center space-x-4 cursor-pointer">
                  <div class="flex-shrink-0">
                    <div class="h-12 w-12 rounded-full flex items-center justify-center border-2 text-gray-400 dark:text-gray-500" [class]="getPriorityBorder(task.priority)">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                    </div>
                  </div>
                  <div class="flex-grow min-w-0">
                    <p class="font-semibold text-gray-900 dark:text-white truncate">{{ task.title }}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      <span class="font-mono text-xs">#AJR-{{ formatTicketId(task.ticket_id) }}</span> &bull; {{ task.assigned_to_username }}
                    </p>
                  </div>
                  <div class="w-24 text-center flex-shrink-0">
                    <p class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ getCompletedSubtasks(task) }}/{{ task.subtasks.length }}</p>
                    <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 mt-1">
                      <div class="bg-primary-600 h-1.5 rounded-full" [style.width]="calculateSubtaskProgress(task) + '%'"></div>
                    </div>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="text-center p-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <p class="text-lg text-gray-700 dark:text-gray-300">No tasks for today. Enjoy your day!</p>
            </div>
          }
        </div>
        
        <div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Upcoming</h2>
          @if(upcomingTasks().length > 0) {
            <div class="space-y-4">
              @for (task of upcomingTasks(); track task.id) {
                <div [routerLink]="['/tasks', task.id]" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 p-4 flex items-center space-x-4 cursor-pointer">
                  <div class="flex-shrink-0">
                    <div class="h-12 w-12 rounded-full flex items-center justify-center border-2 text-gray-400 dark:text-gray-500" [class]="getPriorityBorder(task.priority)">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                  </div>
                  <div class="flex-grow min-w-0">
                    <p class="font-semibold text-gray-900 dark:text-white truncate">{{ task.title }}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      <span class="font-mono text-xs">#AJR-{{ formatTicketId(task.ticket_id) }}</span> &bull; Due: {{ task.due_date | date }}
                    </p>
                  </div>
                  <div class="text-right flex-shrink-0">
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ task.assigned_to_username }}</p>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="text-center p-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <p class="text-lg text-gray-700 dark:text-gray-300">Nothing due in the next 7 days.</p>
            </div>
          }
        </div>
      </section>

      <!-- All Tasks & Filters Section -->
      <section id="all-tasks" class="pt-10">
        <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">All Tasks ({{ filteredTasks().length }})</h2>
        </div>

        <div class="flex flex-wrap gap-4 mb-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-inner items-end">
            <!-- Type Filter -->
            <div class="flex-1 min-w-[150px]">
                <label for="filter-type" class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Type</label>
                <select id="filter-type" [ngModel]="selectedType()" (ngModelChange)="selectedType.set($event)" class="w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors">
                    <option value="all">All Types</option>
                    @for (type of taskTypes; track type) {
                        <option [value]="type">{{ type }}</option>
                    }
                </select>
            </div>
            <!-- Status Filter -->
            <div class="flex-1 min-w-[150px]">
                <label for="filter-status" class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Status</label>
                <select id="filter-status" [ngModel]="selectedStatus()" (ngModelChange)="selectedStatus.set($event)" class="w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors">
                    <option value="all">All Statuses</option>
                    @for (status of statuses; track status) {
                        <option [value]="status">{{ status }}</option>
                    }
                </select>
            </div>
            <!-- Priority Filter -->
            <div class="flex-1 min-w-[150px]">
                <label for="filter-priority" class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Priority</label>
                <select id="filter-priority" [ngModel]="selectedPriority()" (ngModelChange)="selectedPriority.set($event)" class="w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors">
                    <option value="all">All Priorities</option>
                    @for (priority of priorities; track priority) {
                        <option [value]="priority">{{ priority }}</option>
                    }
                </select>
            </div>
            <!-- Assignee Filter -->
            <div class="flex-1 min-w-[150px]">
                <label for="filter-assignee" class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Assignee</label>
                <select id="filter-assignee" [ngModel]="selectedAssignee()" (ngModelChange)="selectedAssignee.set($event)" class="w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors">
                    <option value="all">All Assignees</option>
                    @for (user of users(); track user.id) {
                        <option [value]="user.id">{{ user.username }}</option>
                    }
                </select>
            </div>
            <!-- Reset Button -->
            <div class="flex-shrink-0">
                <button (click)="resetFilters()" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors">
                  Reset
                </button>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (task of filteredTasks(); track task.id) {
                <app-task-card [task]="task" />
            }
            @empty {
                <div class="col-span-full text-center p-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <p class="text-lg text-gray-700 dark:text-gray-300">No tasks match your filters.</p>
                </div>
            }
        </div>
      </section>
  </div>
}
  `,
  styles: [`
    .wave {
        animation-name: wave-animation;
        animation-duration: 2.5s;
        animation-iteration-count: infinite;
        transform-origin: 70% 70%;
        display: inline-block;
    }

    @keyframes wave-animation {
        0% { transform: rotate(0.0deg) }
        10% { transform: rotate(14.0deg) }
        20% { transform: rotate(-8.0deg) }
        30% { transform: rotate(14.0deg) }
        40% { transform: rotate(-4.0deg) }
        50% { transform: rotate(10.0deg) }
        60% { transform: rotate(0.0deg) }
        100% { transform: rotate(0.0deg) }
    }
  `]
})
export class TaskListComponent implements AfterViewInit {
  taskService = inject(TaskService);
  authService = inject(AuthService);
  supabaseService = inject(SupabaseService);
  searchService = inject(SearchService);
  route = inject(ActivatedRoute);

  currentUser = this.authService.currentUser;
  allTasks = this.taskService.tasks;
  loading = this.taskService.loading;
  users = this.taskService.users;

  // Global search term from service
  globalSearchTerm = this.searchService.searchTerm;

  // Filter state
  selectedStatus = signal<TaskStatus | 'all'>('all');
  selectedPriority = signal<TaskPriority | 'all'>('all');
  selectedAssignee = signal<string | 'all'>('all');
  selectedType = signal<TaskType | 'all'>('all');

  // Filter options
  statuses: TaskStatus[] = ['todo', 'in-progress', 'review', 'completed'];
  priorities: TaskPriority[] = ['Low', 'Medium', 'High', 'Urgent'];
  taskTypes: TaskType[] = ['Task', 'Order', 'Bugfix', 'Shopping', 'Others'];

  ngAfterViewInit() {
    this.route.fragment.subscribe(fragment => {
      if (fragment) {
        // Use a small timeout to ensure the element is rendered
        setTimeout(() => this.scrollTo(fragment), 100);
      }
    });
  }

  // Computed filtered tasks
  filteredTasks = computed(() => {
    const text = this.globalSearchTerm().toLowerCase();
    const status = this.selectedStatus();
    const priority = this.selectedPriority();
    const assignee = this.selectedAssignee();
    const type = this.selectedType();

    return this.allTasks().filter(task => {
      const matchesText = text 
        ? (task.title.toLowerCase().includes(text) || (task.description && task.description.toLowerCase().includes(text))) 
        : true;
      const matchesStatus = status !== 'all' ? task.status === status : true;
      const matchesPriority = priority !== 'all' ? task.priority === priority : true;
      const matchesAssignee = assignee !== 'all' ? task.assign_to === assignee : true;
      const matchesType = type !== 'all' ? task.type === type : true;
      return matchesText && matchesStatus && matchesPriority && matchesAssignee && matchesType;
    });
  });
  
  resetFilters(): void {
    this.searchService.searchTerm.set('');
    this.selectedStatus.set('all');
    this.selectedPriority.set('all');
    this.selectedAssignee.set('all');
    this.selectedType.set('all');
  }

  private scrollTo(elementId: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  scrollToAllTasks(event: Event): void {
    event.preventDefault();
    this.scrollTo('all-tasks');
  }

  filterByCategory(type: TaskType): void {
    this.selectedType.set(type);
    // Reset other filters for a clean category view
    this.searchService.searchTerm.set('');
    this.selectedStatus.set('all');
    this.selectedPriority.set('all');
    this.selectedAssignee.set('all');
    this.scrollTo('all-tasks');
  }
  
  private categoryStyles: { [key in TaskType]: { icon: TaskType; color: string; bgColor: string; } } = {
    'Task': { icon: 'Task', color: 'text-indigo-500', bgColor: 'bg-indigo-100 dark:bg-indigo-900/50' },
    'Order': { icon: 'Order', color: 'text-teal-500', bgColor: 'bg-teal-100 dark:bg-teal-900/50' },
    'Bugfix': { icon: 'Bugfix', color: 'text-rose-500', bgColor: 'bg-rose-100 dark:bg-rose-900/50' },
    'Shopping': { icon: 'Shopping', color: 'text-amber-500', bgColor: 'bg-amber-100 dark:bg-amber-900/50' },
    'Others': { icon: 'Others', color: 'text-gray-500', bgColor: 'bg-gray-100 dark:bg-gray-600' },
  };

  taskCategories = computed(() => {
    const tasks = this.allTasks();
    // Group existing tasks by type and count totals/completed
    const groupedByTaskType = tasks.reduce((acc, task) => {
      const type = task.type || 'Others';
      if (!acc[type]) {
        acc[type] = { total: 0, completed: 0 };
      }
      acc[type].total++;
      if (task.status === 'completed') {
        acc[type].completed++;
      }
      return acc;
    }, {} as Record<TaskType, { total: number; completed: number }>);

    // Map over the canonical list of all possible task types to ensure all are displayed
    return this.taskTypes.map(type => {
      const counts = groupedByTaskType[type] || { total: 0, completed: 0 };
      const progress = counts.total > 0 ? (counts.completed / counts.total) * 100 : 0;
      return {
        name: type,
        taskCount: counts.total,
        progress: Math.round(progress),
        ...this.categoryStyles[type]
      };
    }).sort((a, b) => b.taskCount - a.taskCount);
  });
  
  myTasks = computed(() => {
    const userId = this.currentUser()?.profile?.id;
    if (!userId) return [];
    return this.allTasks()
      .filter(task => task.assign_to === userId && task.status !== 'completed')
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  });

  welcomeMessage = computed(() => {
    const taskCount = this.myTasks().length;
    if (taskCount === 0) {
        return "You have no active tasks. Great job clearing your list! Ready to take on something new? 🚀";
    }
    if (taskCount === 1) {
        return "Let's rock today! You have one task on your plate. You've got this! 💪";
    }
    if (taskCount > 1 && taskCount <= 5) {
        return `You have ${taskCount} tasks today. Let's get them done and make it a productive day! 🔥`;
    }
    return `It's a busy day with ${taskCount} tasks ahead. Let's start rocking and get things done! ✨`;
  });

  todaysTasks = computed(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return this.allTasks().filter(task => task.due_date === todayStr);
  });

  upcomingTasks = computed(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayStr = today.toISOString().split('T')[0];
    
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];
    
    return this.allTasks().filter(task => 
        task.due_date > todayStr && 
        task.due_date <= nextWeekStr
    ).sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  });

  formatTicketId(id: number): string {
    if (id === null || id === undefined) return '----';
    return id.toString().padStart(4, '0');
  }

  getCompletedSubtasks(task: Task): number {
    if (!task.subtasks) return 0;
    return task.subtasks.filter(st => st.completed).length;
  }

  calculateSubtaskProgress(task: Task): number {
    if (!task.subtasks || task.subtasks.length === 0) return 0;
    const completed = this.getCompletedSubtasks(task);
    return (completed / task.subtasks.length) * 100;
  }

  getCategoryProgressColor(textColor: string): string {
    return textColor.replace('text-', 'bg-');
  }
  
  getPriorityBorder(priority: TaskPriority): string {
    switch (priority) {
      case 'Urgent': return 'border-red-500';
      case 'High': return 'border-orange-500';
      case 'Medium': return 'border-yellow-500';
      case 'Low': return 'border-green-500';
      default: return 'border-gray-300 dark:border-gray-600';
    }
  }
}