"""
Migration script: Import knowledge from code to database
Run: python migrate_knowledge_to_db.py
"""
import asyncio
import sys
import os
import json

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def to_json(data):
    """Convert to JSON string for Prisma"""
    return json.dumps(data)


async def migrate_knowledge():
    """Migrate static knowledge base to database"""
    from app.core.prisma import db, connect_db, disconnect_db
    from app.services.knowledge_service import KnowledgeService
    
    print("🔄 Connecting to database...")
    await connect_db()
    
    service = KnowledgeService(db)
    
    # ============================================
    # MIGRATE DESTINATIONS (without JSON fields first)
    # ============================================
    print("\n📍 Migrating destinations...")
    
    destinations_data = [
        {
            "name": "Đà Nẵng",
            "slug": "da-nang",
            "region": "Miền Trung",
            "description": "Thành phố biển xinh đẹp, được mệnh danh là thành phố đáng sống nhất Việt Nam",
            "bestTime": "Tháng 2-4 (Tết âm lịch - Lễ hội Pháo hoa)",
            "highlights": ["Bà Nà Hills", "Cầu Vàng", "Mỹ Khê Beach", "Ngũ Hành Sơn", "Sông Hàn"],
            "priceRange": "2-5 triệu VND",
        },
        {
            "name": "Hội An",
            "slug": "hoi-an",
            "region": "Miền Trung",
            "description": "Phố cổ UNESCO với kiến trúc độc đáo, ẩm thực phong phú",
            "bestTime": "Tháng 2-4 (thời tiết mát mẻ)",
            "highlights": ["Phố cổ Hội An", "Cù Lao Chàm", "Hội quán Phúc Kiến", "Chùa Cầu", "Làng rau Trà Quế"],
            "priceRange": "1.5-3 triệu VND",
        },
        {
            "name": "Sapa",
            "slug": "sapa",
            "region": "Miền Bắc",
            "description": "Vùng đất của núi non hùng vĩ, ruộng bậc thang, văn hóa dân tộc đặc sắc",
            "bestTime": "Tháng 9-11 (mùa lúa chín vàng), Tháng 12-2 (tuyết rơi)",
            "highlights": ["Đỉnh Fansipan", "Bản Cát Cát", "Thung lũng Mường Hoa", "Núi Hàm Rồng", "Bản Tả Phìn"],
            "priceRange": "4-7 triệu VND",
        },
        {
            "name": "Hạ Long",
            "slug": "ha-long",
            "region": "Miền Bắc",
            "description": "Vịnh biển đẹp nhất thế giới với hàng nghìn đảo đá vôi",
            "bestTime": "Tháng 4-6 (mùa hè, nắng đẹp)",
            "highlights": ["Vịnh Hạ Long", "Hang Sửng Sốt", "Đảo Titop", "Làng chài Vông Viêng", "Hang Luồn"],
            "priceRange": "3-5 triệu VND",
        },
        {
            "name": "Phú Quốc",
            "slug": "phu-quoc",
            "region": "Miền Nam",
            "description": "Đảo ngọc với bãi biển đẹp, resort sang trọng, thuộc top đảo đẹp nhất thế giới",
            "bestTime": "Tháng 11-3 (mùa khô, nắng đẹp)",
            "highlights": ["Vinpearl Safari", "Grand World", "Bãi Sao", "Hòn Thơm", "Dinh Cậu", "Vườn tiêu"],
            "priceRange": "5-10 triệu VND",
        },
        {
            "name": "Nha Trang",
            "slug": "nha-trang",
            "region": "Miền Trung",
            "description": "Thành phố biển xinh đẹp với nhiều resort và khu nghỉ dưỡng cao cấp",
            "bestTime": "Tháng 1-9 (nắng đẹp, ít mưa)",
            "highlights": ["Vinpearl Land", "Hòn Mun", "Tháp Bà Ponagar", "Bãi Dưỡng Sĩ", "Chùa Long Sơn"],
            "priceRange": "3-6 triệu VND",
        },
    ]
    
    for dest in destinations_data:
        try:
            existing = await service.get_destination_by_name(dest["name"])
            if not existing:
                await service.create_destination(dest)
                print(f"  ✅ Created: {dest['name']}")
            else:
                print(f"  ⏭️  Exists: {dest['name']}")
        except Exception as e:
            print(f"  ❌ Error creating {dest['name']}: {e}")
    
    # ============================================
    # MIGRATE POLICIES
    # ============================================
    print("\n📋 Migrating policies...")
    
    policies_data = [
        {
            "code": "cancellation",
            "name": "Chính sách hủy tour",
            "title": "Chính sách hủy và hoàn tiền",
            "content": "Hủy trước 14 ngày: Hoàn 90%. Hủy trước 7-13 ngày: Hoàn 70%. Hủy trước 3-6 ngày: Hoàn 50%. Hủy trước 1-2 ngày: Hoàn 20%. Hủy trong ngày: Không hoàn.",
            "priority": 1
        },
        {
            "code": "booking",
            "name": "Quy định đặt tour",
            "title": "Quy định đặt tour",
            "content": "Đặt cọc 50% giá tour. Thanh toán số dư trước 7 ngày. Trẻ dưới 5 tuổi miễn phí, 5-11 tuổi giảm 50%.",
            "priority": 2
        },
        {
            "code": "payment",
            "name": "Phương thức thanh toán",
            "title": "Các phương thức thanh toán",
            "content": "Chuyển khoản ngân hàng, thanh toán tại văn phòng, VNPay, MoMo, ZaloPay.",
            "priority": 3
        },
    ]
    
    for policy in policies_data:
        try:
            existing = await service.get_policy_by_code(policy["code"])
            if not existing:
                await service.create_policy(policy)
                print(f"  ✅ Policy: {policy['code']}")
            else:
                print(f"  ⏭️  Exists: {policy['code']}")
        except Exception as e:
            print(f"  ❌ Error: {policy['code']} - {e}")
    
    # ============================================
    # MIGRATE FAQs
    # ============================================
    print("\n❓ Migrating FAQs...")
    
    faqs_data = [
        {
            "code": "whats_included",
            "question": "Tour bao gồm những gì?",
            "answer": "Tour bao gồm: xe du lịch, lưu trú, ăn uống theo chương trình, vé tham quan, hướng dẫn viên, bảo hiểm. Không bao gồm: chi tiêu cá nhân, tip, các bữa ăn ngoài chương trình.",
            "category": "tour",
            "tags": ["bao gồm", "dịch vụ", "tiêu chuẩn"],
            "priority": 1
        },
        {
            "code": "reschedule",
            "question": "Tôi có thể đổi lịch tour không?",
            "answer": "Có thể đổi lịch: Đổi trước 7 ngày miễn phí, 3-7 ngày phí 10%, 1-3 ngày phí 20%. Đổi trong ngày không được.",
            "category": "booking",
            "tags": ["đổi lịch", "thay đổi", "reschedule"],
            "priority": 2
        },
        {
            "code": "child_discount",
            "question": "Trẻ em được giảm giá bao nhiêu?",
            "answer": "Trẻ dưới 5 tuổi miễn phí (ngồi cùng bố mẹ). Từ 5-11 tuổi giảm 50% giá tour. Từ 12 tuổi tính giá người lớn.",
            "category": "booking",
            "tags": ["trẻ em", "giảm giá", "child"],
            "priority": 3
        },
        {
            "code": "contact",
            "question": "Tôi liên hệ TravelGPT bằng cách nào?",
            "answer": "Hotline: 1900 xxxx (8:00 - 21:00). Chatbot: Hỗ trợ 24/7. Email: support@travelgpt.com. App: Tải trên iOS/Android.",
            "category": "general",
            "tags": ["liên hệ", "hỗ trợ", "hotline"],
            "priority": 4
        },
    ]
    
    for faq in faqs_data:
        try:
            existing = await service.get_faq_by_code(faq.get("code"))
            if not existing:
                await service.create_faq(faq)
                print(f"  ✅ FAQ: {faq['code']}")
            else:
                print(f"  ⏭️  Exists: {faq['code']}")
        except Exception as e:
            print(f"  ❌ Error: {faq['code']} - {e}")
    
    # ============================================
    # MIGRATE TRAVEL TIPS
    # ============================================
    print("\n💡 Migrating travel tips...")
    
    travel_tips_data = [
        {"title": "Cách gói vali hiệu quả", "content": "Cuộn quần áo thay vì gấp để tiết kiệm không gian. Đặt giày ở đáy, quần áo ở giữa, đồ dễ vỡ ở trên.", "category": "packing", "tags": ["vali", "đóng gói"], "priority": 1},
        {"title": "Giấy tờ cần thiết khi đi du lịch", "content": "CMND/CCCD bản gốc, passport nếu đi nước ngoài, vé máy bay, booking hotel. Chụp ảnh lưu cloud.", "category": "packing", "tags": ["giấy tờ", "cần thiết"], "priority": 2},
        {"title": "Etiquette khi thăm đền chùa", "content": "Mặc trang phục kín đáo, cởi giày khi vào chùa, không chỉ tay vào tượng phật, giữ yên tĩnh.", "category": "culture", "tags": ["chùa", "văn hóa", "etiquette"], "priority": 1},
        {"title": "Tip cho guide và tài xế", "content": "Tip không bắt buộc: 50,000-100,000 VND/ngày cho guide, 20,000-50,000 VND cho tài xế.", "category": "culture", "tags": ["tip", "hướng dẫn viên"], "priority": 2},
        {"title": "Phòng bệnh tiêu hóa khi đi du lịch", "content": "Uống nước đóng chai, tránh đá lạnh, ăn thức ăn được nấu chín. Mang thuốc tiêu chảy.", "category": "health", "tags": ["sức khỏe", "tiêu hóa", "bệnh"], "priority": 1},
    ]
    
    for tip in travel_tips_data:
        try:
            await service.create_travel_tip(tip)
            print(f"  ✅ Tip: {tip['title']}")
        except Exception as e:
            print(f"  ⏭️  Skip: {tip['title']} ({e})")
    
    # ============================================
    # MIGRATE VISA REQUIREMENTS
    # ============================================
    print("\n🛂 Migrating visa requirements...")
    
    visa_data = [
        {"countryCode": "VN", "countryName": "Việt Nam", "visaRequired": False, "notes": "Công dân Việt Nam không cần visa trong nước"},
        {"countryCode": "TH", "countryName": "Thái Lan", "visaRequired": False, "visaType": "Miễn visa 30 ngày", "validity": "30 ngày", "notes": "Hộ chiếu còn hạn 6 tháng"},
        {"countryCode": "SG", "countryName": "Singapore", "visaRequired": False, "visaType": "Miễn visa 30 ngày", "validity": "30 ngày", "notes": "Có thể gia hạn"},
        {"countryCode": "MY", "countryName": "Malaysia", "visaRequired": False, "visaType": "Miễn visa 30 ngày", "validity": "30 ngày", "notes": "Hộ chiếu 6 tháng"},
        {"countryCode": "JP", "countryName": "Nhật Bản", "visaRequired": True, "visaType": "Tourist visa", "processingTime": "5-7 ngày", "validity": "90 ngày", "maxStay": "15 ngày", "notes": "Cần chứng minh tài chính"},
        {"countryCode": "KR", "countryName": "Hàn Quốc", "visaRequired": True, "visaType": "K-ETA", "processingTime": "1-3 ngày", "validity": "90 ngày", "maxStay": "90 ngày", "notes": "Đăng ký K-ETA online trước"},
    ]
    
    for visa in visa_data:
        try:
            await service.create_visa_requirement(visa)
            print(f"  ✅ Visa: {visa['countryName']}")
        except Exception as e:
            print(f"  ⏭️  Skip: {visa['countryName']} ({e})")
    
    print("\n" + "="*50)
    print("✅ Migration complete!")
    print("="*50)
    
    await disconnect_db()


if __name__ == "__main__":
    asyncio.run(migrate_knowledge())
