from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional
from prisma import Prisma
from app.core.prisma import get_db
from app.services.tour_service import TourService
from app.schemas.tour import (
    TourCreate, TourUpdate, TourResponse, TourListResponse, TourFilter
)
from app.api.deps import get_current_user, get_current_admin

router = APIRouter(prefix="/tours", tags=["Tours"])


def convert_tour_response(tour):
    """Convert Prisma Tour model (camelCase attributes) to response dict (snake_case)"""
    return {
        "id": tour.id,
        "name": tour.name,
        "slug": tour.slug,
        "description": tour.description,
        "short_description": getattr(tour, "shortDescription", None),
        "destination": tour.destination,
        "region": tour.region,
        "duration": tour.duration,
        "price": tour.price,
        "discount_price": getattr(tour, "discountPrice", None),
        "max_participants": tour.maxParticipants,
        "current_participants": tour.currentParticipants,
        "images": tour.images if isinstance(tour.images, list) else [],
        "highlights": tour.highlights if isinstance(tour.highlights, list) else [],
        "includes": tour.includes if isinstance(tour.includes, list) else [],
        "excludes": tour.excludes if isinstance(tour.excludes, list) else [],
        "schedule": tour.schedule,
        "departure_dates": getattr(tour, "departureDates", []) if isinstance(getattr(tour, "departureDates", []), list) else [],
        "rating": tour.rating,
        "review_count": tour.reviewCount,
        "is_featured": tour.isFeatured,
        "is_active": tour.isActive,
        "category": tour.category,
        "tags": tour.tags if isinstance(tour.tags, list) else [],
        "created_at": tour.createdAt,
        "updated_at": tour.updatedAt,
    }


@router.get("", response_model=TourListResponse)
async def list_tours(
    destination: Optional[str] = None,
    region: Optional[str] = None,
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    search: Optional[str] = None,
    is_featured: Optional[bool] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    db: Prisma = Depends(get_db)
):
    filters = TourFilter(
        destination=destination,
        region=region,
        category=category,
        min_price=min_price,
        max_price=max_price,
        search=search,
        is_featured=is_featured
    )
    
    tour_service = TourService(db)
    tours, total = await tour_service.list_tours(filters, page, page_size)
    
    return TourListResponse(
        tours=[TourResponse(**convert_tour_response(t)) for t in tours],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )


@router.get("/featured", response_model=list[TourResponse])
async def get_featured_tours(
    limit: int = Query(6, ge=1, le=20),
    db: Prisma = Depends(get_db)
):
    tour_service = TourService(db)
    tours = await tour_service.get_featured_tours(limit)
    return [TourResponse(**convert_tour_response(t)) for t in tours]


@router.get("/search")
async def search_tours(
    q: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=50),
    db: Prisma = Depends(get_db)
):
    tour_service = TourService(db)
    tours = await tour_service.search_tours(q, limit)
    return [TourResponse(**convert_tour_response(t)) for t in tours]


@router.get("/{tour_id}", response_model=TourResponse)
async def get_tour(tour_id: str, db: Prisma = Depends(get_db)):
    tour_service = TourService(db)
    tour = await tour_service.get_tour_by_id(tour_id)
    
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    
    return TourResponse(**convert_tour_response(tour))


@router.get("/slug/{slug}", response_model=TourResponse)
async def get_tour_by_slug(slug: str, db: Prisma = Depends(get_db)):
    tour_service = TourService(db)
    tour = await tour_service.get_tour_by_slug(slug)
    
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    
    return TourResponse(**convert_tour_response(tour))


# Admin routes
@router.post("", response_model=TourResponse)
async def create_tour(
    tour_data: TourCreate,
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    tour_service = TourService(db)
    tour = await tour_service.create_tour(tour_data)
    return TourResponse(**convert_tour_response(tour))


@router.put("/{tour_id}", response_model=TourResponse)
async def update_tour(
    tour_id: str,
    data: TourUpdate,
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    tour_service = TourService(db)
    tour = await tour_service.update_tour(tour_id, data)
    
    if not tour:
        raise HTTPException(status_code=404, detail="Tour not found")
    
    return TourResponse(**convert_tour_response(tour))


@router.delete("/{tour_id}")
async def delete_tour(
    tour_id: str,
    db: Prisma = Depends(get_db),
    current_user = Depends(get_current_admin)
):
    tour_service = TourService(db)
    success = await tour_service.delete_tour(tour_id)
    return {"success": success}
