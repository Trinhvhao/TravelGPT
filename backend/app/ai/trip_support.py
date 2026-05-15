"""
Pre-trip & Post-trip Support - Hỗ trợ trước và sau chuyến đi
"""
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
import json


@dataclass
class ChecklistItem:
    """Item trong checklist"""
    id: str
    category: str
    item: str
    is_checked: bool = False
    is_important: bool = False
    notes: Optional[str] = None


@dataclass
class TripPlan:
    """Kế hoạch chuyến đi"""
    booking_code: str
    tour_name: str
    destination: str
    departure_date: datetime
    return_date: datetime
    num_adults: int
    num_children: int
    checklist: List[ChecklistItem]
    weather_info: Optional[Dict[str, Any]] = None
    local_tips: List[str] = None
    packing_list: List[str] = None


class PreTripSupport:
    """
    Pre-trip Support - Hỗ trợ chuẩn bị trước chuyến đi
    """
    
    # Default checklist templates
    DOCUMENTS_CHECKLIST = [
        {"id": "doc_1", "category": "documents", "item": "CMND/CCCD", "is_important": True},
        {"id": "doc_2", "category": "documents", "item": "Hộ chiếu (nếu đi nước ngoài)", "is_important": True},
        {"id": "doc_3", "category": "documents", "item": "Vé máy bay/ voucher", "is_important": True},
        {"id": "doc_4", "category": "documents", "item": "Xác nhận booking khách sạn", "is_important": True},
        {"id": "doc_5", "category": "documents", "item": "Bảo hiểm du lịch", "is_important": False},
        {"id": "doc_6", "category": "documents", "item": "Giấy tờ xe (nếu tự lái)", "is_important": False},
        {"id": "doc_7", "category": "documents", "item": "Thẻ tín dụng/Tiền mặt", "is_important": True},
    ]
    
    PACKING_CHECKLIST = [
        {"id": "pack_1", "category": "packing", "item": "Quần áo theo thời tiết", "is_important": True},
        {"id": "pack_2", "category": "packing", "item": "Kem chống nắng", "is_important": True},
        {"id": "pack_3", "category": "packing", "item": "Kính râm", "is_important": False},
        {"id": "pack_4", "category": "packing", "item": "Mũ/nón", "is_important": True},
        {"id": "pack_5", "category": "packing", "item": "Thuốc chống côn trùng", "is_important": False},
        {"id": "pack_6", "category": "packing", "item": "Túi nilon/chống nước", "is_important": False},
        {"id": "pack_7", "category": "packing", "item": "Bình nước cá nhân", "is_important": False},
        {"id": "pack_8", "category": "packing", "item": "Sạc dự phòng", "is_important": True},
    ]
    
    HEALTH_CHECKLIST = [
        {"id": "health_1", "category": "health", "item": "Thuốc đau bụng", "is_important": True},
        {"id": "health_2", "category": "health", "item": "Thuốc cảm cúm", "is_important": False},
        {"id": "health_3", "category": "health", "item": "Băng keo, bông y tế", "is_important": False},
        {"id": "health_4", "category": "health", "item": "Thuốc dị ứng (nếu có)", "is_important": True},
        {"id": "health_5", "category": "health", "item": "Thuốc men thường dùng", "is_important": False},
    ]
    
    ELECTRONICS_CHECKLIST = [
        {"id": "elec_1", "category": "electronics", "item": "Điện thoại + sạc", "is_important": True},
        {"id": "elec_2", "category": "electronics", "item": "Máy ảnh (nếu có)", "is_important": False},
        {"id": "elec_3", "category": "electronics", "item": "Ổ cắm điện du lịch", "is_important": False},
        {"id": "elec_4", "category": "electronics", "item": "Tai nghe", "is_important": False},
        {"id": "elec_5", "category": "electronics", "item": "Gậy selfie", "is_important": False},
    ]
    
    @staticmethod
    def get_complete_checklist(trip_type: str = "beach") -> List[ChecklistItem]:
        """Lấy checklist đầy đủ dựa trên loại trip"""
        all_items = []
        
        # Always include documents
        for item in PreTripSupport.DOCUMENTS_CHECKLIST:
            all_items.append(ChecklistItem(**item))
        
        # Add packing items
        for item in PreTripSupport.PACKING_CHECKLIST:
            all_items.append(ChecklistItem(**item))
        
        # Add health items
        for item in PreTripSupport.HEALTH_CHECKLIST:
            all_items.append(ChecklistItem(**item))
        
        # Add electronics
        for item in PreTripSupport.ELECTRONICS_CHECKLIST:
            all_items.append(ChecklistItem(**item))
        
        # Add trip-specific items
        if trip_type == "beach":
            all_items.extend([
                ChecklistItem(id="beach_1", category="beach", item="Đồ bơi", is_important=True),
                ChecklistItem(id="beach_2", category="beach", item="Kính bơi", is_important=False),
                ChecklistItem(id="beach_3", category="beach", item="Dép tổ ong", is_important=True),
            ])
        elif trip_type == "mountain":
            all_items.extend([
                ChecklistItem(id="mt_1", category="mountain", item="Giày leo núi", is_important=True),
                ChecklistItem(id="mt_2", category="mountain", item="Balo", is_important=True),
                ChecklistItem(id="mt_3", category="mountain", item="Áo mưa", is_important=True),
                ChecklistItem(id="mt_4", category="mountain", item="Găng tay", is_important=False),
            ])
        elif trip_type == "city":
            all_items.extend([
                ChecklistItem(id="city_1", category="city", item="Áo thun đẹp", is_important=True),
                ChecklistItem(id="city_2", category="city", item="Giày đi bộ thoải mái", is_important=True),
                ChecklistItem(id="city_3", category="city", item="Máy ảnh", is_important=False),
            ])
        
        return all_items
    
    @staticmethod
    def format_checklist(checklist: List[ChecklistItem], show_checked: bool = True) -> str:
        """Format checklist thành markdown"""
        lines = ["## 📋 CHECKLIST CHUẨN BỊ\n"]
        
        # Group by category
        categories = {}
        for item in checklist:
            if item.category not in categories:
                categories[item.category] = []
            categories[item.category].append(item)
        
        category_names = {
            "documents": "📄 Giấy tờ",
            "packing": "🎒 Đồ dùng",
            "health": "💊 Sức khỏe",
            "electronics": "🔌 Thiết bị điện tử",
            "beach": "🏖️ Đồ biển",
            "mountain": "⛰️ Đồ leo núi",
            "city": "🏙️ Đồ dành cho thành phố"
        }
        
        for category, items in categories.items():
            lines.append(f"\n### {category_names.get(category, category.title())}\n")
            
            for item in items:
                if not show_checked and item.is_checked:
                    continue
                    
                checkbox = "✅" if item.is_checked else "⬜"
                important = "🔥" if item.is_important else ""
                
                lines.append(f"{checkbox} {item.item} {important}")
        
        return "\n".join(lines)
    
    @staticmethod
    def get_countdown_message(departure_date: datetime) -> str:
        """Tạo message đếm ngược"""
        now = datetime.now()
        days_left = (departure_date - now).days
        
        if days_left < 0:
            return "Chuyến đi đã bắt đầu!"
        elif days_left == 0:
            return "Hôm nay là ngày khởi hành! Chúc bạn có chuyến đi vui vẻ!"
        elif days_left == 1:
            return "🌟 **Ngày mai khởi hành!**"
        elif days_left <= 3:
            return f"⏰ Còn **{days_left} ngày** nữa là khởi hành!"
        elif days_left <= 7:
            return f"📅 Còn **{days_left} ngày** nữa - Đã chuẩn bị xong chưa?"
        else:
            return f"📆 Còn **{days_left} ngày** - Bắt đầu chuẩn bị nhé!"
    
    @staticmethod
    def get_packing_tips(trip_type: str, destination: str, duration: int) -> str:
        """Gợi ý đóng gói dựa trên trip type"""
        tips = []
        
        # Duration-based tips
        if duration <= 3:
            tips.append("• Đi ngắn ngày: chỉ cần 2-3 bộ quần áo")
            tips.append("• Mang theo túi nilon để phòng mưa")
        elif duration <= 5:
            tips.append("• Đi vài ngày: 3-4 bộ để thay")
            tips.append("• Nên mang ít nhất 1 bộ dự phòng")
        else:
            tips.append("• Đi dài ngày: giặt đồ tại chỗ nếu có thể")
            tips.append("• Mang đủ thuốc và vật dụng cá nhân")
        
        # Trip type tips
        if trip_type == "beach":
            tips.extend([
                "• Đồ bơi, kem chống nắng SPF 50+",
                "• Dép tổ ong/dé xỏ ngón cho bãi biển",
                "• Khăn tắm beach (có thể mua tại chỗ)"
            ])
        elif trip_type == "mountain":
            tips.extend([
                "• Giày trekking chống trượt",
                "• Áo giữ nhiệt, áo mưa",
                "• Đèn pin/điện thoại có pin dự phòng"
            ])
        elif trip_type == "city":
            tips.extend([
                "• Quần áo thoải mái để đi bộ",
                "• Giày sneaker thoải mái",
                "• Balo nhỏ đựng đồ khi đi chơi"
            ])
        
        return "\n".join(tips)
    
    @staticmethod
    def get_local_tips(destination: str) -> List[Dict[str, str]]:
        """Lấy mẹo địa phương cho destination"""
        tips_db = {
            "đà nẵng": [
                {"title": "Thời tiết", "tip": "Mùa hè nắng nóng, mùa đông se lạnh. Tháng 5-9 là mùa biển lý tưởng."},
                {"title": "Di chuyển", "tip": "Grab/Be là app taxi phổ biến. Xe máy thuê ~100-150k/ngày."},
                {"title": "Ẩm thực", "tip": "Bánh tráng thịt heo, mì Quảng, bún chả cá - giá 20-50k/bát."},
                {"title": "Lưu ý", "tip": "Cầu Rồng bắn lửa vào T7, CN hàng tuần lúc 21h."}
            ],
            "nha trang": [
                {"title": "Thời tiết", "tip": "Nắng quanh năm, tốt nhất tháng 3-9. Mùa mưa tháng 10-12."},
                {"title": "Di chuyển", "tip": "Thuê xe máy ~150k/ngày. Xe ôm đi vòng quanh thành phố ~20-30k."},
                {"title": "Ẩm thực", "tip": "Bún cá, nem nướng, yến sào Nha Trang nổi tiếng."},
                {"title": "Lưu ý", "tip": "Vinpearl Land giá vé ~600k, nên đi cả ngày."}
            ],
            "hội an": [
                {"title": "Thời tiết", "tip": "Nắng nhẹ, mùa khô tháng 3-9. Mùa mưa tháng 10-2."},
                {"title": "Di chuyển", "tip": "Đi bộ trong phố cổ. Thuê xe đạp ~30k/ngày."},
                {"title": "Ẩm thực", "tip": "Bánh vạc, cao lầu, mì Quảng - thử ở quán Trà Mi."},
                {"title": "Lưu ý", "tip": "Phố đi bộ bật đèn đèn lồng vào buổi tối, rất đẹp."}
            ],
            "phú quốc": [
                {"title": "Thời tiết", "tip": "Nắng nóng quanh năm, tốt nhất tháng 11-3. Mùa mưa tháng 5-10."},
                {"title": "Di chuyển", "tip": "Thuê xe máy là tốt nhất ~120k/ngày. Xe ôm ~20k/lần."},
                {"title": "Ẩm thực", "tip": "Hải sản tươi sống ở bãi Sao, giá mềm hơn tại thị trấn."},
                {"title": "Lưu ý", "tip": "Grand World Phú Quốc - khu vui chơi mới rất hot."}
            ],
            "sapa": [
                {"title": "Thời tiết", "tip": "Mát mẻ quanh năm, lạnh nhất tháng 12-2 (có thể xuống 0°C)."},
                {"title": "Di chuyển", "tip": "Thuê xe máy/ô tô để đi tham quan. Đường đèo nhiều cua."},
                {"title": "Ẩm thực", "tip": "Thịt lợn cắp nách, cá hồi, rượu táo mèo - đặc sản vùng cao."},
                {"title": "Lưu ý", "tip": "Nên đi Fansipan sáng sớm, mang theo áo ấm dù là mùa hè."}
            ]
        }
        
        dest_lower = destination.lower()
        for key, tips in tips_db.items():
            if key in dest_lower:
                return tips
        
        # Default tips
        return [
            {"title": "Chuẩn bị", "tip": "Kiểm tra thời tiết trước khi đi, mang theo đồ dùng cá nhân."},
            {"title": "Di chuyển", "tip": "Nên đặt vé trước, đặt xe/hostel trước để được giá tốt."},
            {"title": "An toàn", "tip": "Giữ gìn đồ đạc, cẩn thận khi đi xe máy."}
        ]
    
    @staticmethod
    def get_weather_reminder(destination: str, departure_date: datetime) -> str:
        """Tạo reminder về thời tiết"""
        month = departure_date.month
        
        weather_db = {
            "đà nẵng": {
                range(1, 3): ("Mùa xuân", "Thời tiết dễ chịu, 20-28°C", "Mang áo khoác nhẹ"),
                range(3, 6): ("Mùa hè", "Nắng nóng, 28-38°C", "Kem chống nắng, mũ nón"),
                range(6, 10): ("Mùa thu", "Mát mẻ, 25-32°C", "Thời tiết lý tưởng"),
                range(10, 13): ("Mùa đông", "Se lạnh, 18-25°C", "Mang áo ấm")
            },
            "nha trang": {
                range(1, 3): ("Mùa xuân", "Nắng nhẹ, 23-28°C", "Thời tiết tuyệt vời"),
                range(3, 10): ("Mùa hè", "Nắng nóng, 28-35°C", "Kem chống nắng, đồ bơi"),
                range(10, 13): ("Mùa thu", "Mát mẻ, 22-28°C", "Lý tưởng để đi")
            }
        }
        
        for dest, seasons in weather_db.items():
            if dest in destination.lower():
                for months, (season, temp, tip) in seasons.items():
                    if month in months:
                        return f"""
🌤️ **THÔNG TIN THỜI TIẾT**

Điểm đến: {destination.title()}
Dự kiến: {season} ({temp})

💡 **{tip}**

*Note: Thông tin chỉ mang tính tham khảo, thời tiết có thể thay đổi.*
"""
        
        return f"""
🌤️ **THÔNG TIN THỜI TIẾT**

Điểm đến: {destination.title()}
Ngày đi: {departure_date.strftime('%d/%m/%Y')}

💡 Nên kiểm tra thời tiết 3 ngày trước khi khởi hành để chuẩn bị phù hợp.
"""


class PostTripSupport:
    """
    Post-trip Support - Hỗ trợ sau chuyến đi
    """
    
    @staticmethod
    def generate_feedback_survey(booking_code: str, tour_name: str) -> str:
        """Tạo survey feedback sau chuyến đi"""
        return f"""
# 📝 KHẢO SÁT SAU CHUYẾN ĐI

## {tour_name}

Cảm ơn bạn đã hoàn thành chuyến đi! Hãy chia sẻ trải nghiệm của bạn để chúng tôi phục vụ tốt hơn.

### 1. Mức độ hài lòng tổng thể
[ ] Rất hài lòng ⭐⭐⭐⭐⭐
[ ] Hài lòng ⭐⭐⭐⭐
[ ] Bình thường ⭐⭐⭐
[ ] Không hài lòng ⭐⭐
[ ] Rất không hài lòng ⭐

### 2. Đánh giá các khía cạnh

**Hướng dẫn viên:**
[ ] Xuất sắc [ ] Tốt [ ] Bình thường [ ] Cần cải thiện

**Lịch trình:**
[ ] Đúng như kế hoạch [ ] Có thay đổi nhỏ [ ] Thay đổi nhiều

**Chất lượng xe/đi lại:**
[ ] Rất tốt [ ] Tốt [ ] Bình thường [ ] Kém

**Bữa ăn:**
[ ] Ngon [ ] Bình thường [ ] Không ngon

**Chỗ ở (nếu có):**
[ ] Xuất sắc [ ] Tốt [ ] Bình thường [ ] Cần cải thiện

### 3. Bạn biết đến TravelGPT qua kênh nào?
[ ] Facebook [ ] Google [ ] Bạn bè giới thiệu [ ] Đã đặt trước đó

### 4. Nhận xét khác
```
(Vui lòng chia sẻ thêm trải nghiệm của bạn)
```

---
Mã booking: {booking_code}
Cảm ơn bạn! 💜
"""
    
    @staticmethod
    def generate_review_prompt(tour_name: str, destination: str) -> str:
        """Tạo prompt để user viết review"""
        return f"""
# ✍️ VIẾT REVIEW CHO TOUR

## {tour_name}
📍 {destination}

Chia sẻ trải nghiệm của bạn để giúp những người đi sau có quyết định tốt hơn!

### Gợi ý nội dung:

**1. Điều gì khiến bạn ấn tượng nhất?**
```
VD: Điểm dừng chân tại..., guide rất nhiệt tình...
```

**2. Có điều gì bạn muốn lưu ý cho người đi sau?**
```
VD: Nên mang thêm kem chống nắng, giày thoải mái...
```

**3. Bạn sẽ giới thiệu TravelGPT cho bạn bè không?**
```
VD: Chắc chắn sẽ giới thiệu vì...
```

---
Ví dụ review ngắn:
⭐⭐⭐⭐⭐
"Tour rất ok, guide Minh nhiệt tình, ăn ngon, lịch trình hợp lý. Đi biển Nha Trang mùa hè rất đẹp!"
"""
    
    @staticmethod
    def get_return_reminders(tour_name: str, return_date: datetime) -> str:
        """Nhắc nhở khi trở về"""
        days_until = (return_date - datetime.now()).days
        
        if days_until > 0:
            return f"""
🏠 **NHẮC NHỞ KHI TRỞ VỀ**

Tour: {tour_name}
Ngày kết thúc: {return_date.strftime('%d/%m/%Y')}

### Trước khi về:
- [ ] Kiểm tra lại đồ đạc trong phòng
- [ ] Mang theo tất cả giấy tờ quan trọng
- [ ] Chụp ảnh hóa đơn/chi phí phát sinh (nếu cần)
- [ ] Check-out đúng giờ quy định

### Sau khi về:
- [ ] Nghỉ ngơi và khôi phục sức khỏe
- [ ] Chia sẻ review trên TravelGPT
- [ ] Gửi feedback về chuyến đi
- [ ] Lưu giữ ảnh kỷ niệm

Cảm ơn bạn đã đồng hành cùng TravelGPT! 💜
"""
        else:
            return f"""
🏠 **CHÀO MỪNG VỀ NHÀ!**

Tour: {tour_name}
Đã kết thúc: {return_date.strftime('%d/%m/%Y')}

Cảm ơn bạn đã tin tưởng TravelGPT cho chuyến đi vừa rồi!

### Bạn cần làm gì tiếp theo?
1. ✍️ **Viết review** - Chia sẻ trải nghiệm
2. 📝 **Feedback** - Giúp chúng tôi cải thiện
3. 🔄 **Đặt tour tiếp theo** - Tiếp tục khám phá

Chúc bạn sớm hồi phục sau chuyến đi! 💜
"""
    
    @staticmethod
    def calculate_loyalty_points(
        num_adults: int,
        num_children: int,
        total_spent: float,
        is_first_booking: bool = False
    ) -> Dict[str, Any]:
        """Tính điểm tích lũy cho khách hàng thân thiện"""
        # Base points: 1 point per 100k spent
        base_points = int(total_spent / 100000)
        
        # Multipliers
        multiplier = 1.0
        if num_adults >= 3:
            multiplier += 0.2  # Group discount bonus
        if num_children > 0:
            multiplier += 0.1  # Family bonus
        
        # First booking bonus
        if is_first_booking:
            base_points += 50  # Welcome bonus
        
        total_points = int(base_points * multiplier)
        
        # Determine tier
        tier = "Bronze"
        if total_points >= 500:
            tier = "Silver"
        if total_points >= 1000:
            tier = "Gold"
        if total_points >= 5000:
            tier = "Platinum"
        
        next_tier_points = {
            "Bronze": 500,
            "Silver": 1000,
            "Gold": 5000,
            "Platinum": None
        }
        
        return {
            "earned_points": total_points,
            "tier": tier,
            "next_tier": next_tier_points.get(tier),
            "points_to_next_tier": next_tier_points.get(tier) - total_points if next_tier_points.get(tier) else None,
            "benefits": PostTripSupport._get_tier_benefits(tier)
        }
    
    @staticmethod
    def _get_tier_benefits(tier: str) -> List[str]:
        """Lấy quyền lợi theo tier"""
        benefits = {
            "Bronze": ["Tích điểm 1% giá trị tour"],
            "Silver": ["Tích điểm 1.5% giá trị tour", "Ưu đãi 5% cho tour tiếp theo"],
            "Gold": ["Tích điểm 2% giá trị tour", "Ưu đãi 10%", "Hỗ trợ ưu tiên"],
            "Platinum": ["Tích điểm 3% giá trị tour", "Ưu đãi 15%", "Quà tặng đặc biệt", "Early access tour mới"]
        }
        return benefits.get(tier, benefits["Bronze"])


class TripAssistant:
    """
    Trip Assistant - Kết hợp Pre-trip và Post-trip
    """
    
    def __init__(self):
        self.pre_trip = PreTripSupport()
        self.post_trip = PostTripSupport()
    
    def get_trip_assistant_message(
        self,
        action: str,
        booking_code: str,
        tour_name: str,
        destination: str,
        departure_date: datetime,
        return_date: datetime,
        num_adults: int = 1,
        num_children: int = 0,
        **kwargs
    ) -> str:
        """Get appropriate message based on action"""
        
        if action == "countdown":
            return self.pre_trip.get_countdown_message(departure_date)
        
        elif action == "checklist":
            trip_type = kwargs.get("trip_type", "city")
            checklist = self.pre_trip.get_complete_checklist(trip_type)
            return self.pre_trip.format_checklist(checklist)
        
        elif action == "weather":
            return self.pre_trip.get_weather_reminder(destination, departure_date)
        
        elif action == "packing_tips":
            trip_type = kwargs.get("trip_type", "city")
            duration = (return_date - departure_date).days
            tips = self.pre_trip.get_packing_tips(trip_type, destination, duration)
            return f"## 🎒 MẸO ĐÓNG GÓI\n\n{tips}"
        
        elif action == "local_tips":
            tips = self.pre_trip.get_local_tips(destination)
            lines = [f"## 💡 MẸO ĐỊA PHƯƠNG: {destination.title()}\n"]
            for tip in tips:
                lines.append(f"\n### {tip['title']}\n{tip['tip']}")
            return "\n".join(lines)
        
        elif action == "pre_trip_summary":
            # Full pre-trip summary
            countdown = self.pre_trip.get_countdown_message(departure_date)
            weather = self.pre_trip.get_weather_reminder(destination, departure_date)
            tips = self.pre_trip.get_local_tips(destination)
            trip_type = kwargs.get("trip_type", "city")
            packing = self.pre_trip.get_packing_tips(trip_type, destination, (return_date - departure_date).days)
            
            lines = [
                countdown,
                "",
                weather,
                "",
                "## 💡 MẸO ĐỊA PHƯƠNG"
            ]
            for tip in tips:
                lines.append(f"\n**{tip['title']}:** {tip['tip']}")
            
            lines.extend(["", "## 🎒 MẸO ĐÓNG GÓI", packing])
            
            return "\n".join(lines)
        
        elif action == "feedback":
            return self.post_trip.generate_feedback_survey(booking_code, tour_name)
        
        elif action == "review":
            return self.post_trip.generate_review_prompt(tour_name, destination)
        
        elif action == "return_reminder":
            return self.post_trip.get_return_reminders(tour_name, return_date)
        
        elif action == "loyalty":
            total_spent = kwargs.get("total_spent", 0)
            is_first = kwargs.get("is_first_booking", False)
            loyalty = self.post_trip.calculate_loyalty_points(
                num_adults, num_children, total_spent, is_first
            )
            lines = [
                f"## 🎁 CHƯƠNG TRÌNH TÍCH ĐIỂM",
                f"\nBạn đã nhận được: **{loyalty['earned_points']} điểm**",
                f"\n**Hạng thành viên:** {loyalty['tier']} 🏅",
                "\n### Quyền lợi:"
            ]
            for benefit in loyalty["benefits"]:
                lines.append(f"• {benefit}")
            
            if loyalty["points_to_next_tier"]:
                lines.append(f"\nCòn **{loyalty['points_to_next_tier']} điểm** để lên {loyalty['next_tier']}!")
            
            return "\n".join(lines)
        
        elif action == "post_trip_summary":
            # Full post-trip message
            loyalty = self.post_trip.calculate_loyalty_points(
                num_adults, num_children, kwargs.get("total_spent", 0), 
                kwargs.get("is_first_booking", False)
            )
            feedback = self.post_trip.generate_feedback_survey(booking_code, tour_name)
            
            return f"""
## 🎉 CẢM ƠN BẠN ĐÃ ĐỒNG HÀNH!

### Điểm tích lũy
Bạn nhận được: **{loyalty['earned_points']} điểm**
Hạng: **{loyalty['tier']}**

### Chia sẻ trải nghiệm
{feedback}
"""
        
        return "Không có thông tin nào phù hợp."
