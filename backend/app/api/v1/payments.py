"""
Payment API endpoints — Stripe Checkout + webhook
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from prisma import Prisma
from app.core.prisma import get_db
from app.services.payment_service import PaymentService
from app.api.deps import get_current_user

router = APIRouter(prefix="/payments", tags=["Payments"])


class CreateCheckoutRequest(BaseModel):
    booking_id: str
    success_url: str = "http://localhost:3000/bookings/{booking_code}?paid=true"
    cancel_url: str = "http://localhost:3000/bookings?cancelled=true"


class CreateCheckoutResponse(BaseModel):
    session_id: str
    checkout_url: str


class VerifyCheckoutRequest(BaseModel):
    session_id: str


class VerifyCheckoutResponse(BaseModel):
    booking_id: str
    booking_code: str | None
    status: str
    payment_method: str


class RefundRequest(BaseModel):
    booking_id: str
    reason: str | None = None


class RefundResponse(BaseModel):
    booking_id: str
    status: str


@router.post("/create-checkout", response_model=CreateCheckoutResponse)
async def create_checkout(
    data: CreateCheckoutRequest,
    current_user = Depends(get_current_user),
    db: Prisma = Depends(get_db),
):
    """Create a Stripe Checkout Session for a booking."""
    service = PaymentService(db)

    # Build success/cancel URLs with booking code
    try:
        from app.services.booking_service import BookingService
        bs = BookingService(db)
        booking = await bs.get_booking_by_id(data.booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        success_url = data.success_url.format(booking_code=booking.bookingCode)
    except Exception:
        success_url = data.success_url

    try:
        result = await service.create_stripe_checkout(
            booking_id=data.booking_id,
            user_id=current_user.id,
            success_url=success_url,
            cancel_url=data.cancel_url,
        )
        return CreateCheckoutResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/verify-checkout", response_model=VerifyCheckoutResponse)
async def verify_checkout(
    data: VerifyCheckoutRequest,
    current_user = Depends(get_current_user),
    db: Prisma = Depends(get_db),
):
    """Verify Stripe payment and confirm booking."""
    service = PaymentService(db)
    try:
        result = await service.verify_and_confirm_stripe(data.session_id)
        return VerifyCheckoutResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/refund", response_model=RefundResponse)
async def refund_booking(
    data: RefundRequest,
    current_user = Depends(get_current_user),
    db: Prisma = Depends(get_db),
):
    """Request a refund for a paid booking."""
    service = PaymentService(db)
    try:
        result = await service.create_stripe_refund(
            booking_id=data.booking_id,
            reason=data.reason,
        )
        return RefundResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/stripe-publishable-key")
async def get_stripe_key():
    """Return Stripe publishable key for frontend."""
    from app.core.config import get_settings
    settings = get_settings()
    return {"publishable_key": settings.stripe_publishable_key}
