import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  effect,
} from "@angular/core";
import { CommonModule} from "@angular/common";
import { FormsModule } from "@angular/forms";
import { GeminiService } from "../../services/gemini.service";
import { TaskService } from "../../services/task.service";
import { NotificationService } from "../../services/notification.service";
import { AuthService } from "../../services/auth.service";
import {
  Task,
  TaskReportSummary,
  TaskPriority,
  TaskStatus,
  TaskType,
} from "../../shared/interfaces";
import * as d3 from "d3"; // Import D3
import { ThemeService } from "../../services/theme.service"; // Import ThemeService

// Declare webkitSpeechRecognition globally for TypeScript to recognize it.
// This is a browser-specific API and not part of standard TypeScript DOM types.
declare var webkitSpeechRecognition: any;

@Component({
  selector: "app-ai-task-assistant",
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isOpen()) {
    <div class="fixed inset-0 bg-black/30 z-40" (click)="close()"></div>
    <aside
      class="fixed top-0 right-0 h-full w-full max-w-lg md:max-w-md lg:max-w-lg bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out"
      [class.translate-x-0]="isOpen()"
      [class.translate-x-full]="!isOpen()">
      <div class="flex flex-col h-full">
        <!-- Header -->
        <header
          class="flex flex-col p-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between mb-2">
            <h3
              class="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6 mr-2 text-primary-500"
                viewBox="0 0 20 20"
                fill="currentColor">
                <path
                  d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              AI Assistant
            </h3>
            <button
              (click)="close()"
              class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Mode Tabs -->
          <nav class="flex space-x-2 mt-2">
            <button
              (click)="mode.set('task-creation')"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              [class.bg-primary-600]="mode() === 'task-creation'"
              [class.text-white]="mode() === 'task-creation'"
              [class.bg-gray-100]="mode() !== 'task-creation'"
              [class.text-gray-700]="mode() !== 'task-creation'"
              [class.dark:bg-gray-700]="mode() !== 'task-creation'"
              [class.dark:text-gray-200]="mode() !== 'task-creation'"
              [class.hover:bg-primary-700]="mode() === 'task-creation'"
              [class.hover:bg-gray-200]="mode() !== 'task-creation'"
              [class.dark:hover:bg-gray-600]="mode() !== 'task-creation'">
              Task Creation
            </button>
            <button
              (click)="mode.set('report-generation')"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              [class.bg-primary-600]="mode() === 'report-generation'"
              [class.text-white]="mode() === 'report-generation'"
              [class.bg-gray-100]="mode() !== 'report-generation'"
              [class.text-gray-700]="mode() !== 'report-generation'"
              [class.dark:bg-gray-700]="mode() !== 'report-generation'"
              [class.dark:text-gray-200]="mode() !== 'report-generation'"
              [class.hover:bg-primary-700]="mode() === 'report-generation'"
              [class.hover:bg-gray-200]="mode() !== 'report-generation'"
              [class.dark:hover:bg-gray-600]="mode() !== 'report-generation'">
              Report Generation
            </button>
          </nav>
        </header>

        <!-- Task Creation Content -->
        @if (mode() === 'task-creation') {
        <div class="flex-grow p-4 overflow-y-auto space-y-4">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Describe the task you want to create. You can type or use your
            voice. For example: "Remind me to call John tomorrow about the
            project report, set priority to high and tag it as urgent."
          </p>

          <!-- Text Input -->
          <div class="relative">
            <textarea
              #textInput
              [(ngModel)]="userInput"
              (ngModelChange)="processText()"
              placeholder="Start typing or use the microphone..."
              class="w-full p-3 pr-20 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
              rows="4"></textarea>
            <button
              (click)="toggleSpeechRecognition()"
              [class.bg-red-500]="isRecording()"
              [class.hover:bg-red-600]="isRecording()"
              [class.bg-primary-600]="!isRecording()"
              [class.hover:bg-primary-700]="!isRecording()"
              class="absolute top-3 right-3 p-2 text-white rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0a5 5 0 01-5 5v.07A4.97 4.97 0 015 8a1 1 0 10-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                  clip-rule="evenodd" />
              </svg>
            </button>
          </div>

          <!-- Live Transcription -->
          @if (isRecording() || interimTranscript()) {
          <div class="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
            <p class="text-sm text-gray-500 dark:text-gray-300 italic">
              {{ interimTranscript() }}
            </p>
          </div>
          }

          <!-- AI Response Preview -->
          <div>
            <h4 class="font-semibold text-gray-800 dark:text-gray-200 mb-2">
              AI Preview
            </h4>
            @if (isLoadingAI()) {
            <div
              class="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg space-y-3 animate-pulse">
              <div class="h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
              <div
                class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
              <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
              <div class="grid grid-cols-2 gap-2 text-sm pt-2">
                <div
                  class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                <div
                  class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
              </div>
            </div>
            } @else if (parsedTask()) {
            <div
              class="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg space-y-3 border border-gray-200 dark:border-gray-600">
              @if (parsedTask()?.title) {
              <div class="text-lg font-bold text-gray-900 dark:text-white">
                {{ parsedTask()!.title }}
              </div>
              } @if (parsedTask()?.description) {
              <p class="text-sm text-gray-600 dark:text-gray-300">
                {{ parsedTask()!.description }}
              </p>
              }
              <div
                class="grid grid-cols-2 gap-2 text-sm pt-2 border-t border-gray-200 dark:border-gray-600">
                @if (parsedTask()?.due_date) {
                <div class="flex items-center">
                  <span class="font-semibold text-gray-500 mr-2">Due:</span>
                  <span class="text-gray-800 dark:text-gray-200">{{
                    parsedTask()!.due_date
                  }}</span>
                </div>
                } @if (parsedTask()?.priority) {
                <div class="flex items-center">
                  <span class="font-semibold text-gray-500 mr-2"
                    >Priority:</span
                  >
                  <span class="text-gray-800 dark:text-gray-200">{{
                    parsedTask()!.priority
                  }}</span>
                </div>
                } @if (getAssigneeName(parsedTask()?.assign_to)) {
                <div class="flex items-center">
                  <span class="font-semibold text-gray-500 mr-2"
                    >Assignee:</span
                  >
                  <span class="text-gray-800 dark:text-gray-200">{{
                    getAssigneeName(parsedTask()!.assign_to)
                  }}</span>
                </div>
                } @if (parsedTask()?.duration) {
                <div class="flex items-center">
                  <span class="font-semibold text-gray-500 mr-2"
                    >Duration:</span
                  >
                  <span class="text-gray-800 dark:text-gray-200">{{
                    parsedTask()!.duration
                  }}</span>
                </div>
                }
              </div>
              @if (parsedTask()?.tags && parsedTask()!.tags!.length > 0) {
              <div class="flex flex-wrap gap-2 pt-2">
                @for(tag of parsedTask()!.tags; track tag) {
                <span
                  class="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-xs font-medium"
                  >{{ tag }}</span
                >
                }
              </div>
              }
            </div>
            } @else {
            <p class="text-sm text-gray-500 dark:text-gray-400">
              The structured task data will appear here once parsed.
            </p>
            }
          </div>
        </div>

        <!-- Task Creation Footer -->
        <footer class="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            (click)="createTask()"
            [disabled]="!parsedTask() || isLoadingAI()"
            class="w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
            Create Task
          </button>
        </footer>
        }

        <!-- Report Generation Content -->
        @if (mode() === 'report-generation') {
        <div class="flex-grow p-4 overflow-y-auto space-y-4">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Ask me to generate a report. For example: "Summarize all overdue
            tasks", "Show tasks assigned to John due next week", or "Report on
            tasks by priority".
          </p>

          <!-- Report Input -->
          <div class="relative mb-6">
            <textarea
              #reportInput
              [(ngModel)]="reportPrompt"
              placeholder="Enter your report request..."
              class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
              rows="3"></textarea>
            <button
              (click)="generateReport()"
              [disabled]="!reportPrompt() || isLoadingReport()"
              class="mt-2 w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
              @if (isLoadingReport()) {
              <svg
                class="animate-spin h-5 w-5 mr-3 inline-block"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24">
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating Report... } @else { Generate Report }
            </button>
          </div>

          <!-- Report Summary & Charts -->
          @if (isLoadingReport()) {
          <div
            class="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg space-y-4 animate-pulse">
            <div
              class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full mb-4"></div>
            <div
              class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6 mb-4"></div>
            <div
              class="h-40 bg-gray-300 dark:bg-gray-600 rounded w-full mb-4"></div>
            <div class="h-40 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
          </div>
          } @else if (reportSummary()) {
          <div
            class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-inner space-y-4">
            <h4 class="font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Report Summary
            </h4>
            <p
              class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {{ reportSummary()!.summaryText }}
            </p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Status Distribution Chart -->
              <div>
                <h5
                  class="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">
                  Tasks by Status
                </h5>
                <div #statusBarChart class="w-full aspect-video"></div>
              </div>
              <!-- Priority Distribution Chart -->
              <div>
                <h5
                  class="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">
                  Tasks by Priority
                </h5>
                <div #priorityPieChart class="w-full aspect-video"></div>
              </div>
            </div>
            <!-- New: Type Distribution Chart -->
            @if (reportSummary()!.typeDistribution.length > 0) {
            <div class="mt-4">
              <h5
                class="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">
                Tasks by Type
              </h5>
              <div #typeBarChart class="w-full aspect-video"></div>
            </div>
            }
            <!-- Tasks Over Time Chart -->
            @if (reportSummary()!.tasksByDate.length > 0) {
            <div class="mt-4">
              <h5
                class="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">
                Tasks Due Over Time (Due Date)
              </h5>
              <div #tasksLineChart class="w-full aspect-video"></div>
            </div>
            }
          </div>
          } @else {
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Generate a report to see key task insights and visualizations.
          </p>
          }
        </div>
        }
      </div>
    </aside>
    }
  `,
})
export class AiTaskAssistantComponent {
  geminiService = inject(GeminiService);
  taskService = inject(TaskService);
  notificationService = inject(NotificationService);
  authService = inject(AuthService);
  themeService = inject(ThemeService); // Inject ThemeService

  isOpen = signal(false);
  mode = signal<"task-creation" | "report-generation">("task-creation"); // New mode signal

  isRecording = signal(false);
  userInput = signal(""); // For task creation
  interimTranscript = signal("");
  parsedTask = signal<Partial<Omit<Task, "id" | "created_at">> | null>(null);
  isLoadingAI = signal(false);

  reportPrompt = signal(""); // For report generation
  reportSummary = signal<TaskReportSummary | null>(null);
  isLoadingReport = signal(false);

  @ViewChild("textInput") textInput!: ElementRef<HTMLTextAreaElement>;
  @ViewChild("reportInput") reportInput!: ElementRef<HTMLTextAreaElement>;
  @ViewChild("statusBarChart") statusBarChart!: ElementRef<HTMLDivElement>;
  @ViewChild("priorityPieChart") priorityPieChart!: ElementRef<HTMLDivElement>;
  @ViewChild("typeBarChart") typeBarChart!: ElementRef<HTMLDivElement>; // New ViewChild for type chart
  @ViewChild("tasksLineChart") tasksLineChart!: ElementRef<HTMLDivElement>;

  private recognition: any;
  private debounceTimer: any;
  private reportDebounceTimer: any;

  constructor() {
    this.initializeSpeechRecognition();

    effect(
      () => {
        // Clear specific states when switching modes
        const currentMode = this.mode();
        if (currentMode === "task-creation") {
          this.reportSummary.set(null);
          this.isLoadingReport.set(false);
          this.reportPrompt.set("");
          // Ensure to clear any rendered charts
          this.clearCharts();
        } else if (currentMode === "report-generation") {
          this.parsedTask.set(null);
          this.isLoadingAI.set(false);
          this.userInput.set("");
          this.stopSpeechRecognition();
        }
      },
      { allowSignalWrites: true }
    );

    effect(() => {
      const summary = this.reportSummary();
      if (summary) {
        // Schedule rendering after view is updated
        setTimeout(() => this.renderCharts(summary), 0);
      }
    }); // No need for allowSignalWrites here, as it only reads `reportSummary`
  }

  public open() {
    this.isOpen.set(true);
  }

  public close() {
    this.isOpen.set(false);
    this.stopSpeechRecognition();
    this.clearDebounceTimers();
    // Clear all states when closing the assistant
    this.userInput.set("");
    this.interimTranscript.set("");
    this.parsedTask.set(null);
    this.isLoadingAI.set(false);
    this.reportPrompt.set("");
    this.reportSummary.set(null);
    this.isLoadingReport.set(false);
    this.clearCharts();
    this.mode.set("task-creation"); // Reset to default mode
  }

  public toggle() {
    this.isOpen() ? this.close() : this.open();
  }

  private clearDebounceTimers() {
    clearTimeout(this.debounceTimer);
    clearTimeout(this.reportDebounceTimer);
  }

  private initializeSpeechRecognition() {
    if ("webkitSpeechRecognition" in window) {
      this.recognition = new webkitSpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = "en-US";

      this.recognition.onstart = () => {
        this.isRecording.set(true);
      };

      this.recognition.onend = () => {
        this.isRecording.set(false);
        this.processText();
      };

      this.recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        // FIX: Use showToast instead of show
        this.notificationService.showToast(
          `Speech recognition error: ${event.error}`,
          "error"
        );
        this.isRecording.set(false);
      };

      this.recognition.onresult = (event: any) => {
        let final_transcript = "";
        let interim_transcript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final_transcript += event.results[i][0].transcript;
          } else {
            interim_transcript += event.results[i][0].transcript;
          }
        }
        this.userInput.set(final_transcript);
        this.interimTranscript.set(interim_transcript);
        if (this.textInput?.nativeElement) {
          this.textInput.nativeElement.value = final_transcript; // Manually update for view
        }
      };
    } else {
      // FIX: Use showToast instead of show
      this.notificationService.showToast(
        "Voice input is not supported by your browser.",
        "warning"
      );
    }
  }

  toggleSpeechRecognition() {
    if (!this.recognition) return;
    if (this.isRecording()) {
      this.stopSpeechRecognition();
    } else {
      this.startSpeechRecognition();
    }
  }

  startSpeechRecognition() {
    if (!this.recognition) return;
    this.userInput.set("");
    this.interimTranscript.set("");
    this.recognition.start();
  }

  stopSpeechRecognition() {
    if (!this.recognition) return;
    this.recognition.stop();
  }

  processText() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(async () => {
      const text = this.userInput().trim();
      if (text.length < 5) {
        // Minimum length for AI processing
        this.parsedTask.set(null);
        return;
      }
      this.isLoadingAI.set(true);
      this.parsedTask.set(null); // Clear previous parsing results
      try {
        const result = await this.geminiService.parseTextToTask(text);
        this.parsedTask.set(result);
      } finally {
        this.isLoadingAI.set(false);
      }
    }, 1000); // Debounce for 1 second
  }

  getAssigneeName(userId: string | undefined): string | undefined {
    if (!userId) return undefined;
    return this.taskService.users().find((u) => u.id === userId)?.username;
  }

  async createTask() {
    const taskData = this.parsedTask();
    const currentUser = this.authService.currentUser();
    const today = new Date().toISOString().split("T")[0];

    if (!taskData || !currentUser?.profile || !currentUser.profile.id) {
      // FIX: Use showToast instead of show
      this.notificationService.showToast(
        "Cannot create task. Parsed data or user is missing.",
        "error"
      );
      return;
    }

    // Bug Fix: Ensure start_date and due_date are always valid YYYY-MM-DD strings
    const isValidDateString = (dateStr: any) =>
      typeof dateStr === "string" &&
      dateStr !== "null" &&
      /^\d{4}-\d{2}-\d{2}$/.test(dateStr);

    // FIX: Add missing properties to match the Omit type expected by taskService.addTask
    const finalTaskData: Omit<
      Task,
      | "id"
      | "created_at"
      | "updated_by"
      | "updated_by_username"
      | "assigned_by_username"
      | "assigned_to_username"
      | "like_count"
      | "liked_by_users"
    > = {
      title: taskData.title || "Untitled Task",
      description: taskData.description || "",
      type: taskData.type || "Task",
      priority: taskData.priority || "Medium",
      duration: taskData.duration || "",

      start_date: isValidDateString(taskData.start_date ?? "")
        ? taskData.start_date!
        : today,

      due_date: isValidDateString(taskData.due_date ?? "")
        ? taskData.due_date!
        : today,
      status: "todo",
      assign_to: taskData.assign_to || currentUser.profile.id,
      assigned_by: currentUser.profile.id,
      approval_required: false,
      approval_status: null,
      tags: taskData.tags || [],
      // FIX: Add missing 'tagged_users' property to satisfy the type.
      tagged_users: [],
      subtasks: [],
      reminder_option: "None",
      repeat_option: "None",
      project_id: null,
    };

    try {
      await this.taskService.addTask(finalTaskData);
      // FIX: Use showToast instead of show
      this.notificationService.showToast("AI task created successfully!", "success");
      this.userInput.set("");
      this.parsedTask.set(null);
      this.close(); // Close assistant after task creation
    } catch (error) {
      // FIX: Use showToast instead of show
      this.notificationService.showToast(
        "Failed to create task from AI data.",
        "error"
      );
    }
  }

  // --- Report Generation Logic ---
  async generateReport() {
    clearTimeout(this.reportDebounceTimer);
    this.reportDebounceTimer = setTimeout(async () => {
      const prompt = this.reportPrompt().trim();
      if (prompt.length < 10) {
        this.reportSummary.set(null);
        return;
      }

      this.isLoadingReport.set(true);
      this.reportSummary.set(null);
      this.clearCharts();

      try {
        // Fetch all tasks (this simulates querying a database in an Edge Function context)
        // For the applet, TaskService already holds all tasks.
        const allTasks = this.taskService.tasks();
        const summary = await this.geminiService.generateTaskReport(
          prompt,
          allTasks
        );
        this.reportSummary.set(summary);
      } finally {
        this.isLoadingReport.set(false);
      }
    }, 1000); // Debounce for 1 second
  }

  private clearCharts() {
    if (this.statusBarChart?.nativeElement)
      d3.select(this.statusBarChart.nativeElement).select("svg").remove();
    if (this.priorityPieChart?.nativeElement)
      d3.select(this.priorityPieChart.nativeElement).select("svg").remove();
    if (this.typeBarChart?.nativeElement)
      d3.select(this.typeBarChart.nativeElement).select("svg").remove(); // Clear new chart
    if (this.tasksLineChart?.nativeElement)
      d3.select(this.tasksLineChart.nativeElement).select("svg").remove();
  }

  private getCssVarColor(varName: string): string {
    return `rgb(${getComputedStyle(document.documentElement)
      .getPropertyValue(varName)
      .trim()})`;
  }

  // Helper method to render all charts from the summary
  private renderCharts(summary: TaskReportSummary) {
    this.clearCharts(); // Clear existing charts before rendering new ones

    const isDark = this.themeService.isDarkMode();

    // Define explicit color maps for light and dark modes
    const statusColorsLight: Record<TaskStatus, string> = {
      todo: "rgb(107, 114, 128)", // gray-500
      "in-progress": "rgb(59, 130, 246)", // blue-500
      review: "rgb(168, 85, 247)", // purple-500
      completed: "rgb(34, 197, 94)", // green-500
    };
    const statusColorsDark: Record<TaskStatus, string> = {
      todo: "rgb(75, 85, 99)", // gray-700
      "in-progress": "rgb(96, 165, 250)", // blue-400
      review: "rgb(192, 132, 252)", // purple-400
      completed: "rgb(52, 211, 153)", // green-400
    };

    const priorityColorsLight: Record<TaskPriority, string> = {
      Urgent: "rgb(239, 68, 68)", // red-500
      High: "rgb(249, 115, 22)", // orange-500
      Medium: "rgb(234, 179, 8)", // yellow-500
      Low: "rgb(34, 197, 94)", // green-500
    };
    const priorityColorsDark: Record<TaskPriority, string> = {
      Urgent: "rgb(252, 165, 165)", // red-300
      High: "rgb(253, 186, 116)", // orange-300
      Medium: "rgb(250, 204, 21)", // yellow-300
      Low: "rgb(74, 222, 128)", // green-300
    };

    const typeColorsLight: Record<TaskType, string> = {
      Task: this.getCssVarColor("--color-primary-500"), // Use primary
      Order: "rgb(20, 184, 166)", // teal-500
      Bugfix: "rgb(239, 68, 68)", // red-500
      Shopping: "rgb(168, 85, 247)", // purple-500
      Others: "rgb(107, 114, 128)", // gray-500
    };
    const typeColorsDark: Record<TaskType, string> = {
      Task: this.getCssVarColor("--color-primary-400"), // Use primary
      Order: "rgb(45, 212, 191)", // teal-400
      Bugfix: "rgb(252, 165, 165)", // red-300
      Shopping: "rgb(192, 132, 252)", // purple-400
      Others: "rgb(156, 163, 175)", // gray-400
    };

    // Render Status Bar Chart
    if (
      this.statusBarChart?.nativeElement &&
      summary.statusDistribution.length > 0
    ) {
      const statusData = summary.statusDistribution.map((d) => ({
        label: d.status,
        value: d.count,
      }));
      const statusColorFn = (d: { label: string; value: number }) =>
        isDark
          ? statusColorsDark[d.label as TaskStatus]
          : statusColorsLight[d.label as TaskStatus];
      this.renderBarChart(
        this.statusBarChart.nativeElement,
        statusData,
        "Tasks by Status",
        statusColorFn
      );
    }

    // Render Priority Pie Chart
    if (
      this.priorityPieChart?.nativeElement &&
      summary.priorityDistribution.length > 0
    ) {
      const priorityData = summary.priorityDistribution.map((d) => ({
        label: d.priority,
        value: d.count,
      }));
      const priorityColorFn = (d: { label: string; value: number }) =>
        isDark
          ? priorityColorsDark[d.label as TaskPriority]
          : priorityColorsLight[d.label as TaskPriority];
      this.renderPieChart(
        this.priorityPieChart.nativeElement,
        priorityData,
        "Tasks by Priority",
        priorityColorFn
      );
    }

    // Render Type Bar Chart
    if (
      this.typeBarChart?.nativeElement &&
      summary.typeDistribution.length > 0
    ) {
      const typeData = summary.typeDistribution.map((d) => ({
        label: d.type,
        value: d.count,
      }));
      const typeColorFn = (d: { label: string; value: number }) =>
        isDark
          ? typeColorsDark[d.label as TaskType]
          : typeColorsLight[d.label as TaskType];
      this.renderBarChart(
        this.typeBarChart.nativeElement,
        typeData,
        "Tasks by Type",
        typeColorFn
      );
    }

    // Render Tasks Over Time Line Chart
    if (this.tasksLineChart?.nativeElement && summary.tasksByDate.length > 0) {
      const lineData = summary.tasksByDate.map((d) => ({
        date: new Date(d.date),
        value: d.count,
      }));
      this.renderLineChart(
        this.tasksLineChart.nativeElement,
        lineData,
        "Tasks Due Over Time",
        isDark
          ? this.getCssVarColor("--color-primary-400")
          : this.getCssVarColor("--color-primary-600")
      );
    }
  }

  private renderBarChart(
    container: HTMLElement,
    data: { label: string; value: number }[],
    title: string,
    colorFn: (d: { label: string; value: number }) => string // Accepts RGB string
  ) {
    const margin = { top: 20, right: 20, bottom: 60, left: 40 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = container.clientHeight - margin.top - margin.bottom;

    const svg = d3
      .select(container)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleBand()
      .range([0, width])
      .padding(0.1)
      .domain(data.map((d) => d.label));

    const y = d3
      .scaleLinear()
      .range([height, 0])
      .domain([0, d3.max(data, (d) => d.value)! + 1]); // +1 for padding above max bar

    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "translate(-10,0)rotate(-45)")
      .style("text-anchor", "end")
      .attr("fill", "currentColor"); // Use currentColor for theme responsiveness

    svg
      .append("g")
      .call(d3.axisLeft(y).tickFormat(d3.format("d"))) // Ensure integer ticks
      .selectAll("text")
      .attr("fill", "currentColor"); // Use currentColor for theme responsiveness

    svg
      .selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.label)!)
      .attr("width", x.bandwidth())
      .attr("y", (d) => y(d.value))
      .attr("height", (d) => height - y(d.value))
      .attr("fill", (d) => colorFn(d)); // Use the explicit color function
  }

  private renderPieChart(
    container: HTMLElement,
    data: { label: string; value: number }[],
    title: string,
    colorFn: (d: { label: string; value: number }) => string // Accepts RGB string
  ) {
    const width = container.clientWidth;
    const height = container.clientHeight;
    const radius = Math.min(width, height) / 2 - 10; // Adjusted for padding

    const svg = d3
      .select(container)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const pie = d3
      .pie<{ label: string; value: number }>()
      .value((d) => d.value);

    const arc = d3
      .arc<d3.PieArcDatum<{ label: string; value: number }>>()
      .innerRadius(0)
      .outerRadius(radius);

    const outerArc = d3
      .arc<d3.PieArcDatum<{ label: string; value: number }>>()
      .innerRadius(radius * 0.9)
      .outerRadius(radius * 0.9);

    const arcs = svg
      .selectAll(".arc")
      .data(pie(data))
      .enter()
      .append("g")
      .attr("class", "arc");

    arcs
      .append("path")
      .attr("d", arc)
      .attr("fill", (d) => colorFn(d.data)) // Use the explicit color function
      .attr("stroke", "currentColor") // Use currentColor for theme responsiveness (border color)
      .style("stroke-width", "2px");

    arcs
      .append("text")
      .attr("transform", (d) => `translate(${outerArc.centroid(d)})`)
      .attr("dy", ".35em")
      .style("text-anchor", "middle")
      .style("font-size", "10px")
      .attr("fill", "currentColor") // Use currentColor for theme responsiveness
      .text((d) => `${d.data.label} (${d.data.value})`);
  }

  private renderLineChart(
    container: HTMLElement,
    data: { date: Date; value: number }[],
    title: string,
    lineColor: string // Accepts RGB string for line and dots
  ) {
    const margin = { top: 20, right: 30, bottom: 60, left: 50 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = container.clientHeight - margin.top - margin.bottom;

    const svg = d3
      .select(container)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // ---------- X Scale ----------
    const x = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => d.date) as [Date, Date])
      .range([0, width]);

    // ---------- Y Scale ----------
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.value)! + 1])
      .range([height, 0]);

    // ---------- Line Generator ----------
    const line = d3
      .line<{ date: Date; value: number }>()
      .x((d) => x(d.date))
      .y((d) => y(d.value));

    // ---------- X Axis (FIXED) ----------
    const xAxis = d3
      .axisBottom<Date>(x)
      .ticks(d3.timeDay.every(Math.max(1, Math.floor(data.length / 7)))!)
      .tickFormat((value: Date | d3.NumberValue) =>
        value instanceof Date ? d3.timeFormat("%b %d")(value) : ""
      );

    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(xAxis)
      .selectAll("text")
      .attr("transform", "translate(-10,0)rotate(-45)")
      .style("text-anchor", "end")
      .attr("fill", "currentColor");

    // ---------- Y Axis ----------
    svg
      .append("g")
      .call(d3.axisLeft(y).tickFormat(d3.format("d")))
      .selectAll("text")
      .attr("fill", "currentColor");

    // ---------- Line Path ----------
    svg
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", lineColor)
      .attr("stroke-width", 2)
      .attr("d", line);

    // ---------- Data Points ----------
    svg
      .selectAll(".dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", (d) => x(d.date))
      .attr("cy", (d) => y(d.value))
      .attr("r", 4)
      .attr("fill", lineColor)
      .attr("stroke", "currentColor")
      .attr("stroke-width", 1.5)
      .append("title")
      .text((d) => `${d3.timeFormat("%b %d, %Y")(d.date)}: ${d.value} tasks`);
  }
}
