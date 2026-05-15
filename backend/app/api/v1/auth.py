from fastapi import APIRouter, Depends, HTTPException, status, Header
from prisma import Prisma
from typing import Optional
from datetime import datetime
from app.core.prisma import get_db
from app.core.security import decode_token
from app.services.auth_service import AuthService
from app.core.token_blacklist import get_blacklist_service, hash_token
from app.api.deps import get_current_user
from app.schemas.user import (
    UserCreate, UserUpdate, UserResponse, LoginRequest,
    TokenResponse, RefreshTokenRequest
)
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])


def convert_user_response(user) -> dict:
    """Convert Prisma User model (camelCase) to response dict (snake_case)."""
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.fullName,
        "phone": getattr(user, "phone", None),
        "avatar_url": getattr(user, "avatarUrl", None),
        "role": user.role,
        "is_active": user.isActive,
        "created_at": user.createdAt,
    }


@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserCreate, db: Prisma = Depends(get_db)):
    auth_service = AuthService(db)
    try:
        user = await auth_service.register(user_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    _, access_token, refresh_token = await auth_service.login(user_data.email, user_data.password)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse(**convert_user_response(user))
    )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: LoginRequest, db: Prisma = Depends(get_db)):
    auth_service = AuthService(db)
    try:
        user, access_token, refresh_token = await auth_service.login(
            credentials.email, credentials.password
        )
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse(**convert_user_response(user))
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: RefreshTokenRequest, db: Prisma = Depends(get_db)):
    payload = decode_token(request.refresh_token)

    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    # Check if refresh token is blacklisted
    blacklist = get_blacklist_service()
    token_hash = hash_token(request.refresh_token)
    if await blacklist.is_blacklisted(token_hash):
        raise HTTPException(status_code=401, detail="Token has been revoked")

    user_id = payload.get("sub")
    auth_service = AuthService(db)

    try:
        # Revoke old refresh token
        await blacklist.revoke_token(
            token_hash,
            user_id,
            datetime.fromtimestamp(payload.get("exp", 0))
        )

        access_token, refresh_token = await auth_service.refresh_tokens(user_id)
        user = await auth_service.get_user_by_id(user_id)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse(**convert_user_response(user))
    )


@router.post("/logout")
async def logout(
    token: Optional[str] = Header(None, alias="Authorization"),
    db: Prisma = Depends(get_db)
):
    """Logout - revoke current access token."""
    if token and token.startswith("Bearer "):
        access_token = token[7:]
        payload = decode_token(access_token)

        if payload:
            blacklist = get_blacklist_service()
            token_hash = hash_token(access_token)
            exp = datetime.fromtimestamp(payload.get("exp", 0))
            await blacklist.revoke_token(token_hash, payload.get("sub", ""), exp)
            logger.info(f"User logged out: {payload.get('sub')}")

    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user=Depends(get_current_user),
):
    return UserResponse(**convert_user_response(current_user))


@router.put("/me", response_model=UserResponse)
async def update_me(
    data: UserUpdate,
    current_user=Depends(get_current_user),
    db: Prisma = Depends(get_db)
):
    auth_service = AuthService(db)
    updated_user = await auth_service.update_user(current_user.id, data)
    return UserResponse(**convert_user_response(updated_user))


@router.post("/change-password")
async def change_password(
    old_password: str,
    new_password: str,
    current_user=Depends(get_current_user),
    db: Prisma = Depends(get_db)
):
    auth_service = AuthService(db)

    try:
        await auth_service.change_password(current_user.id, old_password, new_password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {"message": "Password changed successfully"}
