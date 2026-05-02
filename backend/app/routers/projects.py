"""Project CRUD and member management routes."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..models import MemberRole, Project, ProjectMember, Task, User
from ..schemas import (
    MemberAdd,
    MemberRoleUpdate,
    ProjectCreate,
    ProjectDetailResponse,
    ProjectMemberResponse,
    ProjectResponse,
    ProjectUpdate,
)
from ..services.permissions import get_member_or_403, require_admin
from ..utils.security import get_current_user

router = APIRouter(prefix="/api/projects", tags=["Projects"])


# ── Project CRUD ─────────────────────────────────────────────────────────────


@router.get("/", response_model=list[ProjectResponse])
async def list_projects(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all projects the current user is a member of."""
    result = await db.execute(
        select(Project)
        .join(ProjectMember, ProjectMember.project_id == Project.id)
        .where(ProjectMember.user_id == current_user.id)
        .options(selectinload(Project.creator), selectinload(Project.members), selectinload(Project.tasks))
        .order_by(Project.created_at.desc())
    )
    projects = result.scalars().unique().all()

    response = []
    for project in projects:
        p = ProjectResponse.model_validate(project)
        p.member_count = len(project.members)
        p.task_count = len(project.tasks)
        response.append(p)

    return response


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    payload: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new project. The creator is automatically added as admin."""
    project = Project(
        name=payload.name,
        description=payload.description,
        created_by_id=current_user.id,
    )
    db.add(project)
    await db.flush()

    # Auto-add creator as admin member
    membership = ProjectMember(
        project_id=project.id,
        user_id=current_user.id,
        role=MemberRole.ADMIN,
    )
    db.add(membership)
    await db.flush()
    await db.refresh(project)

    response = ProjectResponse.model_validate(project)
    response.member_count = 1
    response.task_count = 0
    return response


@router.get("/{project_id}", response_model=ProjectDetailResponse)
async def get_project(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get project details including members. Requires membership."""
    await get_member_or_403(db, project_id, current_user.id)

    result = await db.execute(
        select(Project)
        .where(Project.id == project_id)
        .options(
            selectinload(Project.creator),
            selectinload(Project.members).selectinload(ProjectMember.user),
            selectinload(Project.tasks),
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    response = ProjectDetailResponse.model_validate(project)
    response.member_count = len(project.members)
    response.task_count = len(project.tasks)
    return response


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: UUID,
    payload: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update project name/description. Admin only."""
    await require_admin(db, project_id, current_user.id)

    result = await db.execute(
        select(Project).where(Project.id == project_id).options(selectinload(Project.creator))
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if payload.name is not None:
        project.name = payload.name
    if payload.description is not None:
        project.description = payload.description

    await db.flush()
    await db.refresh(project)

    response = ProjectResponse.model_validate(project)
    return response


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a project. Admin only."""
    await require_admin(db, project_id, current_user.id)

    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    await db.delete(project)
    await db.flush()


# ── Member Management ────────────────────────────────────────────────────────


@router.get("/{project_id}/members", response_model=list[ProjectMemberResponse])
async def list_members(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all members of a project. Requires membership."""
    await get_member_or_403(db, project_id, current_user.id)

    result = await db.execute(
        select(ProjectMember)
        .where(ProjectMember.project_id == project_id)
        .options(selectinload(ProjectMember.user))
        .order_by(ProjectMember.joined_at)
    )
    return result.scalars().all()


@router.post(
    "/{project_id}/members",
    response_model=ProjectMemberResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_member(
    project_id: UUID,
    payload: MemberAdd,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a member to the project by email. Admin only."""
    await require_admin(db, project_id, current_user.id)

    # Find user by email
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found with that email")

    # Check if already a member
    existing = await db.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user.id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="User is already a member")

    membership = ProjectMember(
        project_id=project_id,
        user_id=user.id,
        role=payload.role,
    )
    db.add(membership)
    await db.flush()
    await db.refresh(membership)
    return membership


@router.put("/{project_id}/members/{user_id}", response_model=ProjectMemberResponse)
async def update_member_role(
    project_id: UUID,
    user_id: UUID,
    payload: MemberRoleUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a member's role. Admin only."""
    await require_admin(db, project_id, current_user.id)

    result = await db.execute(
        select(ProjectMember)
        .where(ProjectMember.project_id == project_id, ProjectMember.user_id == user_id)
        .options(selectinload(ProjectMember.user))
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    member.role = payload.role
    await db.flush()
    await db.refresh(member)
    return member


@router.delete("/{project_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    project_id: UUID,
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a member from the project. Admin only. Cannot remove yourself."""
    await require_admin(db, project_id, current_user.id)

    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot remove yourself from the project")

    result = await db.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id,
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    await db.delete(member)
    await db.flush()
