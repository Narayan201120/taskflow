"""Task CRUD routes scoped to projects."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..models import MemberRole, Task, User
from ..schemas import TaskCreate, TaskResponse, TaskUpdate
from ..services.permissions import get_member_or_403
from ..utils.security import get_current_user

router = APIRouter(prefix="/api/projects/{project_id}/tasks", tags=["Tasks"])


@router.get("/", response_model=list[TaskResponse])
async def list_tasks(
    project_id: UUID,
    status_filter: str | None = None,
    priority: str | None = None,
    assigned_to: UUID | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all tasks in a project. Supports filtering by status, priority, and assignee."""
    await get_member_or_403(db, project_id, current_user.id)

    query = (
        select(Task)
        .where(Task.project_id == project_id)
        .options(selectinload(Task.assignee), selectinload(Task.creator))
        .order_by(Task.created_at.desc())
    )

    if status_filter:
        query = query.where(Task.status == status_filter)
    if priority:
        query = query.where(Task.priority == priority)
    if assigned_to:
        query = query.where(Task.assigned_to_id == assigned_to)

    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    project_id: UUID,
    payload: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new task in a project. Any member can create tasks."""
    await get_member_or_403(db, project_id, current_user.id)

    # If assigning to someone, verify they are a member
    if payload.assigned_to_id:
        assigned_member = await db.execute(
            select(Task).where(Task.project_id == project_id)  # just need any query
        )
        from ..models import ProjectMember
        check = await db.execute(
            select(ProjectMember).where(
                ProjectMember.project_id == project_id,
                ProjectMember.user_id == payload.assigned_to_id,
            )
        )
        if not check.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail="Assigned user is not a member of this project",
            )

    task = Task(
        title=payload.title,
        description=payload.description,
        priority=payload.priority,
        project_id=project_id,
        assigned_to_id=payload.assigned_to_id,
        created_by_id=current_user.id,
        due_date=payload.due_date,
    )
    db.add(task)
    await db.flush()
    await db.refresh(task)
    return task


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    project_id: UUID,
    task_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single task's details."""
    await get_member_or_403(db, project_id, current_user.id)

    result = await db.execute(
        select(Task)
        .where(Task.id == task_id, Task.project_id == project_id)
        .options(selectinload(Task.assignee), selectinload(Task.creator))
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    project_id: UUID,
    task_id: UUID,
    payload: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a task. Any project member can update tasks."""
    await get_member_or_403(db, project_id, current_user.id)

    result = await db.execute(
        select(Task)
        .where(Task.id == task_id, Task.project_id == project_id)
        .options(selectinload(Task.assignee), selectinload(Task.creator))
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)

    await db.flush()
    await db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    project_id: UUID,
    task_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a task. Only the task creator or project admin can delete."""
    member = await get_member_or_403(db, project_id, current_user.id)

    result = await db.execute(
        select(Task).where(Task.id == task_id, Task.project_id == project_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Only creator or admin can delete
    if task.created_by_id != current_user.id and member.role != MemberRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the task creator or project admin can delete tasks",
        )

    await db.delete(task)
    await db.flush()
