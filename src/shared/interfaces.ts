export interface User {
  id: string; // This is the public.users table's UUID
  auth_id: string; // This is the auth.users table's UUID
  username: string;
  role: 'Admin' | 'User' | 'Manager' | 'Viewer';
  created_at?: string; // ISO date string
  avatar_base64?: string;
}

// Represents the full authenticated user, combining Supabase Auth session and our public profile
export interface AuthenticatedUser {
  session: any; // Supabase Session object, can be more specific if needed
  profile: User; // Our custom user profile from public.users
}

export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'completed';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TaskType = 'Task' | 'Order' | 'Bugfix' | 'Shopping' | 'Others';
export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected' | null;
export type RepeatOption = 'None' | 'Daily' | 'Weekly' | 'Monthly';
export type ReminderOption = 'None' | '1 Day Before' | '1 Hour Before' | 'Custom';
export type ReactionType = '👍' | '❤️' | '💡' | '🎉';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Attachment {
  id: string;
  taskId: string;
  fileName: string;
  file_base64: string;
  uploadedBy: string; // userId from public.users
  uploaded_by_username?: string; // For display, derived
  uploadedAt: string; // ISO date string
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string; // userId from public.users
  username: string;
  text: string;
  createdAt: string; // ISO date string
}

export interface HistoryEntry {
  id: string;
  taskId: string;
  action: string; // e.g., 'Created', 'Status changed from X to Y', 'Comment added', 'Approved'
  userId: string; // userId from public.users
  username: string; // Denormalized for simpler display
  timestamp: string; // ISO date string
  details?: string; // Optional additional details
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  duration: string; // e.g., "2 hours", "3 days"
  start_date: string; // ISO date string
  due_date: string; // ISO date string
  status: TaskStatus;
  assign_to: string; // userId from public.users
  assigned_to_username?: string; // For display, derived
  assigned_by: string; // userId from public.users
  assigned_by_username?: string; // For display, derived
  approval_required: boolean;
  approval_status: ApprovalStatus;
  updated_by: string; // userId from public.users
  updated_by_username?: string; // For display, derived
  created_at: string; // ISO date string
  like_count: number;
  tags: string[];
  tagged_users: string[];
  subtasks: Subtask[];
  reminder_option: ReminderOption;
  repeat_option: RepeatOption;
  liked_by_users: string[];
  project_id?: string | null; // Optional: Link to a project
}

export interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
  created_by: string;
  created_by_username?: string;
  member_ids: string[];
}

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  created_at: string; // ISO date string
  read: boolean;
  task_id?: string;
}

// Represents a transient chat notification toast
export interface ChatToast {
  id: string;
  senderUsername: string;
  senderAvatar: string;
  message: string;
  conversationUserId: string; // The ID of the user who sent the message
  timestamp: string;
}

// New interface for AI-generated task report summary
export interface TaskReportSummary {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  reviewTasks: number;
  overdueTasks: number;
  priorityDistribution: { priority: TaskPriority; count: number }[];
  statusDistribution: { status: TaskStatus; count: number }[];
  typeDistribution: { type: TaskType; count: number }[]; // New: Tasks grouped by type
  tasksByDate: { date: string; count: number }[]; // For a potential line chart
  summaryText: string;
}

// New interface for user settings, including notification preferences
export interface UserSettings {
  id: string; // PK, same as public.users.id
  user_id: string; // FK to public.users.id
  email_notifications_enabled: boolean;
  whatsapp_notifications_enabled?: boolean; // New: WhatsApp toggle
  whatsapp_number?: string; // New: Phone number
  created_at?: string;
  updated_at?: string;
}

// Interface for Global System Settings (Admin only)
export interface SystemConfig {
  whatsapp_integration_enabled: boolean;
  whatsapp_api_key?: string;
  whatsapp_provider?: 'Twilio' | 'Meta';
  whatsapp_status_template?: string;
}

// --- New Chat Interfaces ---

export interface ChatMessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message_text: string;
  created_at: string; // ISO Date string
  updated_at?: string; // To track if a message was edited
  is_read: boolean;
  sender_username?: string; // Denormalized for display
  attachment_base64?: string;
  attachment_type?: 'image' | 'video' | 'audio' | 'file';
  reactions?: ChatMessageReaction[];
}

export interface Conversation {
  other_user_id: string;
  other_user_username: string;
  other_user_avatar_base64: string;
  last_message_text: string;
  last_message_timestamp: string;
  unread_count: number;
}

// --- Role-Based Access Control ---
export interface RolePermissions {
  role: 'Admin' | 'Manager' | 'User' | 'Viewer';
  can_create_tasks: boolean;
  can_create_projects: boolean;
  can_use_chat: boolean;
  can_change_status: boolean;
  can_access_tools: boolean;
  can_access_calendar: boolean;
  can_access_kanban: boolean;
  can_assign_tasks: boolean;
  can_add_comment_attachment: boolean;
}