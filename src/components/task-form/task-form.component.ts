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
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.css'],
})
export class TaskFormComponent {
  taskToEditInput = input<Task | undefined>();
  taskSaved = output<Task>();

  fb: FormBuilder = inject(FormBuilder);
  taskService: TaskService = inject(TaskService);
  authService: AuthService = inject(AuthService);
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
    if (fromInput) return fromInput;
    const id = this.taskId();
    if (id) return this.taskService.getTaskById(id)();
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
    tagged_users: this.fb.array([]),
    approval_required: [false],
    reminder_option: ["None" as ReminderOption],
    repeat_option: ["None" as RepeatOption],
  });

  taskTypes: TaskType[] = ["Task", "Order", "Bugfix", "Shopping", "Others"];
  priorities: TaskPriority[] = ["Low", "Medium", "High", "Urgent"];
  reminderOptions: ReminderOption[] = ["None", "1 Day Before", "1 Hour Before", "Custom"];
  repeatOptions: RepeatOption[] = ["None", "Daily", "Weekly", "Monthly"];

  isEditMode = false;

  constructor() {
    this.route.paramMap.subscribe((params) => this.taskId.set(params.get("id")));

    effect(() => {
      const userList = this.users();
      const taggedUsersArray = this.taskForm.get('tagged_users') as FormArray;
      
      while(taggedUsersArray.length !== 0) {
        taggedUsersArray.removeAt(0);
      }
      userList.forEach(() => taggedUsersArray.push(this.fb.control(false)));
    });

    effect(() => {
      const task = this.taskToEdit();
      if (task) {
        this.isEditMode = true;
        this.taskForm.patchValue({
          ...task,
          tags: task.tags.join(", "),
        });
        
        this.subtasks.clear();
        task.subtasks.forEach(sub => this.subtasks.push(this.fb.group({ ...sub })));

        const userList = this.users();
        const taggedUsersBools = userList.map(u => task.tagged_users?.includes(u.id) ?? false);
        this.taskForm.get('tagged_users')?.patchValue(taggedUsersBools, { emitEvent: false });

      } else {
        this.isEditMode = false;
        this.taskForm.reset({
          type: "Task",
          priority: "Medium",
          start_date: new Date().toISOString().substring(0, 10),
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
          approval_required: false,
          reminder_option: "None",
          repeat_option: "None",
          assign_to: this.currentUser()?.profile?.id || '',
          project_id: this.route.snapshot.queryParamMap.get('projectId') || null
        });
        this.subtasks.clear();
      }
    });

    if (!this.currentUser()) {
      this.notificationService.showToast("You must be logged in.", "error");
      this.router.navigate(["/auth"]);
    }
  }

  get subtasks() {
    return this.taskForm.get("subtasks") as FormArray<FormGroup>;
  }

  addSubtask(): void {
    this.subtasks.push(this.fb.group({
      id: [this.uuidService.generateUuid()],
      title: ['', Validators.required],
      completed: [false]
    }));
  }

  removeSubtask(index: number): void {
    this.subtasks.removeAt(index);
  }

  async onSubmit(): Promise<void> {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      this.notificationService.showToast("Please fill in all required fields.", "error");
      return;
    }

    const formValue = this.taskForm.value;
    const userList = this.users();
    const tagged_users = formValue.tagged_users?.map((checked, i) => checked ? userList[i].id : null).filter((id): id is string => id !== null) || [];

    const taskData: Omit<Task, "id" | "ticket_id" | "created_at" | "like_count" | "liked_by_users"> = {
      ...this.taskToEdit(), // Keep existing fields like status
      ...formValue,
      tags: formValue.tags ? formValue.tags.split(",").map(t => t.trim()).filter(t => t) : [],
      tagged_users: tagged_users,
      status: this.isEditMode ? this.taskToEdit()!.status : 'todo',
      approval_status: formValue.approval_required ? (this.taskToEdit()?.approval_status || 'Pending') : null,
      assigned_by: this.taskToEdit()?.assigned_by || this.currentUser()!.profile.id,
      updated_by: this.currentUser()!.profile.id
    } as Omit<Task, "id" | "ticket_id" | "created_at" | "like_count" | "liked_by_users">;

    try {
      let savedTask: Task;
      if (this.isEditMode && this.taskToEdit()) {
        savedTask = await this.taskService.updateTask({ ...taskData, id: this.taskToEdit()!.id, ticket_id: this.taskToEdit()!.ticket_id } as Task);
      } else {
        savedTask = await this.taskService.addTask(taskData);
      }
      this.taskSaved.emit(savedTask);
      this.router.navigate(["/tasks", savedTask.id]);
    } catch (error) {
      // Notification is handled in the service
    }
  }
}
