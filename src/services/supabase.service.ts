
import { Injectable } from '@angular/core';
import { Task, Comment, Attachment, HistoryEntry, User, TaskStatus, Subtask, ApprovalStatus, UserSettings, Notification, ChatMessage, Conversation, ChatMessageReaction, Project, RolePermissions } from '../shared/interfaces';
import { createClient, SupabaseClient, AuthSession, RealtimeChannel } from '@supabase/supabase-js';
import { UuidService } from './uuid.service';

// Define an internal interface to represent the raw data structure coming from the 'history' table
interface HistoryRowFromDB {
  id: string;
  task_id: string;
  action: string;
  user_id: string;
  username: string; // Denormalized field as per HistoryEntry interface
  timestamp: string;
  details?: string;
}

interface AttachmentRowFromDB {
  id: string;
  task_id: string;
  file_name: string;
  file_base64: string;
  uploaded_by: string;
  uploaded_at: string;
  user: { username: string }[] | null; 
}

interface CommentRowFromDB {
  id: string;
  task_id: string;
  user_id: string;
  text: string;
  created_at: string;
  user: { username: string }[] | null;
}


@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  supabase: SupabaseClient; // Make public to allow AuthService to access .auth
  private _supabaseUrl: string;

  constructor(private uuidService: UuidService) {
 const supabaseUrl = 'https://kmukweenyvpjosutimpi.supabase.co';
    const supabaseAnonKey ='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttdWt3ZWVueXZwam9zdXRpbXBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MjU5NjksImV4cCI6MjA4MDEwMTk2OX0._ZMsPjG8HVnPdRNvZoyrKDXktCoTQKUW63TY573b0Fo';



    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase URL or ANON Key is missing.');
      throw new Error('Supabase client initialization failed: Environment variables missing.');
    }
    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    this._supabaseUrl = supabaseUrl;
  }

  // --- Supabase Table Operations ---

  // Users (Public Profiles)
  async fetchUsers(): Promise<User[]> {
    const { data, error } = await this.supabase.from('users').select('*');
    if (error) {
      console.error('Error fetching users:', error.message || error);
      throw new Error(`Supabase Error fetching users: ${error.message || JSON.stringify(error)}`);
    }
    return data || [];
  }

  async findUserByUsernameAndRole(username: string, role: User['role']): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('role', role)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
      console.error('Error finding user in Supabase:', error.message || error);
      throw new Error(`Supabase Error finding user: ${error.message || JSON.stringify(error)}`);
    }
    return data || null;
  }

  async addUserProfile(auth_id: string, username: string, role: User['role']): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .insert({ auth_id, username, role })
      .select()
      .single();
    if (error) {
      console.error('Error adding user profile to Supabase:', error.message || error);
      throw new Error(`Supabase Error adding user profile: ${error.message || JSON.stringify(error)}`);
    }
    return data;
  }

  async updateUserProfile(userId: string, updates: { username?: string; avatar_base64?: string }): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error.message || error);
      throw new Error(`Supabase Error updating user profile: ${error.message || JSON.stringify(error)}`);
    }
    return data;
  }

  async updateUserRole(profileId: string, newRole: User['role']): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', profileId)
      .select()
      .single();
    if (error) {
      console.error('Error updating user role:', error.message || error);
      throw new Error(`Supabase Error updating user role: ${error.message || JSON.stringify(error)}`);
    }
    return data;
  }

  async deleteUserProfile(profileId: string): Promise<void> {
    const { error } = await this.supabase.from('users').delete().eq('id', profileId);
    if (error) {
      console.error('Error deleting user profile:', error.message || error);
      throw new Error(`Supabase Error deleting user profile: ${error.message || JSON.stringify(error)}`);
    }
  }

  async deleteAuthUser(authId: string): Promise<void> {
    // This method invokes a Supabase Edge Function (or database function via RPC)
    // which is required to delete a user from the `auth.users` table, as this
    // operation needs admin privileges (service_role key).
    const { error } = await this.supabase.rpc('delete_user', {
      user_id_to_delete: authId
    });

    if (error) {
      console.error('Error deleting auth user via RPC:', error);
      if (error.message.includes('permission denied')) {
        throw new Error('Permission denied. Ensure the backend function is correctly configured with security definer.');
      }
      if (error.message.includes('not exist')) {
        throw new Error('The `delete_user` function was not found on the backend. Please create it in the Supabase SQL editor.');
      }
      throw new Error(`Supabase RPC Error: ${error.message}`);
    }
  }

  // --- Role Permissions ---
  async fetchRolePermissions(): Promise<RolePermissions[]> {
    const { data, error } = await this.supabase.from('role_permissions').select('*');
    if (error) {
      console.error('Error fetching role permissions:', error);
      throw new Error(`Supabase Error fetching role permissions: ${error.message}`);
    }
    return data || [];
  }

  async updateRolePermissions(role: string, permissions: Partial<RolePermissions>): Promise<RolePermissions> {
    const { data, error } = await this.supabase
      .from('role_permissions')
      .update(permissions)
      .eq('role', role)
      .select()
      .single();

    if (error) {
      console.error(`Error updating permissions for role ${role}:`, error);
      throw new Error(`Supabase Error updating permissions: ${error.message}`);
    }
    return data;
  }


  // --- Projects ---
  async fetchProjects(): Promise<Project[]> {
    // Step 1: Fetch projects the user can see (based on RLS on 'projects' table).
    // Do not join 'project_users' here to avoid recursion.
    const { data: projectsData, error: projectsError } = await this.supabase
      .from('projects')
      .select(`
        id,
        name,
        description,
        created_at,
        created_by,
        created_by_user:users!projects_created_by_fkey(username)
      `);

    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
      throw new Error(`Supabase Error fetching projects: ${projectsError.message || JSON.stringify(projectsError)}`);
    }

    if (!projectsData || projectsData.length === 0) {
      return [];
    }

    const projectIds = projectsData.map(p => p.id);

    // Step 2: Separately fetch members for the visible projects.
    // This query is simpler and less likely to trigger recursive RLS checks.
    const { data: membersData, error: membersError } = await this.supabase
      .from('project_users')
      .select('project_id, user_id')
      .in('project_id', projectIds);

    if (membersError) {
      console.error('Error fetching project members:', membersError);
      throw new Error(`Supabase Error fetching project members: ${membersError.message || JSON.stringify(membersError)}`);
    }

    // Step 3: Create a map for efficient member lookup.
    const membersByProjectId = new Map<string, string[]>();
    if (membersData) {
      membersData.forEach(member => {
        if (!membersByProjectId.has(member.project_id)) {
          membersByProjectId.set(member.project_id, []);
        }
        membersByProjectId.get(member.project_id)!.push(member.user_id);
      });
    }

    // Step 4: Combine the data on the client side.
    return projectsData.map((project: any) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      created_at: project.created_at,
      created_by: project.created_by,
      // FIX: The user join may return an array, so access the first element.
      created_by_username: project.created_by_user?.[0]?.username,
      member_ids: membersByProjectId.get(project.id) || [],
    }));
  }
  
  private async fetchSingleProject(projectId: string): Promise<Project> {
    // Step 1: Fetch the single project's main data.
    const { data: projectData, error: projectError } = await this.supabase
      .from('projects')
      .select(`
        id,
        name,
        description,
        created_at,
        created_by,
        created_by_user:users!projects_created_by_fkey(username)
      `)
      .eq('id', projectId)
      .single();

    if (projectError) {
      console.error(`Error fetching project ${projectId}:`, projectError);
      throw new Error(`Supabase Error fetching project: ${projectError.message || JSON.stringify(projectError)}`);
    }

    // Step 2: Fetch the members for this project.
    const { data: membersData, error: membersError } = await this.supabase
      .from('project_users')
      .select('user_id')
      .eq('project_id', projectId);

    if (membersError) {
        console.error(`Error fetching members for project ${projectId}:`, membersError);
        throw new Error(`Supabase Error fetching project members: ${membersError.message || JSON.stringify(membersError)}`);
    }

    const memberIds = membersData ? membersData.map(m => m.user_id) : [];
    
    // Step 3: Combine the data.
    return {
      id: projectData.id,
      name: projectData.name,
      description: projectData.description,
      created_at: projectData.created_at,
      created_by: projectData.created_by,
      // FIX: The user join returns an array, so access the first element. This resolves the reported error.
      created_by_username: (projectData.created_by_user as any)?.[0]?.username,
      member_ids: memberIds,
    };
  }

  async addProject(project: Omit<Project, 'id' | 'created_at' | 'created_by_username' | 'member_ids'>, memberIds: string[]): Promise<Project> {
    // Step 1: Insert the project
    const { data: projectData, error: projectError } = await this.supabase
      .from('projects')
      .insert({
        name: project.name,
        description: project.description,
        created_by: project.created_by
      })
      .select('id') // Only select the ID we need
      .single();

    if (projectError) {
      console.error('Error adding project:', projectError);
      throw new Error(`Supabase Error adding project: ${projectError.message || JSON.stringify(projectError)}`);
    }
    
    const newProjectId = projectData.id;

    // Step 2: Insert members
    if (memberIds.length > 0) {
      const membersToInsert = memberIds.map(userId => ({
        project_id: newProjectId,
        user_id: userId
      }));
      const { error: memberError } = await this.supabase
        .from('project_users')
        .insert(membersToInsert);

      if (memberError) {
        console.error('Error adding project members:', memberError);
        // Attempt to clean up the created project for consistency
        await this.supabase.from('projects').delete().eq('id', newProjectId);
        throw new Error(`Supabase Error adding project members: ${memberError.message || JSON.stringify(memberError)}`);
      }
    }
    
    // Step 3: Fetch the full project details using the safe, non-recursive method and return it.
    // This ensures the returned object is complete and respects RLS.
    return this.fetchSingleProject(newProjectId);
  }

  async updateProject(project: Pick<Project, 'id' | 'name' | 'description'>, memberIds: string[]): Promise<Project> {
    // Step 1: Update project details
    const { error: projectError } = await this.supabase
      .from('projects')
      .update({
        name: project.name,
        description: project.description
      })
      .eq('id', project.id);

    if (projectError) {
      console.error('Error updating project:', projectError);
      throw new Error(`Supabase Error updating project: ${projectError.message || JSON.stringify(projectError)}`);
    }

    // Step 2: Delete existing members. This is simpler than figuring out diffs.
    const { error: deleteError } = await this.supabase
      .from('project_users')
      .delete()
      .eq('project_id', project.id);
    
    if (deleteError) {
        console.error('Error clearing project members:', deleteError);
        throw new Error(`Supabase Error clearing project members: ${deleteError.message || JSON.stringify(deleteError)}`);
    }

    // Step 3: Insert new members
    if (memberIds.length > 0) {
        const membersToInsert = memberIds.map(userId => ({
            project_id: project.id,
            user_id: userId
        }));
        const { error: insertError } = await this.supabase
            .from('project_users')
            .insert(membersToInsert);
        
        if (insertError) {
            console.error('Error inserting new project members:', insertError);
            throw new Error(`Supabase Error inserting new project members: ${insertError.message || JSON.stringify(insertError)}`);
        }
    }
    
    // Step 4: Fetch the full project details to return a consistent object.
    return this.fetchSingleProject(project.id);
  }
  
  async deleteProject(projectId: string): Promise<void> {
    const { error } = await this.supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }


  // --- Task Likes ---

  async likeTask(taskId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('task_likes')
      .insert({ task_id: taskId, user_id: userId });
    if (error) {
      console.error('Error liking task:', error);
      // Ignore unique constraint violation errors, as it means the like already exists.
      if (error.code !== '23505') {
        throw error;
      }
    }
  }

  async unlikeTask(taskId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('task_likes')
      .delete()
      .match({ task_id: taskId, user_id: userId });
    if (error) {
      console.error('Error unliking task:', error);
      throw error;
    }
  }

  // Tasks
  async fetchTasks(): Promise<Task[]> {
    const { data, error } = await this.supabase
      .from('tasks')
      .select(`
        *,
        assign_to_user:users!tasks_assign_to_fkey(username),
        assigned_by_user:users!tasks_assigned_by_fkey(username),
        updated_by_user:users!tasks_updated_by_fkey(username),
        task_likes(user_id)
      `);
    if (error) {
      console.error('Error fetching tasks:', error.message || error);
      throw new Error(`Supabase Error fetching tasks: ${error.message || JSON.stringify(error)}`);
    }
    return (data || []).map((taskData: any) => ({
      ...taskData,
      // FIX: The user join may return an array, so access the first element.
      assigned_to_username: taskData.assign_to_user?.[0]?.username,
      assigned_by_username: taskData.assigned_by_user?.[0]?.username,
      updated_by_username: taskData.updated_by_user?.[0]?.username,
      liked_by_users: taskData.task_likes ? taskData.task_likes.map((like: { user_id: string }) => like.user_id) : [],
      like_count: taskData.task_likes ? taskData.task_likes.length : (taskData.like_count || 0)
    }));
  }

  async addTask(task: Omit<Task, 'id' | 'created_at' | 'updated_by_username' | 'assigned_by_username' | 'assigned_to_username' | 'like_count' | 'liked_by_users'>): Promise<Task> {
    const { data, error } = await this.supabase
      .from('tasks')
      .insert({
        title: task.title,
        description: task.description,
        type: task.type,
        priority: task.priority,
        duration: task.duration,
        start_date: task.start_date,
        due_date: task.due_date,
        status: task.status,
        assign_to: task.assign_to,
        assigned_by: task.assigned_by,
        approval_required: task.approval_required,
        approval_status: task.approval_required ? 'Pending' : null,
        updated_by: task.updated_by,
        tags: task.tags,
        tagged_users: task.tagged_users,
        subtasks: task.subtasks,
        reminder_option: task.reminder_option,
        repeat_option: task.repeat_option,
        like_count: 0, // Initialize with 0
        project_id: task.project_id
      })
      .select(`
        *,
        assign_to_user:users!tasks_assign_to_fkey(username),
        assigned_by_user:users!tasks_assigned_by_fkey(username),
        updated_by_user:users!tasks_updated_by_fkey(username)
      `)
      .single();

    if (error) {
      console.error('Error adding task:', error.message || error);
      throw new Error(`Supabase Error adding task: ${error.message || JSON.stringify(error)}`);
    }
    return {
      ...data,
      // FIX: The user join may return an array, so access the first element.
      assigned_to_username: data.assign_to_user?.[0]?.username,
      assigned_by_username: data.assigned_by_user?.[0]?.username,
      updated_by_username: data.updated_by_user?.[0]?.username,
      liked_by_users: [],
    };
  }

  async updateTask(updatedTask: Omit<Task, 'like_count' | 'liked_by_users'>): Promise<Task> {
    const { data, error } = await this.supabase
      .from('tasks')
      .update({
        title: updatedTask.title,
        description: updatedTask.description,
        type: updatedTask.type,
        priority: updatedTask.priority,
        duration: updatedTask.duration,
        start_date: updatedTask.start_date,
        due_date: updatedTask.due_date,
        status: updatedTask.status,
        assign_to: updatedTask.assign_to,
        assigned_by: updatedTask.assigned_by,
        approval_required: updatedTask.approval_required,
        approval_status: updatedTask.approval_status,
        updated_by: updatedTask.updated_by,
        tags: updatedTask.tags,
        tagged_users: updatedTask.tagged_users,
        subtasks: updatedTask.subtasks,
        reminder_option: updatedTask.reminder_option,
        repeat_option: updatedTask.repeat_option,
        project_id: updatedTask.project_id
      })
      .eq('id', updatedTask.id)
      .select(`
        *,
        assign_to_user:users!tasks_assign_to_fkey(username),
        assigned_by_user:users!tasks_assigned_by_fkey(username),
        updated_by_user:users!tasks_updated_by_fkey(username),
        task_likes(user_id)
      `);

    if (error) {
      console.error('Error updating task:', error.message || error);
      throw new Error(`Supabase Error updating task: ${error.message || JSON.stringify(error)}`);
    }

    if (!data || data.length === 0) {
        throw new Error(`Supabase Error updating task: Task with ID ${updatedTask.id} not found or update failed.`);
    }

    const updatedData = data[0];

    return {
      ...updatedData,
      // FIX: The user join may return an array, so access the first element.
      assigned_to_username: updatedData.assign_to_user?.[0]?.username,
      assigned_by_username: updatedData.assigned_by_user?.[0]?.username,
      updated_by_username: updatedData.updated_by_user?.[0]?.username,
      liked_by_users: updatedData.task_likes ? updatedData.task_likes.map((like: { user_id: string }) => like.user_id) : [],
      like_count: updatedData.task_likes ? updatedData.task_likes.length : (updatedData.like_count || 0)
    };
  }

  async deleteTask(taskId: string): Promise<void> {
    const { error } = await this.supabase.from('tasks').delete().eq('id', taskId);
    if (error) {
      console.error('Error deleting task:', error.message || error);
      throw new Error(`Supabase Error deleting task: ${error.message || JSON.stringify(error)}`);
    }
  }

  // Comments
  async fetchComments(taskId: string): Promise<Comment[]> {
    const { data, error } = await this.supabase
      .from('comments')
      .select(`id, task_id, user_id, text, created_at, user:users(username)`)
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Error fetching comments:', error.message || error);
      throw new Error(`Supabase Error fetching comments: ${error.message || JSON.stringify(error)}`);
    }
    return (data || []).map((commentData: CommentRowFromDB) => ({
      id: commentData.id,
      taskId: commentData.task_id,
      userId: commentData.user_id,
      username: commentData.user?.[0]?.username || 'Unknown User', 
      text: commentData.text,
      createdAt: commentData.created_at,
    }));
  }

  async fetchAllComments(): Promise<Comment[]> {
    const { data, error } = await this.supabase
      .from('comments')
      .select(`id, task_id, user_id, text, created_at, user:users(username)`)
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Error fetching all comments:', error.message || error);
      throw new Error(`Supabase Error fetching all comments: ${error.message || JSON.stringify(error)}`);
    }
    return (data || []).map((commentData: CommentRowFromDB) => ({
      id: commentData.id,
      taskId: commentData.task_id,
      userId: commentData.user_id,
      username: commentData.user?.[0]?.username || 'Unknown User',
      text: commentData.text,
      createdAt: commentData.created_at,
    }));
  }

  async addComment(taskId: string, userId: string, username: string, text: string): Promise<Comment> {
    const { data, error } = await this.supabase
      .from('comments')
      .insert({ task_id: taskId, user_id: userId, text })
      .select(`id, task_id, user_id, text, created_at, user:users(username)`)
      .single<CommentRowFromDB>();
    if (error) {
      console.error('Error adding comment:', error.message || error);
      throw new Error(`Supabase Error adding comment: ${error.message || JSON.stringify(error)}`);
    }
    return {
      id: data.id,
      taskId: data.task_id,
      userId: data.user_id,
      username: data.user?.[0]?.username || 'Unknown User',
      text: data.text,
      createdAt: data.created_at,
    };
  }

  // Attachments
  async fetchAttachments(taskId: string): Promise<Attachment[]> {
    const { data, error } = await this.supabase
      .from('attachments')
      .select(`id, task_id, file_name, file_base64, uploaded_by, uploaded_at, user:users(username)`)
      .eq('task_id', taskId)
      .order('uploaded_at', { ascending: true });
    if (error) {
      console.error('Error fetching attachments:', error.message || error);
      throw new Error(`Supabase Error fetching attachments: ${error.message || JSON.stringify(error)}`);
    }
    return (data || []).map((attachmentData: AttachmentRowFromDB) => ({
      id: attachmentData.id,
      taskId: attachmentData.task_id,
      fileName: attachmentData.file_name,
      file_base64: attachmentData.file_base64,
      uploadedBy: attachmentData.uploaded_by,
      uploaded_by_username: attachmentData.user?.[0]?.username, 
      uploadedAt: attachmentData.uploaded_at,
    }));
  }

  async addAttachment(taskId: string, fileName: string, fileBase64: string, uploadedByUserId: string): Promise<Attachment> {
    const { data, error } = await this.supabase
      .from('attachments')
      .insert({ 
        task_id: taskId, 
        file_name: fileName, 
        file_base64: fileBase64, 
        uploaded_by: uploadedByUserId,
      })
      .select(`id, task_id, file_name, file_base64, uploaded_by, uploaded_at, user:users(username)`)
      .single<AttachmentRowFromDB>();
    if (error) {
      console.error('Error adding attachment:', error.message || error);
      throw new Error(`Supabase Error adding attachment: ${error.message || JSON.stringify(error)}`);
    }
    return {
      id: data.id,
      taskId: data.task_id,
      fileName: data.file_name,
      file_base64: data.file_base64,
      uploadedBy: data.uploaded_by,
      uploaded_by_username: data.user?.[0]?.username, 
      uploadedAt: data.uploaded_at,
    };
  }

  // History
  async fetchHistory(taskId: string): Promise<HistoryEntry[]> {
    const { data, error } = await this.supabase
      .from('history')
      .select(`*`) 
      .eq('task_id', taskId)
      .order('timestamp', { ascending: true });
    if (error) {
      console.error('Error fetching history:', error.message || error);
      throw new Error(`Supabase Error fetching history: ${error.message || JSON.stringify(error)}`);
    }
    return (data || []).map((historyData: HistoryRowFromDB) => ({
      id: historyData.id,
      taskId: historyData.task_id,
      action: historyData.action,
      userId: historyData.user_id,
      username: historyData.username,
      timestamp: historyData.timestamp,
      details: historyData.details,
    }));
  }

  async addHistoryEntry(taskId: string, action: string, userId: string, username: string, details?: string): Promise<HistoryEntry> {
    const { data, error } = await this.supabase
      .from('history')
      .insert({ task_id: taskId, action, user_id: userId, username, details })
      .select(`*`) 
      .single();
    if (error) {
      console.error('Error adding history entry:', error.message || error);
      throw new Error(`Supabase Error adding history entry: ${error.message || JSON.stringify(error)}`);
    }
    return {
      id: data.id,
      taskId: data.task_id,
      action: data.action,
      userId: data.user_id,
      username: data.username,
      timestamp: data.timestamp || data.created_at || new Date().toISOString(),
      details: data.details,
    };
  }

  // --- Notifications ---

  async fetchNotifications(): Promise<Notification[]> {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching notifications:', error.message || error);
      throw new Error(`Supabase Error fetching notifications: ${error.message || JSON.stringify(error)}`);
    }
    return data || [];
  }
  
  async addNotification(notification: Omit<Notification, 'id' | 'created_at' | 'read'>): Promise<Notification> {
    const { data, error } = await this.supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single();
    if (error) {
      console.error('Error adding notification:', error.message || error);
      throw new Error(`Supabase Error adding notification: ${error.message || JSON.stringify(error)}`);
    }
    return data;
  }

  async markNotificationAsRead(notificationId: string): Promise<Notification> {
    const { data, error } = await this.supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .select()
      .single();
    if (error) {
      console.error('Error marking notification as read:', error.message || error);
      throw new Error(`Supabase Error marking notification as read: ${error.message || JSON.stringify(error)}`);
    }
    return data;
  }

  async markAllNotificationsAsRead(): Promise<Notification[]> {
    const { data, error } = await this.supabase
      .from('notifications')
      .update({ read: true })
      .eq('read', false)
      .select();
    if (error) {
      console.error('Error marking all notifications as read:', error.message || error);
      throw new Error(`Supabase Error marking all notifications as read: ${error.message || JSON.stringify(error)}`);
    }
    return data || [];
  }


  // --- User Settings (for notifications) ---
  async fetchUserSettings(userId: string): Promise<UserSettings | null> {
    const { data, error } = await this.supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      if (error.message && (error.message.includes('Could not find the table') || error.code === '42P01')) {
        console.warn('Table "public.user_settings" does not exist. Please run the SQL to create it.');
        return null;
      }
      console.error('Error fetching user settings:', error.message || error);
      throw new Error(`Supabase Error fetching user settings: ${error.message || JSON.stringify(error)}`);
    }
    return data || null;
  }

  async updateUserSettings(settings: Partial<UserSettings> & { user_id: string }): Promise<UserSettings> {
    try {
      const { data, error } = await this.supabase
        .from('user_settings')
        .upsert(
          { 
            user_id: settings.user_id, 
            email_notifications_enabled: settings.email_notifications_enabled,
            whatsapp_notifications_enabled: settings.whatsapp_notifications_enabled,
            whatsapp_number: settings.whatsapp_number
          },
          { onConflict: 'user_id' }
        )
        .select()
        .single();

      if (error) {
        if (error.message && (error.message.includes('Could not find the table') || error.code === '42P01')) {
          console.warn('Table "public.user_settings" does not exist. Simulating update locally.');
          return this.mockUserSettings(settings);
        }
        
        const isMissingColumnError = error.message && (error.message.includes("Could not find the") && error.message.includes("column"));
        if (isMissingColumnError) {
           console.warn(`A column is likely missing in 'user_settings'. Retrying without WhatsApp fields. Error: ${error.message}`);
           const { data: retryData, error: retryError } = await this.supabase
            .from('user_settings')
            .upsert({ user_id: settings.user_id, email_notifications_enabled: settings.email_notifications_enabled }, { onConflict: 'user_id' })
            .select()
            .single();
            
            if (retryError) throw retryError;
            
            return {
                ...retryData,
                whatsapp_notifications_enabled: settings.whatsapp_notifications_enabled,
                whatsapp_number: settings.whatsapp_number
            };
        }
        throw error;
      }
      return data;
    } catch (error: any) {
      console.error('Error updating user settings:', error.message || error);
      return this.mockUserSettings(settings);
    }
  }

  private mockUserSettings(settings: Partial<UserSettings> & { user_id: string }): UserSettings {
    return {
      id: settings.user_id,
      user_id: settings.user_id,
      email_notifications_enabled: settings.email_notifications_enabled ?? true,
      whatsapp_notifications_enabled: settings.whatsapp_notifications_enabled ?? false,
      whatsapp_number: settings.whatsapp_number ?? '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as UserSettings;
  }

  // --- Chat ---

  async fetchConversations(currentUserId: string): Promise<Conversation[]> {
    const { data, error } = await this.supabase.rpc('get_conversations', { current_user_id: currentUserId });
    if (error) {
      console.error('Error fetching conversations:', error);
      throw new Error(`Supabase RPC Error fetching conversations: ${error.message}`);
    }
    return data || [];
  }

  async fetchMessages(currentUserId: string, otherUserId: string): Promise<ChatMessage[]> {
    const { data, error } = await this.supabase
      .from('chat_messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      throw new Error(`Supabase Error fetching messages: ${error.message}`);
    }
    return data || [];
  }

  async sendMessage(senderId: string, receiverId: string, messageText: string, attachmentBase64?: string, attachmentType?: ChatMessage['attachment_type']): Promise<ChatMessage> {
    const { data, error } = await this.supabase
      .from('chat_messages')
      .insert({ 
        sender_id: senderId, 
        receiver_id: receiverId, 
        message_text: messageText,
        attachment_base64: attachmentBase64,
        attachment_type: attachmentType
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error sending message:', error);
      throw new Error(`Supabase Error sending message: ${error.message}`);
    }
    return data;
  }

  async editChatMessage(messageId: string, newText: string, userId: string): Promise<void> {
    const { data, error } = await this.supabase
      .from('chat_messages')
      .update({ message_text: newText, updated_at: new Date().toISOString() })
      .match({ id: messageId, sender_id: userId })
      .select();

    if (error) {
      console.error('Error editing chat message:', error);
      throw new Error(`Supabase Error editing message: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('Update failed. The message could not be found or you do not have permission to edit it.');
    }
  }

  async deleteChatMessage(messageId: string, userId: string): Promise<void> {
    const { data, error } = await this.supabase
      .from('chat_messages')
      .delete()
      .match({ id: messageId, sender_id: userId })
      .select();
    
    if (error) {
      console.error('Error deleting chat message:', error);
      throw new Error(`Supabase Error deleting message: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      throw new Error('Delete failed. The message could not be found or you do not have permission to delete it.');
    }
  }

  async markMessagesAsRead(currentUserId: string, senderId: string): Promise<void> {
    const { error } = await this.supabase
      .from('chat_messages')
      .update({ is_read: true })
      .eq('receiver_id', currentUserId)
      .eq('sender_id', senderId)
      .eq('is_read', false);
      
    if (error) {
      console.error('Error marking messages as read:', error);
      throw new Error(`Supabase Error marking messages as read: ${error.message}`);
    }
  }

  subscribeToChatMessages(userId: string, handler: (payload: any) => void): RealtimeChannel {
    return this.supabase
      .channel(`public:chat_messages:receiver_id=eq.${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `receiver_id=eq.${userId}` }, handler)
      .subscribe();
  }

  async fetchReactionsForMessages(messageIds: string[]): Promise<ChatMessageReaction[]> {
    if (messageIds.length === 0) return [];
    const { data, error } = await this.supabase
      .from('chat_message_reactions')
      .select('*')
      .in('message_id', messageIds);
    if (error) {
      console.error('Error fetching reactions:', error);
      throw error;
    }
    return data || [];
  }

  async addReaction(messageId: string, userId: string, reaction: string): Promise<ChatMessageReaction> {
    const { data, error } = await this.supabase
      .from('chat_message_reactions')
      .upsert({ message_id: messageId, user_id: userId, reaction: reaction }, { onConflict: 'message_id,user_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async removeReaction(messageId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('chat_message_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', userId);
    
    if (error) throw error;
  }
}