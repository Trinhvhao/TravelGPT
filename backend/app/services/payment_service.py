"""
Stripe Payment Service for TravelGPT
"""
import logging
from typing import Optional
from prisma import Prisma
from app.services.booking_service import BookingService

logger = logging.getLogger(__name__)

_stripe = None


def _get_stripe():
    global _stripe
    if _stripe is None:
        try:
            import stripe
            from app.core.config import get_settings
            settings = get_settings()
            stripe.api_key = settings.stripe_secret_key
            _stripe = stripe
        except ImportError:
            logger.warning("Stripe not installed. Payment features disabled.")
            return None
    return _stripe


class PaymentService:
    def __init__(self, db: Prisma):
        self.db = db
        self.booking_service = BookingService(db)
        self.stripe = _get_stripe()

    async def create_stripe_checkout(
        self,
        booking_id: str,
        user_id: str,
        success_url: str,
        cancel_url: str,
    ) -> dict:
        """Create a Stripe Checkout Session for a booking."""
        if not self.stripe:
            raise ValueError("Stripe is not configured on the server.")

        booking = await self.booking_service.get_booking_by_id(booking_id)
        if not booking:
            raise ValueError("Booking not found")
        if booking.userId != user_id:
            raise ValueError("Not authorized")

        # Amount in VND (no decimal conversion needed)
        amount = int(float(booking.totalPrice))

        user = await self.db.user.find_unique(where={"id": user_id})

        # Build line items
        tour_name = booking.tour.name if booking.tour else "Tour TravelGPT"
        description = f"Mã booking: {booking.bookingCode} | {booking.numAdults} người lớn"
        if booking.numChildren:
            description += f" | {booking.numChildren} trẻ em"

        line_items = [
            {
                "price_data": {
                    "currency": "vnd",
                    "product_data": {
                        "name": tour_name,
                        "description": description,
                    },
                    "unit_amount": max(amount, 1000),
                },
                "quantity": 1,
            }
        ]

        metadata = {
            "booking_id": booking_id,
            "booking_code": booking.bookingCode,
            "user_id": user_id,
        }

        try:
            session = self.stripe.checkout.Session.create(
                mode="payment",
                line_items=line_items,
                customer_email=user.email if user else None,
                metadata=metadata,
                success_url=success_url,
                cancel_url=cancel_url,
                payment_method_types=["card"],
                locale="vi",
            )
            logger.info(
                f"Created Stripe checkout session {session.id} for booking {booking.bookingCode}"
            )
            return {
                "session_id": session.id,
                "checkout_url": session.url,
            }
        except Exception as e:
            logger.error(f"Stripe error: {e}")
            raise ValueError(f"Không thể tạo thanh toán Stripe: {str(e)}")

    async def verify_and_confirm_stripe(
        self,
        session_id: str,
    ) -> dict:
        """Verify a Stripe session and confirm payment on the booking."""
        if not self.stripe:
            raise ValueError("Stripe is not configured on the server.")

        try:
            session = self.stripe.checkout.Session.retrieve(session_id)
        except Exception:
            raise ValueError("Phiên thanh toán không hợp lệ.")

        if session.payment_status != "paid":
            raise ValueError(f"Thanh toán chưa hoàn tất. Trạng thái: {session.payment_status}")

        booking_id = session.metadata.get("booking_id")
        if not booking_id:
            raise ValueError("Không tìm thấy booking_id trong phiên thanh toán.")

        # Update booking to PAID
        booking = await self.db.booking.update(
            where={"id": booking_id},
            data={
                "paymentStatus": "PAID",
                "paymentMethod": "stripe",
                "paymentDate": session.created_at or None,
            },
        )

        # Confirm the booking (PENDING → CONFIRMED)
        if booking and booking.status == "PENDING":
            await self.db.booking.update(
                where={"id": booking_id},
                data={"status": "CONFIRMED"},
            )

        logger.info(
            f"Payment confirmed for booking {booking.bookingCode if booking else booking_id}"
        )
        return {
            "booking_id": booking_id,
            "booking_code": booking.bookingCode if booking else None,
            "status": "PAID",
            "payment_method": "stripe",
        }

    async def create_stripe_refund(
        self,
        booking_id: str,
        reason: Optional[str] = None,
    ) -> dict:
        """Create a Stripe refund for a paid booking (marks as REFUNDED)."""
        booking = await self.booking_service.get_booking_by_id(booking_id)
        if not booking:
            raise ValueError("Booking not found")
        if booking.paymentStatus != "PAID":
            raise ValueError("Booking chưa được thanh toán.")

        await self.db.booking.update(
            where={"id": booking_id},
            data={
                "paymentStatus": "REFUNDED",
                "paymentMethod": "stripe",
            },
        )
        return {
            "booking_id": booking_id,
            "status": "REFUNDED",
        }
