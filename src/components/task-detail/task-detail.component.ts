
import { Component, inject, computed, signal, effect } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { Task, Subtask, Comment, Attachment, TaskStatus, User, AuthenticatedUser } from '../../shared/interfaces';
import { HistoryTimelineComponent } from '../history-timeline/history-timeline.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SkeletonLoaderComponent } from '../skeleton-loader/skeleton-loader.component';
import { PermissionService } from '../../services/permission.service';
import { ProjectService } from '../../services/project.service';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, RouterLink, HistoryTimelineComponent, SkeletonLoaderComponent],
  template: `
<div class="container mx-auto p-4 my-8">
  @if (loading()) {
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
      <div class="flex justify-between items-center mb-6">
        <app-skeleton-loader height="36px" width="60%"/>
        <app-skeleton-loader height="40px" width="100px"/>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 space-y-6">
          <app-skeleton-loader height="200px"/>
          <app-skeleton-loader height="150px"/>
          <app-skeleton-loader height="200px"/>
        </div>
        <div class="lg:col-span-1">
          <app-skeleton-loader height="400px"/>
        </div>
      </div>
    </div>
  } @else if (task()) {
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 sm:p-6">
      <div class="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
        <div class="flex items-baseline gap-3 flex-wrap">
            <h2 class="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">{{ task()!.title }}</h2>
            @if(task()!.ticket_id) {
              <span class="text-xl sm:text-2xl font-mono text-gray-400 dark:text-gray-500">#AJR-{{ formatTicketId(task()!.ticket_id) }}</span>
            }
        </div>
        <div class="flex flex-wrap gap-3 self-start sm:self-center">
          @if (canEditContent()) {
            <a [routerLink]="['/tasks', task()!.id, 'edit']"
               class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md flex items-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit
            </a>
          }
          @if (canDelete()) {
            <button (click)="deleteTask()"
                    class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          }
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 space-y-6">
          <!-- Main Details -->
          <div class="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow-md">
            <p class="text-gray-700 dark:text-gray-300 text-lg mb-4">{{ task()!.description }}</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div class="flex items-center space-x-2"><span class="font-semibold text-gray-800 dark:text-gray-200">Type:</span><span class="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-xs font-medium">{{ task()!.type }}</span></div>
              @if (project()) {
                <div class="flex items-center space-x-2">
                  <span class="font-semibold text-gray-800 dark:text-gray-200">Project:</span>
                  <a [routerLink]="['/projects', project()!.id]" class="text-primary-600 dark:text-primary-400 hover:underline">
                    {{ project()!.name }}
                  </a>
                </div>
              }
              <div class="flex items-center space-x-2"><span class="font-semibold text-gray-800 dark:text-gray-200">Priority:</span><span class="px-2 py-1 rounded-full text-xs font-medium" [class]="getPriorityClasses(task()!.priority)">{{ task()!.priority }}</span></div>
              <div class="flex items-center space-x-2"><span class="font-semibold text-gray-800 dark:text-gray-200">Status:</span><span class="px-2 py-1 rounded-full text-xs font-medium" [class]="getStatusClasses(task()!.status)">{{ task()!.status | uppercase }}</span></div>
              <div class="flex items-center space-x-2"><span class="font-semibold text-gray-800 dark:text-gray-200">Assigned To:</span><span class="text-gray-600 dark:text-gray-400">{{ task()!.assigned_to_username }}</span></div>
              <div class="flex items-center space-x-2"><span class="font-semibold text-gray-800 dark:text-gray-200">Assigned By:</span><span class="text-gray-600 dark:text-gray-400">{{ task()!.assigned_by_username }}</span></div>
              <div class="flex items-center space-x-2"><span class="font-semibold text-gray-800 dark:text-gray-200">Duration:</span><span class="text-gray-600 dark:text-gray-400">{{ task()!.duration || 'N/A' }}</span></div>
              <div class="flex items-center space-x-2"><span class="font-semibold text-gray-800 dark:text-gray-200">Start Date:</span><span class="text-gray-600 dark:text-gray-400">{{ task()!.start_date | date }}</span></div>
              <div class="flex items-center space-x-2"><span class="font-semibold text-gray-800 dark:text-gray-200">Due Date:</span><span class="text-gray-600 dark:text-gray-400">{{ task()!.due_date | date }}</span></div>
              <div class="flex items-center space-x-2"><span class="font-semibold text-gray-800 dark:text-gray-200">Created At:</span><span class="text-gray-600 dark:text-gray-400">{{ task()!.created_at | date:'medium' }}</span></div>
              <div class="flex items-center space-x-2"><span class="font-semibold text-gray-800 dark:text-gray-200">Last Updated By:</span><span class="text-gray-600 dark:text-gray-400">{{ task()!.updated_by_username }}</span></div>
              <div class="flex items-center space-x-2"><span class="font-semibold text-gray-800 dark:text-gray-200">Approval:</span>
                @if (task()!.approval_required) { <span class="px-2 py-1 rounded-full text-xs font-medium" [class]="getApprovalStatusClasses(task()!.approval_status)">{{ task()!.approval_status || 'N/A' }}</span> }
                @else { <span class="text-gray-600 dark:text-gray-400">Not Required</span> }
              </div>
              <div class="flex items-center space-x-2"><span class="font-semibold text-gray-800 dark:text-gray-200">Likes:</span><span class="text-gray-600 dark:text-gray-400">{{ task()!.like_count }}</span></div>
              <div class="flex items-center space-x-2"><span class="font-semibold text-gray-800 dark:text-gray-200">Reminder:</span><span class="text-gray-600 dark:text-gray-400">{{ task()!.reminder_option }}</span></div>
              <div class="flex items-center space-x-2"><span class="font-semibold text-gray-800 dark:text-gray-200">Repeat:</span><span class="text-gray-600 dark:text-gray-400">{{ task()!.repeat_option }}</span></div>
            </div>
            @if (task()!.tags && task()!.tags.length > 0) {
              <div class="mt-4 flex flex-wrap gap-2">
                @for (tag of task()!.tags; track tag) { <span class="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium">{{ tag }}</span> }
              </div>
            }
          </div>

          <!-- Actions Panel -->
          <div class="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow-md">
            <h3 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Actions</h3>
            <div class="flex flex-wrap gap-3">
              @if (canChangeStatus()) {
                <button (click)="markTaskStatus('in-progress')" [disabled]="task()!.status === 'in-progress'" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">Mark In Progress</button>
                <button (click)="markTaskStatus('review')" [disabled]="task()!.status === 'review'" class="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors">Mark For Review</button>
                <button (click)="markTaskStatus('completed')" [disabled]="task()!.status === 'completed'" class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors">Mark Completed</button>
                <button (click)="markTaskStatus('todo')" [disabled]="task()!.status === 'todo'" class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors">Mark To Do</button>
              }
              @if (canApproveReject()) {
                <button (click)="approveTask()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors">Approve</button>
                <button (click)="rejectTask()" class="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-colors">Reject</button>
              }
              <button (click)="toggleLikeTask()" [disabled]="isViewer()" class="px-4 py-2 text-white rounded-md flex items-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      [class.bg-pink-500]="hasLiked()" [class.hover:bg-pink-600]="hasLiked()"
                      [class.bg-gray-400]="!hasLiked()" [class.hover:bg-gray-500]="!hasLiked()">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" /></svg>
                Like ({{ task()!.like_count }})
              </button>
            </div>
            @if (canAssignTasks()) {
              <div class="mt-4 flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                <label for="reassign_user" class="text-sm font-medium text-gray-700 dark:text-gray-300">Reassign To:</label>
                <select id="reassign_user" [ngModel]="selectedAssigneeId()" (ngModelChange)="selectedAssigneeId.set($event)" class="flex-grow sm:max-w-xs w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors">
                  <option value="">Select User</option>
                  @for (user of users(); track user.id) { <option [value]="user.id">{{ user.username }}</option> }
                </select>
                <button (click)="reassignTask()" [disabled]="!selectedAssigneeId()" class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors">Reassign</button>
              </div>
            }
          </div>

          <!-- Tabbed Interface for Mobile/Tablet -->
          <div class="lg:hidden">
            <div class="border-b border-gray-200 dark:border-gray-700">
                <nav class="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                    <button (click)="activeTab.set('subtasks')" [class]="getTabClass('subtasks')" class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">Subtasks <span [class]="getTabBadgeClass('subtasks')">{{ task()!.subtasks.length }}</span></button>
                    <button (click)="activeTab.set('comments')" [class]="getTabClass('comments')" class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">Comments <span [class]="getTabBadgeClass('comments')">{{ comments().length }}</span></button>
                    <button (click)="activeTab.set('attachments')" [class]="getTabClass('attachments')" class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">Attachments <span [class]="getTabBadgeClass('attachments')">{{ attachments().length }}</span></button>
                    <button (click)="activeTab.set('history')" [class]="getTabClass('history')" class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">History <span [class]="getTabBadgeClass('history')">{{ history().length }}</span></button>
                </nav>
            </div>
            <div class="mt-6">
                @if (activeTab() === 'subtasks') { <ng-container *ngTemplateOutlet="subtasksContent"></ng-container> }
                @if (activeTab() === 'comments') { <ng-container *ngTemplateOutlet="commentsContent"></ng-container> }
                @if (activeTab() === 'attachments') { <ng-container *ngTemplateOutlet="attachmentsContent"></ng-container> }
                @if (activeTab() === 'history') { <app-history-timeline [history]="history()" /> }
            </div>
          </div>
          
          <!-- Regular Layout for Desktop -->
          <div class="hidden lg:block space-y-6">
             <ng-container *ngTemplateOutlet="subtasksContent"></ng-container>
             <ng-container *ngTemplateOutlet="commentsContent"></ng-container>
             <ng-container *ngTemplateOutlet="attachmentsContent"></ng-container>
          </div>
        </div>
        
        <!-- History Sidebar for Desktop -->
        <div class="hidden lg:block lg:col-span-1">
          <div class="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow-md sticky top-4">
            <h3 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">History Log</h3>
            <app-history-timeline [history]="history()" />
          </div>
        </div>
      </div>
    </div>
  } @else {
    <div class="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
      <p class="text-xl text-gray-700 dark:text-gray-300">Task not found or ID is invalid.</p>
      <button (click)="router.navigateByUrl('/tasks')" class="mt-6 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors">Back to Task List</button>
    </div>
  }
</div>

<!-- Attachment Preview Modal -->
@if (showPreviewModal() && currentPreviewUrl()) {
  <div class="fixed inset-0 bg-black bg-opacity-75 z-[100] flex justify-center items-center p-4" (click)="closePreviewModal()">
    <div class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-full max-h-[90vh] flex flex-col" (click)="$event.stopPropagation()">
      <div class="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <h4 class="text-lg font-semibold text-gray-900 dark:text-white truncate">{{ currentPreviewFileName() }}</h4>
        <button (click)="closePreviewModal()" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="flex-grow p-4 overflow-auto flex justify-center items-center">
        @if (currentPreviewType() === 'image') {
          <img [src]="currentPreviewUrl()" alt="Attachment Preview" class="max-w-full max-h-full object-contain rounded-md">
        } @else if (currentPreviewType() === 'video') {
          <video [src]="currentPreviewUrl()" controls class="max-w-full max-h-full rounded-md"></video>
        } @else if (currentPreviewType() === 'audio') {
          <audio [src]="currentPreviewUrl()" controls class="w-full max-w-md"></audio>
        } @else if (currentPreviewType() === 'pdf') {
          <iframe [src]="currentPreviewUrl()" class="w-full h-full border-none rounded-md" loading="lazy">
            This browser does not support PDFs. Please <a [href]="currentPreviewUrl()" target="_blank" class="text-primary-600 hover:underline">download the PDF</a> to view it.
          </iframe>
        } @else if (currentPreviewType() === 'text') {
          <iframe [src]="currentPreviewUrl()" class="w-full h-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" loading="lazy">
            Your browser does not support embedded text files.
          </iframe>
        } @else {
          <div class="text-center p-4 text-gray-500 dark:text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1"><path stroke-linecap="round" stroke-linejoin="round" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
            <p class="mt-2">No direct preview available for this file type.</p>
            <a [href]="currentPreviewUrl()" target="_blank" download class="mt-1 text-primary-600 hover:underline dark:text-primary-400">Download {{ currentPreviewFileName() }}</a>
          </div>
        }
      </div>
    </div>
  </div>
}

<!-- Reusable Content Templates -->
<ng-template #subtasksContent>
  <div class="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow-md">
    <h3 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Subtasks</h3>
    @if (task()!.subtasks.length > 0) {
      <div class="mb-4">
        <div class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Progress: {{ progressPercentage() | number:'1.0-0' }}%</div>
        <div class="progress-bar"><div class="progress-fill" [style.width]="progressPercentage() + '%'"></div></div>
      </div>
      <ul class="space-y-2">
        @for (subtask of task()!.subtasks; track subtask.id) {
          <li class="flex items-center">
            <input type="checkbox" [checked]="subtask.completed" (change)="toggleSubtaskCompletion(subtask.id)" [disabled]="!canChangeStatus()" class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            <span class="ml-3 text-gray-700 dark:text-gray-300" [class.line-through]="subtask.completed">{{ subtask.title }}</span>
          </li>
        }
      </ul>
    } @else { <p class="text-gray-500 dark:text-gray-400">No subtasks defined.</p> }
  </div>
</ng-template>

<ng-template #commentsContent>
  <div class="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow-md">
    <h3 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Comments</h3>
    @if (canAddCommentAttachment()) {
      <div class="mb-6">
        <textarea [ngModel]="newCommentText()" (ngModelChange)="newCommentText.set($event)" rows="3" placeholder="Add a comment..." class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors" [disabled]="isSubmittingComment()"></textarea>
        <button (click)="addComment()" [disabled]="isSubmittingComment() || !newCommentText()" class="mt-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
           @if(isSubmittingComment()){ Posting... } @else { Post Comment }
        </button>
      </div>
    }
    @if (comments().length > 0) {
      <ul class="space-y-4">
        @for (comment of comments(); track comment.id) {
          <li class="border-b border-gray-200 dark:border-gray-600 pb-4 last:border-b-0">
            <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-1">
              <span class="font-medium text-gray-800 dark:text-gray-200">{{ comment.username }}</span>
              <span>{{ comment.createdAt | date:'short' }}</span>
            </div>
            <p class="text-gray-700 dark:text-gray-300">{{ comment.text }}</p>
          </li>
        }
      </ul>
    } @else { <p class="text-gray-500 dark:text-gray-400">No comments yet.</p> }
  </div>
</ng-template>

<ng-template #attachmentsContent>
  <div class="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow-md">
    <h3 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Attachments</h3>
    @if (canAddCommentAttachment()) {
      <div class="mb-6 flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
        <input type="file" (change)="onFileSelected($event)" id="file-upload" class="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-800 dark:file:text-white transition-colors" [disabled]="isUploadingFile()">
        <button (click)="uploadAttachment()" [disabled]="!selectedFile || isUploadingFile()" class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors">
          @if(isUploadingFile()){ Uploading... } @else { Upload }
        </button>
      </div>
    }
    @if (attachments().length > 0) {
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (attachment of attachments(); track attachment.id) {
          <div class="bg-gray-100 dark:bg-gray-700 rounded-lg shadow-sm p-4 flex flex-col justify-between">
            <div class="flex items-center justify-center h-20 w-full mb-3 text-primary-500 dark:text-primary-400">
              @if (getIconForFileType(attachment.fileName) === 'image') {
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              } @else if (getIconForFileType(attachment.fileName) === 'pdf') {
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
              } @else if (getIconForFileType(attachment.fileName) === 'video') {
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              } @else if (getIconForFileType(attachment.fileName) === 'audio') {
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19V6l12-3v14M9 19c-1.105 0-2 .895-2 2s.895 2 2 2 2-.895 2-2-.895-2-2-2zm0 0H7m2 0H5m0 0a2 2 0 110 4 2 2 0 010-4zm12 0H9" /></svg>
              } @else if (getIconForFileType(attachment.fileName) === 'text') {
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 2H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              } @else {
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              }
            </div>
            <p class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate mb-2 text-center">{{ attachment.fileName }}</p>
            <div class="flex justify-around space-x-2 text-sm">
              <button (click)="openPreviewModal(attachment)" class="flex-1 px-3 py-1 bg-primary-100 hover:bg-primary-200 dark:bg-primary-800 dark:hover:bg-primary-700 text-primary-700 dark:text-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors">
                Preview
              </button>
              <a [href]="attachment.file_base64" [download]="attachment.fileName" class="flex-1 px-3 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors">
                Download
              </a>
            </div>
          </div>
        }
      </div>
    } @else { <p class="text-gray-500 dark:text-gray-400">No attachments yet.</p> }
  </div>
</ng-template>

  `,
  styles: [`
    .progress-bar { height: 8px; border-radius: 9999px; background-color: #e5e7eb; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 9999px; background-color: rgb(var(--color-primary-600)); transition: width 0.3s ease-in-out; }
  `]
})
export class TaskDetailComponent {
  route: ActivatedRoute = inject(ActivatedRoute);
  router: Router = inject(Router);
  taskService: TaskService = inject(TaskService);
  authService: AuthService = inject(AuthService);
  notificationService: NotificationService = inject(NotificationService);
  sanitizer: DomSanitizer = inject(DomSanitizer);
  permissionService = inject(PermissionService);
  projectService = inject(ProjectService);

  taskId = signal<string | null>(null);
  loading = signal(true);
  isSubmittingComment = signal(false);
  isUploadingFile = signal(false);
  activeTab = signal<'subtasks' | 'comments' | 'attachments' | 'history'>('subtasks');

  task = computed(() => {
    const id = this.taskId();
    return id ? this.taskService.getTaskById(id)() : undefined;
  });
  project = computed(() => {
    const projId = this.task()?.project_id;
    if (!projId) return undefined;
    return this.projectService.getProjectById(projId)();
  });
  comments = computed(() => this.taskId() ? this.taskService.getCommentsForTask(this.taskId()!)() : []);
  attachments = computed(() => this.taskId() ? this.taskService.getAttachmentsForTask(this.taskId()!)() : []);
  history = computed(() => this.taskId() ? this.taskService.getHistoryForTask(this.taskId()!)() : []);
  users = this.taskService.users;
  currentUser = this.authService.currentUser;

  newCommentText = signal('');
  selectedFile: File | null = null;
  selectedAssigneeId = signal<string>('');

  showPreviewModal = signal(false);
  currentPreviewUrl = signal<SafeResourceUrl | string | null>(null);
  currentPreviewType = signal<'image' | 'video' | 'audio' | 'pdf' | 'text' | 'other' | null>(null);
  currentPreviewFileName = signal<string | null>(null);
  
  isViewer = computed(() => this.authService.isViewer());
  canEditContent = computed(() => !this.isViewer() && (this.task() ? this.taskService.canEditTask(this.task()!) : false));
  canDelete = computed(() => !this.isViewer() && (this.task() ? this.taskService.canDeleteTask(this.task()!) : false));
  canChangeStatus = this.permissionService.canChangeStatus;
  canAssignTasks = this.permissionService.canAssignTasks;
  canApproveReject = computed(() => !this.isViewer() && (this.task() ? this.taskService.canApproveReject(this.task()!) : false));
  canAddCommentAttachment = this.permissionService.canAddCommentAttachment;

  hasLiked = computed(() => {
    const userId = this.authService.currentUser()?.profile?.id;
    if (!userId || !this.task()) return false;
    return this.task()!.liked_by_users.includes(userId);
  });


  constructor() {
    this.route.paramMap.subscribe(params => {
        this.taskId.set(params.get('id'));
    });

    effect(() => {
      const id = this.taskId();
      if (id) {
        this.loadTaskDetails(id);
      } else {
        this.loading.set(false);
      }
    }, { allowSignalWrites: true });
  }
  
  private async loadTaskDetails(id: string): Promise<void> {
    this.loading.set(true);
    try {
      await Promise.all([
        this.taskService.fetchCommentsForTask(id),
        this.taskService.fetchAttachmentsForTask(id),
        this.taskService.fetchHistoryForTask(id),
      ]);
    } catch (error) {
      this.notificationService.showToast('Failed to load task details.', 'error');
      console.error('Error fetching task details', error);
    } finally {
      this.loading.set(false);
    }
  }

  progressPercentage = computed(() => {
    const t = this.task();
    if (!t || t.subtasks.length === 0) return 0;
    const completed = t.subtasks.filter(st => st.completed).length;
    return (completed / t.subtasks.length) * 100;
  });

  formatTicketId(id: number): string {
    if (id === null || id === undefined) return '----';
    return id.toString().padStart(4, '0');
  }

  async addComment(): Promise<void> {
    const taskId = this.taskId();
    if (!taskId || !this.newCommentText().trim()) return;

    this.isSubmittingComment.set(true);
    try {
      await this.taskService.addComment(taskId, this.newCommentText());
      this.newCommentText.set('');
    } finally {
      this.isSubmittingComment.set(false);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
    }
  }

  async uploadAttachment(): Promise<void> {
    const taskId = this.taskId();
    if (!taskId || !this.selectedFile) return;

    this.isUploadingFile.set(true);
    
    const reader = new FileReader();
    reader.onload = async (e: any) => {
      try {
        const fileBase64 = e.target.result;
        await this.taskService.addAttachment(taskId, this.selectedFile!.name, fileBase64);
        this.selectedFile = null;
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } catch (error) {
        // Error is handled in the service
      } finally {
        this.isUploadingFile.set(false);
      }
    };
    reader.onerror = (error) => {
      this.notificationService.showToast('Failed to read file for upload.', 'error');
      console.error('FileReader error:', error);
      this.isUploadingFile.set(false);
    };
    reader.readAsDataURL(this.selectedFile);
  }

  async deleteTask(): Promise<void> {
    const taskId = this.taskId();
    if (!taskId) return;
    if (confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      await this.taskService.deleteTask(taskId);
      this.router.navigateByUrl('/tasks');
    }
  }

  markTaskStatus(status: TaskStatus): void { if (this.taskId()) this.taskService.updateTaskStatus(this.taskId()!, status); }
  approveTask(): void { if (this.taskId()) this.taskService.approveTask(this.taskId()!); }
  rejectTask(): void { if (this.taskId()) this.taskService.rejectTask(this.taskId()!); }
  toggleLikeTask(): void { if (this.taskId()) this.taskService.toggleLikeTask(this.taskId()!); }
  reassignTask(): void { if (this.taskId() && this.selectedAssigneeId()) this.taskService.reassignTask(this.taskId()!, this.selectedAssigneeId()); }
  toggleSubtaskCompletion(subtaskId: string): void { if (this.taskId()) this.taskService.toggleSubtask(this.taskId()!, subtaskId); }

  private _getPreviewType(fileName: string): 'image' | 'video' | 'audio' | 'pdf' | 'text' | 'other' {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(extension)) return 'image';
    if (['mp4', 'webm', 'ogg'].includes(extension)) return 'video';
    if (['mp3', 'wav', 'ogg'].includes(extension)) return 'audio';
    if (extension === 'pdf') return 'pdf';
    if (['txt', 'md', 'json', 'xml', 'html', 'css', 'js'].includes(extension)) return 'text';
    return 'other';
  }

  openPreviewModal(attachment: Attachment): void {
    const fileType = this._getPreviewType(attachment.fileName);
    this.currentPreviewType.set(fileType);
    this.currentPreviewFileName.set(attachment.fileName);
    
    if (fileType === 'pdf' || fileType === 'text') {
      this.currentPreviewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(attachment.file_base64));
    } else {
      this.currentPreviewUrl.set(attachment.file_base64);
    }

    this.showPreviewModal.set(true);
  }

  closePreviewModal(): void {
    this.showPreviewModal.set(false);
    this.currentPreviewUrl.set(null);
    this.currentPreviewType.set(null);
    this.currentPreviewFileName.set(null);
  }

  getIconForFileType(fileName: string): string { return this._getPreviewType(fileName); }
  getTabClass(tabName: 'subtasks' | 'comments' | 'attachments' | 'history'): string { return this.activeTab() === tabName ? 'border-primary-500 text-primary-600 dark:border-primary-400 dark:text-primary-300' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'; }
  getTabBadgeClass(tabName: 'subtasks' | 'comments' | 'attachments' | 'history'): string { return this.activeTab() === tabName ? 'bg-primary-100 text-primary-600 dark:bg-primary-800 dark:text-primary-200 ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium' : 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-200 ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium'; }
  getPriorityClasses(priority: string): string { switch (priority) { case 'Urgent': return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'; case 'High': return 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100'; case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'; case 'Low': return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'; default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'; } }
  getStatusClasses(status: string): string { switch (status) { case 'todo': return 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200'; case 'in-progress': return 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200'; case 'review': return 'bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-purple-200'; case 'completed': return 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200'; default: return 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200'; } }
  getApprovalStatusClasses(status: string | null): string { switch (status) { case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'; case 'Approved': return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'; case 'Rejected': return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'; default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'; } }
}