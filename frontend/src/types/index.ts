/* ── Shared TypeScript types matching backend schemas ── */

// Enums
export type MemberRole = "admin" | "member";
export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

// Auth
export interface UserResponse {
  id: string;
  email: string;
  username: string;
  full_name: string;
  created_at: string;
}

export interface Token {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  email: string;
  username: string;
  full_name: string;
  password: string;
}

// Projects
export interface ProjectMemberResponse {
  id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
  user: UserResponse;
}

export interface ProjectResponse {
  id: string;
  name: string;
  description: string | null;
  created_by_id: string;
  created_at: string;
  updated_at: string | null;
  creator: UserResponse;
  member_count: number;
  task_count: number;
}

export interface ProjectDetailResponse extends ProjectResponse {
  members: ProjectMemberResponse[];
}

export interface ProjectCreate {
  name: string;
  description?: string;
}

export interface ProjectUpdate {
  name?: string;
  description?: string;
}

// Members
export interface MemberAdd {
  email: string;
  role?: MemberRole;
}

// Tasks
export interface TaskResponse {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  project_id: string;
  assigned_to_id: string | null;
  created_by_id: string;
  due_date: string | null;
  created_at: string;
  updated_at: string | null;
  assignee: UserResponse | null;
  creator: UserResponse;
}

export interface TaskCreate {
  title: string;
  description?: string;
  priority?: TaskPriority;
  assigned_to_id?: string;
  due_date?: string;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigned_to_id?: string | null;
  due_date?: string | null;
}

// Dashboard
export interface DashboardStats {
  total_projects: number;
  total_tasks: number;
  tasks_todo: number;
  tasks_in_progress: number;
  tasks_done: number;
  overdue_tasks: number;
  my_tasks: number;
}
