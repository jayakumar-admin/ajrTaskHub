import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { Project } from '../../shared/interfaces';
import { ApiService } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';

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
            <label for="image" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Project Banner Image</label>
            <div class="mt-2 flex items-center gap-4">
                @if (imagePreviewUrl()) {
                    <img [src]="imagePreviewUrl()" alt="Project image preview" class="h-20 w-32 object-cover rounded-md">
                } @else {
                    <div class="h-20 w-32 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                }
                <input type="file" (change)="onFileSelected($event)" accept="image/*" class="form-file-input">
            </div>
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
            <button type="submit" [disabled]="projectForm.invalid || isUploading()" class="form-submit-button">{{ isUploading() ? 'Saving...' : (isEditMode ? 'Update Project' : 'Create Project') }}</button>
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
  fb: FormBuilder = inject(FormBuilder);
  router = inject(Router);
  route = inject(ActivatedRoute);
  projectService = inject(ProjectService);
  userService = inject(UserService);
  authService = inject(AuthService);
  apiService = inject(ApiService);
  notificationService = inject(NotificationService);

  projectId = signal<string | null>(null);
  projectToEdit = computed(() => {
    const id = this.projectId();
    return id ? this.projectService.getProjectById(id)() : undefined;
  });
  
  users = computed(() => {
      const currentUserId = this.authService.currentUser()?.profile.id;
      return this.userService.users().filter(u => u.id !== currentUserId);
  });
  isEditMode = false;

  imagePreviewUrl = signal<string | null>(null);
  selectedImageFile: File | null = null;
  isUploading = signal(false);

  projectForm = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    image_url: [''],
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

        Object.keys(membersGroup.controls).forEach(key => membersGroup.removeControl(key));

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
                description: project.description,
                image_url: project.image_url
            });
            this.imagePreviewUrl.set(project.image_url || null);
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
            this.imagePreviewUrl.set(null);
        }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedImageFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreviewUrl.set(reader.result as string);
      };
      reader.readAsDataURL(this.selectedImageFile);
      this.projectForm.get('image_url')?.markAsDirty();
    }
  }

  async onSubmit(): Promise<void> {
    if (this.projectForm.invalid) return;
    
    this.isUploading.set(true);

    let imageUrl = this.projectForm.get('image_url')?.value || null;

    if (this.selectedImageFile) {
        try {
            const { url } = await this.apiService.uploadFile(this.selectedImageFile);
            imageUrl = url;
        } catch (error) {
            this.notificationService.showToast('Image upload failed. Please try again.', 'error');
            this.isUploading.set(false);
            return;
        }
    }

    const formValue = this.projectForm.value;
    const memberIds = Object.entries(formValue.members || {})
      .filter(([, isMember]) => isMember)
      .map(([userId]) => userId);

    const currentUserId = this.authService.currentUser()?.profile.id;
    if (currentUserId && !memberIds.includes(currentUserId)) {
        memberIds.push(currentUserId);
    }
    
    const projectData = {
        name: formValue.name!,
        description: formValue.description || '',
        image_url: imageUrl
    };

    try {
        if (this.isEditMode && this.projectId()) {
            await this.projectService.updateProject(this.projectId()!, projectData, memberIds);
        } else {
            await this.projectService.createProject(projectData, memberIds);
        }
    } finally {
        this.isUploading.set(false);
    }
  }
}
