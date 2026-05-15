from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional
from prisma import Prisma
from app.core.prisma import get_db
from app.services.booking_service import BookingService
from app.schemas.booking import (
    BookingCreate, BookingUpdate, BookingResponse, BookingListResponse
)
from app.api.deps import get_current_user, get_current_admin

router = APIRouter(prefix="/bookings", tags=["Bookings"])


def convert_booking_response(booking):
    """Convert Prisma Booking model (camelCase) to response dict (snake_case)"""
    from app.api.v1.tours import convert_tour_response

    return {
        "id": booking.id,
        "user_id": booking.userId,
        "tour_id": booking.tourId,
        "booking_code": booking.bookingCode,
        "status": booking.status,
        "num_adults": booking.numAdults,
        "num_children": booking.numChildren,
        "total_price": str(booking.totalPrice) if booking.totalPrice else None,
        "contact_name": booking.contactName,
        "contact_email": booking.contactEmail,
        "contact_phone": booking.contactPhone,
        "departure_date": booking.departureDate,
        "special_requests": booking.specialRequests,
        "note": booking.note,
        "payment_status": booking.paymentStatus,
        "payment_method": booking.paymentMethod,
        "payment_date": booking.paymentDate,
        "created_at": booking.createdAt,
        "updated_at": booking.updatedAt,
        "tour": convert_tour_response(booking.tour) if booking.tour else None
    }


@router.get("", response_model=BookingListResponse)
async def list_my_bookings(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    current_user = Depends(get_current_user),
    db: Prisma = Depends(get_db)
):
    booking_service = BookingService(db)
    bookings, total = await booking_service.list_user_bookings(
        current_user.id, page, page_size
    )
    
    return BookingListResponse(
        bookings=[BookingResponse(**convert_booking_response(b)) for b in bookings],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )


@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking(
    booking_id: str,
    current_user = Depends(get_current_user),
    db: Prisma = Depends(get_db)
):
    booking_service = BookingService(db)
    booking = await booking_service.get_booking_by_id(booking_id)
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.userId != current_user.id and current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return BookingResponse(**convert_booking_response(booking))


@router.get("/code/{booking_code}", response_model=BookingResponse)
async def get_booking_by_code(
    booking_code: str,
    db: Prisma = Depends(get_db)
):
    booking_service = BookingService(db)
    booking = await booking_service.get_booking_by_code(booking_code)
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    return BookingResponse(**convert_booking_response(booking))


@router.post("", response_model=BookingResponse)
async def create_booking(
    data: BookingCreate,
    current_user = Depends(get_current_user),
    db: Prisma = Depends(get_db)
):
    booking_service = BookingService(db)
    try:
        booking = await booking_service.create_booking(current_user.id, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    return BookingResponse(**convert_booking_response(booking))


@router.put("/{booking_id}/cancel", response_model=BookingResponse)
async def cancel_booking(
    booking_id: str,
    current_user = Depends(get_current_user),
    db: Prisma = Depends(get_db)
):
    booking_service = BookingService(db)
    try:
        booking = await booking_service.cancel_booking(booking_id, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    return BookingResponse(**convert_booking_response(booking))


# Admin routes
@router.get("/admin/all", response_model=BookingListResponse)
async def list_all_bookings(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    status: Optional[str] = None,
    current_user = Depends(get_current_admin),
    db: Prisma = Depends(get_db)
):
    booking_service = BookingService(db)
    bookings, total = await booking_service.list_all_bookings(page, page_size, status)
    
    return BookingListResponse(
        bookings=[BookingResponse(**convert_booking_response(b)) for b in bookings],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )


@router.put("/admin/{booking_id}", response_model=BookingResponse)
async def admin_update_booking(
    booking_id: str,
    data: BookingUpdate,
    current_user = Depends(get_current_admin),
    db: Prisma = Depends(get_db)
):
    booking_service = BookingService(db)
    booking = await booking_service.update_booking(booking_id, data)
    return BookingResponse(**convert_booking_response(booking))


@router.put("/{booking_id}/confirm-payment", response_model=BookingResponse)
async def confirm_payment(
    booking_id: str,
    payment_method: str = "bank_transfer",
    current_user = Depends(get_current_admin),
    db: Prisma = Depends(get_db)
):
    booking_service = BookingService(db)
    booking = await booking_service.confirm_payment(booking_id, payment_method)
    return BookingResponse(**convert_booking_response(booking))
