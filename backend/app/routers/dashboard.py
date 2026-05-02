"""Dashboard routes for aggregated statistics and task overview."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..models import Project, ProjectMember, Task, TaskStatus, User
from ..schemas import DashboardStats, TaskResponse, TaskSummary
from ..utils.security import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/", response_model=DashboardStats)
async def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return aggregated statistics for the current user's dashboard."""

    # Get all project IDs the user is a member of
    member_result = await db.execute(
        select(ProjectMember.project_id).where(ProjectMember.user_id == current_user.id)
    )
    project_ids = [row[0] for row in member_result.all()]

    if not project_ids:
        return DashboardStats(
            total_projects=0,
            total_tasks=0,
            tasks_todo=0,
            tasks_in_progress=0,
            tasks_done=0,
            overdue_tasks=0,
            my_tasks=0,
        )

    total_projects = len(project_ids)

    # Count tasks by status
    task_counts = await db.execute(
        select(Task.status, func.count(Task.id))
        .where(Task.project_id.in_(project_ids))
        .group_by(Task.status)
    )
    status_map = dict(task_counts.all())

    tasks_todo = status_map.get(TaskStatus.TODO, 0)
    tasks_in_progress = status_map.get(TaskStatus.IN_PROGRESS, 0)
    tasks_done = status_map.get(TaskStatus.DONE, 0)
    total_tasks = tasks_todo + tasks_in_progress + tasks_done

    # Overdue tasks (due_date < now AND status != done)
    overdue_result = await db.execute(
        select(func.count(Task.id)).where(
            Task.project_id.in_(project_ids),
            Task.due_date < datetime.now(timezone.utc),
            Task.status != TaskStatus.DONE,
        )
    )
    overdue_tasks = overdue_result.scalar() or 0

    # My tasks (assigned to current user)
    my_tasks_result = await db.execute(
        select(func.count(Task.id)).where(
            Task.assigned_to_id == current_user.id,
            Task.project_id.in_(project_ids),
        )
    )
    my_tasks = my_tasks_result.scalar() or 0

    return DashboardStats(
        total_projects=total_projects,
        total_tasks=total_tasks,
        tasks_todo=tasks_todo,
        tasks_in_progress=tasks_in_progress,
        tasks_done=tasks_done,
        overdue_tasks=overdue_tasks,
        my_tasks=my_tasks,
    )


@router.get("/my-tasks", response_model=list[TaskResponse])
async def get_my_tasks(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return all tasks assigned to the current user across all projects."""
    result = await db.execute(
        select(Task)
        .where(Task.assigned_to_id == current_user.id)
        .options(selectinload(Task.assignee), selectinload(Task.creator), selectinload(Task.project))
        .order_by(Task.due_date.asc().nullslast(), Task.created_at.desc())
    )
    return result.scalars().all()
