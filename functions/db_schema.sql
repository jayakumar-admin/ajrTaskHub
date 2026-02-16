-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'User' CHECK (role IN ('Admin', 'Manager', 'User', 'Viewer')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Projects Table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    image_url TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Project Members Junction Table
CREATE TABLE project_users (
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, user_id)
);

-- Tasks Table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id SERIAL NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL DEFAULT 'Task',
    priority VARCHAR(50) NOT NULL DEFAULT 'Medium',
    duration VARCHAR(100),
    start_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'todo',
    assign_to UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approval_required BOOLEAN NOT NULL DEFAULT FALSE,
    approval_status VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tags TEXT[],
    tagged_users UUID[],
    subtasks JSONB,
    reminder_option VARCHAR(50),
    repeat_option VARCHAR(50),
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL
);

-- Task Likes Junction Table
CREATE TABLE task_likes (
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, user_id)
);

-- Comments Table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Attachments Table
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Task History Table
CREATE TABLE task_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications Table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type VARCHAR(50),
    task_id UUID,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User Settings Table
CREATE TABLE user_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    email_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    whatsapp_notifications_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    whatsapp_number VARCHAR(50),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- System Config Table (for WhatsApp, etc.)
CREATE TABLE system_config (
    id INT PRIMARY KEY,
    whatsapp_integration_enabled BOOLEAN,
    whatsapp_access_token TEXT,
    whatsapp_phone_number_id TEXT,
    whatsapp_graph_url TEXT,
    whatsapp_status_template TEXT,
    whatsapp_assignment_template TEXT
);

-- Chat Messages Table
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_text TEXT,
    attachment_url TEXT,
    attachment_type VARCHAR(50),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- Chat Message Reactions
CREATE TABLE chat_message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reaction VARCHAR(10) NOT NULL,
    UNIQUE(message_id, user_id)
);

-- Role Permissions Table
CREATE TABLE role_permissions (
    role VARCHAR(50) PRIMARY KEY,
    can_create_tasks BOOLEAN,
    can_create_projects BOOLEAN,
    can_use_chat BOOLEAN,
    can_change_status BOOLEAN,
    can_access_tools BOOLEAN,
    can_access_calendar BOOLEAN,
    can_access_kanban BOOLEAN,
    can_assign_tasks BOOLEAN,
    can_add_comments BOOLEAN,
    can_add_attachments BOOLEAN,
    can_preview_attachments BOOLEAN,
    can_download_attachments BOOLEAN
);

-- Default data for roles
INSERT INTO role_permissions (role, can_create_tasks, can_create_projects, can_use_chat, can_change_status, can_access_tools, can_access_calendar, can_access_kanban, can_assign_tasks, can_add_comments, can_add_attachments, can_preview_attachments, can_download_attachments) VALUES
('Admin', true, true, true, true, true, true, true, true, true, true, true, true),
('Manager', true, true, true, true, true, true, true, true, true, true, true, true),
('User', true, false, true, true, true, true, true, false, true, true, true, true),
('Viewer', false, false, false, false, false, true, true, false, false, false, true, true);

-- Cron Jobs Table
CREATE TABLE cron_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    schedule VARCHAR(100) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    last_run TIMESTAMPTZ,
    next_run TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Default cron jobs
INSERT INTO cron_jobs (name, description, schedule, enabled) VALUES
('Daily Task Reminders', 'Sends email/WhatsApp reminders for tasks due today.', '0 9 * * *', true),
('Weekly Summary', 'Generates and sends a weekly summary report to managers.', '0 10 * * 1', true),
('Clean Old Notifications', 'Deletes notifications older than 90 days.', '0 2 * * *', true);

-- WhatsApp Logs Table
CREATE TABLE whatsapp_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(50) NOT NULL,
    message_content TEXT NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'success' or 'failure'
    error_message TEXT,
    meta_message_id VARCHAR(255),
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);