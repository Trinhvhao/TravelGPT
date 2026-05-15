"""
Knowledge Base for TravelGPT Chatbot
Lưu trữ thông tin tĩnh về điểm đến, chính sách, FAQ
Dùng làm fallback khi DB không có data hoặc thiếu
"""
from typing import Dict, List, Optional, Any
from dataclasses import dataclass


@dataclass
class DestinationInfo:
    """Thông tin về điểm đến"""
    name: str
    region: str
    description: str
    best_time: str
    highlights: List[str]
    typical_price_range: str  # e.g., "2-5 triệu VND"


@dataclass
class PolicyInfo:
    """Chính sách của công ty"""
    name: str
    content: str
    refund_rules: Optional[List[Dict]] = None


@dataclass
class FAQItem:
    """Câu hỏi thường gặp"""
    question: str
    answer: str
    tags: List[str]


class TravelKnowledgeBase:
    """
    Knowledge base tĩnh cho chatbot
    - Cung cấp thông tin fallback khi DB không có data
    - Giúp chatbot trả lời thông minh ngay cả khi thiếu data
    """
    
    # ============================================
    # DESTINATIONS INFO
    # ============================================
    DESTINATIONS: Dict[str, DestinationInfo] = {
        "đà nẵng": DestinationInfo(
            name="Đà Nẵng",
            region="Miền Trung",
            description="Thành phố biển xinh đẹp, được mệnh danh là thành phố đáng sống nhất Việt Nam",
            best_time="Tháng 2-4 (Tết âm lịch - Lễ hội Pháo hoa)",
            highlights=["Bà Nà Hills", "Cầu Vàng", "Mỹ Khê Beach", "Ngũ Hành Sơn", "Sông Hàn"],
            typical_price_range="2-5 triệu VND"
        ),
        "hội an": DestinationInfo(
            name="Hội An",
            region="Miền Trung",
            description="Phố cổ UNESCO với kiến trúc độc đáo, ẩm thực phong phú",
            best_time="Tháng 2-4 (thời tiết mát mẻ)",
            highlights=["Phố cổ Hội An", "Cù Lao Chàm", "Hội quán Phúc Kiến", "Chùa Cầu", "Làng rau Trà Quế"],
            typical_price_range="1.5-3 triệu VND"
        ),
        "sapa": DestinationInfo(
            name="Sapa",
            region="Miền Bắc",
            description="Vùng đất của núi non hùng vĩ, ruộng bậc thang, văn hóa dân tộc đặc sắc",
            best_time="Tháng 9-11 (mùa lúa chín vàng), Tháng 12-2 (tuyết rơi)",
            highlights=["Đỉnh Fansipan", "Bản Cát Cát", "Thung lũng Mường Hoa", "Núi Hàm Rồng", "Bản Tả Phìn"],
            typical_price_range="4-7 triệu VND"
        ),
        "hạ long": DestinationInfo(
            name="Hạ Long",
            region="Miền Bắc",
            description="Vịnh biển đẹp nhất thế giới với hàng nghìn đảo đá vôi",
            best_time="Tháng 4-6 (mùa hè, nắng đẹp)",
            highlights=["Vịnh Hạ Long", "Hang Sửng Sốt", "Đảo Titop", "Làng chài Vông Viêng", "Hang Luồn"],
            typical_price_range="3-5 triệu VND"
        ),
        "phú quốc": DestinationInfo(
            name="Phú Quốc",
            region="Miền Nam",
            description="Đảo ngọc với bãi biển đẹp, resort sang trọng, thuộc top đảo đẹp nhất thế giới",
            best_time="Tháng 11-3 (mùa khô, nắng đẹp)",
            highlights=["Vinpearl Safari", "Grand World", "Bãi Sao", "Hòn Thơm", "Dinh Cậu", "Vườn tiêu"],
            typical_price_range="5-10 triệu VND"
        ),
        "nha trang": DestinationInfo(
            name="Nha Trang",
            region="Miền Nam",
            description="Thành phố biển xinh đẹp với nhiều resort và khu nghỉ dưỡng cao cấp",
            best_time="Tháng 1-9 (nắng đẹp, ít mưa)",
            highlights=["Vinpearl Land", "Hòn Mun", "Tháp Bà Ponagar", "Bãi Dưỡng Sĩ", "Chùa Long Sơn"],
            typical_price_range="3-6 triệu VND"
        ),
        "huế": DestinationInfo(
            name="Huế",
            region="Miền Trung",
            description="Cố đô hoàng gia với lịch sử phong phú, kiến trúc độc đáo",
            best_time="Tháng 1-4 (thời tiết mát mẻ)",
            highlights=["Đại Nội Huế", "Lăng tẩm các vua Nguyễn", "Chùa Thiên Mụ", "Sông Hương", "Chợ Đông Ba"],
            typical_price_range="3-5 triệu VND"
        ),
        "hà nội": DestinationInfo(
            name="Hà Nội",
            region="Miền Bắc",
            description="Thủ đô ngàn năm văn hiến với nhiều di tích lịch sử",
            best_time="Tháng 10-12 (thu vàng), Tháng 3-4 (hoa ban nở)",
            highlights=["Hồ Hoàn Kiếm", "Văn Miếu - Quốc Tử Giám", "Lăng Bác", "Phố cổ Hà Nội", "Chùa Trấn Quốc"],
            typical_price_range="2-4 triệu VND"
        ),
        "đà lạt": DestinationInfo(
            name="Đà Lạt",
            region="Tây Nguyên",
            description="Thành phố ngàn hoa với khí hậu mát mẻ quanh năm, phong cảnh lãng mạn",
            best_time="Tháng 10-3 (mùa hoa, lễ hội)",
            highlights=["Thung lũng Tình Yêu", "Hồ Tuyền Trạch", "Đồi Mộng Mơ", "Chợ Đà Lạt", "Thác Datanla"],
            typical_price_range="3-5 triệu VND"
        ),
        "quy nhơn": DestinationInfo(
            name="Quy Nhơn",
            region="Miền Trung",
            description="Thành phố biển hoang sơ với bãi biển đẹp, được mệnh danh là Maldives của Việt Nam",
            best_time="Tháng 4-9 (nắng đẹp)",
            highlights=["Eo Gió", "Kỳ Co", "Bãi Im Chuối", "Đồi Cỏ Mịch", "Chùa Ông Nun"],
            typical_price_range="3-5 triệu VND"
        ),
    }
    
    # ============================================
    # REGION INFO
    # ============================================
    REGIONS: Dict[str, Dict[str, Any]] = {
        "Miền Bắc": {
            "description": "Vùng đất của núi non hùng vĩ, biển đảo xanh mát với nhiều danh lam thắng cảnh nổi tiếng",
            "highlights": ["Sapa", "Hạ Long", "Hà Nội", "Ninh Bình", "Mộc Châu", "Hà Giang"],
            "best_season": "Thu (tháng 9-11) và Đông (tháng 12-2)"
        },
        "Miền Trung": {
            "description": "Vùng đất của di sản văn hóa thế giới, bãi biển đẹp, ẩm thực phong phú",
            "highlights": ["Đà Nẵng", "Hội An", "Huế", "Quy Nhơn", "Nha Trang"],
            "best_season": "Tháng 2-8 (mùa hè, ít mưa)"
        },
        "Miền Nam": {
            "description": "Vùng đất của biển đảo nhiệt đới, sông nước miệt vườn, thành phố hiện đại",
            "highlights": ["Phú Quốc", "Nha Trang", "Cần Thơ", "Đà Lạt", "Cà Mau"],
            "best_season": "Tháng 11-4 (mùa khô)"
        }
    }
    
    # ============================================
    # POLICIES
    # ============================================
    POLICIES: Dict[str, PolicyInfo] = {
        "cancellation": PolicyInfo(
            name="Chính sách hủy đặt tour",
            content="""Quý khách có thể hủy đặt tour theo các điều kiện sau:
• Hủy trước 14 ngày trở lên: Hoàn 90% giá tour
• Hủy trước 7-13 ngày: Hoàn 70% giá tour  
• Hủy trước 3-6 ngày: Hoàn 50% giá tour
• Hủy trước 1-2 ngày: Hoàn 20% giá tour
• Hủy trong ngày khởi hành: Không hoàn tiền
*Lưu ý: Phí xử lý 5% sẽ được trừ vào số tiền hoàn*""",
            refund_rules=[
                {"days": "14+", "refund_percent": 90},
                {"days": "7-13", "refund_percent": 70},
                {"days": "3-6", "refund_percent": 50},
                {"days": "1-2", "refund_percent": 20},
                {"days": "0", "refund_percent": 0}
            ]
        ),
        "booking": PolicyInfo(
            name="Quy định đặt tour",
            content="""Để đặt tour, quý khách cần cung cấp:
• Họ và tên người đặt tour
• Số điện thoại liên hệ
• Email (để nhận xác nhận)
• Số lượng người lớn và trẻ em
• Ngày khởi hành dự kiến

Đặt cọc 50% giá tour để xác nhận.
Thanh toán số dư trước ngày khởi hành 7 ngày."""
        ),
        "payment": PolicyInfo(
            name="Phương thức thanh toán",
            content="""Chúng tôi hỗ trợ các phương thức thanh toán:
• Chuyển khoản ngân hàng (khuyến khích)
• Thanh toán tại văn phòng
• Thanh toán online qua VNPay, MoMo, ZaloPay
• Thanh toán trả góp 0% lãi suất qua thẻ tín dụng"""
        ),
        "travel_tips": PolicyInfo(
            name="Mẹo du lịch",
            content="""💡 Mẹo hữu ích cho chuyến đi:
• Đặt tour sớm để có giá tốt nhất
• Kiểm tra thời tiết trước khi đi
• Mang theo kem chống nắng, mũ nón
• Chuẩn bị thuốc cơ bản (đau bụng, cảm cúm)
• Giữ gìn vệ sinh môi trường
• Mua bảo hiểm du lịch khi đi xa"""
        )
    }
    
    # ============================================
    # FAQ
    # ============================================
    FAQ: List[FAQItem] = [
        FAQItem(
            question="Tour bao gồm những gì?",
            answer="Tour du lịch thường bao gồm: xe vận chuyển, ăn uống theo chương trình, lưu trú khách sạn, hướng dẫn viên, vé tham quan các điểm đến trong chương trình. Chi tiết xem trong mục 'Bao gồm' của từng tour.",
            tags=["booking", "tour", "general"]
        ),
        FAQItem(
            question="Tôi có thể đổi lịch tour không?",
            answer="Quý khách có thể đổi lịch tour trước ngày khởi hành 7 ngày, tùy thuộc vào tình trạng chỗ trống. Phí đổi lịch: 200.000đ/người. Đổi lịch trong vòng 7 ngày không được áp dụng.",
            tags=["booking", "reschedule", "change"]
        ),
        FAQItem(
            question="Trẻ em đi tour được giảm giá bao nhiêu?",
            answer="• Trẻ em dưới 5 tuổi: Miễn phí (ngồi ghế với bố mẹ, ngủ chung giường)\n• Trẻ em từ 5-11 tuổi: Giảm 50% giá tour (có ghế riêng, ngủ chung giường với bố mẹ)\n• Trẻ em từ 12 tuổi trở lên: Tính như người lớn",
            tags=["booking", "children", "price"]
        ),
        FAQItem(
            question="Tôi cần chuẩn bị gì trước khi đi tour?",
            answer="• Đặt tour và thanh toán trước 7 ngày\n• Mang theo CMND/CCCD hoặc hộ chiếu\n• Chuẩn bị trang phục phù hợp theo thời tiết\n• Kiểm tra lại hành lý và giấy tờ\n• Thông báo cho công ty nếu có thay đổi thông tin",
            tags=["preparation", "travel", "tips"]
        ),
        FAQItem(
            question="Nếu tour bị hủy thì sao?",
            answer="Nếu tour bị hủy do công ty (thiên tai, dịch bệnh, ít khách...), chúng tôi sẽ:\n• Thông báo cho quý khách sớm nhất\n• Hoàn tiền 100% trong vòng 3-5 ngày làm việc\n• Hỗ trợ đặt tour khác theo yêu cầu",
            tags=["cancellation", "refund", "emergency"]
        ),
        FAQItem(
            question="Làm sao để liên hệ khi cần hỗ trợ?",
            answer="Quý khách có thể liên hệ:\n• Hotline: 1900 xxxx (24/7)\n• Zalo/OA: TravelGPT\n• Email: support@travelgpt.vn\n• Facebook: TravelGPT Official\nĐội ngũ tư vấn sẵn sàng hỗ trợ 24/7!",
            tags=["contact", "support", "help"]
        ),
        FAQItem(
            question="Có tour trọn gói cho gia đình không?",
            answer="Chúng tôi có nhiều tour phù hợp cho gia đình với các tiêu chí:\n• Hoạt động vui chơi cho trẻ em\n• Lịch trình nhẹ nhàng, không quá mệt\n• Khách sạn có view đẹp, tiện nghi\n• Ăn uống đa dạng, phù hợp mọi lứa tuổi\nHãy hỏi tôi về nhu cầu cụ thể để được gợi ý tour phù hợp nhất!",
            tags=["family", "children", "recommendation"]
        ),
        FAQItem(
            question="Tour có bảo hiểm không?",
            answer="Tất cả các tour đều bao gồm bảo hiểm du lịch với mức bồi thường tối đa 100 triệu đồng/người cho các rủi ro trong chuyến đi. Quý khách có thể mua thêm bảo hiểm nâng cao nếu muốn.",
            tags=["insurance", "safety", "protection"]
        )
    ]
    
    # ============================================
    # GREETING & SMALL TALK RESPONSES
    # ============================================
    GREETING_SUGGESTIONS = [
        "Tìm tour Đà Nẵng 3 ngày",
        "Tour miền Bắc dưới 5 triệu",
        "Đặt tour biển mùa hè",
        "Tour gia đình 4 người",
        "Tour nổi bật nhất"
    ]
    
    # ============================================
    # METHODS
    # ============================================
    
    @classmethod
    def get_destination_info(cls, destination: str) -> Optional[DestinationInfo]:
        """Lấy thông tin điểm đến"""
        # Normalize
        dest_lower = destination.lower().strip()
        
        # Direct match
        if dest_lower in cls.DESTINATIONS:
            return cls.DESTINATIONS[dest_lower]
        
        # Partial match
        for key in cls.DESTINATIONS:
            if dest_lower in key or key in dest_lower:
                return cls.DESTINATIONS[key]
        
        return None
    
    @classmethod
    def get_region_info(cls, region: str) -> Optional[Dict[str, Any]]:
        """Lấy thông tin vùng miền"""
        region_normalized = region.strip()
        
        # Match variations
        region_map = {
            "miền bắc": "Miền Bắc", "mien bac": "Miền Bắc", "bắc": "Miền Bắc", "north": "Miền Bắc",
            "miền trung": "Miền Trung", "mien trung": "Miền Trung", "trung": "Miền Trung", "central": "Miền Trung",
            "miền nam": "Miền Nam", "mien nam": "Miền Nam", "nam": "Miền Nam", "south": "Miền Nam"
        }
        
        region_key = region_map.get(region_normalized.lower())
        if region_key:
            return cls.REGIONS.get(region_key)
        
        return None
    
    @classmethod
    def get_policy(cls, policy_name: str) -> Optional[PolicyInfo]:
        """Lấy thông tin chính sách"""
        return cls.POLICIES.get(policy_name.lower())
    
    @classmethod
    def search_faq(cls, query: str) -> List[FAQItem]:
        """Tìm kiếm FAQ theo query"""
        query_lower = query.lower()
        results = []
        
        for faq in cls.FAQ:
            # Match in question or tags
            if (query_lower in faq.question.lower() or 
                any(query_lower in tag for tag in faq.tags)):
                results.append(faq)
        
        return results
    
    @classmethod
    def get_tour_recommendation_context(cls, region: Optional[str] = None, 
                                         budget: Optional[str] = None,
                                         style: Optional[str] = None) -> str:
        """Tạo context cho LLM về đề xuất tour"""
        context_parts = []
        
        # Region info
        if region:
            region_info = cls.get_region_info(region)
            if region_info:
                context_parts.append(f"Về {region}: {region_info['description']}")
                context_parts.append(f"Điểm nổi bật: {', '.join(region_info['highlights'])}")
        
        # Add destination details if available
        if region:
            for dest_name, dest_info in cls.DESTINATIONS.items():
                if dest_info.region.lower() == region.lower():
                    context_parts.append(
                        f"- {dest_info.name}: {dest_info.description} "
                        f"(giá thường: {dest_info.typical_price_range})"
                    )
        
        return "\n".join(context_parts) if context_parts else ""
    
    @classmethod
    def get_general_info_context(cls) -> str:
        """Tạo context tổng quát cho LLM"""
        return f"""
## THÔNG TIN CHUNG VỀ DU LỊCH VIỆT NAM

### Các vùng miền nổi tiếng:
{cls._format_regions()}

### Chính sách hủy đặt tour:
{cls.POLICIES['cancellation'].content}

### Mẹo du lịch:
{cls.POLICIES['travel_tips'].content}

### Câu hỏi thường gặp:
{cls._format_faq()}
"""
    
    @classmethod
    def _format_regions(cls) -> str:
        """Format regions info"""
        lines = []
        for region_name, region_data in cls.REGIONS.items():
            lines.append(f"**{region_name}**: {region_data['description']}")
            lines.append(f"  Điểm đến nổi bật: {', '.join(region_data['highlights'])}")
            lines.append(f"  Thời điểm đẹp nhất: {region_data['best_season']}")
        return "\n".join(lines)
    
    @classmethod
    def _format_faq(cls) -> str:
        """Format FAQ"""
        lines = []
        for i, faq in enumerate(cls.FAQ[:5], 1):
            lines.append(f"**Q{i}: {faq.question}**")
            lines.append(f"A: {faq.answer}")
        return "\n".join(lines)
    
    @classmethod
    def format_destination_for_llm(cls, destination: str) -> str:
        """Format thông tin điểm đến cho LLM"""
        dest_info = cls.get_destination_info(destination)
        if not dest_info:
            return f"Tôi chưa có thông tin chi tiết về {destination}, nhưng tôi có thể giúp bạn tìm tour phù hợp!"
        
        return f"""
## Thông tin về {dest_info.name}:
- **Vị trí**: {dest_info.region}
- **Mô tả**: {dest_info.description}
- **Thời điểm đẹp nhất**: {dest_info.best_time}
- **Điểm nổi bật**: {', '.join(dest_info.highlights)}
- **Mức giá thường gặp**: {dest_info.typical_price_range}
"""
    
    @classmethod
    def get_empty_state_response(cls, query_type: str, user_query: str) -> str:
        """Tạo response khi không có data từ DB"""
        responses = {
            "search_tour": (
                "Hiện tại tôi chưa có tour cụ thể cho yêu cầu của bạn trong hệ thống. "
                "Tuy nhiên, dựa trên sở thích của bạn, tôi có thể gợi ý:\n\n"
                "• Liên hệ tư vấn trực tiếp để được cập nhật tour mới nhất\n"
                "• Thử thay đổi ngân sách hoặc điểm đến để xem các gợi ý khác\n"
                "• Để lại số điện thoại, tôi sẽ liên hệ lại khi có tour phù hợp"
            ),
            "destination_info": (
                "Tôi chưa có thông tin chi tiết về điểm đến bạn quan tâm trong hệ thống. "
                "Bạn có thể cho tôi biết thêm chi tiết để được hỗ trợ tốt hơn, "
                "hoặc liên hệ hotline để được tư vấn trực tiếp!"
            ),
            "booking_help": (
                "Để hỗ trợ bạn đặt tour, tôi cần một số thông tin:\n"
                "• Điểm đến bạn muốn đi\n"
                "• Ngân sách dự kiến\n"
                "• Số người đi (người lớn và trẻ em)\n"
                "• Ngày khởi hành dự kiến\n\n"
                "Bạn có thể cung cấp thông tin này không?"
            )
        }
        
        return responses.get(query_type, responses["search_tour"])
