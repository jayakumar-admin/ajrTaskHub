import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { PersonalTodo } from '../../shared/interfaces';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-personal-todo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 w-full md:w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">My To-Do List</h3>
      
      <!-- Add New Todo -->
      <div class="flex gap-2 mb-4">
        <input 
          type="text" 
          [(ngModel)]="newTodoText" 
          (keyup.enter)="addTodo()"
          placeholder="Add a new task..." 
          class="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
        >
        <button 
          (click)="addTodo()" 
          [disabled]="!newTodoText.trim()"
          class="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>

      <!-- Todo List -->
      <div class="max-h-60 overflow-y-auto space-y-2">
        @if (isLoading()) {
          <div class="flex justify-center py-4">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          </div>
        } @else if (todos().length === 0) {
          <p class="text-center text-gray-500 dark:text-gray-400 text-sm py-4">No tasks yet. Add one above!</p>
        } @else {
          @for (todo of todos(); track todo.id) {
            <div class="flex items-start justify-between group p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div class="flex items-start gap-3 flex-1 min-w-0">
                <button 
                  (click)="toggleTodo(todo)"
                  class="flex-shrink-0 w-5 h-5 mt-0.5 rounded border border-gray-300 dark:border-gray-500 flex items-center justify-center focus:outline-none transition-colors"
                  [class.bg-primary-500]="todo.is_completed"
                  [class.border-primary-500]="todo.is_completed"
                >
                  @if (todo.is_completed) {
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                  }
                </button>
                <span 
                  class="text-sm break-words transition-all duration-200"
                  [class.line-through]="todo.is_completed"
                  [class.text-gray-400]="todo.is_completed"
                  [class.text-gray-700]="!todo.is_completed"
                  [class.dark:text-gray-200]="!todo.is_completed"
                >
                  {{ todo.text }}
                </span>
              </div>
              <button 
                (click)="deleteTodo(todo.id)"
                class="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all duration-200 flex-shrink-0"
                title="Delete task"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          }
        }
      </div>
    </div>
  `
})
export class PersonalTodoComponent implements OnInit {
  apiService = inject(ApiService);
  notificationService = inject(NotificationService);
  
  todos = signal<PersonalTodo[]>([]);
  isLoading = signal(false);
  newTodoText = '';

  ngOnInit() {
    this.loadTodos();
  }

  async loadTodos() {
    this.isLoading.set(true);
    try {
      const data = await this.apiService.fetchTodos();
      this.todos.set(data);
    } catch (error) {
      console.error('Failed to load todos', error);
      // Silent fail for personal todos to not annoy user too much
    } finally {
      this.isLoading.set(false);
    }
  }

  async addTodo() {
    if (!this.newTodoText.trim()) return;
    
    const text = this.newTodoText;
    this.newTodoText = ''; // Optimistic clear
    
    try {
      const newTodo = await this.apiService.addTodo(text);
      this.todos.update(current => [newTodo, ...current]);
    } catch (error) {
      console.error('Failed to add todo', error);
      this.notificationService.showToast('Failed to add task', 'error');
      this.newTodoText = text; // Restore text on error
    }
  }

  async toggleTodo(todo: PersonalTodo) {
    // Optimistic update
    this.todos.update(current => 
      current.map(t => t.id === todo.id ? { ...t, is_completed: !t.is_completed } : t)
    );

    try {
      await this.apiService.updateTodo(todo.id, !todo.is_completed);
    } catch (error) {
      console.error('Failed to update todo', error);
      // Revert on error
      this.todos.update(current => 
        current.map(t => t.id === todo.id ? { ...t, is_completed: todo.is_completed } : t)
      );
    }
  }

  async deleteTodo(id: string) {
    // Optimistic update
    const previousTodos = this.todos();
    this.todos.update(current => current.filter(t => t.id !== id));

    try {
      await this.apiService.deleteTodo(id);
    } catch (error) {
      console.error('Failed to delete todo', error);
      this.todos.set(previousTodos); // Revert
      this.notificationService.showToast('Failed to delete task', 'error');
    }
  }
}
