"""
Quick migrate FAQs and travel tips
"""
import asyncio
from app.core.prisma import db, connect_db, disconnect_db
from app.services.knowledge_service import KnowledgeService

async def migrate():
    await connect_db()
    service = KnowledgeService(db)
    
    # Migrate FAQs
    print("Migrating FAQs...")
    faqs = [
        {"question": "Tour bao gồm những gì?", "answer": "Bao gồm xe, lưu trú, ăn uống, vé tham quan, HDV, bảo hiểm. Không gồm chi tiêu cá nhân.", "category": "tour", "tags": [], "priority": 1},
        {"question": "Tôi có thể đổi lịch tour không?", "answer": "Đổi trước 7 ngày miễn phí, 3-7 ngày phí 10%, 1-3 ngày phí 20%.", "category": "booking", "tags": [], "priority": 2},
        {"question": "Trẻ em được giảm giá bao nhiêu?", "answer": "Dưới 5 tuổi miễn phí, 5-11 tuổi giảm 50%, từ 12 tuổi tính giá người lớn.", "category": "booking", "tags": [], "priority": 3},
        {"question": "Các phương thức thanh toán nào được chấp nhận?", "answer": "Chuyển khoản ngân hàng, thanh toán tại văn phòng, VNPay, MoMo, ZaloPay.", "category": "payment", "tags": [], "priority": 4},
        {"question": "Chính sách hoàn tiền như thế nào?", "answer": "Hủy trước 14 ngày hoàn 90%, 7-13 ngày hoàn 70%, 3-6 ngày hoàn 50%, 1-2 ngày hoàn 20%, ngày khởi hành không hoàn.", "category": "payment", "tags": [], "priority": 5},
    ]
    count = 0
    for faq in faqs:
        try:
            await service.create_faq(faq)
            count += 1
        except Exception as e:
            print(f"FAQ error: {e}")
    print(f"Created {count} FAQs")
    
    # Migrate travel tips
    print("Migrating travel tips...")
    tips = [
        {"title": "Cách gói vali hiệu quả", "content": "Cuộn quần áo thay vì gấp để tiết kiệm không gian. Đặt giày ở đáy vali.", "category": "packing", "tags": [], "priority": 1},
        {"title": "Giấy tờ cần thiết", "content": "CMND/CCCD bản gốc, vé máy bay, booking hotel, bảo hiểm du lịch.", "category": "packing", "tags": [], "priority": 2},
        {"title": "Etiquette khi thăm đền chùa", "content": "Mặc trang phục kín đáo, cởi giày khi vào chùa, không chỉ tay vào tượng phật.", "category": "culture", "tags": [], "priority": 1},
        {"title": "Tip cho guide và tài xế", "content": "Tip không bắt buộc: 50,000-100,000 VND/ngày cho guide, 20,000-50,000 VND cho tài xế.", "category": "culture", "tags": [], "priority": 2},
        {"title": "Phòng bệnh tiêu hóa", "content": "Uống nước đóng chai, tránh đá lạnh, ăn thức ăn được nấu chín.", "category": "health", "tags": [], "priority": 1},
        {"title": "Phòng say tàu xe", "content": "Ngồi giữa xe ít chóng mặt hơn. Uống gừng hoặc thuốc chống say.", "category": "health", "tags": [], "priority": 2},
    ]
    count = 0
    for tip in tips:
        try:
            await service.create_travel_tip(tip)
            count += 1
        except Exception as e:
            print(f"Tip error: {e}")
    print(f"Created {count} travel tips")
    
    await disconnect_db()

asyncio.run(migrate())
