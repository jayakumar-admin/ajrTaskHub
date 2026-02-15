import {
  Component,
  inject,
  input,
  output,
  effect,
  computed,
  signal,
} from "@angular/core";
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  FormArray,
  FormControl,
  FormGroup,
} from "@angular/forms";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router } from "@angular/router";
import { TaskService } from "../../services/task.service";
import { AuthService } from "../../services/auth.service";
import {
  Task,
  User,
  TaskType,
  TaskPriority,
  RepeatOption,
  ReminderOption,
  Subtask,
  AuthenticatedUser,
  Project,
} from "../../shared/interfaces";
import { NotificationService } from "../../services/notification.service";
import { UserService } from "../../services/user.service";
import { UuidService } from "../../services/uuid.service";
import { ProjectService } from "../../services/project.service";

@Component({
  selector: "app-task-form",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div
      class="container mx-auto p-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl my-8">
      <h2 class="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
        {{ isEditMode ? "Edit Task" : "Create New Task" }}
      </h2>

      <form
        [formGroup]="taskForm"
        (ngSubmit)="onSubmit()"
        class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Title -->
        <div>
          <label
            for="title"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Title <span class="text-red-500">*</span></label
          >
          <input
            id="title"
            type="text"
            formControlName="title"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
            [class.border-red-500]="
              taskForm.get('title')?.invalid && taskForm.get('title')?.touched
            " />
          @if (taskForm.get('title')?.invalid && taskForm.get('title')?.touched)
          {
          <p class="mt-1 text-sm text-red-500">Title is required.</p>
          }
        </div>

        <!-- Description -->
        <div>
          <label
            for="description"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Description</label
          >
          <textarea
            id="description"
            formControlName="description"
            rows="3"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"></textarea>
        </div>

        <!-- Task Type -->
        <div>
          <label
            for="type"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Task Type <span class="text-red-500">*</span></label
          >
          <select
            id="type"
            formControlName="type"
            class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors">
            @for (type of taskTypes; track type) {
            <option [value]="type">{{ type }}</option>
            }
          </select>
        </div>

        <!-- Assign To -->
        <div>
          <label
            for="assign_to"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Assign To <span class="text-red-500">*</span></label
          >
          <select
            id="assign_to"
            formControlName="assign_to"
            class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
            [class.border-red-500]="
              taskForm.get('assign_to')?.invalid &&
              taskForm.get('assign_to')?.touched
            ">
            <option value="">Select User</option>
            @for (user of users(); track user.id) {
            <option [value]="user.id">{{ user.username }}</option>
            }
          </select>
          @if (taskForm.get('assign_to')?.invalid &&
          taskForm.get('assign_to')?.touched) {
          <p class="mt-1 text-sm text-red-500">Assignee is required.</p>
          }
        </div>

        <!-- Project -->
        <div>
          <label
            for="project_id"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Project</label
          >
          <select
            id="project_id"
            formControlName="project_id"
            class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors">
            <option [value]="null">No Project</option>
            @for (project of projects(); track project.id) {
            <option [value]="project.id">{{ project.name }}</option>
            }
          </select>
        </div>

        <!-- Duration to complete -->
        <div>
          <label
            for="duration"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Duration to Complete</label
          >
          <input
            id="duration"
            type="text"
            formControlName="duration"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
            placeholder="e.g., 2 hours, 3 days" />
        </div>

        <!-- Priority -->
        <div class="md:col-start-1">
          <label
            for="priority"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Priority <span class="text-red-500">*</span></label
          >
          <select
            id="priority"
            formControlName="priority"
            class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors">
            @for (p of priorities; track p) {
            <option [value]="p">{{ p }}</option>
            }
          </select>
        </div>

        <!-- Start Date -->
        <div>
          <label
            for="start_date"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Start Date <span class="text-red-500">*</span></label
          >
          <input
            id="start_date"
            type="date"
            formControlName="start_date"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
            [class.border-red-500]="
              taskForm.get('start_date')?.invalid &&
              taskForm.get('start_date')?.touched
            " />
          @if (taskForm.get('start_date')?.invalid &&
          taskForm.get('start_date')?.touched) {
          <p class="mt-1 text-sm text-red-500">Start Date is required.</p>
          }
        </div>

        <!-- Due Date -->
        <div>
          <label
            for="due_date"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Due Date <span class="text-red-500">*</span></label
          >
          <input
            id="due_date"
            type="date"
            formControlName="due_date"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
            [class.border-red-500]="
              taskForm.get('due_date')?.invalid &&
              taskForm.get('due_date')?.touched
            " />
          @if (taskForm.get('due_date')?.invalid &&
          taskForm.get('due_date')?.touched) {
          <p class="mt-1 text-sm text-red-500">Due Date is required.</p>
          }
        </div>

        <!-- Subtasks -->
        <div class="md:col-span-2">
          <label
            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Subtasks</label
          >
          <div formArrayName="subtasks" class="space-y-2 mt-1">
            @for (subtaskControl of subtasks.controls; track $index) {
            <div [formGroupName]="$index" class="flex items-center space-x-2">
              <input
                type="text"
                formControlName="title"
                class="flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                placeholder="Subtask title" />
              <button
                type="button"
                (click)="removeSubtask($index)"
                class="p-2 rounded-full text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor">
                  <path
                    fill-rule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 11-2 0v6a1 1 0 112 0V8z"
                    clip-rule="evenodd" />
                </svg>
              </button>
            </div>
            }
          </div>
          <button
            type="button"
            (click)="addSubtask()"
            class="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-primary-700 dark:text-white dark:hover:bg-primary-600 transition-colors">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="-ml-0.5 mr-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 4v16m8-8H4" />
            </svg>
            Add Subtask
          </button>
        </div>

        <!-- Tags / Labels -->
        <div>
          <label
            for="tags"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Tags / Labels (comma-separated)</label
          >
          <input
            id="tags"
            type="text"
            formControlName="tags"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
            placeholder="e.g., frontend, bug, urgent" />
        </div>

        <!-- Tagged Users -->
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Tag Users</label>
          <div formGroupName="tagged_users" class="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg max-h-48 overflow-y-auto">
            @for (user of users(); track user.id) {
              @if(taggedUsersGroup.controls[user.id]) {
                <div class="flex items-center">
                  <input [id]="'tag-' + user.id" type="checkbox" [formControlName]="user.id" class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700 transition-colors">
                  <label [for]="'tag-' + user.id" class="ml-2 text-sm text-gray-900 dark:text-gray-300">{{ user.username }}</label>
                </div>
              }
            }
          </div>
        </div>

        <!-- Approval Needed -->
        <div class="flex items-center">
          <input
            id="approval_required"
            type="checkbox"
            formControlName="approval_required"
            class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700 transition-colors" />
          <label
            for="approval_required"
            class="ml-2 block text-sm font-medium text-gray-900 dark:text-gray-300"
            >Approval Needed</label
          >
        </div>

        <!-- Reminder Options -->
        <div>
          <label
            for="reminder_option"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Reminder Options</label
          >
          <select
            id="reminder_option"
            formControlName="reminder_option"
            class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors">
            @for (option of reminderOptions; track option) {
            <option [value]="option">{{ option }}</option>
            }
          </select>
        </div>

        <!-- Repeat Task Options -->
        <div>
          <label
            for="repeat_option"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >Repeat Task Options</label
          >
          <select
            id="repeat_option"
            formControlName="repeat_option"
            class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors">
            @for (option of repeatOptions; track option) {
            <option [value]="option">{{ option }}</option>
            }
          </select>
        </div>

        <!-- Action Buttons -->
        <div class="md:col-span-2 flex justify-end space-x-4 mt-6">
          <button
            type="button"
            (click)="router.navigateByUrl('/tasks')"
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors">
            Cancel
          </button>
          <button
            type="submit"
            class="inline-flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-primary-700 dark:hover:bg-primary-600 transition-colors">
            {{ isEditMode ? "Update Task" : "Create Task" }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [],
})
export class TaskFormComponent {
  taskToEditInput = input<Task | undefined>();
  taskSaved = output<Task>();

  fb: FormBuilder = inject(FormBuilder);
  taskService: TaskService = inject(TaskService);
  authService = inject(AuthService);
  router: Router = inject(Router);
  route: ActivatedRoute = inject(ActivatedRoute);
  notificationService = inject(NotificationService);
  userService = inject(UserService);
  uuidService = inject(UuidService);
  projectService = inject(ProjectService);

  users = this.userService.users;
  projects = this.projectService.projects;
  currentUser = this.authService.currentUser;

  private taskId = signal<string | null>(null);
  private taskToEdit = computed(() => {
    const fromInput = this.taskToEditInput();
    if (fromInput) {
      return fromInput;
    }
    const id = this.taskId();
    if (id) {
      return this.taskService.getTaskById(id)();
    }
    return undefined;
  });

  taskForm = this.fb.group({
    title: ["", Validators.required],
    description: [""],
    type: ["Task" as TaskType, Validators.required],
    assign_to: ["", Validators.required],
    project_id: [null as string | null],
    duration: [""],
    priority: ["Medium" as TaskPriority, Validators.required],
    start_date: ["", Validators.required],
    due_date: ["", Validators.required],
    subtasks: this.fb.array<FormGroup>([]),
    tags: [""],
    tagged_users: this.fb.group({}),
    approval_required: [false],
    reminder_option: ["None" as ReminderOption],
    repeat_option: ["None" as RepeatOption],
  });

  taskTypes: TaskType[] = ["Task", "Order", "Bugfix", "Shopping", "Others"];
  priorities: TaskPriority[] = ["Low", "Medium", "High", "Urgent"];
  reminderOptions: ReminderOption[] = [
    "None",
    "1 Day Before",
    "1 Hour Before",
    "Custom",
  ];
  repeatOptions: RepeatOption[] = ["None", "Daily", "Weekly", "Monthly"];

  isEditMode = false;

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get("id");
      this.taskId.set(id);
    });

    // Effect to manage tagged_users form controls based on available users
    effect(() => {
      const userList = this.users();
      const taggedUsersGroup = this.taskForm.get('tagged_users') as FormGroup;
      
      const existingControlIds = new Set(Object.keys(taggedUsersGroup.controls));
      const userIds = new Set(userList.map(u => u.id));

      existingControlIds.forEach(id => {
          if (!userIds.has(id)) {
              taggedUsersGroup.removeControl(id);
          }
      });

      userList.forEach(user => {
          if (!taggedUsersGroup.contains(user.id)) {
              taggedUsersGroup.addControl(user.id, this.fb.control(false));
          }
      });
    });

    // Main effect to populate form based on task
    effect(
      () => {
        const task = this.taskToEdit();
        if (task) {
          this.isEditMode = true;
          this.taskForm.patchValue({
            title: task.title,
            description: task.description,
            type: task.type,
            assign_to: task.assign_to,
            project_id: task.project_id,
            duration: task.duration,
            priority: task.priority,
            start_date: task.start_date,
            due_date: task.due_date,
            tags: task.tags.join(", "),
            approval_required: task.approval_required,
            reminder_option: task.reminder_option,
            repeat_option: task.repeat_option,
          });
          this.subtasks.clear();
          task.subtasks.forEach((sub) =>
            this.subtasks.push(
              this.fb.group({
                id: [sub.id],
                title: [sub.title, Validators.required],
                completed: [sub.completed],
              })
            )
          );

          // Patch tagged users
          const taggedUsersGroup = this.taskForm.get('tagged_users') as FormGroup;
          if (taggedUsersGroup) {
              Object.keys(taggedUsersGroup.controls).forEach(userId => {
                  taggedUsersGroup.get(userId)?.setValue(false, { emitEvent: false });
              });
              if (task.tagged_users) {
                  task.tagged_users.forEach(taggedId => {
                      if (taggedUsersGroup.get(taggedId)) {
                          taggedUsersGroup.get(taggedId)?.setValue(true, { emitEvent: false });
                      }
                  });
              }
          }

        } else {
          this.isEditMode = false;
          this.taskForm.reset();
          this.subtasks.clear();
          this.taskForm.patchValue({
            type: "Task",
            priority: "Medium",
            start_date: new Date().toISOString().substring(0, 10),
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
              .toISOString()
              .substring(0, 10),
            approval_required: false,
            reminder_option: "None",
            repeat_option: "None",
          });
          const currentUserId = this.currentUser()?.profile?.id;
          if (currentUserId) {
            this.taskForm.patchValue({ assign_to: currentUserId });
          }

          const taggedUsersGroup = this.taskForm.get('tagged_users') as FormGroup;
          if (taggedUsersGroup) {
              Object.keys(taggedUsersGroup.controls).forEach(userId => {
                  taggedUsersGroup.get(userId)?.setValue(false, { emitEvent: false });
              });
          }

          const projectIdFromQuery = this.route.snapshot.queryParamMap.get('projectId');
          if (projectIdFromQuery) {
              this.taskForm.patchValue({ project_id: projectIdFromQuery });
          }
        }
      },
      { allowSignalWrites: true }
    );

    if (!this.currentUser()) {
      this.notificationService.showToast(
        "You must be logged in to create/edit tasks.",
        "error"
      );
      this.router.navigate(["/auth"]);
    }
  }

  get taggedUsersGroup(): FormGroup {
    return this.taskForm.get("tagged_users") as FormGroup;
  }

  get subtasks() {
    return this.taskForm.get("subtasks") as FormArray<FormGroup>;
  }

  addSubtask(): void {
    this.subtasks.push(
      this.fb.group({
        id: [this.uuidService.generateUuid()],
        title: ['', Validators.required],
        completed: [false]
      })
    );
  }

  removeSubtask(index: number): void {
    this.subtasks.removeAt(index);
  }

  async onSubmit(): Promise<void> {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      this.notificationService.showToast(
        "Please fill in all required fields correctly.",
        "error"
      );
      return;
    }

    const formValue = this.taskForm.value;
    const currentUserId = this.currentUser()?.profile?.id;
    if (!currentUserId) {
      this.notificationService.showToast("User not logged in.", "error");
      return;
    }

    const subtasksArray: Subtask[] = this.subtasks.value.filter((s: any) => s.title);

    const taggedUsersValue = this.taskForm.value.tagged_users || {};
    const tagged_users = Object.entries(taggedUsersValue)
      .filter(([, isTagged]) => isTagged)
      .map(([userId]) => userId);

    const taskData: Omit<
      Task,
      "id" | "created_at" | "updated_by" | "updated_by_username" | "like_count" | "liked_by_users"
    > = {
      title: formValue.title!,
      description: formValue.description || "",
      type: formValue.type!,
      priority: formValue.priority!,
      duration: formValue.duration || "",
      start_date: formValue.start_date!,
      due_date: formValue.due_date!,
      status:
        this.isEditMode && this.taskToEdit()
          ? this.taskToEdit()!.status
          : "todo",
      assign_to: formValue.assign_to!,
      assigned_by: currentUserId,
      approval_required: formValue.approval_required!,
      approval_status: formValue.approval_required ? "Pending" : null,
      tags: formValue.tags
        ? formValue.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag)
        : [],
      tagged_users: tagged_users,
      subtasks: subtasksArray,
      reminder_option: formValue.reminder_option!,
      repeat_option: formValue.repeat_option!,
      project_id: formValue.project_id || null,
    };

    try {
      let savedTask: Task;
      if (this.isEditMode && this.taskToEdit()) {
        savedTask = await this.taskService.updateTask({
          ...this.taskToEdit()!,
          ...taskData,
          id: this.taskToEdit()!.id
        });
        this.notificationService.showToast("Task updated successfully!", "success");
      } else {
        savedTask = await this.taskService.addTask(taskData);
        this.notificationService.showToast("Task created successfully!", "success");
      }
      this.taskSaved.emit(savedTask);
      this.router.navigate(["/tasks", savedTask.id]);
    } catch (error) {
      console.error("Error saving task:", error);
      this.notificationService.showToast(
        "Failed to save task. Please try again.",
        "error"
      );
    }
  }
}
