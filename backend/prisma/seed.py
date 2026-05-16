"""
TravelGPT Database Seed Script
Run: cd backend && python -m prisma.seed
Or:  python prisma/seed.py
"""
import asyncio
import json
import random
import bcrypt
from datetime import datetime, timedelta
from prisma import Prisma


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12)).decode()


async def upsert_user(db: Prisma, email: str, **data) -> dict:
    existing = await db.user.find_unique(where={"email": email})
    if existing:
        user = await db.user.update(where={"email": email}, data=data)
        print(f"  ↻ Updated: {email}")
        return user
    else:
        user = await db.user.create(data={"email": email, **data})
        print(f"  + Created: {email}")
        return user


async def upsert_tour(db: Prisma, slug: str, **data) -> dict:
    departure_dates = data.pop("departureDates", [])
    existing = await db.tour.find_unique(where={"slug": slug})
    if existing:
        await db.tour.update(
            where={"slug": slug},
            data={**data, "departureDates": departure_dates},
        )
        print(f"  ↻ Tour: {slug}")
        return existing
    else:
        tour = await db.tour.create(data={"slug": slug, **data, "departureDates": departure_dates})
        print(f"  + Tour: {slug}")
        return tour


async def upsert_booking(db: Prisma, code: str, **data) -> dict:
    existing = await db.booking.find_unique(where={"bookingCode": code})
    if existing:
        print(f"  ↻ Booking: {code}")
        return existing
    booking = await db.booking.create(data={"bookingCode": code, **data})
    print(f"  + Booking: {code}")
    return booking


async def upsert_review(db: Prisma, user_id: str, tour_id: str, **data) -> dict:
    existing = await db.review.find_first(
        where={"userId": user_id, "tourId": tour_id}
    )
    if existing:
        return existing
    r = await db.review.create(data={"userId": user_id, "tourId": tour_id, **data})
    print(f"  + Review {r.rating}★")
    return r


def future_date(days_ahead: int) -> str:
    d = datetime.now() + timedelta(days=days_ahead)
    return d.strftime("%Y-%m-%d")


# ─────────────────────────────────────────────────────────────────────────────
async def main():
    db = Prisma()
    await db.connect()
    print("\n✅ Connected to database")

    # ── USERS ─────────────────────────────────────────────────────────────────
    print("\n📦 Seeding users...")
    admin = await upsert_user(
        db,
        "admin@travelgpt.vn",
        passwordHash=hash_password("admin123"),
        fullName="Admin TravelGPT",
        phone="0901234567",
        role="ADMIN",
    )
    test_user = await upsert_user(
        db,
        "user@test.com",
        passwordHash=hash_password("user123"),
        fullName="Nguyễn Văn Test",
        phone="0909876543",
        role="USER",
    )
    # Realistic users
    users_data = [
        ("tram.nguyen@email.com", "Trần Thị Trâm", "0832345678"),
        ("khoi.le@gmail.com", "Lê Minh Khôi", "0912456789"),
        ("uyen.pham@outlook.com", "Phạm Thị Uyên", "0763456789"),
        ("hieu.nguyen@gmail.com", "Nguyễn Minh Hiếu", "0902345678"),
        ("linh.ho@email.com", "Hoàng Thị Linh", "0854567890"),
        ("duong.tran@gmail.com", "Trần Hoàng Dương", "0782345678"),
        ("han.nguyen@outlook.com", "Nguyễn Thu Hà", "0932345678"),
        ("son.pham@gmail.com", "Phạm Đình Sơn", "0883456789"),
        ("mai.le@email.com", "Lê Thị Mai", "0812345678"),
        ("tuan.tran@gmail.com", "Trần Công Tuấn", "0942345678"),
    ]
    created_users = [admin, test_user]
    for email, name, phone in users_data:
        u = await upsert_user(
            db, email,
            passwordHash=hash_password("user123"),
            fullName=name,
            phone=phone,
            role="USER",
        )
        created_users.append(u)

    print(f"   Total users: {len(created_users)}")

    # ── TOUR IMAGES ─────────────────────────────────────────────────────────────
    IMG = {
        "danang": [
            "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800",
            "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800",
            "https://images.unsplash.com/photo-1561626423-a51b45aef0a1?w=800",
            "https://images.unsplash.com/photo-1580618864180-f6d7d39b4eb8?w=800",
        ],
        "hoian": [
            "https://images.unsplash.com/photo-1557794008-66bf5d6f6e97?w=800",
            "https://images.unsplash.com/photo-1518544866330-95a2bfa6bb26?w=800",
            "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800",
        ],
        "phuquoc": [
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
            "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800",
            "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=800",
            "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800",
        ],
        "nhatrang": [
            "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800",
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
            "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800",
        ],
        "halong": [
            "https://images.unsplash.com/photo-1528127269322-539801943592?w=800",
            "https://images.unsplash.com/photo-1559825481-12a05cc00344?w=800",
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
        ],
        "sapa": [
            "https://images.unsplash.com/photo-1597007064818-11d2395dc5df?w=800",
            "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800",
            "https://images.unsplash.com/photo-1528181304800-259b08848526?w=800",
        ],
        "dalat": [
            "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800",
            "https://images.unsplash.com/photo-1597007064818-11d2395dc5df?w=800",
            "https://images.unsplash.com/photo-1528181304800-259b08848526?w=800",
        ],
        "bangkok": [
            "https://images.unsplash.com/photo-1508009603885-50cf7c579dd5?w=800",
            "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
            "https://images.unsplash.com/photo-1528181304800-259b08848526?w=800",
        ],
        "singapore": [
            "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800",
            "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800",
            "https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=800",
        ],
        "bali": [
            "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800",
            "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800",
            "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800",
        ],
        "hanoi": [
            "https://images.unsplash.com/photo-1558862107-d49ef2a04d72?w=800",
            "https://images.unsplash.com/photo-1509030450996-dd1a26d11e53?w=800",
            "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800",
        ],
        "hue": [
            "https://images.unsplash.com/photo-1559727436-3e5d8c9a7c6a?w=800",
            "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800",
            "https://images.unsplash.com/photo-1561626423-a51b45aef0a1?w=800",
        ],
        "condao": [
            "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800",
            "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800",
            "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800",
        ],
        "mientay": [
            "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800",
            "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800",
            "https://images.unsplash.com/photo-1561626423-a51b45aef0a1?w=800",
        ],
        "seoul": [
            "https://images.unsplash.com/photo-1538485399081-7191377e8241?w=800",
            "https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=800",
            "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=800",
        ],
        "tokyo": [
            "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800",
            "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800",
            "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800",
        ],
    }

    def img(key: str) -> str:
        return json.dumps(IMG.get(key, IMG["danang"]))

    # ── TOURS ─────────────────────────────────────────────────────────────────
    print("\n📦 Seeding tours...")
    tours_data = [
        # VIETNAM — NORTH
        {
            "name": "Tour Hà Nội - Hạ Long 2N1Đ",
            "slug": "tour-ha-noi-ha-long-2n1d",
            "description": "Khám phá vịnh Hạ Long — kỳ quan thiên nhiên thế giới với hàng ngàn đảo đá vôi và hang động kỳ bí. Kết hợp tham quan thủ đô Hà Nội nghìn năm văn hiến.",
            "shortDescription": "Tour 2 ngày 1 đêm vịnh Hạ Long",
            "destination": "Hạ Long",
            "region": "NORTH",
            "duration": "2 ngày 1 đêm",
            "price": 2200000,
            "maxParticipants": 35,
            "images": img("halong"),
            "highlights": json.dumps([
                "Du thuyền Hạ Long 4★",
                "Hang Sửng Sốt - động tự nhiên lớn nhất",
                "Đảo Ti Top - tắm biển",
                "Làng chài Vung Viễng",
            ]),
            "includes": json.dumps([
                "Xe limousine đưa đón",
                "Du thuyền 4 sao",
                "Ăn trưa, chiều, sáng",
                "Vé tham quan",
                "HDV tiếng Việt",
            ]),
            "excludes": json.dumps(["Vé máy bay", "Chi phí cá nhân"]),
            "isFeatured": True,
            "category": "cultural",
            "tags": json.dumps(["Hạ Long", "Vịnh", "Du thuyền", "Di sản"]),
            "departureDates": json.dumps([future_date(5), future_date(12), future_date(19), future_date(26)]),
            "rating": 4.9,
            "reviewCount": 204,
        },
        {
            "name": "Tour Sapa 2N1Đ - Trekking Fansipan",
            "slug": "tour-sapa-2n1d-trekking",
            "description": "Hành trình trekking đến Fansipan — nóc nhà Đông Dương (3.143m), khám phá văn hóa dân tộc H'Mông, Dao và cảnh đẹp Tây Bắc hùng vĩ.",
            "shortDescription": "Tour 2 ngày 1 đêm trekking Sapa",
            "destination": "Sapa",
            "region": "NORTH",
            "duration": "2 ngày 1 đêm",
            "price": 2800000,
            "maxParticipants": 15,
            "images": img("sapa"),
            "highlights": json.dumps([
                "Trekking đỉnh Fansipan (cáp treo)",
                "Thăm bản Cát Cát",
                "Thác Silver Waterfall",
                "Đèo Ô Quy Hồ",
            ]),
            "includes": json.dumps(["Xe limousine", "Khách sạn", "Ăn sáng", "Vé cáp treo 2 chiều", "HDV"]),
            "excludes": json.dumps(["Ăn trưa, ăn tối", "Chi phí cá nhân"]),
            "isFeatured": False,
            "category": "adventure",
            "tags": json.dumps(["Sapa", "Fansipan", "Trekking", "Núi", "Tây Bắc"]),
            "departureDates": json.dumps([future_date(7), future_date(14), future_date(21)]),
            "rating": 4.5,
            "reviewCount": 63,
        },
        {
            "name": "Tour Hà Nội City 1N",
            "slug": "tour-ha-noi-city-1n",
            "description": "Khám phá thủ đô Hà Nội nghìn năm văn hiến: Hoàng Thành, Văn Miếu, Hồ Hoàn Kiếm và ẩm thực đường phố nổi tiếng.",
            "shortDescription": "Tour 1 ngày khám phá Hà Nội",
            "destination": "Hà Nội",
            "region": "NORTH",
            "duration": "1 ngày",
            "price": 790000,
            "maxParticipants": 40,
            "images": img("hanoi"),
            "highlights": json.dumps([
                "Hoàng Thành Thăng Long",
                "Văn Miếu - Quốc Tử Giám",
                "Hồ Hoàn Kiếm",
                "Phố cổ 36 phố phường",
            ]),
            "includes": json.dumps(["Xe đưa đón", "Vé tham quan", "HDV tiếng Việt"]),
            "excludes": json.dumps(["Ăn trưa", "Chi phí cá nhân"]),
            "isFeatured": False,
            "category": "cultural",
            "tags": json.dumps(["Hà Nội", "Thủ đô", "Văn hóa", "Di sản"]),
            "departureDates": json.dumps([future_date(3), future_date(10), future_date(17)]),
            "rating": 4.6,
            "reviewCount": 142,
        },
        # VIETNAM — CENTRAL
        {
            "name": "Tour Đà Nẵng - Hội An - Bà Nà 3N2Đ",
            "slug": "tour-da-nang-hoi-an-ba-na-3n2d",
            "description": "Khám phá Đà Nẵng — thành phố đáng sống nhất Việt Nam với các điểm đến hấp dẫn: Bà Nà Hills, phố cổ Hội An, và bãi biển Mỹ Khê.",
            "shortDescription": "Tour trọn gói 3 ngày 2 đêm khám phá Đà Nẵng và Hội An",
            "destination": "Đà Nẵng",
            "region": "CENTRAL",
            "duration": "3 ngày 2 đêm",
            "price": 4500000,
            "discountPrice": 3990000,
            "maxParticipants": 30,
            "images": img("danang"),
            "highlights": json.dumps([
                "Tham quan Bà Nà Hills - Fantasy Park",
                "Check-in Cầu Vàng huyền thoại",
                "Dạo phố cổ Hội An về đêm",
                "Tắm biển Mỹ Khê",
                "Ngắm sông Hàn về đêm",
            ]),
            "includes": json.dumps([
                "Xe máy lạnh đưa đón",
                "Khách sạn 3★",
                "Ăn sáng hàng ngày",
                "Vé tham quan Bà Nà + Hội An",
                "HDV tiếng Việt",
            ]),
            "excludes": json.dumps(["Vé máy bay", "Ăn trưa và ăn tối", "Chi phí cá nhân"]),
            "isFeatured": True,
            "category": "cultural",
            "tags": json.dumps(["Đà Nẵng", "Hội An", "Bà Nà", "Biển"]),
            "departureDates": json.dumps([future_date(5), future_date(12), future_date(19), future_date(26)]),
            "rating": 4.7,
            "reviewCount": 128,
        },
        {
            "name": "Tour Nha Trang 3N2Đ - Biển Xanh Cát Trắng",
            "slug": "tour-nha-trang-3n2d",
            "description": "Khám phá Nha Trang — thiên đường biển với nắng vàng, cát trắng, và những đảo nhỏ xinh đẹp. Kết hợp Vinpearl Land giải trí.",
            "shortDescription": "Tour 3 ngày 2 đêm khám phá Nha Trang",
            "destination": "Nha Trang",
            "region": "CENTRAL",
            "duration": "3 ngày 2 đêm",
            "price": 3800000,
            "discountPrice": 3490000,
            "maxParticipants": 30,
            "images": img("nhatrang"),
            "highlights": json.dumps([
                "Tham quan Vinpearl Land",
                "Tắm biển Hòn Miễu",
                "Nước khoáng Tháp Bà",
                "Chợ đêm Nha Trang",
            ]),
            "includes": json.dumps(["Xe máy lạnh", "Khách sạn 3★", "Ăn sáng", "Vé tham quan"]),
            "excludes": json.dumps(["Vé máy bay", "Ăn trưa, ăn tối"]),
            "isFeatured": True,
            "category": "beach",
            "tags": json.dumps(["Nha Trang", "Biển", "Vinpearl", "Đảo"]),
            "departureDates": json.dumps([future_date(6), future_date(13), future_date(20), future_date(27)]),
            "rating": 4.6,
            "reviewCount": 87,
        },
        {
            "name": "Tour Huế 2N1Đ - Cố Đô Hoàng Cung",
            "slug": "tour-hue-2n1d",
            "description": "Khám phá Huế — cố đô với các di sản thế giới UNESCO, lăng tẩm vua Nguyễn và ẩm thực cung đình đặc sắc.",
            "shortDescription": "Tour 2 ngày 1 đêm Huế",
            "destination": "Huế",
            "region": "CENTRAL",
            "duration": "2 ngày 1 đêm",
            "price": 2100000,
            "discountPrice": 1890000,
            "maxParticipants": 25,
            "images": img("hue"),
            "highlights": json.dumps([
                "Đại Nội Huế",
                "Lăng tẩm Minh Mạng",
                "Chùa Thiên Mụ",
                "Sông Hương",
            ]),
            "includes": json.dumps(["Xe đưa đón", "Khách sạn 3★", "Ăn sáng", "Vé tham quan"]),
            "excludes": json.dumps(["Ăn trưa, ăn tối", "Chi phí cá nhân"]),
            "isFeatured": False,
            "category": "heritage",
            "tags": json.dumps(["Huế", "Cố đô", "Di sản", "Văn hóa", "UNESCO"]),
            "departureDates": json.dumps([future_date(8), future_date(15), future_date(22)]),
            "rating": 4.6,
            "reviewCount": 89,
        },
        {
            "name": "Tour Hội An 1N - Phố Cổ Về Đêm",
            "slug": "tour-hoi-an-1n",
            "description": "Khám phá phố cổ Hội An về đêm với đèn lồng rực rỡ, các ngôi nhà cổ hàng trăm năm và ẩm thực đường phố đặc sắc.",
            "shortDescription": "Tour 1 ngày Hội An",
            "destination": "Hội An",
            "region": "CENTRAL",
            "duration": "1 ngày",
            "price": 890000,
            "discountPrice": 790000,
            "maxParticipants": 40,
            "images": img("hoian"),
            "highlights": json.dumps([
                "Phố cổ Hội An về đêm",
                "Chùa Cầu",
                "Nhà cổ Quảng Đức",
                "Thảm đèn lồng đường phố",
            ]),
            "includes": json.dumps(["Xe đưa đón", "HDV", "Vé tham quan"]),
            "excludes": json.dumps(["Ăn uống", "Chi phí cá nhân"]),
            "isFeatured": False,
            "category": "cultural",
            "tags": json.dumps(["Hội An", "Phố cổ", "Đêm", "Di sản", "UNESCO"]),
            "departureDates": json.dumps([future_date(5), future_date(12), future_date(19)]),
            "rating": 4.5,
            "reviewCount": 156,
        },
        {
            "name": "Tour Đà Lạt 3N2Đ - Thành Phố Ngàn Hoa",
            "slug": "tour-da-lat-3n2d",
            "description": "Khám phá Đà Lạt — thành phố mộng mơ với thung lũng Tình Yêu, hồ Tuyền Lâm và khí hậu mát mẻ quanh năm.",
            "shortDescription": "Tour 3 ngày 2 đêm Đà Lạt",
            "destination": "Đà Lạt",
            "region": "CENTRAL",
            "duration": "3 ngày 2 đêm",
            "price": 3200000,
            "discountPrice": 2890000,
            "maxParticipants": 25,
            "images": img("dalat"),
            "highlights": json.dumps([
                "Thung lũng Tình Yêu",
                "Hồ Tuyền Lâm",
                "Chợ Đà Lạt",
                "Thác Datanla",
            ]),
            "includes": json.dumps(["Xe đưa đón", "Khách sạn 3★", "Ăn sáng", "Vé tham quan"]),
            "excludes": json.dumps(["Ăn trưa, ăn tối", "Chi phí cá nhân"]),
            "isFeatured": True,
            "category": "nature",
            "tags": json.dumps(["Đà Lạt", "Tây Nguyên", "Hoa", "Núi", "Mộng mơ"]),
            "departureDates": json.dumps([future_date(6), future_date(13), future_date(20)]),
            "rating": 4.7,
            "reviewCount": 112,
        },
        # VIETNAM — SOUTH
        {
            "name": "Tour Phú Quốc 4N3Đ - Đảo Ngọc Thiên Đường",
            "slug": "tour-phu-quoc-4n3d",
            "description": "Trải nghiệm thiên đường biển đảo Phú Quốc với những bãi biển đẹp nhất Việt Nam, Vinpearl Safari, Grand World và cáp treo Hòn Thơm.",
            "shortDescription": "Tour 4 ngày 3 đêm khám phá đảo ngọc Phú Quốc",
            "destination": "Phú Quốc",
            "region": "SOUTH",
            "duration": "4 ngày 3 đêm",
            "price": 6500000,
            "discountPrice": 5990000,
            "maxParticipants": 25,
            "images": img("phuquoc"),
            "highlights": json.dumps([
                "Vinpearl Safari - Vườn thú mở đầu tiên",
                "Grand World - Phố đêm mua sắm",
                "Bãi Sao - Bãi biển đẹp nhất đảo",
                "Cáp treo Hòn Thơm",
            ]),
            "includes": json.dumps([
                "Vé máy bay khứ hồi",
                "Khách sạn 4★",
                "Ăn sáng",
                "Di chuyển đảo",
            ]),
            "excludes": json.dumps(["Ăn trưa, ăn tối", "Chi phí giải trí"]),
            "isFeatured": True,
            "category": "beach",
            "tags": json.dumps(["Phú Quốc", "Biển", "Đảo", "Vinpearl", "Safari"]),
            "departureDates": json.dumps([future_date(7), future_date(14), future_date(21)]),
            "rating": 4.8,
            "reviewCount": 95,
        },
        {
            "name": "Tour Côn Đảo 3N2Đ - Thiên Đường Biển Đảo",
            "slug": "tour-con-dao-3n2d",
            "description": "Khám phá Côn Đảo — hòn đảo hoang sơ với bãi biển đẹp tuyệt vời, rừng nguyên sinh và lịch sử đặc biệt.",
            "shortDescription": "Tour 3 ngày 2 đêm Côn Đảo",
            "destination": "Côn Đảo",
            "region": "SOUTH",
            "duration": "3 ngày 2 đêm",
            "price": 7200000,
            "discountPrice": 6500000,
            "maxParticipants": 20,
            "images": img("condao"),
            "highlights": json.dumps([
                "Bãi Đầm - Bãi biển đẹp nhất Côn Đảo",
                "Nghĩa trang Hàng Dương",
                "Hòn Bảy Cạnh",
                "Cáp treo Côn Sơn",
            ]),
            "includes": json.dumps(["Vé máy bay", "Khách sạn 3★", "Ăn sáng", "Di chuyển đảo"]),
            "excludes": json.dumps(["Ăn trưa, ăn tối", "Chi phí cá nhân"]),
            "isFeatured": True,
            "category": "beach",
            "tags": json.dumps(["Côn Đảo", "Biển", "Đảo", "Hoang sơ", "Lịch sử"]),
            "departureDates": json.dumps([future_date(10), future_date(17), future_date(24)]),
            "rating": 4.7,
            "reviewCount": 72,
        },
        {
            "name": "Tour Miền Tây 2N1Đ - Cần Thơ - Chợ Nổi",
            "slug": "tour-mien-tay-2n1d",
            "description": "Trải nghiệm miền Tây sông nước với chợ nổi Cái Răng, vườn cây ăn trái và cuộc sống miệt vườn đặc trưng.",
            "shortDescription": "Tour 2 ngày 1 đêm miền Tây",
            "destination": "Cần Thơ",
            "region": "SOUTH",
            "duration": "2 ngày 1 đêm",
            "price": 1600000,
            "maxParticipants": 30,
            "images": img("mientay"),
            "highlights": json.dumps([
                "Chợ nổi Cái Răng",
                "Vườn trái cây",
                "Nhà cổ Bình Thuỷ",
                "Cầu Cần Thơ",
            ]),
            "includes": json.dumps(["Xe đưa đón", "Khách sạn 3★", "Ăn sáng", "Vé tham quan"]),
            "excludes": json.dumps(["Ăn trưa, ăn tối", "Chi phí cá nhân"]),
            "isFeatured": False,
            "category": "nature",
            "tags": json.dumps(["Cần Thơ", "Miền Tây", "Sông nước", "Chợ nổi"]),
            "departureDates": json.dumps([future_date(9), future_date(16), future_date(23)]),
            "rating": 4.4,
            "reviewCount": 67,
        },
        {
            "name": "Tour Phú Quốc 3N2Đ - Giá Rẻ",
            "slug": "tour-phu-quoc-3n2d",
            "description": "Tour tiết kiệm khám phá Phú Quốc với các điểm đến nổi bật: Bãi Sao, Dinh Cậu, Grand World - phù hợp cho gia đình và nhóm bạn.",
            "shortDescription": "Tour 3 ngày 2 đêm Phú Quốc giá rẻ",
            "destination": "Phú Quốc",
            "region": "SOUTH",
            "duration": "3 ngày 2 đêm",
            "price": 4200000,
            "discountPrice": 3790000,
            "maxParticipants": 30,
            "images": img("phuquoc"),
            "highlights": json.dumps([
                "Grand World Phú Quốc",
                "Dinh Cậu",
                "Bãi Sao",
                "Thị trấn Dương Đông",
            ]),
            "includes": json.dumps(["Xe đưa đón", "Khách sạn 3★", "Ăn sáng"]),
            "excludes": json.dumps(["Vé máy bay", "Ăn trưa, ăn tối", "Chi phí cá nhân"]),
            "isFeatured": False,
            "category": "beach",
            "tags": json.dumps(["Phú Quốc", "Biển", "Tiết kiệm", "Gia đình"]),
            "departureDates": json.dumps([future_date(8), future_date(15), future_date(22)]),
            "rating": 4.3,
            "reviewCount": 45,
        },
        # INTERNATIONAL
        {
            "name": "Tour Bangkok - Pattaya 4N3Đ",
            "slug": "tour-bangkok-pattaya-4n3d",
            "description": "Khám phá xứ Chùa Vàng với Bangkok hoa lệ và Pattaya sôi động, mua sắm, ẩm thực đường phố và đảo Coral.",
            "shortDescription": "Tour 4 ngày 3 đêm khám phá Thái Lan",
            "destination": "Bangkok",
            "region": "INTERNATIONAL",
            "duration": "4 ngày 3 đêm",
            "price": 8900000,
            "discountPrice": 7990000,
            "maxParticipants": 25,
            "images": img("bangkok"),
            "highlights": json.dumps([
                "Cung điện Hoàng gia",
                "Wat Arun - Chùa Thuyền",
                "Walking Street Pattaya",
                "Đảo Coral",
            ]),
            "includes": json.dumps([
                "Vé máy bay khứ hồi",
                "Khách sạn 4★",
                "Ăn sáng",
                "Di chuyển",
                "Visa Thailand",
            ]),
            "excludes": json.dumps(["Ăn trưa, ăn tối", "Bảo hiểm", "Chi phí cá nhân"]),
            "isFeatured": True,
            "category": "cultural",
            "tags": json.dumps(["Bangkok", "Pattaya", "Thái Lan", "Quốc tế", "Đảo"]),
            "departureDates": json.dumps([future_date(14), future_date(21), future_date(28)]),
            "rating": 4.4,
            "reviewCount": 56,
        },
        {
            "name": "Tour Singapore - Malaysia 5N4Đ",
            "slug": "tour-singapore-malaysia-5n4d",
            "description": "Khám phá hai quốc gia Đông Nam Á: Singapore hiện đại và Malaysia đa văn hóa trong 5 ngày 4 đêm đầy ấn tượng.",
            "shortDescription": "Tour 5 ngày 4 đêm Singapore - Malaysia",
            "destination": "Singapore",
            "region": "INTERNATIONAL",
            "duration": "5 ngày 4 đêm",
            "price": 15900000,
            "discountPrice": 14500000,
            "maxParticipants": 20,
            "images": img("singapore"),
            "highlights": json.dumps([
                "Gardens by the Bay Singapore",
                "Marina Bay Sands",
                "Petronas Towers Kuala Lumpur",
                "Genting Highlands",
            ]),
            "includes": json.dumps([
                "Vé máy bay khứ hồi",
                "Khách sạn 4★",
                "Ăn sáng hàng ngày",
                "Di chuyển",
                "Visa",
            ]),
            "excludes": json.dumps(["Ăn trưa, ăn tối", "Bảo hiểm", "Chi phí cá nhân"]),
            "isFeatured": True,
            "category": "cultural",
            "tags": json.dumps(["Singapore", "Malaysia", "Quốc tế", "Đông Nam Á"]),
            "departureDates": json.dumps([future_date(21), future_date(35), future_date(49)]),
            "rating": 4.6,
            "reviewCount": 38,
        },
        {
            "name": "Tour Bali 4N3Đ - Đảo Ngọc Indonesia",
            "slug": "tour-bali-4n3d",
            "description": "Khám phá Bali — hòn đảo thiên đường của Indonesia với đền tháp cổ, bãi biển tuyệt đẹp và văn hóa Hindu đặc sắc.",
            "shortDescription": "Tour 4 ngày 3 đêm Bali Indonesia",
            "destination": "Bali",
            "region": "INTERNATIONAL",
            "duration": "4 ngày 3 đêm",
            "price": 12900000,
            "discountPrice": 11500000,
            "maxParticipants": 20,
            "images": img("bali"),
            "highlights": json.dumps([
                "Tanah Lot Temple",
                "Ubud Monkey Forest",
                "Uluwatu Sunset Temple",
                "Kuta Beach",
            ]),
            "includes": json.dumps([
                "Vé máy bay khứ hồi",
                "Khách sạn 4★",
                "Ăn sáng",
                "Di chuyển",
                "Visa Indonesia",
            ]),
            "excludes": json.dumps(["Ăn trưa, ăn tối", "Bảo hiểm", "Chi phí cá nhân"]),
            "isFeatured": True,
            "category": "beach",
            "tags": json.dumps(["Bali", "Indonesia", "Quốc tế", "Biển", "Hindu"]),
            "departureDates": json.dumps([future_date(18), future_date(32), future_date(46)]),
            "rating": 4.8,
            "reviewCount": 42,
        },
        {
            "name": "Tour Seoul - Hàn Quốc 4N3Đ",
            "slug": "tour-seoul-4n3d",
            "description": "Khám phá Seoul — thủ đô hiện đại của Hàn Quốc với cung điện Changdeokgung, khu phố Bukchon Hanok và ẩm thực K-food.",
            "shortDescription": "Tour 4 ngày 3 đêm Seoul Hàn Quốc",
            "destination": "Seoul",
            "region": "INTERNATIONAL",
            "duration": "4 ngày 3 đêm",
            "price": 18900000,
            "maxParticipants": 20,
            "images": img("seoul"),
            "highlights": json.dumps([
                "Cung điện Changdeokgung",
                "Bukchon Hanok Village",
                "Myeongdong Shopping",
                "N Seoul Tower",
            ]),
            "includes": json.dumps([
                "Vé máy bay khứ hồi",
                "Khách sạn 4★",
                "Ăn sáng",
                "Di chuyển",
                "Visa Korea",
            ]),
            "excludes": json.dumps(["Ăn trưa, ăn tối", "Bảo hiểm", "Chi phí cá nhân"]),
            "isFeatured": True,
            "category": "cultural",
            "tags": json.dumps(["Seoul", "Hàn Quốc", "K-food", "Quốc tế", "Cung điện"]),
            "departureDates": json.dumps([future_date(25), future_date(40), future_date(55)]),
            "rating": 4.7,
            "reviewCount": 34,
        },
        {
            "name": "Tour Tokyo - Nhật Bản 5N4Đ",
            "slug": "tour-tokyo-5n4d",
            "description": "Trải nghiệm Nhật Bản hiện đại kết hợp cổ điển: Tokyo sôi động, núi Phú Sĩ hùng vĩ và ẩm thực Nhật đẳng cấp.",
            "shortDescription": "Tour 5 ngày 4 đêm Tokyo Nhật Bản",
            "destination": "Tokyo",
            "region": "INTERNATIONAL",
            "duration": "5 ngày 4 đêm",
            "price": 35000000,
            "maxParticipants": 15,
            "images": img("tokyo"),
            "highlights": json.dumps([
                "Núi Phú Sĩ (chụp ảnh)",
                "Shibuya Crossing Tokyo",
                "Asakusa Temple",
                "Akihabara Electronics",
            ]),
            "includes": json.dumps([
                "Vé máy bay khứ hồi",
                "Khách sạn 4★",
                "Ăn sáng",
                "Di chuyển bullet train",
                "Visa Japan",
            ]),
            "excludes": json.dumps(["Ăn trưa, ăn tối", "Bảo hiểm", "Chi phí cá nhân"]),
            "isFeatured": False,
            "category": "cultural",
            "tags": json.dumps(["Tokyo", "Nhật Bản", "Phú Sĩ", "Quốc tế", "ẩm thực"]),
            "departureDates": json.dumps([future_date(30), future_date(45), future_date(60)]),
            "rating": 4.9,
            "reviewCount": 21,
        },
    ]

    created_tours = []
    for tour_data in tours_data:
        t = await upsert_tour(db, **tour_data)
        created_tours.append(t)

    print(f"   Total tours: {len(created_tours)}")

    # ── BOOKINGS ─────────────────────────────────────────────────────────────────
    print("\n📦 Seeding bookings...")
    status_opts = ["PENDING", "CONFIRMED", "CONFIRMED", "CONFIRMED", "COMPLETED", "CANCELLED"]
    payment_opts = [
        ("UNPAID", None),
        ("PAID", "stripe"),
        ("PAID", "vnpay"),
        ("PAID", "bank_transfer"),
        ("REFUNDED", "vnpay"),
    ]

    booking_counter = 1
    for i, user in enumerate(created_users[1:]):  # skip admin
        num_bookings = random.randint(1, 3)
        for j in range(num_bookings):
            tour = random.choice(created_tours)
            num_adults = random.randint(1, 3)
            num_children = random.randint(0, 2)
            status = random.choice(status_opts)
            payment = random.choice(payment_opts)

            price_per_adult = float(tour.discountPrice or tour.price) if tour.discountPrice or tour.price else 4500000
            price_per_child = price_per_adult * 0.5
            total_price = price_per_adult * num_adults + price_per_child * num_children

            booking_code = f"TGPT-{datetime.now().year}-{booking_counter:04d}"
            booking_counter += 1

            await upsert_booking(
                db,
                booking_code,
                userId=user.id,
                tourId=tour.id,
                status=status,
                numAdults=num_adults,
                numChildren=num_children,
                totalPrice=total_price,
                contactName=user.fullName,
                contactEmail=user.email,
                contactPhone=user.phone or "0900000000",
                departureDate=(
                    datetime.strptime(random.choice(
                        tour.departureDates
                        if isinstance(tour.departureDates, list)
                        else json.loads(tour.departureDates)
                    ), "%Y-%m-%d")
                    if tour.departureDates
                    else None
                ),
                paymentStatus=payment[0],
                paymentMethod=payment[1] if payment[0] == "PAID" else None,
                paymentDate=datetime.now() if payment[0] == "PAID" else None,
                specialRequests=random.choice([
                    "Cần ghế ngồi gần cửa sổ",
                    "Ăn chay",
                    "Cần xe lăn",
                    None,
                    None,
                ]),
            )

    # ── REVIEWS ─────────────────────────────────────────────────────────────────
    print("\n📦 Seeding reviews...")
    # Only confirmed/completed bookings can have reviews
    confirmed_bookings = await db.booking.find_many(
        where={"status": {"in": ["CONFIRMED", "COMPLETED"]}}
    )
    comments_pool = [
        "Tour tuyệt vời! Hướng dẫn viên rất nhiệt tình, ăn uống ngon, khách sạn sạch sẽ.",
        "Rất hài lòng! Lịch trình hợp lý, đúng như mô tả. Sẽ quay lại!",
        "Điểm đến đẹp không tưởng. Đặc biệt cảm ơn HDV đã chia sẻ nhiều kinh nghiệm du lịch.",
        "Tour chất lượng tốt so với giá. Xe máy lạnh, khách sạn tiện nghi.",
        "Trải nghiệm tuyệt vời cho gia đình. Trẻ em rất thích. Khuyến khích mọi người đi!",
        "Ăn uống đa dạng, khách sạn view đẹp. HDV am hiểu lịch sử và văn hóa địa phương.",
        "Đáng đồng tiền! Có điều thời gian hơi gấp ở một số điểm tham quan.",
        "Cảm ơn TravelGPT đã tổ chức tour tốt. Sẽ giới thiệu bạn bè.",
        "Tôi đi cùng bố mẹ già, mọi người đều hài lòng. Tour rất phù hợp gia đình.",
        "Check-in đúng giờ, xe sạch, HDV vui vẻ. Một chuyến đi đáng nhớ!",
    ]

    for booking in confirmed_bookings[:30]:  # Max 30 reviews
        user = next((u for u in created_users if u.id == booking.userId), None)
        if not user or not booking.tourId:
            continue
        existing = await db.review.find_first(
            where={"userId": user.id, "tourId": booking.tourId}
        )
        if existing:
            continue
        rating = random.choice([4, 4, 4, 5, 5, 5, 5, 5])
        comment = random.choice(comments_pool)
        await db.review.create(data={
            "userId": user.id,
            "tourId": booking.tourId,
            "bookingId": booking.id,
            "rating": rating,
            "comment": comment,
            "isVerified": True,
        })
        # Update tour review stats
        await db.tour.update(
            where={"id": booking.tourId},
            data={
                "rating": round(random.uniform(4.3, 4.9), 1),
                "reviewCount": {"increment": 1},
            },
        )
    print("  + Reviews seeded")

    # ── VERIFY ──────────────────────────────────────────────────────────────────
    user_count = await db.user.count()
    tour_count = await db.tour.count()
    booking_count = await db.booking.count()
    review_count = await db.review.count()

    print(f"""
╔═══════════════════════════════════════════╗
║   ✅ Seed completed successfully!           ║
╠═══════════════════════════════════════════╣
║   👥 Users:     {user_count:<6}                      ║
║   🏖️  Tours:     {tour_count:<6}                      ║
║   📋 Bookings: {booking_count:<6}                      ║
║   ⭐ Reviews:   {review_count:<6}                      ║
╠═══════════════════════════════════════════╣
║   🔐 Credentials:                        ║
║     Admin: admin@travelgpt.vn / admin123  ║
║     User:  user@test.com / user123        ║
║     Demo:  tram.nguyen@email.com / user123 ║
╚═══════════════════════════════════════════╝
""")
    await db.disconnect()


if __name__ == "__main__":
    asyncio.run(main())
