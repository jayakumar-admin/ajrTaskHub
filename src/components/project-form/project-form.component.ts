
import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { Project } from '../../shared/interfaces';

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container mx-auto p-4 max-w-2xl">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl my-8 p-6">
        <h2 class="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
          {{ isEditMode ? 'Edit Project' : 'Create New Project' }}
        </h2>
        <form [formGroup]="projectForm" (ngSubmit)="onSubmit()" class="space-y-6">
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Project Name <span class="text-red-500">*</span></label>
            <input type="text" id="name" formControlName="name" class="form-input">
            @if (projectForm.get('name')?.invalid && projectForm.get('name')?.touched) {
              <p class="mt-1 text-sm text-red-500">Project name is required.</p>
            }
          </div>
          <div>
            <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <textarea id="description" formControlName="description" rows="4" class="form-input"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Include Users</label>
            <div formGroupName="members" class="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg max-h-60 overflow-y-auto">
              @for (user of users(); track user.id) {
                @if(membersFormGroup.controls[user.id]) {
                  <div class="flex items-center">
                    <input [id]="'user-' + user.id" type="checkbox" [formControlName]="user.id" class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700">
                    <label [for]="'user-' + user.id" class="ml-2 text-sm text-gray-900 dark:text-gray-300">{{ user.username }}</label>
                  </div>
                }
              }
            </div>
          </div>
          <div class="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" (click)="router.navigateByUrl('/projects')" class="form-cancel-button">Cancel</button>
            <button type="submit" [disabled]="projectForm.invalid" class="form-submit-button">{{ isEditMode ? 'Update Project' : 'Create Project' }}</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .form-input { @apply mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors; }
    .form-submit-button { @apply inline-flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors; }
    .form-cancel-button { @apply px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors; }
  `]
})
export class ProjectFormComponent {
  // FIX: Added explicit type for FormBuilder
  fb: FormBuilder = inject(FormBuilder);
  router = inject(Router);
  route = inject(ActivatedRoute);
  projectService = inject(ProjectService);
  userService = inject(UserService);
  authService = inject(AuthService);

  projectId = signal<string | null>(null);
  projectToEdit = computed(() => {
    const id = this.projectId();
    return id ? this.projectService.getProjectById(id)() : undefined;
  });
  
  users = computed(() => {
      // Exclude the current user from the list of users that can be unchecked
      const currentUserId = this.authService.currentUser()?.profile.id;
      return this.userService.users().filter(u => u.id !== currentUserId);
  });
  isEditMode = false;

  projectForm = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    members: this.fb.group({})
  });
  
  get membersFormGroup() {
    return this.projectForm.get('members') as FormGroup;
  }

  constructor() {
    this.route.paramMap.subscribe(params => {
      this.projectId.set(params.get('id'));
    });

    effect(() => {
        const userList = this.users();
        const membersGroup = this.membersFormGroup;

        // Clear existing controls
        Object.keys(membersGroup.controls).forEach(key => membersGroup.removeControl(key));

        // Add controls for each user
        userList.forEach(user => {
            membersGroup.addControl(user.id, this.fb.control(false));
        });
    });

    effect(() => {
        const project = this.projectToEdit();
        if (project) {
            this.isEditMode = true;
            this.projectForm.patchValue({
                name: project.name,
                description: project.description
            });
            const memberBooleans: { [key: string]: boolean } = {};
            project.member_ids.forEach(id => {
              if (this.membersFormGroup.controls[id]) {
                memberBooleans[id] = true;
              }
            });
            this.membersFormGroup.patchValue(memberBooleans);
        } else {
            this.isEditMode = false;
            this.projectForm.reset();
        }
    });
  }

  onSubmit(): void {
    if (this.projectForm.invalid) return;
    
    const formValue = this.projectForm.value;
    const memberIds = Object.entries(formValue.members || {})
      .filter(([, isMember]) => isMember)
      .map(([userId]) => userId);

    if (this.isEditMode && this.projectId()) {
      this.projectService.updateProject(this.projectId()!, formValue.name!, formValue.description || '', memberIds);
    } else {
      this.projectService.createProject(formValue.name!, formValue.description || '', memberIds);
    }
  }
}
