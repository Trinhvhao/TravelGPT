"""
Seed script - TravelGPT Database
Run: python prisma/seed.py
"""
import asyncio
import json
import bcrypt
from prisma import Prisma


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


async def upsert_user(db: Prisma, email: str, **data) -> None:
    existing = await db.user.find_unique(where={"email": email})
    if existing:
        await db.user.update(where={"email": email}, data=data)
        print(f"Updated user: {email}")
    else:
        await db.user.create(data={"email": email, **data})
        print(f"Created user: {email}")


async def upsert_tour(db: Prisma, slug: str, **data) -> None:
    departure_dates = data.pop("departureDates", [])
    existing = await db.tour.find_unique(where={"slug": slug})
    if existing:
        await db.tour.update(where={"slug": slug}, data={**data, "departureDates": departure_dates})
        print(f"Updated tour: {slug}")
    else:
        await db.tour.create(data={**data, "slug": slug, "departureDates": departure_dates})
        print(f"Created tour: {slug}")


async def main():
    db = Prisma()
    await db.connect()
    print("Connected to database ✓")

    # ── Users ──────────────────────────────────────────────────────────────────
    await upsert_user(
        db,
        "admin@travelgpt.vn",
        passwordHash=hash_password("admin123"),
        fullName="Admin TravelGPT",
        phone="0901234567",
        role="ADMIN",
    )
    user = await db.user.find_unique(where={"email": "admin@travelgpt.vn"})

    await upsert_user(
        db,
        "user@test.com",
        passwordHash=hash_password("user123"),
        fullName="Nguyễn Văn Test",
        phone="0909876543",
        role="USER",
    )

    # ── Tours ───────────────────────────────────────────────────────────────────
    # Vietnam Destination Images (Unsplash)
    VIETNAM_IMAGES = {
        "da_nang": [
            "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800",
            "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800",
            "https://images.unsplash.com/photo-1561626423-a51b45aef0a1?w=800",
            "https://images.unsplash.com/photo-1580618864180-f6d7d39b4eb8?w=800",
        ],
        "hoi_an": [
            "https://images.unsplash.com/photo-1557794008-66bf5d6f6e97?w=800",
            "https://images.unsplash.com/photo-1518544866330-95a2bfa6bb26?w=800",
            "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800",
        ],
        "phu_quoc": [
            "https://live.staticflickr.com/65535/50344280868_33c48724e3.jpg",
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
            "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800",
            "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=800",
        ],
        "nha_trang": [
            "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800",
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
            "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800",
            "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=800",
        ],
        "ha_long": [
            "https://images.unsplash.com/photo-1528127269322-539801943592?w=800",
            "https://images.unsplash.com/photo-1559825481-12a05cc00344?w=800",
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
        ],
        "sapa": [
            "https://images.unsplash.com/photo-1597007064818-11d2395dc5df?w=800",
            "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800",
            "https://images.unsplash.com/photo-1528181304800-259b08848526?w=800",
        ],
        "bangkok": [
            "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800",
            "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
            "https://images.unsplash.com/photo-1528181304800-259b08848526?w=800",
        ],
        "con_dao": [
            "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800",
            "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800",
            "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800",
        ],
        "phan_thiet": [
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
            "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800",
            "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800",
        ],
        "hue": [
            "https://images.unsplash.com/photo-1559727436-3e5d8c9a7c6a?w=800",
            "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800",
            "https://images.unsplash.com/photo-1561626423-a51b45aef0a1?w=800",
        ],
        "mien_tay": [
            "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800",
            "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800",
            "https://images.unsplash.com/photo-1561626423-a51b45aef0a1?w=800",
        ],
    }

    tours = [
        {
            "name": "Tour Đà Nẵng - Hội An - Bà Nà 3N2Đ",
            "slug": "tour-da-nang-hoi-an-ba-na-3n2d",
            "description": "Khám phá Đà Nẵng - thành phố đáng sống nhất Việt Nam với các điểm đến hấp dẫn: Bà Nà Hills, phố cổ Hội An, và bãi biển Mỹ Khê.",
            "shortDescription": "Tour trọn gói 3 ngày 2 đêm khám phá Đà Nẵng và Hội An",
            "destination": "Đà Nẵng",
            "region": "CENTRAL",
            "duration": "3 ngày 2 đêm",
            "price": 4500000,
            "discountPrice": 3990000,
            "maxParticipants": 30,
            "images": json.dumps(VIETNAM_IMAGES["da_nang"]),
            "highlights": json.dumps([
                "Tham quan Bà Nà Hills - Fantasy Park",
                "Check-in Cầu Vàng huyền thoại",
                "Dạo phố cổ Hội An về đêm",
                "Tắm biển Mỹ Khê",
                "Ngắm sông Hàn về đêm",
            ]),
            "includes": json.dumps([
                "Xe máy lạnh đưa đón",
                "Khách sạn 3 sao",
                "Ăn sáng hàng ngày",
                "Vé tham quan các điểm đến",
                "Hướng dẫn viên tiếng Việt",
            ]),
            "excludes": json.dumps([
                "Vé máy bay",
                "Ăn trưa và ăn tối",
                "Chi phí cá nhân",
                "Bảo hiểm du lịch",
            ]),
            "isFeatured": True,
            "category": "cultural",
            "tags": json.dumps(["Đà Nẵng", "Hội An", "Bà Nà", "Biển"]),
            "departureDates": json.dumps(["2026-05-20", "2026-05-25", "2026-06-01", "2026-06-05"]),
            "rating": 4.7,
            "reviewCount": 128,
        },
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
            "images": json.dumps(VIETNAM_IMAGES["phu_quoc"]),
            "highlights": json.dumps([
                "Vinpearl Safari - Vườn thú mở đầu tiên",
                "Grand World - Phố đêm mua sắm",
                "Bãi Sao - Bãi biển đẹp nhất đảo",
                "Cáp treo Hòn Thơm",
            ]),
            "includes": json.dumps([
                "Vé máy bay khứ hồi",
                "Khách sạn 4 sao",
                "Ăn sáng",
                "Di chuyển đảo",
            ]),
            "excludes": json.dumps(["Ăn trưa, ăn tối", "Chi phí giải trí"]),
            "isFeatured": True,
            "category": "beach",
            "tags": json.dumps(["Phú Quốc", "Biển", "Đảo", "Vinpearl"]),
            "departureDates": json.dumps(["2026-05-22", "2026-05-29", "2026-06-03", "2026-06-10"]),
            "rating": 4.8,
            "reviewCount": 95,
        },
        {
            "name": "Tour Sapa 2N1Đ - Trekking Fansipan",
            "slug": "tour-sapa-2n1d-trekking",
            "description": "Hành trình trekking đến Fansipan - nóc nhà Đông Dương, khám phá văn hóa dân tộc H'Mông, Dao và cảnh đẹp Tây Bắc.",
            "shortDescription": "Tour 2 ngày 1 đêm trekking Sapa",
            "destination": "Sapa",
            "region": "NORTH",
            "duration": "2 ngày 1 đêm",
            "price": 2800000,
            "maxParticipants": 15,
            "images": json.dumps(VIETNAM_IMAGES["sapa"]),
            "highlights": json.dumps([
                "Trekking đỉnh Fansipan",
                "Thăm bản Cát Cát",
                "Thác Silver Waterfall",
                "Đèo Ô Quy Hồ",
            ]),
            "includes": json.dumps(["Xe limousine", "Khách sạn", "Ăn sáng", "Vé cáp treo"]),
            "excludes": json.dumps(["Ăn trưa, ăn tối", "Chi phí cá nhân"]),
            "isFeatured": False,
            "category": "adventure",
            "tags": json.dumps(["Sapa", "Fansipan", "Trekking", "Núi"]),
            "departureDates": json.dumps(["2026-05-24", "2026-06-07", "2026-06-14"]),
            "rating": 4.5,
            "reviewCount": 63,
        },
        {
            "name": "Tour Nha Trang 3N2Đ - Biển Xanh Cát Trắng",
            "slug": "tour-nha-trang-3n2d",
            "description": "Khám phá Nha Trang - thiên đường biển với nắng vàng, cát trắng, và những đảo nhỏ xinh đẹp.",
            "shortDescription": "Tour 3 ngày 2 đêm khám phá Nha Trang",
            "destination": "Nha Trang",
            "region": "CENTRAL",
            "duration": "3 ngày 2 đêm",
            "price": 3800000,
            "discountPrice": 3490000,
            "maxParticipants": 30,
            "images": json.dumps(VIETNAM_IMAGES["nha_trang"]),
            "highlights": json.dumps([
                "Tham quan Vinpearl Land",
                "Tắm biển Hòn Miễu",
                "Nước khoáng Tháp Bà",
                "Chợ đêm Nha Trang",
            ]),
            "includes": json.dumps(["Xe máy lạnh", "Khách sạn 3 sao", "Ăn sáng", "Vé tham quan"]),
            "excludes": json.dumps(["Vé máy bay", "Ăn trưa, ăn tối"]),
            "isFeatured": True,
            "category": "beach",
            "tags": json.dumps(["Nha Trang", "Biển", "Vinpearl", "Đảo"]),
            "departureDates": json.dumps(["2026-05-21", "2026-05-28", "2026-06-04", "2026-06-11"]),
            "rating": 4.6,
            "reviewCount": 87,
        },
        {
            "name": "Tour Hà Nội - Hạ Long 2N1Đ",
            "slug": "tour-ha-noi-ha-long-2n1d",
            "description": "Khám phá vịnh Hạ Long - kỳ quan thiên nhiên thế giới với hàng ngàn đảo đá và hang động kỳ bí.",
            "shortDescription": "Tour 2 ngày 1 đêm vịnh Hạ Long",
            "destination": "Hạ Long",
            "region": "NORTH",
            "duration": "2 ngày 1 đêm",
            "price": 2200000,
            "maxParticipants": 35,
            "images": json.dumps(VIETNAM_IMAGES["ha_long"]),
            "highlights": json.dumps([
                "Du thuyền Hạ Long",
                "Hang Sửng Sốt",
                "Đảo Ti Top",
                "Làng chài Vung Viễng",
            ]),
            "includes": json.dumps([
                "Xe đưa đón",
                "Du thuyền 4 sao",
                "Ăn trưa, chiều, sáng",
                "Vé tham quan",
            ]),
            "excludes": json.dumps(["Vé máy bay", "Chi phí cá nhân"]),
            "isFeatured": False,
            "category": "cultural",
            "tags": json.dumps(["Hạ Long", "Vịnh", "Du thuyền", "Di sản"]),
            "departureDates": json.dumps(["2026-05-23", "2026-05-30", "2026-06-06", "2026-06-13"]),
            "rating": 4.9,
            "reviewCount": 204,
        },
        {
            "name": "Tour Bangkok - Pattaya 4N3Đ",
            "slug": "tour-bangkok-pattaya-4n3d",
            "description": "Khám phá xứ Chùa Vàng với Bangkok hoa lệ và Pattaya sôi động, mua sắm, ẩm thực đường phố.",
            "shortDescription": "Tour 4 ngày 3 đêm khám phá Thái Lan",
            "destination": "Bangkok",
            "region": "INTERNATIONAL",
            "duration": "4 ngày 3 đêm",
            "price": 8900000,
            "discountPrice": 7990000,
            "maxParticipants": 25,
            "images": json.dumps(VIETNAM_IMAGES["bangkok"]),
            "highlights": json.dumps([
                "Cung điện Hoàng gia",
                "Wat Arun - Chùa Thuyền",
                "Walking Street Pattaya",
                "Đảo Coral",
            ]),
            "includes": json.dumps([
                "Vé máy bay",
                "Khách sạn 4 sao",
                "Ăn sáng",
                "Di chuyển",
                "Visa Thailand",
            ]),
            "excludes": json.dumps(["Ăn trưa, ăn tối", "Bảo hiểm", "Chi phí cá nhân"]),
            "isFeatured": True,
            "category": "cultural",
            "tags": json.dumps(["Bangkok", "Pattaya", "Thái Lan", "Quốc tế"]),
            "departureDates": json.dumps(["2026-06-02", "2026-06-09", "2026-06-16"]),
            "rating": 4.4,
            "reviewCount": 56,
        },
        {
            "name": "Tour Côn Đảo 3N2Đ - Thiên Đường Biển Đảo",
            "slug": "tour-con-dao-3n2d",
            "description": "Khám phá Côn Đảo - hòn đảo hoang sơ với bãi biển đẹp tuyệt vời, rừng nguyên sinh và lịch sử đặc biệt.",
            "shortDescription": "Tour 3 ngày 2 đêm Côn Đảo",
            "destination": "Côn Đảo",
            "region": "SOUTH",
            "duration": "3 ngày 2 đêm",
            "price": 7200000,
            "discountPrice": 6500000,
            "maxParticipants": 20,
            "images": json.dumps(VIETNAM_IMAGES["con_dao"]),
            "highlights": json.dumps([
                "Bãi Đầm - Bãi biển đẹp nhất Côn Đảo",
                "Nghĩa trang Hàng Dương",
                "Hòn Bảy Cạnh",
                "Cáp treo Côn Sơn",
            ]),
            "includes": json.dumps([
                "Vé máy bay",
                "Khách sạn 3 sao",
                "Ăn sáng",
                "Di chuyển đảo",
            ]),
            "excludes": json.dumps(["Ăn trưa, ăn tối", "Chi phí cá nhân"]),
            "isFeatured": True,
            "category": "beach",
            "tags": json.dumps(["Côn Đảo", "Biển", "Đảo", "Hoang sơ"]),
            "departureDates": json.dumps(["2026-05-25", "2026-06-01", "2026-06-08"]),
            "rating": 4.7,
            "reviewCount": 72,
        },
        {
            "name": "Tour Phan Thiết 2N1Đ - Mũi Né",
            "slug": "tour-phan-thiet-mui-ne-2n1d",
            "description": "Trải nghiệm Phan Thiết với đồi cát Mũi Né, những bãi biển yên bình và ẩm thực biển đặc sắc.",
            "shortDescription": "Tour 2 ngày 1 đêm Phan Thiết",
            "destination": "Phan Thiết",
            "region": "CENTRAL",
            "duration": "2 ngày 1 đêm",
            "price": 1800000,
            "discountPrice": 1590000,
            "maxParticipants": 30,
            "images": json.dumps(VIETNAM_IMAGES["phan_thiet"]),
            "highlights": json.dumps([
                "Đồi cát Mũi Né",
                "Bãi biển Mũi Né",
                "Làng chài Mũi Né",
                "Tháp Poshanu",
            ]),
            "includes": json.dumps([
                "Xe đưa đón",
                "Khách sạn 3 sao",
                "Ăn sáng",
            ]),
            "excludes": json.dumps(["Ăn trưa, ăn tối", "Chi phí cá nhân"]),
            "isFeatured": False,
            "category": "beach",
            "tags": json.dumps(["Phan Thiết", "Mũi Né", "Biển", "Cát"]),
            "departureDates": json.dumps(["2026-05-26", "2026-06-02", "2026-06-09"]),
            "rating": 4.3,
            "reviewCount": 45,
        },
        {
            "name": "Tour Huế 2N1Đ - Cố Đô Hoàng Cung",
            "slug": "tour-hue-2n1d",
            "description": "Khám phá Huế - cố đô với các di sản thế giới UNESCO, lăng tẩm vua Nguyễn và ẩm thực cung đình.",
            "shortDescription": "Tour 2 ngày 1 đêm Huế",
            "destination": "Huế",
            "region": "CENTRAL",
            "duration": "2 ngày 1 đêm",
            "price": 2100000,
            "discountPrice": 1890000,
            "maxParticipants": 25,
            "images": json.dumps(VIETNAM_IMAGES["hue"]),
            "highlights": json.dumps([
                "Đại Nội Huế",
                "Lăng tẩm Minh Mạng",
                "Chùa Thiên Mụ",
                "Sông Hương",
            ]),
            "includes": json.dumps([
                "Xe đưa đón",
                "Khách sạn 3 sao",
                "Ăn sáng",
                "Vé tham quan",
            ]),
            "excludes": json.dumps(["Ăn trưa, ăn tối", "Chi phí cá nhân"]),
            "isFeatured": False,
            "category": "heritage",
            "tags": json.dumps(["Huế", "Cố đô", "Di sản", "Văn hóa"]),
            "departureDates": json.dumps(["2026-05-27", "2026-06-03", "2026-06-10"]),
            "rating": 4.6,
            "reviewCount": 89,
        },
        {
            "name": "Tour Miền Tây 2N1Đ - Cần Thơ - Chợ Nổi",
            "slug": "tour-mien-tay-2n1d",
            "description": "Trải nghiệm miền Tây sông nước với chợ nổi Cái Răng, vườn cây ăn trái và cuộc sống miệt vườn.",
            "shortDescription": "Tour 2 ngày 1 đêm miền Tây",
            "destination": "Cần Thơ",
            "region": "SOUTH",
            "duration": "2 ngày 1 đêm",
            "price": 1600000,
            "maxParticipants": 30,
            "images": json.dumps(VIETNAM_IMAGES["mien_tay"]),
            "highlights": json.dumps([
                "Chợ nổi Cái Răng",
                "Vườn trái cây",
                "Nhà cổ Bình Thuỷ",
                "Cầu Cần Thơ",
            ]),
            "includes": json.dumps([
                "Xe đưa đón",
                "Khách sạn 3 sao",
                "Ăn sáng",
                "Vé tham quan",
            ]),
            "excludes": json.dumps(["Ăn trưa, ăn tối", "Chi phí cá nhân"]),
            "isFeatured": False,
            "category": "nature",
            "tags": json.dumps(["Cần Thơ", "Miền Tây", "Sông nước", "Chợ nổi"]),
            "departureDates": json.dumps(["2026-05-28", "2026-06-04", "2026-06-11"]),
            "rating": 4.4,
            "reviewCount": 67,
        },
        {
            "name": "Tour Hội An 1N - Phố Cổ Về Đêm",
            "slug": "tour-hoi-an-1n",
            "description": "Khám phá phố cổ Hội An về đêm với đèn lồng rực rỡ, các ngôi nhà cổ và ẩm thực đường phố đặc sắc.",
            "shortDescription": "Tour 1 ngày Hội An",
            "destination": "Hội An",
            "region": "CENTRAL",
            "duration": "1 ngày",
            "price": 890000,
            "discountPrice": 790000,
            "maxParticipants": 40,
            "images": json.dumps(VIETNAM_IMAGES["hoi_an"]),
            "highlights": json.dumps([
                "Phố cổ Hội An về đêm",
                "Chùa Cầu",
                "Nhà cổ Quảng Đức",
                "Thảm đèn lồng",
            ]),
            "includes": json.dumps([
                "Xe đưa đón",
                "Hướng dẫn viên",
                "Vé tham quan",
            ]),
            "excludes": json.dumps(["Ăn uống", "Chi phí cá nhân"]),
            "isFeatured": False,
            "category": "cultural",
            "tags": json.dumps(["Hội An", "Phố cổ", "Đêm", "Di sản"]),
            "departureDates": json.dumps(["2026-05-20", "2026-05-25", "2026-06-01"]),
            "rating": 4.5,
            "reviewCount": 156,
        },
        {
            "name": "Tour Đà Lạt 3N2Đ - Thành Phố Ngàn Hoa",
            "slug": "tour-da-lat-3n2d",
            "description": "Khám phá Đà Lạt - thành phố mộng mơ với thung lũng Tình Yêu, hồ Tuyền Lâm và khí hậu mát mẻ quanh năm.",
            "shortDescription": "Tour 3 ngày 2 đêm Đà Lạt",
            "destination": "Đà Lạt",
            "region": "CENTRAL",
            "duration": "3 ngày 2 đêm",
            "price": 3200000,
            "discountPrice": 2890000,
            "maxParticipants": 25,
            "images": json.dumps([
                "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800",
                "https://images.unsplash.com/photo-1597007064818-11d2395dc5df?w=800",
                "https://images.unsplash.com/photo-1528181304800-259b08848526?w=800",
            ]),
            "highlights": json.dumps([
                "Thung lũng Tình Yêu",
                "Hồ Tuyền Lâm",
                "Chợ Đà Lạt",
                "Thác Datanla",
            ]),
            "includes": json.dumps([
                "Xe đưa đón",
                "Khách sạn 3 sao",
                "Ăn sáng",
                "Vé tham quan",
            ]),
            "excludes": json.dumps(["Ăn trưa, ăn tối", "Chi phí cá nhân"]),
            "isFeatured": True,
            "category": "nature",
            "tags": json.dumps(["Đà Lạt", "Tây Nguyên", "Hoa", "Núi"]),
            "departureDates": json.dumps(["2026-05-21", "2026-05-28", "2026-06-04"]),
            "rating": 4.7,
            "reviewCount": 112,
        },
        {
            "name": "Tour Vũng Tàu 1N - Biển Gần Sài Gòn",
            "slug": "tour-vung-tau-1n",
            "description": "Cuối tuần ra biển Vũng Tàu với bãi Sau, tượng Chúa Kitô và ẩm thực hải sản tươi ngon.",
            "shortDescription": "Tour 1 ngày Vũng Tàu",
            "destination": "Vũng Tàu",
            "region": "SOUTH",
            "duration": "1 ngày",
            "price": 650000,
            "maxParticipants": 45,
            "images": json.dumps([
                "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
                "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800",
                "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800",
            ]),
            "highlights": json.dumps([
                "Bãi Sau",
                "Tượng Chúa Kitô",
                "Mũi Nghinh Phong",
                "Hải sản tươi sống",
            ]),
            "includes": json.dumps([
                "Xe đưa đón",
                "Hướng dẫn viên",
            ]),
            "excludes": json.dumps(["Ăn uống", "Chi phí cá nhân"]),
            "isFeatured": False,
            "category": "beach",
            "tags": json.dumps(["Vũng Tàu", "Biển", "Gần Sài Gòn"]),
            "departureDates": json.dumps(["2026-05-25", "2026-06-01", "2026-06-08"]),
            "rating": 4.2,
            "reviewCount": 234,
        },
    ]

    for tour_data in tours:
        await upsert_tour(db, **tour_data)

    # ── Sample Booking ───────────────────────────────────────────────────────────
    danang_tour = await db.tour.find_unique(
        where={"slug": "tour-da-nang-hoi-an-ba-na-3n2d"}
    )
    test_user = await db.user.find_unique(where={"email": "user@test.com"})

    if danang_tour and test_user:
        existing_booking = await db.booking.find_unique(
            where={"bookingCode": "TGPT-2026-001"}
        )
        if existing_booking:
            print(f"Booking {existing_booking.bookingCode} already exists")
        else:
            booking = await db.booking.create(
                data={
                    "bookingCode": "TGPT-2026-001",
                    "userId": test_user.id,
                    "tourId": danang_tour.id,
                    "status": "CONFIRMED",
                    "numAdults": 2,
                    "numChildren": 1,
                    "totalPrice": 7990000,
                    "contactName": test_user.fullName,
                    "contactEmail": test_user.email,
                    "contactPhone": test_user.phone or "0909876543",
                    "paymentStatus": "PAID",
                    "paymentMethod": "vnpay",
                    "specialRequests": "Cần ghế ngồi gần cửa sổ",
                }
            )
            print(f"Created booking: {booking.bookingCode}")

    # ── Sample Reviews ───────────────────────────────────────────────────────────
    if danang_tour and test_user:
        reviews = [
            {
                "rating": 5,
                "comment": "Tour tuyệt vời! Bà Nà Hills đẹp không tưởng, đặc biệt là Cầu Vàng. Hướng dẫn viên nhiệt tình.",
                "isVerified": True,
            },
            {
                "rating": 4,
                "comment": "Hội An về đêm rất thơ mộng. Ăn uống ngon và rẻ. Khách sạn sạch sẽ.",
                "isVerified": True,
            },
        ]
        for rev in reviews:
            r = await db.review.create(
                data={
                    **rev,
                    "userId": test_user.id,
                    "tourId": danang_tour.id,
                }
            )
            print(f"Created review: {r.rating}★")

    # ── Verify ─────────────────────────────────────────────────────────────────
    user_count = await db.user.count()
    tour_count = await db.tour.count()
    booking_count = await db.booking.count()
    review_count = await db.review.count()
    print(
        f"\n✅ Seed completed!\n"
        f"   Users:    {user_count}\n"
        f"   Tours:    {tour_count}\n"
        f"   Bookings: {booking_count}\n"
        f"   Reviews:  {review_count}\n"
        f"\n   Admin:    admin@travelgpt.vn / admin123\n"
        f"   User:     user@test.com / user123"
    )

    await db.disconnect()


if __name__ == "__main__":
    asyncio.run(main())
