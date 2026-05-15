from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from prisma import Prisma
from app.core.prisma import get_db
from app.api.deps import get_current_user, get_current_admin
from app.services.auth_service import AuthService
from app.schemas.user import UserResponse

router = APIRouter(prefix="/users", tags=["Users"])


def _convert_user(u) -> dict:
    return {
        "id": u.id,
        "email": u.email,
        "full_name": u.fullName,
        "phone": getattr(u, "phone", None),
        "avatar_url": getattr(u, "avatarUrl", None),
        "role": u.role,
        "is_active": u.isActive,
        "created_at": u.createdAt,
    }


@router.get("", response_model=list[UserResponse])
async def list_users(
    skip: int = 0,
    take: int = 20,
    current_user = Depends(get_current_admin),
    db: Prisma = Depends(get_db)
):
    auth_service = AuthService(db)
    users, _ = await auth_service.list_users(skip, take)
    return [UserResponse(**_convert_user(u)) for u in users]


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    current_user = Depends(get_current_admin),
    db: Prisma = Depends(get_db)
):
    auth_service = AuthService(db)
    user = await auth_service.get_user_by_id(user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return UserResponse(**_convert_user(user))


@router.put("/{user_id}/role")
async def update_user_role(
    user_id: str,
    role: str,
    current_user = Depends(get_current_admin),
    db: Prisma = Depends(get_db)
):
    if role not in ["USER", "ADMIN"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    user = await db.user.update(
        where={"id": user_id},
        data={"role": role}
    )

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {"success": True, "role": role}


@router.put("/{user_id}/status")
async def update_user_status(
    user_id: str,
    is_active: bool,
    current_user = Depends(get_current_admin),
    db: Prisma = Depends(get_db)
):
    user = await db.user.update(
        where={"id": user_id},
        data={"isActive": is_active}
    )

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {"success": True, "is_active": is_active}
