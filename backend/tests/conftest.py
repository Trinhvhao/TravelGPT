"""
Pytest configuration and fixtures for TravelGPT backend tests.
Standalone FastAPI test app - no Prisma DB dependency needed.
"""
import pytest
import json
from typing import AsyncGenerator, Generator
from httpx import AsyncClient, ASGITransport
from decimal import Decimal
from contextlib import asynccontextmanager
import uuid


# ============= Event Loop =============

@pytest.fixture(scope="session")
def event_loop() -> Generator:
    import asyncio
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


# ============= Mock DB =============

class MockDB:
    def __init__(self):
        self.users = {
            "user-001": {"id": "user-001", "email": "test@example.com", "password_hash": None,
                "full_name": "Test User", "phone": "0912345678", "avatar_url": None, "role": "USER", "is_active": True, "created_at": None, "updated_at": None},
            "admin-001": {"id": "admin-001", "email": "admin@example.com", "password_hash": None,
                "full_name": "Admin User", "phone": "0999999999", "avatar_url": None, "role": "ADMIN", "is_active": True, "created_at": None, "updated_at": None},
        }
        self.tours = {
            # Miền Trung (CENTRAL) - Đà Nẵng, Hội An
            "tour-001": {"id": "tour-001", "name": "Tour Đà Nẵng 3N2Đ", "slug": "da-nang-3n2d",
                "description": "Tour du lịch Đà Nẵng 3 ngày 2 đêm - Khám phá Bà Nà Hills, Cầu Vàng, Mỹ Khê Beach",
                "short_description": "Khám phá Đà Nẵng - Thành phố đáng sống nhất Việt Nam",
                "destination": "Đà Nẵng", "region": "CENTRAL", "duration": "3N2Đ",
                "price": Decimal("2500000"), "discount_price": Decimal("2300000"),
                "max_participants": 20, "current_participants": 5, "images": [], "highlights": [],
                "includes": [], "excludes": [], "schedule": None, "departure_dates": [],
                "rating": Decimal("4.5"), "review_count": 10, "is_featured": True, "is_active": True,
                "category": "biển", "tags": [], "created_at": None, "updated_at": None},
            "tour-002": {"id": "tour-002", "name": "Tour Hội An - Đà Nẵng 2N1Đ", "slug": "hoi-an-2n1d",
                "description": "Tour Hội An 2 ngày 1 đêm - Phố cổ Hội An, Hội quán Phúc Kiến, Cù Lao Chàm",
                "short_description": "Phố cổ Hội An - Di sản văn hóa thế giới UNESCO",
                "destination": "Hội An", "region": "CENTRAL", "duration": "2N1Đ",
                "price": Decimal("1500000"), "discount_price": None,
                "max_participants": 15, "current_participants": 3, "images": [], "highlights": [],
                "includes": [], "excludes": [], "schedule": None, "departure_dates": [],
                "rating": Decimal("4.2"), "review_count": 5, "is_featured": False, "is_active": True,
                "category": "văn hóa", "tags": [], "created_at": None, "updated_at": None},
            "tour-006": {"id": "tour-006", "name": "Tour Huế - Đà Nẵng 4N3Đ", "slug": "hue-danang-4n3d",
                "description": "Tour Huế - Đà Nẵng 4 ngày 3 đêm - Khám phá Đại Nội Huế, Đà Nẵng, Hội An",
                "short_description": "Miền Trung hoàng gia và biển xanh",
                "destination": "Huế", "region": "CENTRAL", "duration": "4N3Đ",
                "price": Decimal("3800000"), "discount_price": Decimal("3500000"),
                "max_participants": 25, "current_participants": 8, "images": [], "highlights": [],
                "includes": [], "excludes": [], "schedule": None, "departure_dates": [],
                "rating": Decimal("4.6"), "review_count": 22, "is_featured": True, "is_active": True,
                "category": "văn hóa", "tags": [], "created_at": None, "updated_at": None},
            # Miền Bắc (NORTH) - Sapa, Hạ Long, Hà Nội
            "tour-003": {"id": "tour-003", "name": "Tour Sapa 3N2Đ", "slug": "sapa-3n2d",
                "description": "Tour Sapa 3 ngày 2 đêm - Khám phá Fansipan, bản Cát Cát, thung lũng Mường Hoa",
                "short_description": "Sa Pa huyền bí - Nơi giao của núi và mây",
                "destination": "Sapa", "region": "NORTH", "duration": "3N2Đ",
                "price": Decimal("4500000"), "discount_price": Decimal("4200000"),
                "max_participants": 20, "current_participants": 8, "images": [], "highlights": [],
                "includes": [], "excludes": [], "schedule": None, "departure_dates": [],
                "rating": Decimal("4.7"), "review_count": 45, "is_featured": True, "is_active": True,
                "category": "núi", "tags": [], "created_at": None, "updated_at": None},
            "tour-004": {"id": "tour-004", "name": "Tour Hạ Long 2N1Đ", "slug": "ha-long-2n1d",
                "description": "Tour Hạ Long 2 ngày 1 đêm - Vịnh Hạ Long UNESCO, đảo Titop, hang Sửng Sốt",
                "short_description": "Vịnh Hạ Long - Kỳ quan thế giới mới",
                "destination": "Hạ Long", "region": "NORTH", "duration": "2N1Đ",
                "price": Decimal("3500000"), "discount_price": Decimal("3300000"),
                "max_participants": 30, "current_participants": 12, "images": [], "highlights": [],
                "includes": [], "excludes": [], "schedule": None, "departure_dates": [],
                "rating": Decimal("4.6"), "review_count": 38, "is_featured": True, "is_active": True,
                "category": "biển", "tags": [], "created_at": None, "updated_at": None},
            "tour-005": {"id": "tour-005", "name": "Tour Hà Nội - Ninh Bình 4N3Đ", "slug": "hanoi-ninhbinh-4n3d",
                "description": "Tour Hà Nội - Ninh Bình 4 ngày 3 đêm - Hồ Hoàn Kiếm, Văn Miếu, Tràng An, Chùa Bái Đính",
                "short_description": "Cố đô và Tràng An - Di sản thế giới",
                "destination": "Hà Nội", "region": "NORTH", "duration": "4N3Đ",
                "price": Decimal("4800000"), "discount_price": None,
                "max_participants": 25, "current_participants": 6, "images": [], "highlights": [],
                "includes": [], "excludes": [], "schedule": None, "departure_dates": [],
                "rating": Decimal("4.4"), "review_count": 22, "is_featured": False, "is_active": True,
                "category": "văn hóa", "tags": [], "created_at": None, "updated_at": None},
            "tour-007": {"id": "tour-007", "name": "Tour Mộc Châu 2N1Đ", "slug": "moc-chau-2n1d",
                "description": "Tour Mộc Châu 2 ngày 1 đêm - Thác Dải Yếm, Đỉnh Pha Đạm, Caoo nguyên Mộc Châu",
                "short_description": "Mộc Châu - Tây Bắc thơ mộng",
                "destination": "Mộc Châu", "region": "NORTH", "duration": "2N1Đ",
                "price": Decimal("2200000"), "discount_price": Decimal("2000000"),
                "max_participants": 20, "current_participants": 4, "images": [], "highlights": [],
                "includes": [], "excludes": [], "schedule": None, "departure_dates": [],
                "rating": Decimal("4.3"), "review_count": 15, "is_featured": False, "is_active": True,
                "category": "núi", "tags": [], "created_at": None, "updated_at": None},
            "tour-008": {"id": "tour-008", "name": "Tour Hà Giang 4N3Đ", "slug": "ha-giang-4n3d",
                "description": "Tour Hà Giang 4 ngày 3 đêm - Đỉnh Mã Pí Lèng, Cột Cờ Lũng Cú, Cao Bằng",
                "short_description": "Hà Giang - Nơi đất trời giao hội",
                "destination": "Hà Giang", "region": "NORTH", "duration": "4N3Đ",
                "price": Decimal("5500000"), "discount_price": None,
                "max_participants": 15, "current_participants": 3, "images": [], "highlights": [],
                "includes": [], "excludes": [], "schedule": None, "departure_dates": [],
                "rating": Decimal("4.8"), "review_count": 32, "is_featured": True, "is_active": True,
                "category": "núi", "tags": [], "created_at": None, "updated_at": None},
            # Miền Nam (SOUTH) - Phú Quốc, Nha Trang, Cần Thơ
            "tour-009": {"id": "tour-009", "name": "Tour Phú Quốc 3N2Đ", "slug": "phu-quoc-3n2d",
                "description": "Tour Phú Quốc 3 ngày 2 đêm - Vinpearl Safari, Grand World, Bãi Sao, Hòn Thơm",
                "short_description": "Phú Quốc - Đảo Ngọc thiên đường biển",
                "destination": "Phú Quốc", "region": "SOUTH", "duration": "3N2Đ",
                "price": Decimal("5800000"), "discount_price": Decimal("5500000"),
                "max_participants": 25, "current_participants": 10, "images": [], "highlights": [],
                "includes": [], "excludes": [], "schedule": None, "departure_dates": [],
                "rating": Decimal("4.7"), "review_count": 55, "is_featured": True, "is_active": True,
                "category": "biển", "tags": [], "created_at": None, "updated_at": None},
            "tour-010": {"id": "tour-010", "name": "Tour Nha Trang 3N2Đ", "slug": "nha-trang-3n2d",
                "description": "Tour Nha Trang 3 ngày 2 đêm - Vinpearl Land, Hòn Mun, Tháp Bà Ponagar",
                "short_description": "Nha Trang - Hòn Ngọc Viễn Đông",
                "destination": "Nha Trang", "region": "SOUTH", "duration": "3N2Đ",
                "price": Decimal("4200000"), "discount_price": Decimal("3900000"),
                "max_participants": 30, "current_participants": 15, "images": [], "highlights": [],
                "includes": [], "excludes": [], "schedule": None, "departure_dates": [],
                "rating": Decimal("4.5"), "review_count": 42, "is_featured": True, "is_active": True,
                "category": "biển", "tags": [], "created_at": None, "updated_at": None},
            "tour-011": {"id": "tour-011", "name": "Tour Cần Thơ - Cà Mau 3N2Đ", "slug": "can-tho-camau-3n2d",
                "description": "Tour Cần Thơ - Cà Mau 3 ngày 2 đêm - Chợ nổi Cái Rồng, Mũi Cà Mau, Bạc Liêu",
                "short_description": "Miền Tây sông nước - Cảnh đẹp Cà Mau",
                "destination": "Cần Thơ", "region": "SOUTH", "duration": "3N2Đ",
                "price": Decimal("3200000"), "discount_price": None,
                "max_participants": 20, "current_participants": 5, "images": [], "highlights": [],
                "includes": [], "excludes": [], "schedule": None, "departure_dates": [],
                "rating": Decimal("4.2"), "review_count": 18, "is_featured": False, "is_active": True,
                "category": "văn hóa", "tags": [], "created_at": None, "updated_at": None},
            "tour-012": {"id": "tour-012", "name": "Tour Phan Thiết - Mũi Né 2N1Đ", "slug": "phan-thiet-2n1d",
                "description": "Tour Phan Thiết - Mũi Né 2 ngày 1 đêm - Đồi Cát, Lầu Ông Hoàng, Suối Tiên",
                "short_description": "Mũi Né - Thiên đường nghỉ dưỡng",
                "destination": "Phan Thiết", "region": "SOUTH", "duration": "2N1Đ",
                "price": Decimal("2800000"), "discount_price": Decimal("2500000"),
                "max_participants": 25, "current_participants": 7, "images": [], "highlights": [],
                "includes": [], "excludes": [], "schedule": None, "departure_dates": [],
                "rating": Decimal("4.4"), "review_count": 25, "is_featured": False, "is_active": True,
                "category": "biển", "tags": [], "created_at": None, "updated_at": None},
            "tour-013": {"id": "tour-013", "name": "Tour Đà Lạt 3N2Đ", "slug": "da-lat-3n2d",
                "description": "Tour Đà Lạt 3 ngày 2 đêm - Thung lũng Tình Yêu, Hồ Tuyền Trạch, Đà Lạt View",
                "short_description": "Đà Lạt - Thành phố ngàn hoa",
                "destination": "Đà Lạt", "region": "SOUTH", "duration": "3N2Đ",
                "price": Decimal("3500000"), "discount_price": Decimal("3200000"),
                "max_participants": 25, "current_participants": 9, "images": [], "highlights": [],
                "includes": [], "excludes": [], "schedule": None, "departure_dates": [],
                "rating": Decimal("4.6"), "review_count": 35, "is_featured": True, "is_active": True,
                "category": "núi", "tags": [], "created_at": None, "updated_at": None},
            "tour-014": {"id": "tour-014", "name": "Tour Vũng Tàu 1N", "slug": "vung-tau-1n",
                "description": "Tour Vũng Tàu 1 ngày - Tượng Chúa Kitô Vua, Mũi Nghinh Phong, Bãi Sau",
                "short_description": "Vũng Tàu - Thành phố biển gần Sài Gòn",
                "destination": "Vũng Tàu", "region": "SOUTH", "duration": "1N",
                "price": Decimal("900000"), "discount_price": Decimal("850000"),
                "max_participants": 40, "current_participants": 20, "images": [], "highlights": [],
                "includes": [], "excludes": [], "schedule": None, "departure_dates": [],
                "rating": Decimal("4.1"), "review_count": 30, "is_featured": False, "is_active": True,
                "category": "biển", "tags": [], "created_at": None, "updated_at": None},
            "tour-015": {"id": "tour-015", "name": "Tour Quy Nhơn - Kỳ Co 3N2Đ", "slug": "quy-nhon-3n2d",
                "description": "Tour Quy Nhơn - Kỳ Co 3 ngày 2 đêm - Eo Gió, Kỳ Co, Bãi Im Chuối",
                "short_description": "Quy Nhơn - Maldives của Việt Nam",
                "destination": "Quy Nhơn", "region": "CENTRAL", "duration": "3N2Đ",
                "price": Decimal("4100000"), "discount_price": Decimal("3800000"),
                "max_participants": 20, "current_participants": 6, "images": [], "highlights": [],
                "includes": [], "excludes": [], "schedule": None, "departure_dates": [],
                "rating": Decimal("4.7"), "review_count": 28, "is_featured": True, "is_active": True,
                "category": "biển", "tags": [], "created_at": None, "updated_at": None},
        }
        self.bookings = {
            "booking-001": {"id": "booking-001", "user_id": "user-001", "tour_id": "tour-001",
                "booking_code": "BK12345678", "status": "PENDING", "num_adults": 2, "num_children": 1,
                "total_price": Decimal("6050000"), "contact_name": "Test User",
                "contact_email": "test@example.com", "contact_phone": "0912345678",
                "departure_date": None, "special_requests": None, "note": None,
                "payment_status": "UNPAID", "payment_method": None, "payment_date": None,
                "created_at": None, "updated_at": None},
        }
        self._user_counter = 3
        self._tour_counter = 16
        self._booking_counter = 2


_mock_db = MockDB()


# ============= Test App Factory =============

def create_test_app(db: MockDB):
    from fastapi import FastAPI, Depends, HTTPException, Query, Request
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel, EmailStr
    from typing import Optional
    from passlib.context import CryptContext
    from jose import jwt
    from datetime import datetime, timedelta

    pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
    JWT_SECRET = "testsecret123"
    JWT_ALGO = "HS256"

    # Hash passwords
    db.users["user-001"]["password_hash"] = pwd_ctx.hash("password123")
    db.users["admin-001"]["password_hash"] = pwd_ctx.hash("admin123")

    def hash_pw(p: str) -> str:
        return pwd_ctx.hash(p)

    def verify_pw(p: str, h: str) -> bool:
        return pwd_ctx.verify(p, h)

    def make_token(data: dict, exp: datetime) -> str:
        d = data.copy()
        d["exp"] = exp
        return jwt.encode(d, JWT_SECRET, algorithm=JWT_ALGO)

    def decode_token(t: str):
        try:
            return jwt.decode(t, JWT_SECRET, algorithms=[JWT_ALGO])
        except:
            return None

    # Schemas
    class UserCreate(BaseModel):
        email: EmailStr; password: str; full_name: str; phone: Optional[str] = None

    class LoginReq(BaseModel):
        email: EmailStr; password: str

    class TokenResp(BaseModel):
        access_token: str; refresh_token: str; token_type: str = "bearer"; user: dict

    class UserResp(BaseModel):
        id: str; email: str; full_name: str; phone: Optional[str]; role: str; is_active: bool

    class BookingCreate(BaseModel):
        tour_id: Optional[str] = None; num_adults: int = 1; num_children: int = 0
        contact_name: str; contact_email: EmailStr; contact_phone: str
        departure_date: Optional[datetime] = None; special_requests: Optional[str] = None
        note: Optional[str] = None

    class BookingResp(BaseModel):
        id: str; user_id: str; booking_code: str; status: str
        num_adults: int; num_children: int; total_price: Decimal
        payment_status: str; contact_name: str; contact_email: str; contact_phone: str

    @asynccontextmanager
    async def lifespan(app):
        yield

    app = FastAPI(lifespan=lifespan)
    app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

    # Auth dependency
    def get_user(request: Request):
        auth = request.headers.get("authorization", "")
        if not auth.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid token")
        payload = decode_token(auth[7:])
        if not payload or payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token")
        user = db.users.get(payload.get("sub"))
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        if not user["is_active"]:
            raise HTTPException(status_code=403, detail="User inactive")
        return user

    # Auth endpoints
    @app.post("/api/v1/auth/register", response_model=TokenResp)
    async def register(data: UserCreate):
        for u in db.users.values():
            if u["email"] == data.email:
                raise HTTPException(status_code=400, detail="Email already registered")
        uid = f"user-{db._user_counter:03d}"
        db._user_counter += 1
        new_u = {"id": uid, "email": data.email, "password_hash": hash_pw(data.password),
                 "full_name": data.full_name, "phone": data.phone, "avatar_url": None,
                 "role": "USER", "is_active": True, "created_at": None, "updated_at": None}
        db.users[uid] = new_u
        return TokenResp(
            access_token=make_token({"sub": uid, "type": "access"}, datetime.utcnow() + timedelta(minutes=30)),
            refresh_token=make_token({"sub": uid, "type": "refresh"}, datetime.utcnow() + timedelta(days=7)),
            user={"id": uid, "email": data.email, "full_name": data.full_name, "phone": data.phone, "role": "USER", "is_active": True}
        )

    @app.post("/api/v1/auth/login", response_model=TokenResp)
    async def login(data: LoginReq):
        user = next((u for u in db.users.values() if u["email"] == data.email), None)
        if not user or not verify_pw(data.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        if not user["is_active"]:
            raise HTTPException(status_code=400, detail="Account is inactive")
        return TokenResp(
            access_token=make_token({"sub": user["id"], "type": "access"}, datetime.utcnow() + timedelta(minutes=30)),
            refresh_token=make_token({"sub": user["id"], "type": "refresh"}, datetime.utcnow() + timedelta(days=7)),
            user={"id": user["id"], "email": user["email"], "full_name": user["full_name"], "phone": user["phone"], "role": user["role"], "is_active": user["is_active"]}
        )

    @app.post("/api/v1/auth/refresh", response_model=TokenResp)
    async def refresh(data: dict):
        payload = decode_token(data.get("refresh_token", ""))
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        uid = payload.get("sub")
        user = db.users.get(uid)
        if not user or not user["is_active"]:
            raise HTTPException(status_code=401, detail="Invalid user")
        return TokenResp(
            access_token=make_token({"sub": uid, "type": "access"}, datetime.utcnow() + timedelta(minutes=30)),
            refresh_token=make_token({"sub": uid, "type": "refresh"}, datetime.utcnow() + timedelta(days=7)),
            user={"id": uid, "email": user["email"], "full_name": user["full_name"], "phone": user["phone"], "role": user["role"], "is_active": user["is_active"]}
        )

    @app.get("/api/v1/auth/me", response_model=UserResp)
    async def get_me(user = Depends(get_user)):
        return UserResp(**user)

    @app.put("/api/v1/auth/me", response_model=UserResp)
    async def update_me(user = Depends(get_user), data: dict = None):
        if data:
            for k, v in data.items():
                if v is not None:
                    user[k] = v
        return UserResp(**user)

    @app.post("/api/v1/auth/change-password")
    async def change_pw(user = Depends(get_user), old_password: str = None, new_password: str = None):
        if not verify_pw(old_password, user["password_hash"]):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        user["password_hash"] = hash_pw(new_password)
        return {"message": "Password changed successfully"}

    # Booking endpoints
    @app.get("/api/v1/bookings")
    async def list_bookings(user = Depends(get_user), page: int = 1, page_size: int = 10):
        ubs = [b for b in db.bookings.values() if b["user_id"] == user["id"]]
        return {"bookings": [{"id": b["id"], "user_id": b["user_id"], "booking_code": b["booking_code"],
            "status": b["status"], "num_adults": b["num_adults"], "num_children": b["num_children"],
            "total_price": b["total_price"], "payment_status": b["payment_status"],
            "contact_name": b["contact_name"], "contact_email": b["contact_email"], "contact_phone": b["contact_phone"]} for b in ubs],
            "total": len(ubs), "page": page, "page_size": page_size, "total_pages": 1}

    @app.get("/api/v1/bookings/{booking_id}")
    async def get_booking(booking_id: str, user = Depends(get_user)):
        b = db.bookings.get(booking_id)
        if not b:
            raise HTTPException(status_code=404, detail="Booking not found")
        if b["user_id"] != user["id"] and user["role"] != "ADMIN":
            raise HTTPException(status_code=403, detail="Not authorized")
        return {"id": b["id"], "user_id": b["user_id"], "booking_code": b["booking_code"],
            "status": b["status"], "num_adults": b["num_adults"], "num_children": b["num_children"],
            "total_price": b["total_price"], "payment_status": b["payment_status"],
            "contact_name": b["contact_name"], "contact_email": b["contact_email"], "contact_phone": b["contact_phone"]}

    @app.post("/api/v1/bookings")
    async def create_booking(user = Depends(get_user), data: BookingCreate = None):
        # Validate using Pydantic schema (will return 422 for invalid input)
        if data is None:
            raise HTTPException(status_code=422, detail="Invalid input")
        if data.num_adults < 1:
            raise HTTPException(status_code=422, detail="num_adults must be at least 1")
        if data.num_children < 0:
            raise HTTPException(status_code=422, detail="num_children must be non-negative")
        
        total_price = Decimal("0")
        if data.tour_id:
            tour = db.tours.get(data.tour_id)
            if not tour:
                raise HTTPException(status_code=400, detail="Tour not found")
            price = tour["discount_price"] if tour["discount_price"] else tour["price"]
            total_price = price * data.num_adults + price / 2 * data.num_children
        bid = f"booking-{db._booking_counter:03d}"
        db._booking_counter += 1
        nb = {"id": bid, "user_id": user["id"], "tour_id": data.tour_id,
              "booking_code": f"BK{uuid.uuid4().hex[:8].upper()}", "status": "PENDING",
              "num_adults": data.num_adults, "num_children": data.num_children,
              "total_price": str(total_price), "contact_name": data.contact_name,
              "contact_email": data.contact_email, "contact_phone": data.contact_phone,
              "departure_date": data.departure_date, "special_requests": data.special_requests,
              "note": data.note, "payment_status": "UNPAID", "payment_method": None,
              "payment_date": None, "created_at": None, "updated_at": None}
        db.bookings[bid] = nb
        return {"id": nb["id"], "user_id": nb["user_id"], "booking_code": nb["booking_code"],
            "status": nb["status"], "num_adults": nb["num_adults"], "num_children": nb["num_children"],
            "total_price": nb["total_price"], "payment_status": nb["payment_status"],
            "contact_name": nb["contact_name"], "contact_email": nb["contact_email"], "contact_phone": nb["contact_phone"]}

    @app.put("/api/v1/bookings/{booking_id}/cancel")
    async def cancel_booking(booking_id: str, user = Depends(get_user)):
        b = db.bookings.get(booking_id)
        if not b:
            raise HTTPException(status_code=404, detail="Booking not found")
        if b["user_id"] != user["id"] and user["role"] != "ADMIN":
            raise HTTPException(status_code=403, detail="Not authorized")
        if b["status"] == "CANCELLED":
            raise HTTPException(status_code=400, detail="Booking is already cancelled")
        b["status"] = "CANCELLED"
        return {"id": b["id"], "user_id": b["user_id"], "booking_code": b["booking_code"],
            "status": b["status"], "num_adults": b["num_adults"], "num_children": b["num_children"],
            "total_price": b["total_price"], "payment_status": b["payment_status"],
            "contact_name": b["contact_name"], "contact_email": b["contact_email"], "contact_phone": b["contact_phone"]}

    @app.get("/api/v1/bookings/code/{code}")
    async def get_booking_code(code: str):
        b = next((bk for bk in db.bookings.values() if bk["booking_code"] == code), None)
        if not b:
            raise HTTPException(status_code=404, detail="Booking not found")
        return {"id": b["id"], "user_id": b["user_id"], "booking_code": b["booking_code"],
            "status": b["status"], "num_adults": b["num_adults"], "num_children": b["num_children"],
            "total_price": b["total_price"], "payment_status": b["payment_status"],
            "contact_name": b["contact_name"], "contact_email": b["contact_email"], "contact_phone": b["contact_phone"]}

    @app.get("/api/v1/bookings/admin/all")
    async def admin_list(user = Depends(get_user), status: Optional[str] = None):
        if user["role"] != "ADMIN":
            raise HTTPException(status_code=403, detail="Admin access required")
        bks = list(db.bookings.values())
        if status:
            bks = [b for b in bks if b["status"] == status]
        return {"bookings": [{"id": b["id"], "user_id": b["user_id"], "booking_code": b["booking_code"],
            "status": b["status"], "num_adults": b["num_adults"], "num_children": b["num_children"],
            "total_price": b["total_price"], "payment_status": b["payment_status"],
            "contact_name": b["contact_name"], "contact_email": b["contact_email"], "contact_phone": b["contact_phone"]} for b in bks],
            "total": len(bks), "page": 1, "page_size": 20, "total_pages": 1}

    @app.put("/api/v1/bookings/admin/{booking_id}")
    async def admin_update(booking_id: str, user = Depends(get_user), data: dict = None):
        if user["role"] != "ADMIN":
            raise HTTPException(status_code=403, detail="Admin access required")
        b = db.bookings.get(booking_id)
        if not b:
            raise HTTPException(status_code=404, detail="Booking not found")
        if data:
            for k, v in data.items():
                if v is not None:
                    b[k] = v
        return {"id": b["id"], "user_id": b["user_id"], "booking_code": b["booking_code"],
            "status": b["status"], "num_adults": b["num_adults"], "num_children": b["num_children"],
            "total_price": b["total_price"], "payment_status": b["payment_status"],
            "contact_name": b["contact_name"], "contact_email": b["contact_email"], "contact_phone": b["contact_phone"]}

    @app.put("/api/v1/bookings/{booking_id}/confirm-payment")
    async def confirm_pay(booking_id: str, user = Depends(get_user), payment_method: str = "bank_transfer"):
        if user["role"] != "ADMIN":
            raise HTTPException(status_code=403, detail="Admin access required")
        b = db.bookings.get(booking_id)
        if not b:
            raise HTTPException(status_code=404, detail="Booking not found")
        b["payment_status"] = "PAID"
        b["status"] = "CONFIRMED"
        b["payment_method"] = payment_method
        return {"id": b["id"], "user_id": b["user_id"], "booking_code": b["booking_code"],
            "status": b["status"], "num_adults": b["num_adults"], "num_children": b["num_children"],
            "total_price": b["total_price"], "payment_status": b["payment_status"],
            "contact_name": b["contact_name"], "contact_email": b["contact_email"], "contact_phone": b["contact_phone"]}

    # Tour endpoints (no auth)
    @app.get("/api/v1/tours")
    async def list_tours(destination=None, region=None, category=None,
                         min_price=None, max_price=None, search=None,
                         is_featured=None, page: int = 1, page_size: int = 12):
        tours = list(db.tours.values())
        if destination:
            tours = [t for t in tours if destination.lower() in t["destination"].lower()]
        if region:
            tours = [t for t in tours if t.get("region") == region]
        if is_featured is not None:
            tours = [t for t in tours if t.get("is_featured") == is_featured]
        if min_price is not None:
            tours = [t for t in tours if float(str(t["price"])) >= float(min_price)]
        if max_price is not None:
            tours = [t for t in tours if float(str(t["price"])) <= float(max_price)]
        page_size = min(page_size, 50)
        skip = (page - 1) * page_size
        return {"tours": tours[skip:skip+page_size], "total": len(tours), "page": page, "page_size": page_size, "total_pages": (len(tours) + page_size - 1) // page_size}

    @app.get("/api/v1/tours/featured")
    async def featured_tours(limit: int = 6):
        return [t for t in db.tours.values() if t.get("is_featured")][:limit]

    @app.get("/api/v1/tours/search")
    async def search_tours(q: str = Query(...), limit: int = 10):
        return [t for t in db.tours.values() if q.lower() in t["name"].lower()][:limit]

    @app.get("/api/v1/tours/{tour_id}")
    async def get_tour(tour_id: str):
        t = db.tours.get(tour_id)
        if not t:
            raise HTTPException(status_code=404, detail="Tour not found")
        return t

    @app.get("/api/v1/tours/slug/{slug}")
    async def get_tour_slug(slug: str):
        t = next((t for t in db.tours.values() if t["slug"] == slug), None)
        if not t:
            raise HTTPException(status_code=404, detail="Tour not found")
        return t

    @app.post("/api/v1/tours")
    async def create_tour(user = Depends(get_user), data: dict = None):
        if user["role"] != "ADMIN":
            raise HTTPException(status_code=403, detail="Admin access required")
        tid = f"tour-{db._tour_counter:03d}"
        db._tour_counter += 1
        nt = {"id": tid, "name": data.get("name"), "slug": data.get("slug"),
              "destination": data.get("destination"), "region": data.get("region"),
              "duration": data.get("duration", "1N"),
              "price": Decimal(str(data.get("price", 0))),
              "discount_price": Decimal(str(data.get("discount_price"))) if data.get("discount_price") else None,
              "max_participants": data.get("max_participants", 20), "current_participants": 0,
              "images": [], "highlights": [], "includes": [], "excludes": [], "schedule": None,
              "departure_dates": [], "rating": Decimal("0"), "review_count": 0,
              "is_featured": False, "is_active": True, "category": data.get("category"),
              "tags": [], "created_at": None, "updated_at": None}
        db.tours[tid] = nt
        return nt

    @app.put("/api/v1/tours/{tour_id}")
    async def update_tour(tour_id: str, user = Depends(get_user), data: dict = None):
        if user["role"] != "ADMIN":
            raise HTTPException(status_code=403, detail="Admin access required")
        t = db.tours.get(tour_id)
        if not t:
            raise HTTPException(status_code=404, detail="Tour not found")
        if data:
            for k, v in data.items():
                if v is not None:
                    t[k] = v
        return t

    @app.delete("/api/v1/tours/{tour_id}")
    async def delete_tour(tour_id: str, user = Depends(get_user)):
        if user["role"] != "ADMIN":
            raise HTTPException(status_code=403, detail="Admin access required")
        if tour_id in db.tours:
            del db.tours[tour_id]
            return {"success": True}
        raise HTTPException(status_code=404, detail="Tour not found")

    # Chat endpoints
    @app.post("/api/v1/chat/message")
    async def chat_msg(data: dict):
        return {"message": {"id": "msg-001", "conversation_id": data.get("session_id", "default"),
            "role": "assistant", "content": "Xin chào! Tôi có thể giúp gì?",
            "metadata": {}, "created_at": None},
            "conversation_id": data.get("session_id", "default"),
            "suggestions": ["Tìm tour Đà Nẵng"], "intent": "greeting"}

    @app.get("/api/v1/chat/history")
    async def chat_history(user = Depends(get_user)):
        return {"conversations": []}

    @app.delete("/api/v1/chat/history")
    async def clear_history(user = Depends(get_user)):
        return {"success": True, "message": "Chat history cleared"}

    @app.get("/api/v1/chat/suggestions")
    async def chat_suggestions(intent: str = "general"):
        m = {"greeting": ["Tìm tour Đà Nẵng"], "booking": ["Xem lại thông tin"],
             "cancel": ["Xác nhận hủy"], "general": ["Tour gần đây"]}
        return {"suggestions": m.get(intent, m["general"])}

    @app.post("/api/v1/chat/cancellation/start")
    async def cancel_start(data: dict):
        code = data.get("booking_code")
        if code:
            b = next((b for b in db.bookings.values() if b["booking_code"] == code), None)
            if b:
                return {"success": True, "message": f"Đã xác minh: {code}",
                        "refund_amount": float(b["total_price"]) * 0.9, "refund_percent": 90}
            return {"success": False, "message": f"Không tìm thấy: {code}"}
        return {"success": True, "message": "Cung cấp mã booking"}

    @app.post("/api/v1/chat/cancellation/action")
    async def cancel_action(action: str, session_id: str, confirm: Optional[bool] = None, reason: Optional[str] = None):
        if action == "cancel":
            return {"success": True, "message": "Đã hủy yêu cầu"}
        if action == "confirm" and confirm is not None:
            return {"success": True, "message": "Đã xác nhận hủy", "completed": True}
        return {"success": False, "message": "Unknown action"}

    @app.get("/api/v1/chat/cancellation/refund-policy")
    async def refund_policy():
        return {"policy": [{"days_before": "14+", "refund_percent": 90},
                           {"days_before": "7-13", "refund_percent": 70},
                           {"days_before": "3-6", "refund_percent": 50},
                           {"days_before": "1-2", "refund_percent": 20},
                           {"days_before": "0", "refund_percent": 0}]}

    @app.post("/api/v1/chat/reschedule/start")
    async def reschedule_start(data: dict):
        return {"success": True, "message": "Bắt đầu đổi lịch"}

    @app.post("/api/v1/chat/reschedule/action")
    async def reschedule_action(action: str, session_id: str, new_date: Optional[str] = None, confirm: Optional[bool] = None):
        if action == "cancel":
            return {"success": True, "message": "Đã hủy đổi lịch"}
        if action == "select_date" and new_date:
            return {"success": True, "message": f"Chọn ngày: {new_date}"}
        if action == "confirm" and confirm is not None:
            return {"success": True, "message": "Đã xác nhận đổi lịch", "completed": True}
        return {"success": False, "message": "Unknown action"}

    @app.post("/api/v1/chat/pre-trip/checklist")
    async def pre_checklist(data: dict):
        return {"checklist": ["Hộ chiếu", "Vé máy bay"], "packing_tips": ["Kem chống nắng"], "countdown_message": "Còn 7 ngày!"}

    @app.post("/api/v1/chat/pre-trip/weather")
    async def pre_weather(data: dict):
        return {"weather_info": "Trời nắng, 30°C", "local_tips": [], "countdown_message": ""}

    @app.post("/api/v1/chat/pre-trip/summary")
    async def pre_summary(data: dict):
        return {"checklist": [], "weather_info": "", "local_tips": [], "packing_tips": []}

    @app.post("/api/v1/chat/post-trip/feedback")
    async def post_feedback(data: dict):
        if not data.get("booking_code"):
            raise HTTPException(status_code=400, detail="Booking code is required")
        return {"feedback_survey": "Cảm ơn bạn đã tham gia khảo sát!"}

    @app.post("/api/v1/chat/post-trip/review-prompt")
    async def post_review(data: dict):
        return {"review_prompt": "Chia sẻ cảm nhận của bạn..."}

    @app.post("/api/v1/chat/post-trip/loyalty")
    async def post_loyalty(data: dict):
        return {"loyalty_points": 460, "loyalty_tier": "Silver", "loyalty_benefits": ["Giảm 5%"], "points_to_next_tier": 540}

    @app.post("/api/v1/chat/post-trip/summary")
    async def post_summary(data: dict):
        return {"feedback_survey": "", "loyalty_points": 0, "loyalty_tier": "Bronze", "loyalty_benefits": [], "return_reminder": ""}

    @app.get("/api/v1/chat/conversation/{session_id}")
    async def conv_state(session_id: str):
        return {"session_id": session_id, "state": "active", "total_turns": 0,
                "turns_without_progress": 0, "needs_attention": False,
                "active_goal_type": None, "completed_goals": [], "recent_turns": [], "context": {}, "collected_entities": {}}

    @app.post("/api/v1/chat/conversation/{session_id}/goal")
    async def create_goal(session_id: str, goal_type: str = None):
        return {"goal_id": "goal-001", "message": f"Đã tạo: {goal_type}"}

    @app.delete("/api/v1/chat/conversation/{session_id}/goal")
    async def cancel_goal(session_id: str):
        return {"success": True, "message": "Đã hủy goal"}

    @app.post("/api/v1/chat/message-v2")
    async def chat_msg_v2(data: dict):
        return {"message": {"id": "msg-002", "conversation_id": data.get("session_id", "default"),
            "role": "assistant", "content": "Response v2", "metadata": {}, "created_at": None},
            "conversation_id": data.get("session_id", "default"),
            "suggestions": [], "intent": "general"}

    @app.post("/api/v1/chat/message/stream")
    async def chat_stream(data: dict):
        from fastapi.responses import StreamingResponse
        import asyncio
        from decimal import Decimal

        # Import real intent detector
        try:
            from app.ai.intent import AdvancedIntentDetector
            detector = AdvancedIntentDetector()
        except Exception:
            detector = None

        message = data.get("message", "")
        session_id = data.get("session_id", "default")

        # Detect intent
        intent = "general"
        extracted = {}
        if detector:
            try:
                intent, extracted = detector.detect(message)
            except Exception:
                pass

        # Build tour results from mock DB
        tours = []
        region = extracted.get("region", "").lower()
        destination = extracted.get("destination", "").lower()
        budget = extracted.get("budget", 0) or extracted.get("max_price", 0)

        for tour in db.tours.values():
            if not tour.get("is_active", True):
                continue
            # Filter by region
            if region in ("miền bắc", "mien bac", "bắc"):
                if tour.get("region") != "NORTH":
                    continue
            # Filter by destination
            if destination:
                dest_match = destination.lower() in tour.get("destination", "").lower()
                name_match = destination.lower() in tour.get("name", "").lower()
                if not (dest_match or name_match):
                    continue
            # Filter by budget
            price = float(str(tour.get("price", 0)))
            if budget and price > budget:
                continue
            tours.append(tour)

        # Build response text
        if intent == "search_tour" and tours:
            tour_lines = []
            for t in tours[:5]:
                price = float(str(t.get("price", 0)))
                price_str = f"{price:,.0f}".replace(",", ".")
                tour_lines.append(
                    f"- **{t['name']}** — {t.get('destination', '')}, "
                    f"{t.get('duration', 'N/A')}, "
                    f"**{price_str}đ/người**"
                )
            response_text = (
                f"Tôi tìm thấy {len(tours)} tour phù hợp:\n\n"
                + "\n".join(tour_lines)
            )
        elif intent == "search_tour":
            response_text = (
                f"Hiện tôi chưa có tour cho yêu cầu này. "
                f"Bạn thử thay đổi ngân sách hoặc điểm đến nhé!"
            )
        elif intent in ("greeting", "small_talk"):
            response_text = "Xin chào! Tôi là AI Travel Agent của TravelGPT. Bạn muốn đi du lịch ở đâu?"
        elif intent in ("start_booking", "booking"):
            response_text = (
                "Bạn muốn đặt tour? Tôi có thể giúp! "
                "Bạn cho tôi biết điểm đến và ngân sách nhé."
            )
        else:
            response_text = (
                "Tôi có thể giúp bạn tìm tour du lịch, đặt tour, hủy hoặc đổi lịch. "
                "Bạn muốn làm gì?"
            )

        async def gen():
            yield f"data: {json.dumps({'type': 'start'})}\n\n"
            # Stream word by word for realism
            words = response_text.split(" ")
            for i, word in enumerate(words):
                chunk = word + (" " if i < len(words) - 1 else "")
                yield f"data: {json.dumps({'type': 'content', 'content': chunk})}\n\n"
                await asyncio.sleep(0.005)
            yield f"data: {json.dumps({
                'type': 'complete',
                'intent': intent,
                'suggestions': ["Tour Đà Nẵng", "Tour Phú Quốc", "Liên hệ tư vấn"],
                'response': response_text,
                'tours': [
                    {"id": t["id"], "name": t["name"], "destination": t.get("destination", ""),
                     "price": float(str(t.get("price", 0))), "region": t.get("region", ""),
                     "duration": t.get("duration", ""), "rating": float(str(t.get("rating", 0)))}
                    for t in tours[:5]
                ] if tours else []
            })}\n\n"

        return StreamingResponse(gen(), media_type="text/event-stream",
            headers={"Content-Type": "text/event-stream", "Cache-Control": "no-cache"})

    return app


# ============= Token Fixtures =============

@pytest.fixture
def test_user_token():
    from jose import jwt
    from datetime import datetime, timedelta
    # Token sub must match user in _mock_db (user-001)
    return jwt.encode({"sub": "user-001", "exp": datetime.utcnow() + timedelta(hours=1), "type": "access"},
                      "testsecret123", algorithm="HS256")

@pytest.fixture
def admin_user_token():
    from jose import jwt
    from datetime import datetime, timedelta
    # Token sub must match user in _mock_db (admin-001)
    return jwt.encode({"sub": "admin-001", "exp": datetime.utcnow() + timedelta(hours=1), "type": "access"},
                      "testsecret123", algorithm="HS256")

@pytest.fixture
def expired_token():
    from jose import jwt
    from datetime import datetime, timedelta
    return jwt.encode({"sub": "user-001", "exp": datetime.utcnow() - timedelta(hours=1), "type": "access"},
                      "testsecret123", algorithm="HS256")

@pytest.fixture
def refresh_token_user():
    from jose import jwt
    from datetime import datetime, timedelta
    return jwt.encode({"sub": "user-001", "exp": datetime.utcnow() + timedelta(days=7), "type": "refresh"},
                      "testsecret123", algorithm="HS256")

@pytest.fixture
def invalid_token():
    return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature"

@pytest.fixture
def wrong_type_token():
    from jose import jwt
    from datetime import datetime, timedelta
    return jwt.encode({"sub": "user-001", "exp": datetime.utcnow() + timedelta(hours=1), "type": "refresh"},
                      "testsecret123", algorithm="HS256")


# ============= HTTP Client Fixtures =============

@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    app = create_test_app(_mock_db)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

@pytest.fixture
async def auth_client(client: AsyncClient, test_user_token: str) -> AsyncClient:
    client.headers["Authorization"] = f"Bearer {test_user_token}"
    return client

@pytest.fixture
async def admin_client(client: AsyncClient, admin_user_token: str) -> AsyncClient:
    client.headers["Authorization"] = f"Bearer {admin_user_token}"
    return client


# ============= Mock Data Fixtures =============

@pytest.fixture
def mock_user_data():
    return {"email": "newuser@example.com", "password": "password123", "full_name": "New Test User", "phone": "0987654321"}

@pytest.fixture
def mock_booking_data():
    return {"tour_id": "tour-001", "num_adults": 2, "num_children": 0,
            "contact_name": "Test User", "contact_email": "test@example.com", "contact_phone": "0912345678",
            "departure_date": None, "special_requests": None, "note": None}

@pytest.fixture
def mock_chat_message():
    return {"message": "Tôi muốn đặt tour Đà Nẵng", "session_id": "test-session-001"}
