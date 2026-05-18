"""
Migration script: Import safety tips, FAQs, travel tips vào database
Run: python scripts/migrate_knowledge_full.py
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


async def migrate_knowledge():
    """Migrate knowledge to database"""
    from app.core.prisma import db, connect_db, disconnect_db
    from app.services.knowledge_service import KnowledgeService
    
    print("🔄 Connecting to database...")
    await connect_db()
    
    service = KnowledgeService(db)
    
    # ============================================
    # MIGRATE SAFETY TIPS
    # ============================================
    print("\n⚠️ Migrating safety tips...")
    
    safety_tips_data = [
        # Đà Nẵng
        {"destination": "Đà Nẵng", "category": "general", "title": "An toàn khi tắm biển", "content": "Bơi tại bãi biển có cắm cờ, có người cứu hộ. Không bơi xa bờ khi sóng lớn. Ưu tiên bãi biển Mỹ Khê, Non Nước có cứu hộ chuyên nghiệp.", "severity": "warning"},
        {"destination": "Đà Nẵng", "category": "security", "title": "Cảnh giác móc túi", "content": "Nơi đông người như chợ, bãi biển là địa điểm thường có móc túi. Giữ túi xách trước mặt, không để đồ giá trị ở túi sau.", "severity": "warning"},
        {"destination": "Đà Nẵng", "category": "transport", "title": "Thuê xe máy", "content": "Lái xe cẩn thận, bắt buộc đội mũ bảo hiểm. Đà Nẵng có nhiều xe máy, đặc biệt buổi chiều. Cẩn thận với đèn tín hiệu giao thông.", "severity": "info"},
        {"destination": "Đà Nẵng", "category": "weather", "title": "Cảnh báo mùa mưa", "content": "Từ tháng 9-12 có thể có bão. Theo dõi dự báo thời tiết trước khi đi Bà Nà Hills vì cáp treo có thể dừng khi gió lớn.", "severity": "warning"},
        
        # Hội An
        {"destination": "Hội An", "category": "general", "title": "Ngập nước mùa mưa", "content": "Mùa mưa (tháng 10-12), phố cổ Hội An có thể ngập nước. Mang theo giày chống nước và kiểm tra thời tiết trước.", "severity": "info"},
        {"destination": "Hội An", "category": "security", "title": "Gian lận taxi", "content": "Chỉ đi taxi có đồng hồ hoặc book qua app (Grab, Be, Gojek). Tránh xe xích lô chào giá cao không rõ ràng.", "severity": "warning"},
        {"destination": "Hội An", "category": "culture", "title": "Ăn mặc khi vào chùa", "content": "Mặc trang phục kín đáo khi vào Hội quán, chùa. Tránh quần short, áo hở vai. Cởi giày trước khi vào chùa Cầu.", "severity": "info"},
        
        # Sapa
        {"destination": "Sapa", "category": "health", "title": "Phòng bệnh tiêu hóa", "content": "Uống nước đóng chai, tránh uống nước giếng hoặc nước máy không đun sôi. Ăn thức ăn được nấu chín nóng hổi.", "severity": "warning"},
        {"destination": "Sapa", "category": "weather", "title": "Thời tiết khắc nghiệt", "content": "Mùa đông rất lạnh (5-10°C), có thể có tuyết và băng giá. Mùa mưa đường trơn trượt. Luôn mang theo áo ấm dù là mùa hè.", "severity": "critical"},
        {"destination": "Sapa", "category": "general", "title": "Trekking an toàn", "content": "Đi theo hướng dẫn viên local, không đi một mình vào rừng. Báo cho khách sạn nếu đi trekking xa. Mang giày trekking chống trượt.", "severity": "warning"},
        {"destination": "Sapa", "category": "security", "title": "Mua đồ ở chợ", "content": "Khi mua đồ ở chợ Sapa, thương lượng giá là bình thường. Không mua vì thương hại, mua khi thực sự thích.", "severity": "info"},
        
        # Hạ Long
        {"destination": "Hạ Long", "category": "general", "title": "Say tàu biển", "content": "Uống thuốc chống say tàu 30 phút trước khi lên tàu. Ngồi giữa tàu ít chóng mặt hơn. Nhìn ra xa, không đọc sách.", "severity": "info"},
        {"destination": "Hạ Long", "category": "security", "title": "Mua đồ trên tàu", "content": "Giá cả trên tàu thường cao hơn bên ngoài. Kiểm tra giá trước khi mua hải sản từ người bán trên thuyền.", "severity": "info"},
        {"destination": "Hạ Long", "category": "general", "title": "An toàn khi tham quan hang", "content": "Đi theo hướng dẫn trong hang. Không tự ý đi lạc. Cẩn thận trơn trượt vì đá vôi và nước.", "severity": "warning"},
        
        # Phú Quốc
        {"destination": "Phú Quốc", "category": "general", "title": "Dòng chảy ngầm nguy hiểm", "content": "Một số bãi biển có dòng chảy ngầm nguy hiểm. Hỏi người dân địa phương trước khi tắm. Chỉ bơi ở bãi có cứu hộ.", "severity": "critical"},
        {"destination": "Phú Quốc", "category": "health", "title": "Bảo vệ khỏi côn trùng", "content": "Phú Quốc có nhiều muỗi, đặc biệt buổi sáng sớm và chiều tối. Mang theo kem chống muỗi, xịt côn trùng.", "severity": "warning"},
        {"destination": "Phú Quốc", "category": "security", "title": "Thuê xe máy", "content": "Phú Quốc rộng, cần xe máy để di chuyển. Kiểm tra xe kỹ, mua bảo hiểm. Cẩn thận đường vắng không có đèn.", "severity": "warning"},
        
        # Nha Trang
        {"destination": "Nha Trang", "category": "general", "title": "Tắm nước ngọt sau biển", "content": "Tắm nước ngọt ngay sau khi tắm biển để tránh da khô và nhiễm khuẩn. Sử dụng kem dưỡng da sau khi tắm biển.", "severity": "info"},
        {"destination": "Nha Trang", "category": "security", "title": "Cẩn thận với trộm", "content": "Không để đồ giá trị trên bãi biển khi đi bơi. Sử dụng tủ locker của khách sạn. Cẩn thận khi đi bơi một mình ban đêm.", "severity": "warning"},
        {"destination": "Nha Trang", "category": "general", "title": "Chọn tour tàu ngắm san hô", "content": "Chọn công ty tour uy tín, có hướng dẫn viên. Không mua tour từ người bán trên bãi biển không rõ nguồn gốc.", "severity": "info"},
        
        # Huế
        {"destination": "Huế", "category": "culture", "title": "Ăn mặc ở cố đô", "content": "Trang phục kín đáo khi vào lăng tẩm, chùa chiền. Không mặc áo cộc tay trong một số ngôi chùa.", "severity": "info"},
        {"destination": "Huế", "category": "general", "title": "Thời tiết Huế", "content": "Huế nóng và oi ả vào mùa hè (6-8). Mùa mưa (tháng 9-12) có thể ngập. Mang theo ô, áo mưa.", "severity": "info"},
        
        # Hà Nội
        {"destination": "Hà Nội", "category": "transport", "title": "Giao thông Hà Nội", "content": "Giao thông đông đúc, hỗn loạn. Cẩn thận khi qua đường, đi bên phải. Không bấm còi xe liên tục.", "severity": "warning"},
        {"destination": "Hà Nội", "category": "security", "title": "Cảnh giác lừa đảo", "content": "Cẩn thận với xích lô, xe ôm giá cao. Chỉ đi taxi có đồng hồ hoặc book qua app. Không đổi tiền ở người lạ.", "severity": "warning"},
        
        # Đà Lạt
        {"destination": "Đà Lạt", "category": "weather", "title": "Thời tiết lạnh", "content": "Đà Lạt lạnh quanh năm (15-25°C). Mang theo áo ấm dù là mùa hè. Buổi tối và sáng sớm rất lạnh.", "severity": "info"},
        {"destination": "Đà Lạt", "category": "general", "title": "Sương mù khi lái xe", "content": "Buổi sáng sớm thường có sương mù dày đặc. Cẩn thận khi lái xe, giảm tốc độ. Bật đèn sương mù.", "severity": "warning"},
        
        # Quy Nhơn
        {"destination": "Quy Nhơn", "category": "general", "title": "An toàn biển", "content": "Một số bãi biển có sóng ngầm. Chỉ bơi ở bãi biển có cắm cờ an toàn. Cẩn thận với sóng lớn mùa gió chướng.", "severity": "warning"},
        {"destination": "Quy Nhơn", "category": "general", "title": "Đi Eo Gió", "content": "Eo Gió có độ cao, cẩn thận khi đứng gần vách đá. Không leo qua lan can. Tránh đến vào ngày mưa gió.", "severity": "warning"},
    ]
    
    count = 0
    for tip in safety_tips_data:
        try:
            await service.create_safety_tip(tip)
            count += 1
        except Exception as e:
            pass  # Skip duplicates
    print(f"  ✅ Created {count} safety tips")
    
    # ============================================
    # MIGRATE FAQs
    # ============================================
    print("\n❓ Migrating FAQs...")
    
    faqs_data = [
        # Tour
        {
            "question": "Tour bao gồm những gì?",
            "answer": """Tour du lịch của TravelGPT thường bao gồm:

✅ Đã bao gồm:
• Xe du lịch đời mới (xe 16, 29, 45 chỗ tùy tour)
• Lưu trú khách sạn 3-5 sao (theo tiêu chuẩn tour)
• Ăn uống theo chương trình (bữa sáng, trưa, tối)
• Vé tham quan các điểm trong chương trình
• Hướng dẫn viên chuyên nghiệp
• Bảo hiểm du lịch (theo quy định)
• Nước uống trên xe

❌ Không bao gồm:
• Chi tiêu cá nhân (mua sắm, giải trí)
• Phí phòng đơn (nếu khách ở một mình)
• Các bữa ăn ngoài chương trình
• Tip cho hướng dẫn và tài xế""",
            "category": "tour",
            "tags": ["bao gồm", "dịch vụ", "tiêu chuẩn"],
            "priority": 1
        },
        {
            "question": "Tôi có thể đổi lịch tour không?",
            "answer": """Có, bạn có thể đổi lịch tour với các điều kiện sau:

• Đổi trước 7 ngày: Miễn phí (nếu còn chỗ trống)
• Đổi trước 3-7 ngày: Phí 10% giá tour
• Đổi trước 1-3 ngày: Phí 20% giá tour
• Đổi trong ngày khởi hành: Không được đổi

Lưu ý:
• Đổi ngày phải cùng loại tour và còn chỗ trống
• Nếu tour mới có giá cao hơn, vui lòng thanh toán phần chênh lệch""",
            "category": "booking",
            "tags": ["đổi lịch", "thay đổi", "reschedule"],
            "priority": 2
        },
        {
            "question": "Trẻ em được giảm giá bao nhiêu?",
            "answer": """Chính sách giá dành cho trẻ em:

• Dưới 5 tuổi: Miễn phí (ngồi cùng bố mẹ, không chiếm ghế)
• Từ 5-11 tuổi: Giảm 50% giá tour (có ghế ngồi riêng, ngủ chung phòng với bố mẹ)
• Từ 12 tuổi trở lên: Tính giá như người lớn

Lưu ý:
• Mỗi phòng khách sạn chỉ có 1 trẻ em miễn phí hoặc giảm 50%
• Trẻ em cần có người lớn đi kèm""",
            "category": "booking",
            "tags": ["trẻ em", "giảm giá", "child"],
            "priority": 3
        },
        {
            "question": "Tôi cần chuẩn bị gì trước chuyến đi?",
            "answer": """Checklist chuẩn bị trước chuyến đi:

📋 Giấy tờ:
• CMND/CCCD hoặc hộ chiếu (bản gốc)
• Vé máy bay (nếu có)
• Booking confirmation
• Giấy tờ xe (nếu tự lái)

🎒 Hành lý:
• Quần áo theo thời tiết điểm đến
• Giày thể thao thoải mái
• Áo mưa hoặc ô (mùa mưa)
• Mũ, kính râm, kem chống nắng

💊 Sức khỏe:
• Thuốc cá nhân đang dùng
• Thuốc chống say tàu (nếu cần)

📱 Công nghệ:
• Điện thoại và sạc dự phòng
• Ổ cắm sạc đa năng (nếu đi nước ngoài)""",
            "category": "tour",
            "tags": ["chuẩn bị", "checklist", "hành lý"],
            "priority": 4
        },
        # Booking
        {
            "question": "Làm sao để hủy tour?",
            "answer": """Bạn có thể hủy tour qua các cách sau:

📞 Hotline: Gọi 1900 xxxx (8:00 - 21:00 hàng ngày)
💬 Chat: Nhắn tin qua chatbot TravelGPT
📧 Email: Gửi email đến support@travelgpt.com
📱 App: Hủy trực tiếp trong phần "Đơn hàng"

Thông tin cần cung cấp:
• Mã booking (VD: TG202400123)
• Tên người đặt tour
• Lý do hủy (không bắt buộc)

Tiền hoàn sẽ được chuyển trong 7-14 ngày làm việc.""",
            "category": "booking",
            "tags": ["hủy tour", "cancellation", "hoàn tiền"],
            "priority": 5
        },
        {
            "question": "Tôi liên hệ TravelGPT bằng cách nào?",
            "answer": """TravelGPT hỗ trợ khách hàng qua nhiều kênh:

📞 Hotline: 1900 xxxx
• Thứ 2 - Thứ 6: 8:00 - 21:00
• Thứ 7 - CN: 9:00 - 18:00

💬 Chatbot: Hỗ trợ 24/7 trên website/app
📧 Email: support@travelgpt.com
📱 App: Tải app TravelGPT trên iOS/Android
🏢 Văn phòng: 123 Nguyễn Huệ, Quận 1, TP.HCM""",
            "category": "general",
            "tags": ["liên hệ", "hỗ trợ", "hotline"],
            "priority": 6
        },
        # Payment
        {
            "question": "Các phương thức thanh toán nào được chấp nhận?",
            "answer": """TravelGPT hỗ trợ nhiều phương thức thanh toán:

• Chuyển khoản ngân hàng: Vietcombank, VietinBank, BIDV
• Thanh toán tại văn phòng: 123 Nguyễn Huệ, Q1, TP.HCM
• VNPay: Thẻ ATM, Visa, MasterCard
• MoMo/ZaloPay: Ví điện tử

Phương thức thanh toán có thể thay đổi theo chương trình khuyến mãi.""",
            "category": "payment",
            "tags": ["thanh toán", "payment", "ví điện tử"],
            "priority": 7
        },
        {
            "question": "Chính sách hoàn tiền như thế nào?",
            "answer": """Chính sách hoàn tiền khi hủy tour:

• Hủy trước 14 ngày: Hoàn 90% giá tour
• Hủy trước 7-13 ngày: Hoàn 70% giá tour
• Hủy trước 3-6 ngày: Hoàn 50% giá tour
• Hủy trước 1-2 ngày: Hoàn 20% giá tour
• Hủy trong ngày khởi hành: Không hoàn tiền

Thời gian tính theo ngày làm việc, không tính thứ 7, CN và ngày lễ.""",
            "category": "payment",
            "tags": ["hoàn tiền", "refund", "cancellation"],
            "priority": 8
        },
        # General
        {
            "question": "Tour có bảo hiểm không?",
            "answer": """Có, tất cả các tour của TravelGPT đều có bảo hiểm du lịch:

• Bảo hiểm tai nạn du lịch
• Bảo hiểm y tế cơ bản
• Hỗ trợ y tế khẩn cấp

Mức bảo hiểm tùy theo loại tour:
• Tour trong nước: 50 triệu VND/người
• Tour quốc tế: 100 triệu VND/người

Bạn có thể mua bảo hiểm du lịch bổ sung với chi phí từ 50,000 VND.""",
            "category": "tour",
            "tags": ["bảo hiểm", "insurance", "an toàn"],
            "priority": 9
        },
        {
            "question": "Tôi có thể đặt tour riêng cho nhóm không?",
            "answer": """Có, TravelGPT hỗ trợ đặt tour riêng cho nhóm:

• Nhóm từ 10 người trở lên: Liên hệ để được báo giá riêng
• Tour private: Thiết kế theo yêu cầu của bạn
• Lịch trình tùy chỉnh: Chọn điểm đến, thời gian theo ý muốn
• Dịch vụ VIP: Xe riêng, khách sạn cao cấp, hướng dẫn riêng

Liên hệ hotline 1900 xxxx để được tư vấn chi tiết.""",
            "category": "booking",
            "tags": ["tour riêng", "private tour", "nhóm"],
            "priority": 10
        },
    ]
    
    count = 0
    for faq in faqs_data:
        try:
            await service.create_faq(faq)
            count += 1
        except Exception as e:
            pass  # Skip duplicates
    print(f"  ✅ Created {count} FAQs")
    
    # ============================================
    # MIGRATE TRAVEL TIPS
    # ============================================
    print("\n💡 Migrating travel tips...")
    
    travel_tips_data = [
        # Packing
        {"title": "Cách gói vali hiệu quả", "content": "Cuộn quần áo thay vì gấp để tiết kiệm không gian. Đặt giày ở đáy vali, quần áo ở giữa, đồ dễ vỡ và đồ điện tử ở trên cùng. Sử dụng túi nén chân không cho quần áo cồng kềnh. Để tất, thắt lưng trong giày để tiết kiệm không gian.", "category": "packing", "tags": ["vali", "đóng gói"], "priority": 1},
        {"title": "Giấy tờ cần thiết khi đi du lịch", "content": "CMND/CCCD bản gốc (không cần photo), passport nếu đi nước ngoài, vé máy bay, booking hotel, bảo hiểm du lịch. Nên chụp ảnh tất cả giấy tờ và lưu vào cloud. Gửi bản sao cho người thân phòng trường hợp mất.", "category": "packing", "tags": ["giấy tờ", "cần thiết"], "priority": 2},
        {"title": "Danh sách đồ cần thiết cho chuyến đi biển", "content": "Kem chống nắng SPF 50+, kính râm, mũ rộng vành, áo phông dài tay, dép xăng đan, túi chống nước cho điện thoại, kem dưỡng da sau nắng, bình nước tái sử dụng.", "category": "packing", "tags": ["biển", "đóng gói", "phượt"], "priority": 3},
        
        # Culture
        {"title": "Etiquette khi thăm đền chùa ở Việt Nam", "content": "Mặc trang phục kín đáo (quần dài, áo có tay), cởi giày khi vào chùa, không chỉ tay vào tượng phật, giữ yên tĩnh trong khuôn viên, cúi chào khi ra về. Không chụp ảnh flash trong chùa.", "category": "culture", "tags": ["chùa", "văn hóa", "etiquette"], "priority": 1},
        {"title": "Tip cho guide và tài xế ở Việt Nam", "content": "Tip không bắt buộc nhưng được khuyến khích. Mức tip thường: 50,000-100,000 VND/ngày cho guide, 20,000-50,000 VND cho tài xế. Đưa tip trực tiếp và kèm lời cảm ơn. Không nên đưa tiền lẻ.", "category": "culture", "tags": ["tip", "hướng dẫn viên"], "priority": 2},
        {"title": "Khi nào nên đến Việt Nam?", "content": "Miền Bắc: Tháng 10-12 (thu đông, mát mẻ), tháng 3-4 (mùa hoa). Miền Trung: Tháng 2-4 (khô ráo, không nắng gắt). Miền Nam: Tháng 12-3 (mùa khô, nắng đẹp). Tránh tháng 7-9 (mùa mưa bão miền Trung).", "category": "culture", "tags": ["thời gian", "mùa", "planning"], "priority": 3},
        
        # Money
        {"title": "Nên mang bao nhiêu tiền mặt khi đi du lịch?", "content": "Du lịch trong nước: 2-3 triệu VND tiền mặt cho chi tiêu cá nhân (đã có tour bao ăn uống). Du lịch nước ngoài: Tùy quốc gia, thường 50-100 USD/ngày. Luôn có thẻ ATM và báo cho ngân hàng về kế hoạch du lịch.", "category": "money", "tags": ["tiền", "chi tiêu", "ATM"], "priority": 1},
        {"title": "Sử dụng thẻ ATM ở Việt Nam", "content": "Phí rút tiền ATM: 10,000-30,000 VND/lần + phí quy đổi ngoại tệ (nếu có). Rút tiền tại ngân hàng Vietcombank, VietinBank, BIDV để giảm phí. Chuyển khoản qua app ngân hàng thường rẻ hơn.", "category": "money", "tags": ["ATM", "thẻ", "phí"], "priority": 2},
        
        # Transport
        {"title": "Di chuyển trong thành phố ở Việt Nam", "content": "Grab/Be/MoMo: Tiện nhất, có app, biết trước giá, có xe máy và ô tô. Xe máy thuê: 100,000-150,000 VND/ngày, cần bằng lái xe. Xe bus: Rẻ nhất nhưng chậm, có app BusMap. Xe xích lô: Du lịch ngắn trong phố cổ, thương lượng giá trước.", "category": "transport", "tags": ["di chuyển", "grab", "xe máy"], "priority": 1},
        {"title": "Cách đặt vé máy bay giá rẻ", "content": "Đặt trước 1-2 tháng để có giá tốt. Theo dõi các đợt khuyến mãi của Vietnam Airlines, Vietjet, Bamboo Airways. Đặt vào ngày thứ 3 hoặc thứ 4 trong tuần thường rẻ hơn. So sánh giá trên nhiều trang như Traveloka, Skyscanner.", "category": "transport", "tags": ["vé máy bay", "tiết kiệm", "booking"], "priority": 2},
        
        # Health
        {"title": "Phòng bệnh tiêu hóa khi đi du lịch", "content": "Uống nước đóng chai, tránh đá lạnh trong nước uống, ăn thức ăn được nấu chín nóng hổi, tránh salad và rau sống từ nguồn không đáng tin cậy. Mang theo thuốc tiêu chảy như Smecta, Berberine.", "category": "health", "tags": ["sức khỏe", "tiêu hóa", "bệnh"], "priority": 1},
        {"title": "Phòng say tàu xe", "content": "Ngồi ở giữa xe/tàu ít chóng mặt hơn. Nhìn ra xa, không đọc điện thoại. Ngồi ngược hướng di chuyển nếu dễ say. Uống gừng, trà gừng. Thuốc say: Dimenhydrinate (Dramamine) uống 30-60 phút trước.", "category": "health", "tags": ["say tàu", "sức khỏe"], "priority": 2},
    ]
    
    count = 0
    for tip in travel_tips_data:
        try:
            await service.create_travel_tip(tip)
            count += 1
        except Exception as e:
            pass  # Skip duplicates
    print(f"  ✅ Created {count} travel tips")
    
    print("\n" + "="*50)
    print("✅ Migration complete!")
    print("="*50)
    
    await disconnect_db()


if __name__ == "__main__":
    asyncio.run(migrate_knowledge())
