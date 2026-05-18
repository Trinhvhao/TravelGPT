from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional
from app.services.wishlist_service import WishlistService
from app.api.deps import get_current_user, get_optional_user, get_db

router = APIRouter(prefix="/wishlist", tags=["wishlist"])


class WishlistItemResponse(BaseModel):
    id: str
    tourId: str
    addedAt: str
    tour: dict


class WishlistListResponse(BaseModel):
    items: list[WishlistItemResponse]
    total: int
    page: int
    pageSize: int


class ToggleWishlistResponse(BaseModel):
    success: bool
    isInWishlist: bool


@router.get("", response_model=WishlistListResponse)
async def get_wishlist(
    user: dict = Depends(get_current_user),
    prisma = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
):
    """Get user's wishlist"""
    if not user:
        raise HTTPException(status_code=401, detail="Vui lòng đăng nhập")
    
    service = WishlistService(prisma)
    skip = (page - 1) * page_size
    
    items, total = await service.get_user_wishlists(
        user_id=user.id,
        skip=skip,
        take=page_size
    )
    
    return WishlistListResponse(
        items=[WishlistItemResponse(**item) for item in items],
        total=total,
        page=page,
        pageSize=page_size
    )


@router.post("/{tour_id}", response_model=ToggleWishlistResponse)
async def add_to_wishlist(
    tour_id: str,
    user: dict = Depends(get_current_user),
    prisma = Depends(get_db),
):
    """Add a tour to wishlist"""
    if not user:
        raise HTTPException(status_code=401, detail="Vui lòng đăng nhập")
    
    service = WishlistService(prisma)
    
    # Verify tour exists
    tour = await prisma.tour.find_first(
        where={"id": tour_id, "isActive": True}
    )
    if not tour:
        raise HTTPException(status_code=404, detail="Tour không tồn tại")
    
    is_in, _ = await service.toggle_wishlist(user.id, tour_id)
    
    return ToggleWishlistResponse(success=True, isInWishlist=is_in)


@router.delete("/{tour_id}")
async def remove_from_wishlist(
    tour_id: str,
    user: dict = Depends(get_current_user),
    prisma = Depends(get_db),
):
    """Remove a tour from wishlist"""
    if not user:
        raise HTTPException(status_code=401, detail="Vui lòng đăng nhập")
    
    service = WishlistService(prisma)
    removed = await service.remove_from_wishlist(user.id, tour_id)
    
    if not removed:
        raise HTTPException(status_code=404, detail="Tour không có trong danh sách yêu thích")
    
    return {"success": True, "message": "Đã xóa khỏi danh sách yêu thích"}


@router.get("/check/{tour_id}")
async def check_wishlist(
    tour_id: str,
    user: Optional[dict] = Depends(get_optional_user),
    prisma = Depends(get_db),
):
    """Check if a tour is in user's wishlist"""
    if not user:
        return {"isInWishlist": False}
    
    service = WishlistService(prisma)
    is_in = await service.is_in_wishlist(user.id, tour_id)
    
    return {"isInWishlist": is_in}


@router.get("/ids")
async def get_wishlist_ids(
    user: dict = Depends(get_current_user),
    prisma = Depends(get_db),
):
    """Get all tour IDs in user's wishlist"""
    if not user:
        return {"ids": []}
    
    service = WishlistService(prisma)
    ids = await service.get_user_wishlist_ids(user.id)
    
    return {"ids": ids}
