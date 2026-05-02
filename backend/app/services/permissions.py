"""Role-based access control helpers for project membership."""

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import MemberRole, ProjectMember


async def get_member_or_403(
    db: AsyncSession,
    project_id: UUID,
    user_id: UUID,
) -> ProjectMember:
    """Return the ProjectMember record, or raise 403 if user is not a member."""
    result = await db.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id,
        )
    )
    member = result.scalar_one_or_none()
    if member is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this project",
        )
    return member


async def require_admin(
    db: AsyncSession,
    project_id: UUID,
    user_id: UUID,
) -> ProjectMember:
    """Return the ProjectMember record if user is an admin, or raise 403."""
    member = await get_member_or_403(db, project_id, user_id)
    if member.role != MemberRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return member
