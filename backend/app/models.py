"""SQLAlchemy ORM models for Users, Projects, Members, and Tasks."""

import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    ForeignKey,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from .database import Base


# ── Enums ────────────────────────────────────────────────────────────────────


class MemberRole(str, enum.Enum):
    ADMIN = "admin"
    MEMBER = "member"


class TaskStatus(str, enum.Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"


class TaskPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


# ── User ─────────────────────────────────────────────────────────────────────


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    memberships = relationship("ProjectMember", back_populates="user", lazy="selectin")
    created_projects = relationship("Project", back_populates="creator", lazy="selectin")
    assigned_tasks = relationship(
        "Task", foreign_keys="Task.assigned_to_id", back_populates="assignee", lazy="selectin"
    )
    created_tasks = relationship(
        "Task", foreign_keys="Task.created_by_id", back_populates="creator", lazy="selectin"
    )

    def __repr__(self):
        return f"<User {self.username}>"


# ── Project ──────────────────────────────────────────────────────────────────


class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=datetime.utcnow
    )

    # Relationships
    creator = relationship("User", back_populates="created_projects", lazy="selectin")
    members = relationship(
        "ProjectMember", back_populates="project", cascade="all, delete-orphan", lazy="selectin"
    )
    tasks = relationship(
        "Task", back_populates="project", cascade="all, delete-orphan", lazy="selectin"
    )

    def __repr__(self):
        return f"<Project {self.name}>"


# ── Project Member (join table with role) ────────────────────────────────────


class ProjectMember(Base):
    __tablename__ = "project_members"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    role = Column(Enum(MemberRole), nullable=False, default=MemberRole.MEMBER)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (UniqueConstraint("project_id", "user_id", name="uq_project_user"),)

    # Relationships
    project = relationship("Project", back_populates="members", lazy="selectin")
    user = relationship("User", back_populates="memberships", lazy="selectin")

    def __repr__(self):
        return f"<ProjectMember project={self.project_id} user={self.user_id} role={self.role}>"


# ── Task ─────────────────────────────────────────────────────────────────────


class Task(Base):
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(Enum(TaskStatus), nullable=False, default=TaskStatus.TODO)
    priority = Column(Enum(TaskPriority), nullable=False, default=TaskPriority.MEDIUM)
    project_id = Column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    assigned_to_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    due_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=datetime.utcnow
    )

    # Relationships
    project = relationship("Project", back_populates="tasks", lazy="selectin")
    assignee = relationship(
        "User", foreign_keys=[assigned_to_id], back_populates="assigned_tasks", lazy="selectin"
    )
    creator = relationship(
        "User", foreign_keys=[created_by_id], back_populates="created_tasks", lazy="selectin"
    )

    def __repr__(self):
        return f"<Task {self.title} [{self.status}]>"
