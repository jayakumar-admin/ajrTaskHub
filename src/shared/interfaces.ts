
export interface User {
  id: string; 
  auth_id?: string; // This might not be exposed from the new backend
  username: string;
  role: 'Admin' | 'User' | 'Manager' | 'Viewer';
  created_at?: string;
  avatar_url?: string; // Changed from base64
  avatar_base64?: string; // Keep for backward compatibility if needed temporarily
}

// Represents the authenticated user in the new JWT model
export interface AuthenticatedUser {
  token: string;
  profile: User;
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
  file_url: string; // Changed from base64
  file_base64?: string; // Keep for upload component
  uploadedBy: string;
  uploaded_by_username?: string;
  uploadedAt: string;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  username: string;
  text: string;
  createdAt: string;
}

export interface HistoryEntry {
  id: string;
  taskId: string;
  action: string;
  userId: string;
  username: string;
  timestamp: string;
  details?: string;
}

export interface Task {
  id: string;
  ticket_id: number;
  title: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  duration: string;
  start_date: string;
  due_date: string;
  status: TaskStatus;
  assign_to: string;
  assigned_to_username?: string;
  assigned_by: string;
  assigned_by_username?: string;
  approval_required: boolean;
  approval_status: ApprovalStatus;
  updated_by: string;
  updated_by_username?: string;
  created_at: string;
  like_count: number;
  tags: string[];
  tagged_users: string[];
  subtasks: Subtask[];
  reminder_option: ReminderOption;
  repeat_option: RepeatOption;
  liked_by_users: string[];
  project_id?: string | null;
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
  created_at: string;
  read: boolean;
  task_id?: string;
}

export interface ChatToast {
  id: string;
  senderUsername: string;
  senderAvatar: string;
  message: string;
  conversationUserId: string;
  timestamp: string;
}

export interface TaskReportSummary {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  reviewTasks: number;
  overdueTasks: number;
  priorityDistribution: { priority: TaskPriority; count: number }[];
  statusDistribution: { status: TaskStatus; count: number }[];
  typeDistribution: { type: TaskType; count: number }[];
  tasksByDate: { date: string; count: number }[];
  summaryText: string;
}

export interface UserSettings {
  id?: string;
  user_id: string;
  email_notifications_enabled: boolean;
  whatsapp_notifications_enabled?: boolean;
  whatsapp_number?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SystemConfig {
  whatsapp_integration_enabled: boolean;
  whatsapp_access_token?: string;
  whatsapp_phone_number_id?: string;
  whatsapp_graph_url?: string;
  whatsapp_status_template?: string;
}

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
  created_at: string;
  updated_at?: string;
  is_read: boolean;
  sender_username?: string;
  attachment_url?: string; // Changed from base64
  attachment_type?: 'image' | 'video' | 'audio' | 'file';
  reactions?: ChatMessageReaction[];
}

export interface Conversation {
  other_user_id: string;
  other_user_username: string;
  other_user_avatar_base64: string; // This is fine to stay as base64 for display
  last_message_text: string;
  last_message_timestamp: string;
  unread_count: number;
}

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

export interface CronJob {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  schedule: string;
  last_run?: string;
  next_run?: string;
}