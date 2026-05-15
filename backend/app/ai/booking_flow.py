"""
Smart Booking Flow Engine - Tự động hướng dẫn user qua các bước đặt tour
"""
from typing import Dict, Any, Optional, List
from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime, date
import re


class BookingStep(str, Enum):
    """Các bước trong flow đặt tour"""
    GREETING = "greeting"
    COLLECT_NAME = "collect_name"
    COLLECT_EMAIL = "collect_email"
    COLLECT_PHONE = "collect_phone"
    COLLECT_TOUR = "collect_tour"
    COLLECT_DATE = "collect_date"
    COLLECT_PARTICIPANTS = "collect_participants"
    COLLECT_SPECIAL_REQUESTS = "collect_special_requests"
    CONFIRM_BOOKING = "confirm_booking"
    PROCESSING = "processing"
    SUCCESS = "success"
    ERROR = "error"
    COMPLETED = "completed"


@dataclass
class BookingData:
    """Lưu trữ thông tin booking trong quá trình conversation"""
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    tour_id: Optional[str] = None
    tour_name: Optional[str] = None
    departure_date: Optional[str] = None
    num_adults: int = 1
    num_children: int = 0
    special_requests: Optional[str] = None
    total_price: Optional[float] = None
    booking_code: Optional[str] = None
    
    def to_booking_dict(self) -> Dict[str, Any]:
        return {
            "contact_name": self.name,
            "contact_email": self.email,
            "contact_phone": self.phone,
            "tour_id": self.tour_id,
            "departure_date": self.departure_date,
            "num_adults": self.num_adults,
            "num_children": self.num_children,
            "special_requests": self.special_requests
        }
    
    def is_complete(self) -> bool:
        return all([
            self.name,
            self.email,
            self.phone,
            self.tour_id,
            self.departure_date
        ])


class SmartBookingFlow:
    """
    Smart Booking Flow Engine - Xử lý booking flow tự động
    """
    
    # Mapping từ step hiện tại sang step tiếp theo dựa trên intent
    STEP_INTENT_MAP = {
        BookingStep.GREETING: [BookingStep.COLLECT_NAME, BookingStep.COLLECT_TOUR],
        BookingStep.COLLECT_NAME: BookingStep.COLLECT_EMAIL,
        BookingStep.COLLECT_EMAIL: BookingStep.COLLECT_PHONE,
        BookingStep.COLLECT_PHONE: BookingStep.COLLECT_TOUR,
        BookingStep.COLLECT_TOUR: BookingStep.COLLECT_DATE,
        BookingStep.COLLECT_DATE: BookingStep.COLLECT_PARTICIPANTS,
        BookingStep.COLLECT_PARTICIPANTS: BookingStep.COLLECT_SPECIAL_REQUESTS,
        BookingStep.COLLECT_SPECIAL_REQUESTS: BookingStep.CONFIRM_BOOKING,
        BookingStep.CONFIRM_BOOKING: BookingStep.PROCESSING,
        BookingStep.SUCCESS: BookingStep.COMPLETED,
    }
    
    REQUIRED_FIELDS = {
        BookingStep.COLLECT_NAME: "name",
        BookingStep.COLLECT_EMAIL: "email",
        BookingStep.COLLECT_PHONE: "phone",
        BookingStep.COLLECT_TOUR: "tour_id",
        BookingStep.COLLECT_DATE: "departure_date",
        BookingStep.COLLECT_PARTICIPANTS: "participants",
    }
    
    def __init__(self):
        self.current_step: BookingStep = BookingStep.GREETING
        self.booking_data = BookingData()
        self.collected_info: List[str] = []
        self.missing_fields: List[str] = []
        self.confirmation_needed = False
        self.is_active = False
    
    def start_flow(self, tour_id: Optional[str] = None, tour_name: Optional[str] = None) -> Dict[str, Any]:
        """Bắt đầu booking flow"""
        self.is_active = True
        self.current_step = BookingStep.GREETING
        self.booking_data = BookingData(tour_id=tour_id, tour_name=tour_name)
        self.collected_info = []
        
        return {
            "step": self.current_step.value,
            "message": "Chào mừng bạn đến với TravelGPT! Tôi sẽ giúp bạn đặt tour du lịch một cách dễ dàng. Bắt đầu nào! Bạn tên là gì?",
            "is_complete": False,
            "booking_data": self._get_summary()
        }
    
    def process_message(self, message: str, intent: str, extracted_data: Dict[str, Any], db=None) -> Dict[str, Any]:
        """Xử lý message và tiến flow booking"""
        if not self.is_active:
            return self._handle_not_in_flow(message)
        
        message_lower = message.lower()
        self._update_booking_data(message_lower, extracted_data)
        
        # Kiểm tra xem có intent đặc biệt không
        if intent in ["cancel_booking", "goodbye"]:
            return self._cancel_flow()
        
        # Kiểm tra nếu user muốn xem lại thông tin
        if any(kw in message_lower for kw in ["xem lại", "kiểm tra", "thông tin đã có", "đã nhập"]):
            return self._show_current_info()
        
        # Kiểm tra nếu user muốn đổi thông tin
        change_match = re.search(r"(?:đổi|thay đổi|sửa)\s+(?:tên|email|sđt|điện thoại|ngày|số người|tour)", message_lower)
        if change_match:
            return self._handle_change_request(message_lower)
        
        # Xử lý theo step hiện tại
        response = self._process_current_step(message_lower, extracted_data)
        
        return response
    
    def _update_booking_data(self, message: str, extracted_data: Dict[str, Any]):
        """Cập nhật booking data từ extracted data và message"""
        # Name extraction
        if not self.booking_data.name:
            name_match = re.search(r"(?:tên|tôi là|tên tôi là)\s*[:\s]*([A-Za-zÀ-ỹ\s]+?)(?:\s|,|$|\.)", message)
            if name_match:
                self.booking_data.name = name_match.group(1).strip().title()
            elif extracted_data.get("name"):
                self.booking_data.name = extracted_data["name"]
        
        # Email extraction
        if not self.booking_data.email:
            email_match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", message)
            if email_match:
                self.booking_data.email = email_match.group(0).lower()
            elif extracted_data.get("email"):
                self.booking_data.email = extracted_data["email"]
        
        # Phone extraction
        if not self.booking_data.phone:
            phone_match = re.search(r"(?:sdt|số điện thoại|điện thoại)?[:\s]*(\d{9,11})", message)
            if phone_match:
                self.booking_data.phone = phone_match.group(1)
            elif extracted_data.get("phone"):
                self.booking_data.phone = extracted_data["phone"]
        
        # Participants
        if extracted_data.get("num_adults"):
            self.booking_data.num_adults = extracted_data["num_adults"]
        if extracted_data.get("num_children"):
            self.booking_data.num_children = extracted_data["num_children"]
        
        # Tour info
        if extracted_data.get("tour_id"):
            self.booking_data.tour_id = extracted_data["tour_id"]
        if extracted_data.get("tour_name"):
            self.booking_data.tour_name = extracted_data["tour_name"]
        
        # Departure date
        if extracted_data.get("departure_date"):
            self.booking_data.departure_date = extracted_data["departure_date"]
        elif extracted_data.get("preferred_date"):
            self.booking_data.departure_date = extracted_data["preferred_date"]
        
        # Special requests
        if any(kw in message for kw in ["yêu cầu", "lưu ý", "ghi chú", "đặc biệt"]):
            self.booking_data.special_requests = message
    
    def _process_current_step(self, message: str, extracted_data: Dict[str, Any]) -> Dict[str, Any]:
        """Xử lý step hiện tại và quyết định next step"""
        
        if self.current_step == BookingStep.GREETING:
            # Check nếu đã có tour được chọn từ trước
            if self.booking_data.tour_id:
                self.current_step = BookingStep.COLLECT_NAME
                return {
                    "step": self.current_step.value,
                    "message": f"Tuyệt vời! Tôi thấy bạn quan tâm đến tour {self.booking_data.tour_name}. Để đặt tour này, cho tôi biết tên của bạn nhé!",
                    "is_complete": False,
                    "booking_data": self._get_summary()
                }
            else:
                self.current_step = BookingStep.COLLECT_NAME
                return {
                    "step": self.current_step.value,
                    "message": "Bạn tên là gì vậy?",
                    "is_complete": False,
                    "booking_data": self._get_summary()
                }
        
        elif self.current_step == BookingStep.COLLECT_NAME:
            if self.booking_data.name:
                self.collected_info.append("tên")
                self.current_step = BookingStep.COLLECT_EMAIL
                return {
                    "step": self.current_step.value,
                    "message": f"Rất vui được gặp bạn {self.booking_data.name}! Cho tôi xin email liên hệ của bạn nhé?",
                    "is_complete": False,
                    "booking_data": self._get_summary()
                }
            else:
                return {
                    "step": self.current_step.value,
                    "message": "Xin lỗi, tôi chưa bắt được tên của bạn. Bạn có thể nhập lại tên được không?",
                    "is_complete": False,
                    "booking_data": self._get_summary()
                }
        
        elif self.current_step == BookingStep.COLLECT_EMAIL:
            if self.booking_data.email:
                self.collected_info.append("email")
                self.current_step = BookingStep.COLLECT_PHONE
                return {
                    "step": self.current_step.value,
                    "message": f"Email đã nhận: {self.booking_data.email}. Số điện thoại liên hệ của bạn là gì?",
                    "is_complete": False,
                    "booking_data": self._get_summary()
                }
            else:
                return {
                    "step": self.current_step.value,
                    "message": "Email chưa đúng định dạng. Bạn nhập lại email được không? (Ví dụ: email@example.com)",
                    "is_complete": False,
                    "booking_data": self._get_summary()
                }
        
        elif self.current_step == BookingStep.COLLECT_PHONE:
            if self.booking_data.phone:
                self.collected_info.append("số điện thoại")
                self.current_step = BookingStep.COLLECT_DATE
                return {
                    "step": self.current_step.value,
                    "message": f"Đã ghi nhận SĐT: {self.booking_data.phone}. Bạn muốn khởi hành vào ngày nào? (Ví dụ: 20/05/2024)",
                    "is_complete": False,
                    "booking_data": self._get_summary()
                }
            else:
                return {
                    "step": self.current_step.value,
                    "message": "Số điện thoại chưa hợp lệ. Bạn nhập lại SĐT (9-11 số) được không?",
                    "is_complete": False,
                    "booking_data": self._get_summary()
                }
        
        elif self.current_step == BookingStep.COLLECT_DATE:
            if self.booking_data.departure_date:
                self.collected_info.append("ngày khởi hành")
                self.current_step = BookingStep.COLLECT_PARTICIPANTS
                return {
                    "step": self.current_step.value,
                    "message": f"OK! Khởi hành ngày {self.booking_data.departure_date}. Có bao nhiêu người đi vậy bạn? (Ví dụ: 2 người lớn, 1 trẻ em)",
                    "is_complete": False,
                    "booking_data": self._get_summary()
                }
            else:
                return {
                    "step": self.current_step.value,
                    "message": "Ngày khởi hành chưa rõ. Bạn nhập lại ngày được không? (Ví dụ: 25/12/2024)",
                    "is_complete": False,
                    "booking_data": self._get_summary()
                }
        
        elif self.current_step == BookingStep.COLLECT_PARTICIPANTS:
            if self.booking_data.num_adults > 0:
                self.collected_info.append("số người")
                self.current_step = BookingStep.COLLECT_SPECIAL_REQUESTS
                return {
                    "step": self.current_step.value,
                    "message": f"Đã ghi nhận: {self.booking_data.num_adults} người lớn" + 
                              (f", {self.booking_data.num_children} trẻ em" if self.booking_data.num_children else "") +
                              ". Bạn có yêu cầu đặc biệt nào không? (VD: chế độ ăn, phòng riêng...) Nếu không có gì thì reply 'không' nhé!",
                    "is_complete": False,
                    "booking_data": self._get_summary()
                }
            else:
                return {
                    "step": self.current_step.value,
                    "message": "Số người đi chưa rõ. Bạn cho tôi biết có bao nhiêu người đi được không?",
                    "is_complete": False,
                    "booking_data": self._get_summary()
                }
        
        elif self.current_step == BookingStep.COLLECT_SPECIAL_REQUESTS:
            if "không" not in message and "không có" not in message:
                self.booking_data.special_requests = message.strip()
            self.collected_info.append("yêu cầu đặc biệt")
            self.current_step = BookingStep.CONFIRM_BOOKING
            return self._confirm_booking()
        
        elif self.current_step == BookingStep.CONFIRM_BOOKING:
            if any(kw in message for kw in ["đúng", "xác nhận", "ok", "đồng ý", "đặt luôn", "yes", "y"]):
                self.current_step = BookingStep.PROCESSING
                return {
                    "step": self.current_step.value,
                    "message": "Đang xử lý đặt tour cho bạn...",
                    "is_complete": False,
                    "ready_to_book": True,
                    "booking_data": self._get_summary()
                }
            elif any(kw in message for kw in ["sửa", "đổi", "thay đổi", "chỉnh"]):
                return self._show_change_options()
            else:
                return {
                    "step": self.current_step.value,
                    "message": "Bạn xác nhận đặt tour không? (Reply 'đúng' để xác nhận hoặc 'sửa' để thay đổi thông tin)",
                    "is_complete": False,
                    "booking_data": self._get_summary()
                }
        
        return {
            "step": self.current_step.value,
            "message": "Tôi đang chờ thông tin của bạn...",
            "is_complete": False,
            "booking_data": self._get_summary()
        }
    
    def _confirm_booking(self) -> Dict[str, Any]:
        """Tạo message xác nhận booking"""
        summary = f"""
📋 **XÁC NHẬN THÔNG TIN ĐẶT TOUR**

👤 **Khách hàng:** {self.booking_data.name}
📧 **Email:** {self.booking_data.email}
📞 **Điện thoại:** {self.booking_data.phone}
🏖️ **Tour:** {self.booking_data.tour_name or "Đang chọn tour..."}
📅 **Khởi hành:** {self.booking_data.departure_date or "Đang chờ..."}
👥 **Số người:** {self.booking_data.num_adults} người lớn{(", " + str(self.booking_data.num_children) + " trẻ em") if self.booking_data.num_children else ""}
📝 **Yêu cầu đặc biệt:** {self.booking_data.special_requests or "Không có"}

{self._format_price()}

---

Xác nhận đặt tour? Reply **"đúng"** để xác nhận hoặc **"sửa"** để thay đổi thông tin.
"""
        return {
            "step": self.current_step.value,
            "message": summary.strip(),
            "is_complete": False,
            "confirmation_required": True,
            "booking_data": self._get_summary()
        }
    
    def _show_current_info(self) -> Dict[str, Any]:
        """Hiển thị thông tin đã thu thập"""
        return {
            "step": self.current_step.value,
            "message": self._build_info_summary(),
            "is_complete": False,
            "booking_data": self._get_summary()
        }
    
    def _show_change_options(self) -> Dict[str, Any]:
        """Hiển thị tùy chọn sửa đổi"""
        return {
            "step": self.current_step.value,
            "message": "Bạn muốn sửa thông tin nào?\n- Tên\n- Email\n- Số điện thoại\n- Ngày khởi hành\n- Số người\n\nVí dụ: 'đổi tên thành Minh' hoặc 'sửa ngày 25/12'",
            "is_complete": False,
            "booking_data": self._get_summary()
        }
    
    def _handle_change_request(self, message: str) -> Dict[str, Any]:
        """Xử lý yêu cầu thay đổi thông tin"""
        if "tên" in message:
            self.current_step = BookingStep.COLLECT_NAME
            return {
                "step": "change_name",
                "message": "Bạn muốn đổi tên thành gì?",
                "is_complete": False,
                "booking_data": self._get_summary()
            }
        elif "email" in message:
            self.current_step = BookingStep.COLLECT_EMAIL
            return {
                "step": "change_email",
                "message": "Bạn muốn đổi email thành gì?",
                "is_complete": False,
                "booking_data": self._get_summary()
            }
        elif "điện thoại" in message or "sdt" in message:
            self.current_step = BookingStep.COLLECT_PHONE
            return {
                "step": "change_phone",
                "message": "Bạn muốn đổi số điện thoại thành gì?",
                "is_complete": False,
                "booking_data": self._get_summary()
            }
        elif "ngày" in message:
            self.current_step = BookingStep.COLLECT_DATE
            return {
                "step": "change_date",
                "message": "Bạn muốn đổi ngày khởi hành thành ngày nào?",
                "is_complete": False,
                "booking_data": self._get_summary()
            }
        elif "người" in message:
            self.current_step = BookingStep.COLLECT_PARTICIPANTS
            return {
                "step": "change_participants",
                "message": "Bạn muốn đổi số người đi thành bao nhiêu?",
                "is_complete": False,
                "booking_data": self._get_summary()
            }
        
        return {
            "step": self.current_step.value,
            "message": "Tôi chưa hiểu bạn muốn sửa gì. Bạn nói rõ hơn được không?",
            "is_complete": False,
            "booking_data": self._get_summary()
        }
    
    def _cancel_flow(self) -> Dict[str, Any]:
        """Hủy booking flow"""
        self.is_active = False
        self.current_step = BookingStep.COMPLETED
        return {
            "step": self.current_step.value,
            "message": "Đã hủy quá trình đặt tour. Nếu bạn cần hỗ trợ gì khác, tôi sẵn sàng giúp!",
            "is_complete": True,
            "cancelled": True,
            "booking_data": self._get_summary()
        }
    
    def _handle_not_in_flow(self, message: str) -> Dict[str, Any]:
        """Xử lý khi không trong booking flow"""
        return {
            "step": "idle",
            "message": "Hiện tại không có đơn đặt tour nào đang xử lý. Bạn muốn đặt tour mới không?",
            "is_complete": True,
            "booking_data": {}
        }
    
    def complete_booking(self, booking_code: str) -> Dict[str, Any]:
        """Hoàn thành booking"""
        self.current_step = BookingStep.SUCCESS
        self.booking_data.booking_code = booking_code
        return {
            "step": self.current_step.value,
            "message": f"🎉 **ĐẶT TOUR THÀNH CÔNG!**\n\nMã booking của bạn: **{booking_code}**\n\nChúng tôi đã gửi email xác nhận đến {self.booking_data.email}. Vui lòng thanh toán trong vòng 24 giờ để hoàn tất đặt tour.\n\nCảm ơn bạn {self.booking_data.name} đã tin tưởng TravelGPT! Chúc bạn có chuyến đi tuyệt vời! 🌴",
            "is_complete": True,
            "booking_code": booking_code,
            "booking_data": self._get_summary()
        }
    
    def get_missing_info(self) -> List[str]:
        """Lấy danh sách thông tin còn thiếu"""
        missing = []
        if not self.booking_data.name:
            missing.append("tên")
        if not self.booking_data.email:
            missing.append("email")
        if not self.booking_data.phone:
            missing.append("số điện thoại")
        if not self.booking_data.tour_id:
            missing.append("tour")
        if not self.booking_data.departure_date:
            missing.append("ngày khởi hành")
        return missing
    
    def _format_price(self) -> str:
        """Format price for display"""
        if self.booking_data.total_price:
            return f"💰 **Giá dự kiến:** {self.booking_data.total_price:,.0f}đ"
        return "💰 **Giá dự kiến:** Đang tính..."
    
    def _get_summary(self) -> Dict[str, Any]:
        """Lấy tóm tắt thông tin booking"""
        return {
            "name": self.booking_data.name,
            "email": self.booking_data.email,
            "phone": self.booking_data.phone,
            "tour_id": self.booking_data.tour_id,
            "tour_name": self.booking_data.tour_name,
            "departure_date": self.booking_data.departure_date,
            "num_adults": self.booking_data.num_adults,
            "num_children": self.booking_data.num_children,
            "special_requests": self.booking_data.special_requests,
            "is_complete": self.booking_data.is_complete(),
            "missing_fields": self.get_missing_info()
        }
    
    def _build_info_summary(self) -> str:
        """Build thông tin đã có"""
        lines = ["📋 **THÔNG TIN ĐÃ CÓ:**\n"]
        
        if self.booking_data.name:
            lines.append(f"✅ Tên: {self.booking_data.name}")
        else:
            lines.append("❌ Tên: Chưa có")
            
        if self.booking_data.email:
            lines.append(f"✅ Email: {self.booking_data.email}")
        else:
            lines.append("❌ Email: Chưa có")
            
        if self.booking_data.phone:
            lines.append(f"✅ SĐT: {self.booking_data.phone}")
        else:
            lines.append("❌ SĐT: Chưa có")
            
        if self.booking_data.tour_name:
            lines.append(f"✅ Tour: {self.booking_data.tour_name}")
        else:
            lines.append("❌ Tour: Chưa chọn")
            
        if self.booking_data.departure_date:
            lines.append(f"✅ Ngày: {self.booking_data.departure_date}")
        else:
            lines.append("❌ Ngày: Chưa chọn")
            
        lines.append(f"👥 Số người: {self.booking_data.num_adults} lớn, {self.booking_data.num_children} trẻ em")
        
        return "\n".join(lines)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "current_step": self.current_step.value,
            "is_active": self.is_active,
            "booking_data": self._get_summary()
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "SmartBookingFlow":
        flow = cls()
        flow.current_step = BookingStep(data.get("current_step", "greeting"))
        flow.is_active = data.get("is_active", False)
        
        bd = data.get("booking_data", {})
        flow.booking_data = BookingData(
            name=bd.get("name"),
            email=bd.get("email"),
            phone=bd.get("phone"),
            tour_id=bd.get("tour_id"),
            tour_name=bd.get("tour_name"),
            departure_date=bd.get("departure_date"),
            num_adults=bd.get("num_adults", 1),
            num_children=bd.get("num_children", 0),
            special_requests=bd.get("special_requests")
        )
        
        return flow


class PriceCalculator:
    """Tính giá tour dựa trên số người"""
    
    CHILD_DISCOUNT = 0.5  # Trẻ em giảm 50%
    
    @staticmethod
    def calculate_price(
        base_price: float,
        num_adults: int,
        num_children: int = 0,
        has_discount: bool = False,
        discount_price: Optional[float] = None
    ) -> Dict[str, Any]:
        """Tính tổng giá tour"""
        
        # Sử dụng giá discount nếu có
        unit_price = discount_price if (has_discount and discount_price) else base_price
        
        adult_total = unit_price * num_adults
        child_total = unit_price * CHILD_DISCOUNT * num_children
        
        subtotal = adult_total + child_total
        service_fee = subtotal * 0.05  # Phí dịch vụ 5%
        total = subtotal + service_fee
        
        return {
            "unit_price": unit_price,
            "num_adults": num_adults,
            "adult_total": adult_total,
            "num_children": num_children,
            "child_total": child_total,
            "subtotal": subtotal,
            "service_fee": service_fee,
            "total_price": total,
            "currency": "VND"
        }


# Alias for backward compatibility
CHILD_DISCOUNT = PriceCalculator.CHILD_DISCOUNT
