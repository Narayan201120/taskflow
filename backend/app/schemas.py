"""Pydantic schemas for request/response validation."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from .models import MemberRole, TaskPriority, TaskStatus


# ── Auth ─────────────────────────────────────────────────────────────────────


class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=100)
    full_name: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=6, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: UUID
    email: str
    username: str
    full_name: str
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: UUID | None = None


# ── Project ──────────────────────────────────────────────────────────────────


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None


class ProjectUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None


class ProjectMemberResponse(BaseModel):
    id: UUID
    user_id: UUID
    role: MemberRole
    joined_at: datetime
    user: UserResponse

    model_config = {"from_attributes": True}


class ProjectResponse(BaseModel):
    id: UUID
    name: str
    description: str | None
    created_by_id: UUID
    created_at: datetime
    updated_at: datetime | None
    creator: UserResponse
    member_count: int = 0
    task_count: int = 0

    model_config = {"from_attributes": True}


class ProjectDetailResponse(ProjectResponse):
    members: list[ProjectMemberResponse] = []


# ── Members ──────────────────────────────────────────────────────────────────


class MemberAdd(BaseModel):
    email: EmailStr
    role: MemberRole = MemberRole.MEMBER


class MemberRoleUpdate(BaseModel):
    role: MemberRole


# ── Task ─────────────────────────────────────────────────────────────────────


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    priority: TaskPriority = TaskPriority.MEDIUM
    assigned_to_id: UUID | None = None
    due_date: datetime | None = None


class TaskUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    status: TaskStatus | None = None
    priority: TaskPriority | None = None
    assigned_to_id: UUID | None = None
    due_date: datetime | None = None


class TaskResponse(BaseModel):
    id: UUID
    title: str
    description: str | None
    status: TaskStatus
    priority: TaskPriority
    project_id: UUID
    assigned_to_id: UUID | None
    created_by_id: UUID
    due_date: datetime | None
    created_at: datetime
    updated_at: datetime | None
    assignee: UserResponse | None = None
    creator: UserResponse

    model_config = {"from_attributes": True}


# ── Dashboard ────────────────────────────────────────────────────────────────


class DashboardStats(BaseModel):
    total_projects: int
    total_tasks: int
    tasks_todo: int
    tasks_in_progress: int
    tasks_done: int
    overdue_tasks: int
    my_tasks: int


class TaskSummary(BaseModel):
    id: UUID
    title: str
    status: TaskStatus
    priority: TaskPriority
    due_date: datetime | None
    project_name: str

    model_config = {"from_attributes": True}
