from pydantic import BaseModel, Field
from typing import Optional, List, Any
from decimal import Decimal
from datetime import datetime
from enum import Enum


class Region(str, Enum):
    NORTH = "NORTH"
    CENTRAL = "CENTRAL"
    SOUTH = "SOUTH"
    INTERNATIONAL = "INTERNATIONAL"


class TourBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    short_description: Optional[str] = None
    destination: str
    region: Optional[Region] = None
    duration: str
    price: Decimal
    discount_price: Optional[Decimal] = None
    max_participants: int = 20
    images: List[str] = []
    highlights: List[str] = []
    includes: List[str] = []
    excludes: List[str] = []
    schedule: Optional[List[dict]] = None
    departure_dates: List[str] = []
    is_featured: bool = False
    category: Optional[str] = None
    tags: List[str] = []


class TourCreate(TourBase):
    pass


class TourUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    destination: Optional[str] = None
    region: Optional[Region] = None
    duration: Optional[str] = None
    price: Optional[Decimal] = None
    discount_price: Optional[Decimal] = None
    max_participants: Optional[int] = None
    images: Optional[List[str]] = None
    highlights: Optional[List[str]] = None
    includes: Optional[List[str]] = None
    excludes: Optional[List[str]] = None
    schedule: Optional[List[dict]] = None
    departure_dates: Optional[List[str]] = None
    is_featured: Optional[bool] = None
    is_active: Optional[bool] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None


class TourResponse(TourBase):
    id: str
    current_participants: int = 0
    rating: Decimal = Decimal("0")
    review_count: int = 0
    is_active: bool = True
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class TourListResponse(BaseModel):
    tours: List[TourResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class TourFilter(BaseModel):
    destination: Optional[str] = None
    region: Optional[Region] = None
    category: Optional[str] = None
    min_price: Optional[Decimal] = None
    max_price: Optional[Decimal] = None
    duration: Optional[str] = None
    is_featured: Optional[bool] = None
    search: Optional[str] = None
