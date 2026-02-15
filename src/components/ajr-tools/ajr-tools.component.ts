import {
  Component,
  signal,
  ViewChild,
  ElementRef,
  effect,
  inject,
  ChangeDetectionStrategy,
  OnDestroy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  FormsModule,
} from "@angular/forms";
import Cropper from "cropperjs";
import { GeminiService } from "../../services/gemini.service";
import { NotificationService } from "../../services/notification.service";
import html2pdf from "html2pdf.js";

// declare var html2pdf: any;

type ResumeTemplate = "classic" | "modern" | "creative" | "minimalist";

@Component({
  selector: "app-ajr-tools",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container mx-auto p-4 my-8">
      <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        AJR Tools
      </h2>

      <!-- Tabs -->
      <div class="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav class="-mb-px flex space-x-6" aria-label="Tabs">
          <button
            (click)="currentTool.set('resume')"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
            [class]="getTabClass('resume')">
            Resume Generator
          </button>
          <button
            (click)="currentTool.set('cropper')"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
            [class]="getTabClass('cropper')">
            Photo Cropper
          </button>
          <button
            (click)="currentTool.set('compressor')"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
            [class]="getTabClass('compressor')">
            Image Compressor
          </button>
        </nav>
      </div>

      <!-- Tool Content -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
        @switch (currentTool()) { @case ('resume') {
        <!-- Resume Generator -->
        <div>
          <div
            class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
              Resume Generator
            </h3>
            <div class="flex items-center space-x-2 mt-3 sm:mt-0">
              <label
                for="aiModeToggle"
                class="text-sm font-medium text-gray-700 dark:text-gray-300"
                >AI Mode</label
              >
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="aiModeToggle"
                  class="sr-only peer"
                  [checked]="aiMode()"
                  (change)="aiMode.set(!aiMode())" />
                <div
                  class="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>

          @if (aiMode()) {
          <div
            class="bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500 p-4 rounded-r-lg">
            <h4
              class="text-lg font-semibold text-primary-800 dark:text-primary-200">
              AI Resume Generation
            </h4>
            <p class="text-sm text-primary-700 dark:text-primary-300 mt-1 mb-4">
              Enter a job role, and the AI will generate a complete resume for
              you.
            </p>
            <div class="flex items-center space-x-2">
              <input
                type="text"
                [(ngModel)]="aiJobRole"
                placeholder="e.g., Senior Frontend Developer"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors ng-pristine ng-invalid border-red-500 ng-touched flex-grow" />
              <button
                (click)="generateFullResumeWithAI()"
                [disabled]="isGeneratingFullResume() || !aiJobRole()"
                class="form-button">
                @if(isGeneratingFullResume()){ Generating... } @else { Generate
                }
              </button>
            </div>
          </div>
          }

          <p class="text-sm text-gray-600 dark:text-gray-400 my-6">
            @if(!aiMode()){ Fill in your details manually or use the ✨ icon to
            generate content with AI. }
          </p>

          <form [formGroup]="resumeForm" class="space-y-6">
            <!-- Personal Details -->
            <fieldset
              class="border-t border-gray-200 dark:border-gray-700 pt-6">
              <legend class="text-lg font-medium text-gray-900 dark:text-white">
                Personal Details
              </legend>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label
                    for="fullName"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >Full Name</label
                  >
                  <input
                    type="text"
                    id="fullName"
                    formControlName="fullName"
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors ng-pristine ng-invalid border-red-500 ng-touched" />
                </div>
                <div>
                  <label
                    for="email"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >Email</label
                  >
                  <input
                    type="email"
                    id="email"
                    formControlName="email"
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors ng-pristine ng-invalid border-red-500 ng-touched" />
                </div>
                <div>
                  <label
                    for="phone"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >Phone</label
                  >
                  <input
                    type="tel"
                    id="phone"
                    formControlName="phone"
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors ng-pristine ng-invalid border-red-500 ng-touched" />
                </div>
                <div>
                  <label
                    for="address"
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >Address</label
                  >
                  <input
                    type="text"
                    id="address"
                    formControlName="address"
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors ng-pristine ng-invalid border-red-500 ng-touched" />
                </div>
              </div>
            </fieldset>

            <!-- Summary -->
            <fieldset
              class="border-t border-gray-200 dark:border-gray-700 pt-6">
              <legend
                class="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                Summary
                <button
                  type="button"
                  (click)="generateSummaryWithAI()"
                  [disabled]="isGeneratingSummary()"
                  title="Generate with AI"
                  class="form-ai-button ml-2">
                  ✨
                </button>
              </legend>
              <div class="mt-4">
                <textarea
                  id="summary"
                  formControlName="summary"
                  rows="4"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors ng-pristine ng-invalid border-red-500 ng-touched"></textarea>
              </div>
            </fieldset>

            <!-- Experience -->
            <fieldset
              formArrayName="experience"
              class="border-t border-gray-200 dark:border-gray-700 pt-6">
              <legend
                class="text-lg font-medium text-gray-900 dark:text-white flex justify-between items-center">
                <span>Work Experience</span>
                <button
                  type="button"
                  (click)="addExperience()"
                  class="form-button-sm">
                  Add Experience
                </button>
              </legend>
              @for (exp of experienceForms.controls; track $index) {
              <div
                [formGroupName]="$index"
                class="space-y-4 mt-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg relative">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    formControlName="jobTitle"
                    placeholder="Job Title"
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors ng-pristine ng-invalid border-red-500 ng-touched" />
                  <input
                    type="text"
                    formControlName="company"
                    placeholder="Company"
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors ng-pristine ng-invalid border-red-500 ng-touched" />
                  <input
                    type="text"
                    formControlName="dates"
                    placeholder="e.g., Jan 2020 - Present"
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors ng-pristine ng-invalid border-red-500 ng-touched" />
                </div>
                <div class="relative">
                  <textarea
                    formControlName="description"
                    placeholder="Description of responsibilities"
                    rows="3"
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors ng-pristine ng-invalid border-red-500 ng-touched"></textarea>
                  <button
                    type="button"
                    (click)="generateExperienceDescriptionWithAI($index)"
                    [disabled]="isGeneratingExperience()"
                    title="Generate with AI"
                    class="form-ai-button absolute top-2 right-2">
                    ✨
                  </button>
                </div>
                <button
                  type="button"
                  (click)="removeExperience($index)"
                  class="text-red-500 hover:text-red-700 text-sm">
                  Remove
                </button>
              </div>
              }
            </fieldset>

            <!-- Education -->
            <fieldset
              formArrayName="education"
              class="border-t border-gray-200 dark:border-gray-700 pt-6">
              <legend
                class="text-lg font-medium text-gray-900 dark:text-white flex justify-between items-center">
                <span>Education</span>
                <button
                  type="button"
                  (click)="addEducation()"
                  class="form-button-sm">
                  Add Education
                </button>
              </legend>
              @for (edu of educationForms.controls; track $index) {
              <div
                [formGroupName]="$index"
                class="space-y-4 mt-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    formControlName="degree"
                    placeholder="Degree"
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors ng-pristine ng-invalid border-red-500 ng-touched" />
                  <input
                    type="text"
                    formControlName="school"
                    placeholder="School/University"
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors ng-pristine ng-invalid border-red-500 ng-touched" />
                  <input
                    type="text"
                    formControlName="dates"
                    placeholder="e.g., 2016 - 2020"
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors ng-pristine ng-invalid border-red-500 ng-touched" />
                </div>
                <button
                  type="button"
                  (click)="removeEducation($index)"
                  class="text-red-500 hover:text-red-700 text-sm">
                  Remove
                </button>
              </div>
              }
            </fieldset>

            <!-- Skills -->
            <fieldset
              class="border-t border-gray-200 dark:border-gray-700 pt-6">
              <legend class="text-lg font-medium text-gray-900 dark:text-white">
                Skills
              </legend>
              <div class="mt-4">
                <input
                  type="text"
                  formControlName="skills"
                  placeholder="Comma-separated skills, e.g., JavaScript, Angular, HTML"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors ng-pristine ng-invalid border-red-500 ng-touched" />
              </div>
            </fieldset>

            <div class="flex justify-end space-x-4">
              <button
                type="button"
                (click)="toggleResumePreview()"
                class="form-button">
                {{ showResumePreview() ? "Hide Preview" : "Generate Preview" }}
              </button>
            </div>
          </form>

          <!-- Resume Preview -->
          @if (showResumePreview()) {
          <div
            class="mt-8 p-6 border border-gray-300 dark:border-gray-600 rounded-lg">
            <div
              class="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
              <div class="flex items-center gap-4">
                <h4
                  class="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Template:
                </h4>
                <div class="flex flex-wrap gap-2">
                  <button
                    (click)="setTemplate('classic')"
                    class="form-button-sm"
                    [class.bg-primary-200]="selectedTemplate() === 'classic'">
                    Classic
                  </button>
                  <button
                    (click)="setTemplate('modern')"
                    class="form-button-sm"
                    [class.bg-primary-200]="selectedTemplate() === 'modern'">
                    Modern
                  </button>
                  <button
                    (click)="setTemplate('creative')"
                    class="form-button-sm"
                    [class.bg-primary-200]="selectedTemplate() === 'creative'">
                    Creative
                  </button>
                  <button
                    (click)="setTemplate('minimalist')"
                    class="form-button-sm"
                    [class.bg-primary-200]="
                      selectedTemplate() === 'minimalist'
                    ">
                    Minimalist
                  </button>
                </div>
              </div>
              <button
                (click)="downloadResume()"
                class="form-button-sm self-end sm:self-center">
                Download as PDF
              </button>
            </div>

            <div
              class="resume-print-area bg-white text-black p-8 shadow-lg"
              [ngClass]="selectedTemplate()">
              <aside class="resume-sidebar">
                <section class="details-section">
                  <h1 class="text-4xl font-bold">
                    {{ resumeForm.value.fullName }}
                  </h1>
                  <div class="contact-info">
                    <p>{{ resumeForm.value.address }}</p>
                    <p>{{ resumeForm.value.phone }}</p>
                    <p>{{ resumeForm.value.email }}</p>
                  </div>
                </section>
                <section>
                  <h2 class="section-title">Skills</h2>
                  <p class="mt-2 text-sm">{{ resumeForm.value.skills }}</p>
                </section>
              </aside>
              <main class="resume-main">
                <header class="main-header">
                  <h1 class="text-4xl font-bold">
                    {{ resumeForm.value.fullName }}
                  </h1>
                  <p class="text-sm mt-2">
                    {{ resumeForm.value.address }} |
                    {{ resumeForm.value.phone }} | {{ resumeForm.value.email }}
                  </p>
                </header>
                <section>
                  <h2 class="section-title">Summary</h2>
                  <p class="mt-2 text-sm">{{ resumeForm.value.summary }}</p>
                </section>
                <section>
                  <h2 class="section-title">Experience</h2>
                  @for (exp of resumeForm.value.experience; track $index) {
                  <div class="mt-4">
                    <div class="flex justify-between items-baseline">
                      <h3 class="text-lg font-bold">{{ exp.jobTitle }}</h3>
                      <span class="text-sm font-medium">{{ exp.company }}</span>
                    </div>
                    <p class="text-sm text-gray-600 mb-1">{{ exp.dates }}</p>
                    <p class="mt-1 text-sm whitespace-pre-wrap">
                      {{ exp.description }}
                    </p>
                  </div>
                  }
                </section>
                <section>
                  <h2 class="section-title">Education</h2>
                  @for (edu of resumeForm.value.education; track $index) {
                  <div class="mt-4">
                    <div class="flex justify-between items-baseline">
                      <h3 class="text-lg font-bold">{{ edu.degree }}</h3>
                      <span class="text-sm font-medium">{{ edu.school }}</span>
                    </div>
                    <p class="text-sm text-gray-600">{{ edu.dates }}</p>
                  </div>
                  }
                </section>
              </main>
            </div>
          </div>
          }
        </div>
        } @case ('cropper') {
        <!-- Photo Cropper -->
        <div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Photo Cropper
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Upload an image to crop, resize, and rotate.
          </p>
          <input
            type="file"
            (change)="onCropperFileSelected($event)"
            accept="image/*"
            class="form-file-input mb-4" />

          @if (cropperImageUrl()) {
          <div class="my-4 bg-gray-100 dark:bg-gray-900 p-2 rounded-lg">
            <img #cropperImage [src]="cropperImageUrl()" class="max-w-full" />
          </div>
          <!-- Cropper Controls -->
          <div
            class="flex flex-wrap items-center gap-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div class="flex items-center space-x-2">
              <button
                (click)="cropperZoom(-0.1)"
                title="Zoom Out"
                class="cropper-button">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                </svg>
              </button>
              <button
                (click)="cropperZoom(0.1)"
                title="Zoom In"
                class="cropper-button">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3h-6" />
                </svg>
              </button>
            </div>
            <div class="flex items-center space-x-2">
              <button
                (click)="cropperRotate(-45)"
                title="Rotate Left"
                class="cropper-button">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
              <button
                (click)="cropperRotate(45)"
                title="Rotate Right"
                class="cropper-button">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
                </svg>
              </button>
            </div>
            <div class="flex items-center space-x-2">
              <label for="aspectRatio" class="text-sm font-medium"
                >Aspect Ratio:</label
              >
              <select
                id="aspectRatio"
                (change)="setAspectRatio($event)"
                class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors ng-pristine ng-invalid border-red-500 ng-touched py-1 text-sm">
                <option value="free">Free</option>
                <option value="1:1">1:1</option>
                <option value="4:3">4:3</option>
                <option value="16:9">16:9</option>
              </select>
            </div>
            <button
              (click)="cropperReset()"
              title="Reset"
              class="cropper-button bg-yellow-500 hover:bg-yellow-600">
              Reset
            </button>
          </div>
          <button (click)="cropAndDownload()" class="form-button mt-4">
            Crop & Download
          </button>
          }
        </div>
        } @case ('compressor') {
        <!-- Image Compressor -->
        <div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Image Compressor
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Upload an image to compress it. Adjust the quality slider to see the
            result in real-time.
          </p>
          <input
            type="file"
            (change)="onCompressorFileSelected($event)"
            accept="image/jpeg, image/png, image/webp"
            class="form-file-input mb-4" />

          @if (compressorOriginalUrl()) {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <h4 class="font-medium text-gray-800 dark:text-gray-200">
                Original
              </h4>
              <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Size: {{ (originalSize() / 1024).toFixed(2) }} KB
              </p>
              <img
                [src]="compressorOriginalUrl()"
                class="max-w-full rounded-md border border-gray-300 dark:border-gray-600" />
            </div>
            <div>
              <h4 class="font-medium text-gray-800 dark:text-gray-200">
                Compressed
              </h4>
              <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Size: {{ (compressedSize() / 1024).toFixed(2) }} KB
              </p>
              @if (compressorCompressedUrl()) {
              <img
                [src]="compressorCompressedUrl()"
                class="max-w-full rounded-md border border-gray-300 dark:border-gray-600" />
              } @else {
              <div
                class="w-full aspect-square bg-gray-100 dark:bg-gray-700 flex items-center justify-center rounded-md">
                <p class="text-gray-500">Preview will appear here</p>
              </div>
              }
            </div>
          </div>

          <div class="my-6">
            <label
              for="quality"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >Quality: {{ quality() * 100 }}%</label
            >
            <input
              type="range"
              id="quality"
              min="0.1"
              max="1"
              step="0.05"
              [ngModel]="quality()"
              (ngModelChange)="onQualityChange($event)"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" />
          </div>

          <button
            (click)="downloadCompressed()"
            [disabled]="!compressorCompressedUrl()"
            class="form-button">
            Download Compressed Image
          </button>
          }
        </div>
        } }
      </div>
    </div>
  `,
  styles: [
    `
      .mt-1
        block
        w-full
        px-3
        py-2
        border
        border-gray-300
        dark:border-gray-600
        rounded-md
        shadow-sm
        focus:outline-none
        focus:ring-2
        focus:ring-primary-500
        focus:border-primary-500
        bg-gray-50
        dark:bg-gray-700
        text-gray-900
        dark:text-gray-100
        transition-colors
        ng-pristine
        ng-invalid
        border-red-500
        ng-touched {
        @apply mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors;
      }
      .form-button {
        @apply inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors;
      }
      .form-button-sm {
        @apply inline-flex items-center px-3 py-1.5 border border-transparent text-xs leading-4 font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-primary-700 dark:text-white dark:hover:bg-primary-600 transition-colors;
      }
      .form-ai-button {
        @apply text-sm p-1 rounded-full hover:bg-primary-100 dark:hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
      }
      .form-file-input {
        @apply block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-800 dark:file:text-white transition-colors cursor-pointer;
      }
      .cropper-button {
        @apply p-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500;
      }

      /* Default one-column layout for resume */
      .resume-sidebar {
        display: none;
      }
      .main-header {
        text-align: center;
        margin-bottom: 1.5rem;
      }

      /* Classic Template */
      .classic {
        font-family: "Times New Roman", serif;
      }
      .classic .section-title {
        font-size: 1.25rem;
        font-weight: 700;
        border-bottom: 2px solid #000;
        padding-bottom: 0.25rem;
        margin-top: 1.5rem;
      }

      /* Modern Template */
      .modern {
        font-family: "Helvetica", sans-serif;
      }
      .modern .section-title {
        font-size: 0.875rem;
        font-weight: 700;
        text-transform: uppercase;
        color: rgb(var(--color-primary-500));
        border-bottom: 1px solid #e0e0e0;
        padding-bottom: 0.5rem;
        margin-top: 1.5rem;
        letter-spacing: 0.05em;
      }

      /* Creative Template (Two-column) */
      .creative {
        display: flex;
        gap: 2rem;
        font-family: "Segoe UI", sans-serif;
      }
      .creative .resume-sidebar {
        display: block;
        flex: 1;
        order: 1;
        border-right: 1px solid #e0e0e0;
        padding-right: 2rem;
      }
      .creative .resume-main {
        flex: 2.5;
        order: 2;
      }
      .creative .main-header {
        display: none;
      }
      .creative .details-section h1 {
        font-size: 2.5rem;
        line-height: 1.2;
      }
      .creative .details-section .contact-info {
        margin-top: 1rem;
        font-size: 0.9rem;
        color: #4a5568;
      }
      .creative .section-title {
        color: rgb(var(--color-primary-600));
        font-weight: bold;
        padding-bottom: 0.25rem;
        margin-top: 1.5rem;
        font-size: 1.1rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      /* Minimalist Template */
      .minimalist {
        font-family: "Courier New", monospace;
        font-size: 0.9rem;
      }
      .minimalist .main-header {
        text-align: center;
        margin-bottom: 2rem;
      }
      .minimalist .main-header h1 {
        font-size: 1.8rem;
        letter-spacing: 0.2em;
        text-transform: uppercase;
      }
      .minimalist .main-header p {
        font-size: 0.8rem;
        letter-spacing: 0.1em;
      }
      .minimalist .section-title {
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 0.2em;
        border-bottom: 1px solid #ccc;
        padding-bottom: 0.5rem;
        margin-top: 2rem;
      }
    `,
  ],
})
export class AjrToolsComponent implements OnDestroy {
  currentTool = signal<"resume" | "cropper" | "compressor">("resume");
  fb: FormBuilder = inject(FormBuilder);
  geminiService = inject(GeminiService);
  notificationService = inject(NotificationService);

  // --- Resume Generator State ---
  resumeForm: FormGroup;
  showResumePreview = signal(false);
  selectedTemplate = signal<ResumeTemplate>("creative");
  aiMode = signal(false);
  aiJobRole = signal("");
  isGeneratingSummary = signal(false);
  isGeneratingExperience = signal<number | null>(null);
  isGeneratingFullResume = signal(false);

  // --- Photo Cropper State ---
  @ViewChild("cropperImage") cropperImageRef!: ElementRef<HTMLImageElement>;
  cropperImageUrl = signal<string | null>(null);
  private cropper: any | null = null;
  private selectedCropperFile: File | null = null;

  // --- Image Compressor State ---
  compressorOriginalUrl = signal<string | null>(null);
  compressorCompressedUrl = signal<string | null>(null);
  originalSize = signal(0);
  compressedSize = signal(0);
  quality = signal(0.75);
  private selectedCompressorFile: File | null = null;

  constructor() {
    this.resumeForm = this.fb.group({
      fullName: ["John Doe", Validators.required],
      email: ["john.doe@example.com", [Validators.required, Validators.email]],
      phone: ["(123) 456-7890"],
      address: ["123 Main St, Anytown, USA"],
      summary: [
        "A highly motivated and experienced developer specializing in frontend technologies.",
      ],
      experience: this.fb.array([]),
      education: this.fb.array([]),
      skills: [
        "Angular, TypeScript, JavaScript, HTML, CSS, Tailwind CSS, Node.js",
      ],
    });
    this.addExperience();
    this.addEducation();

    effect(() => {
      const imageUrl = this.cropperImageUrl();
      if (imageUrl && this.cropperImageRef) {
        this.initializeCropper();
      } else {
        this.destroyCropper();
      }
    });
  }

  ngOnDestroy() {
    this.destroyCropper();
  }

  getTabClass(tool: "resume" | "cropper" | "compressor"): string {
    return this.currentTool() === tool
      ? "border-primary-500 text-primary-600 dark:border-primary-400 dark:text-primary-300"
      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600";
  }

  // --- Resume Generator Methods ---
  get experienceForms() {
    return this.resumeForm.get("experience") as FormArray;
  }
  get educationForms() {
    return this.resumeForm.get("education") as FormArray;
  }

  setTemplate(template: ResumeTemplate) {
    this.selectedTemplate.set(template);
  }

  async generateSummaryWithAI() {
    this.isGeneratingSummary.set(true);
    const context = {
      fullName: this.resumeForm.value.fullName,
      skills: this.resumeForm.value.skills,
    };
    const result = await this.geminiService.generateResumeSection(
      "summary",
      context
    );
    if (result) {
      this.resumeForm.get("summary")?.setValue(result);
    }
    this.isGeneratingSummary.set(false);
  }

  async generateExperienceDescriptionWithAI(index: number) {
    this.isGeneratingExperience.set(index);
    const experienceGroup = this.experienceForms.at(index);
    const context = {
      jobTitle: experienceGroup.value.jobTitle,
      company: experienceGroup.value.company,
    };
    const result = await this.geminiService.generateResumeSection(
      "description",
      context
    );
    if (result) {
      experienceGroup.get("description")?.setValue(result);
    }
    this.isGeneratingExperience.set(null);
  }

  async generateFullResumeWithAI() {
    if (!this.aiJobRole()) return;
    this.isGeneratingFullResume.set(true);
    const result = await this.geminiService.generateFullResume(
      this.aiJobRole()
    );
    if (result) {
      this.resumeForm.patchValue(result);

      this.experienceForms.clear();
      result.experience?.forEach((exp: any) =>
        this.experienceForms.push(this.fb.group(exp))
      );

      this.educationForms.clear();
      result.education?.forEach((edu: any) =>
        this.educationForms.push(this.fb.group(edu))
      );

      this.showResumePreview.set(true);
    }
    this.isGeneratingFullResume.set(false);
  }

  addExperience() {
    this.experienceForms.push(
      this.fb.group({
        jobTitle: ["Software Engineer"],
        company: ["Tech Corp"],
        dates: ["Jan 2020 - Present"],
        description: [
          "- Developed and maintained web applications.\n- Collaborated with cross-functional teams.",
        ],
      })
    );
  }
  removeExperience(index: number) {
    this.experienceForms.removeAt(index);
  }

  addEducation() {
    this.educationForms.push(
      this.fb.group({
        degree: ["B.S. in Computer Science"],
        school: ["State University"],
        dates: ["2016 - 2020"],
      })
    );
  }
  removeEducation(index: number) {
    this.educationForms.removeAt(index);
  }

  toggleResumePreview() {
    this.showResumePreview.update((v) => !v);
  }

  async downloadResume(): Promise<void> {
    const originalElement = document.querySelector(".resume-print-area");
    if (!originalElement) {
      this.notificationService.showToast(
        "Could not find resume content to download.",
        "error"
      );
      return;
    }

    // --- Create a processing overlay for user feedback ---
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    overlay.style.zIndex = "1000";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.innerHTML = `<div style="color: white; font-size: 1.2rem; text-align: center; font-family: sans-serif;">
        <p>Generating PDF...</p>
        <p style="font-size: 0.9rem;">Please wait, this may take a moment.</p>
    </div>`;
    document.body.appendChild(overlay);

    // --- Create and style a clone for reliable rendering ---
    const printContainer = document.createElement("div");
    printContainer.style.position = "absolute";
    printContainer.style.left = "-9999px"; // Position off-screen
    printContainer.style.top = "0";
    printContainer.style.width = "210mm"; // Set a fixed physical width for A4
    printContainer.style.height = "auto";
    printContainer.style.backgroundColor = "white";

    const elementToPrint = originalElement.cloneNode(true) as HTMLElement;
    printContainer.appendChild(elementToPrint);
    document.body.appendChild(printContainer);

    // --- Apply layout fixes and inline styles to the clone ---
    if (elementToPrint.classList.contains("creative")) {
      const sidebar = elementToPrint.querySelector(
        ".resume-sidebar"
      ) as HTMLElement | null;
      const main = elementToPrint.querySelector(
        ".resume-main"
      ) as HTMLElement | null;
      if (sidebar && main) {
        elementToPrint.style.display = "block";
        sidebar.style.float = "left";
        sidebar.style.width = "30%";
        main.style.float = "right";
        main.style.width = "68%";
        const clearer = document.createElement("div");
        clearer.style.clear = "both";
        elementToPrint.appendChild(clearer);
      }
    }

    const allElements = Array.from(
      elementToPrint.querySelectorAll("*")
    ) as HTMLElement[];
    allElements.push(elementToPrint);
    allElements.forEach((el) => {
      const computedStyle = window.getComputedStyle(el);
      // Explicitly inline crucial styles that might rely on external sheets or CSS variables
      el.style.color = computedStyle.color;
      el.style.backgroundColor = computedStyle.backgroundColor;
      el.style.fontFamily = computedStyle.fontFamily;
      el.style.fontSize = computedStyle.fontSize;
      el.style.fontWeight = computedStyle.fontWeight;
      el.style.borderBottomColor = computedStyle.borderBottomColor;
      el.style.borderRightColor = computedStyle.borderRightColor;
    });

    const opt = {
      margin: 0.5,
      filename: `${this.resumeForm.value.fullName}_Resume.pdf`.replace(
        / /g,
        "_"
      ),
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 5,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    } as const;
    try {
      // Give the browser a moment to render the off-screen element before capturing
      await new Promise((resolve) => setTimeout(resolve, 100));
      await html2pdf().from(elementToPrint).set(opt).save();
    } catch (err) {
      console.error("PDF generation failed:", err);
      this.notificationService.showToast(
        "PDF generation failed. Please try again.",
        "error"
      );
    } finally {
      // --- Cleanup ---
      document.body.removeChild(printContainer);
      document.body.removeChild(overlay);
    }
  }

  // --- Photo Cropper Methods ---
  private initializeCropper() {
    this.destroyCropper();
    if (this.cropperImageRef) {
      // this.cropper = new Cropper(this.cropperImageRef.nativeElement, {
      //   viewMode: 1,
      //   dragMode: "move",
      //   background: false,
      //   autoCropArea: 0.8,
      // });
    }
  }

  private destroyCropper() {
    this.cropper?.destroy();
    this.cropper = null;
  }

  onCropperFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedCropperFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => this.cropperImageUrl.set(reader.result as string);
      reader.readAsDataURL(this.selectedCropperFile);
    }
  }

  cropperZoom(ratio: number) {
    this.cropper?.zoom(ratio);
  }
  cropperRotate(degree: number) {
    this.cropper?.rotate(degree);
  }
  cropperReset() {
    this.cropper?.reset();
  }

  setAspectRatio(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    let ratio = NaN;
    if (value !== "free") {
      const [w, h] = value.split(":").map(Number);
      ratio = w / h;
    }
    this.cropper?.setAspectRatio(ratio);
  }

  cropAndDownload() {
    if (!this.cropper || !this.selectedCropperFile) return;
    // const canvas = this.cropper.getCroppedCanvas({
    //   imageSmoothingQuality: "high",
    // });
    // const dataUrl = canvas.toDataURL(this.selectedCropperFile.type);
    // const filename = `cropped-${this.selectedCropperFile.name}`;
    // this.downloadDataUrl(dataUrl, filename);
  }

  // --- Image Compressor Methods ---
  onCompressorFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedCompressorFile = input.files[0];
      this.originalSize.set(this.selectedCompressorFile.size);
      const reader = new FileReader();
      reader.onload = () => {
        this.compressorOriginalUrl.set(reader.result as string);
        this.compressImage(reader.result as string, this.quality());
      };
      reader.readAsDataURL(this.selectedCompressorFile);
    }
  }

  onQualityChange(newQuality: any) {
    this.quality.set(Number(newQuality));
    if (this.compressorOriginalUrl()) {
      this.compressImage(this.compressorOriginalUrl()!, this.quality());
    }
  }

  private compressImage(imageUrl: string, quality: number) {
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const compressedDataUrl = canvas.toDataURL(
          this.selectedCompressorFile?.type || "image/jpeg",
          quality
        );
        this.compressorCompressedUrl.set(compressedDataUrl);
        this.compressedSize.set(Math.round(compressedDataUrl.length * (3 / 4)));
      }
    };
  }

  downloadCompressed() {
    if (this.compressorCompressedUrl() && this.selectedCompressorFile) {
      const filename = `compressed-${this.selectedCompressorFile.name}`;
      this.downloadDataUrl(this.compressorCompressedUrl()!, filename);
    }
  }

  // --- Helper Methods ---
  private downloadDataUrl(dataUrl: string, filename: string) {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

