from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from decimal import Decimal
from datetime import datetime
from enum import Enum
from app.schemas.tour import TourResponse


class BookingStatus(str, Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"


class PaymentStatus(str, Enum):
    UNPAID = "UNPAID"
    PAID = "PAID"
    REFUNDED = "REFUNDED"


class BookingBase(BaseModel):
    tour_id: Optional[str] = None
    num_adults: int = Field(default=1, ge=1, description="Number of adults, must be at least 1")
    num_children: int = Field(default=0, ge=0, description="Number of children, must be non-negative")
    contact_name: str
    contact_email: EmailStr
    contact_phone: str
    departure_date: Optional[datetime] = None
    special_requests: Optional[str] = None
    note: Optional[str] = None


class BookingCreate(BookingBase):
    pass


class BookingUpdate(BaseModel):
    status: Optional[BookingStatus] = None
    payment_status: Optional[PaymentStatus] = None
    payment_method: Optional[str] = None
    note: Optional[str] = None


class BookingResponse(BookingBase):
    id: str
    user_id: str
    booking_code: str
    status: BookingStatus
    total_price: Decimal
    payment_status: PaymentStatus
    payment_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    tour: Optional[TourResponse] = None
    
    class Config:
        from_attributes = True


class BookingListResponse(BaseModel):
    bookings: list[BookingResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class BookingConfirmRequest(BaseModel):
    booking_id: str
    payment_method: Optional[str] = None
