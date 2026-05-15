"""
Cancellation & Reschedule Flow - Xử lý hủy và đổi lịch tour
"""
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
import re


class CancellationStep(str, Enum):
    """Các bước trong cancellation flow"""
    INIT = "init"
    VERIFY_BOOKING = "verify_booking"
    CONFIRM_CANCELLATION = "confirm_cancellation"
    CALCULATE_REFUND = "calculate_refund"
    SELECT_REASON = "select_reason"
    PROCESSING = "processing"
    SUCCESS = "success"
    COMPLETED = "completed"


class RescheduleStep(str, Enum):
    """Các bước trong reschedule flow"""
    INIT = "init"
    VERIFY_BOOKING = "verify_booking"
    CHECK_ELIGIBILITY = "check_eligibility"
    SELECT_NEW_DATE = "select_new_date"
    CHECK_AVAILABILITY = "check_availability"
    CALCULATE_PRICE_DIFF = "calculate_price_diff"
    CONFIRM_RESCHEDULE = "confirm_reschedule"
    PROCESSING = "processing"
    SUCCESS = "success"
    COMPLETED = "completed"


@dataclass
class CancellationData:
    """Data cho cancellation"""
    booking_id: Optional[str] = None
    booking_code: Optional[str] = None
    tour_name: Optional[str] = None
    departure_date: Optional[datetime] = None
    total_price: float = 0
    payment_status: str = "UNPAID"
    reason: Optional[str] = None
    refund_amount: float = 0
    refund_percent: float = 0
    refund_method: Optional[str] = None
    bank_account: Optional[str] = None
    processing_fee: float = 0


@dataclass
class RescheduleData:
    """Data cho reschedule"""
    booking_id: Optional[str] = None
    booking_code: Optional[str] = None
    tour_id: Optional[str] = None
    tour_name: Optional[str] = None
    original_date: Optional[datetime] = None
    new_date: Optional[datetime] = None
    original_price: float = 0
    new_price: float = 0
    price_difference: float = 0
    is_upgrade: bool = False
    availability_status: Optional[str] = None
    available_dates: List[Dict[str, Any]] = None


class CancellationFlow:
    """
    Cancellation Flow - Xử lý hủy booking
    """
    
    # Refund policy based on days before departure
    REFUND_POLICY = {
        (14, float('inf')): 0.90,  # 14+ days: 90% refund
        (7, 13): 0.70,              # 7-13 days: 70% refund
        (3, 6): 0.50,               # 3-6 days: 50% refund
        (1, 2): 0.20,               # 1-2 days: 20% refund
        (0, 0): 0.0,                # Same day: 0% refund
    }
    
    PROCESSING_FEE_PERCENT = 0.05  # 5% processing fee
    
    CANCELLATION_REASONS = [
        "Thay đổi kế hoạch",
        "Lý do sức khỏe",
        "Công việc đột xuất",
        "Thời tiết xấu",
        "Điểm đến không hấp dẫn",
        "Giá cao hơn dự kiến",
        "Tìm được tour khác tốt hơn",
        "Khác"
    ]
    
    def __init__(self):
        self.current_step = CancellationStep.INIT
        self.cancellation_data = CancellationData()
        self.reasons_checked: List[str] = []
        self.is_active = False
    
    def start_flow(self, booking_code: str = None, booking_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """Bắt đầu cancellation flow"""
        self.is_active = True
        self.current_step = CancellationStep.INIT
        self.reasons_checked = []
        
        if booking_code:
            self.cancellation_data.booking_code = booking_code
            self.current_step = CancellationStep.VERIFY_BOOKING
        
        if booking_data:
            self._update_from_booking_data(booking_data)
        
        return self._get_status()
    
    def _update_from_booking_data(self, data: Dict[str, Any]):
        """Cập nhật data từ booking"""
        self.cancellation_data.booking_id = data.get("booking_id")
        self.cancellation_data.booking_code = data.get("booking_code")
        self.cancellation_data.tour_name = data.get("tour_name")
        self.cancellation_data.total_price = data.get("total_price", 0)
        self.cancellation_data.payment_status = data.get("payment_status", "UNPAID")
        
        if data.get("departure_date"):
            if isinstance(data["departure_date"], str):
                self.cancellation_data.departure_date = datetime.fromisoformat(data["departure_date"])
            else:
                self.cancellation_data.departure_date = data["departure_date"]
    
    def verify_booking(self, booking_code: str, booking_data: Dict[str, Any]) -> Dict[str, Any]:
        """Xác minh booking"""
        self.cancellation_data.booking_code = booking_code
        self._update_from_booking_data(booking_data)
        
        if not self.cancellation_data.departure_date:
            return {
                **self._get_status(),
                "error": "Không tìm thấy thông tin booking"
            }
        
        # Calculate refund immediately
        self._calculate_refund()
        
        self.current_step = CancellationStep.CONFIRM_CANCELLATION
        
        return {
            **self._get_status(),
            "message": self._build_verification_message()
        }
    
    def _calculate_refund(self):
        """Tính refund dựa trên policy"""
        if not self.cancellation_data.departure_date:
            return
        
        days_until = (self.cancellation_data.departure_date - datetime.now()).days
        
        # Find applicable refund rate
        refund_percent = 0
        for (min_days, max_days), rate in self.REFUND_POLICY.items():
            if min_days <= days_until <= max_days:
                refund_percent = rate
                break
        
        # Calculate amounts
        base_refund = self.cancellation_data.total_price * refund_percent
        processing_fee = self.cancellation_data.total_price * self.PROCESSING_FEE_PERCENT
        actual_refund = max(0, base_refund - processing_fee)
        
        self.cancellation_data.refund_percent = refund_percent * 100
        self.cancellation_data.refund_amount = actual_refund
        self.cancellation_data.processing_fee = processing_fee
    
    def _build_verification_message(self) -> str:
        """Build message sau khi verify"""
        data = self.cancellation_data
        days_until = (data.departure_date - datetime.now()).days if data.departure_date else 0
        
        message = f"""
## ⚠️ XÁC NHẬN HỦY BOOKING

**Mã booking:** `{data.booking_code}`
**Tour:** {data.tour_name}
**Ngày khởi hành:** {data.departure_date.strftime('%d/%m/%Y') if data.departure_date else 'N/A'}
**Còn lại:** {days_until} ngày
**Tổng tiền đã thanh toán:** {data.total_price:,.0f}đ
**Trạng thái thanh toán:** {data.payment_status}

---

### 💰 CHÍNH SÁCH HOÀN TIỀN

| Thời gian hủy | Hoàn tiền |
|----------------|-----------|
| 14+ ngày trước | 90% |
| 7-13 ngày | 70% |
| 3-6 ngày | 50% |
| 1-2 ngày | 20% |
| Cùng ngày | 0% |

---

**Số tiền hoàn (dự kiến):** {data.refund_amount:,.0f}đ
*(Phí xử lý 5%: {data.processing_fee:,.0f}đ)*
"""
        
        return message.strip()
    
    def select_reason(self, reason: str) -> Dict[str, Any]:
        """Chọn lý do hủy"""
        self.cancellation_data.reason = reason
        self.reasons_checked.append(reason)
        self.current_step = CancellationStep.SELECT_REASON
        
        return {
            **self._get_status(),
            "message": f"Đã ghi nhận lý do: **{reason}**\n\nBạn có chắc chắn muốn hủy booking này không?"
        }
    
    def confirm_cancellation(self, confirmed: bool) -> Dict[str, Any]:
        """Xác nhận hủy"""
        if not confirmed:
            self.is_active = False
            return {
                "is_active": False,
                "current_step": CancellationStep.COMPLETED.value,
                "message": "Đã hủy yêu cầu hủy booking."
            }
        
        self.current_step = CancellationStep.PROCESSING
        return {
            **self._get_status(),
            "ready_to_process": True,
            "message": "Đang xử lý yêu cầu hủy booking..."
        }
    
    def process_cancellation(self) -> Dict[str, Any]:
        """Xử lý hủy booking"""
        self.current_step = CancellationStep.SUCCESS
        
        return {
            **self._get_status(),
            "success": True,
            "message": self._build_success_message()
        }
    
    def _build_success_message(self) -> str:
        """Build message thành công"""
        data = self.cancellation_data
        
        return f"""
## ✅ HỦY BOOKING THÀNH CÔNG

**Mã booking:** `{data.booking_code}`
**Tour:** {data.tour_name}

### 💰 Hoàn tiền

| Mục | Số tiền |
|-----|---------|
| Tổng tiền | {data.total_price:,.0f}đ |
| Tỷ lệ hoàn | {data.refund_percent:.0f}% |
| Phí xử lý | -{data.processing_fee:,.0f}đ |
| **Thực nhận** | **{data.refund_amount:,.0f}đ** |

### 📋 Thông tin hoàn tiền

Số tiền sẽ được hoàn về tài khoản của bạn trong **7-14 ngày làm việc**.

### 📧 Xác nhận

Email xác nhận hủy đã được gửi đến địa chỉ email của bạn.

---

Cảm ơn bạn đã sử dụng TravelGPT!
Nếu cần hỗ trợ, liên hệ: support@travelgpt.com
"""
    
    def _get_status(self) -> Dict[str, Any]:
        """Lấy trạng thái hiện tại"""
        return {
            "is_active": self.is_active,
            "current_step": self.current_step.value,
            "booking_code": self.cancellation_data.booking_code,
            "refund_amount": self.cancellation_data.refund_amount,
            "refund_percent": self.cancellation_data.refund_percent,
            "reason": self.cancellation_data.reason
        }
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "current_step": self.current_step.value,
            "is_active": self.is_active,
            "cancellation_data": {
                "booking_id": self.cancellation_data.booking_id,
                "booking_code": self.cancellation_data.booking_code,
                "tour_name": self.cancellation_data.tour_name,
                "departure_date": self.cancellation_data.departure_date.isoformat() if self.cancellation_data.departure_date else None,
                "total_price": self.cancellation_data.total_price,
                "payment_status": self.cancellation_data.payment_status,
                "reason": self.cancellation_data.reason,
                "refund_amount": self.cancellation_data.refund_amount,
                "refund_percent": self.cancellation_data.refund_percent,
                "processing_fee": self.cancellation_data.processing_fee
            }
        }


class RescheduleFlow:
    """
    Reschedule Flow - Xử lý đổi lịch tour
    """
    
    # Eligibility rules
    MIN_DAYS_FOR_RESCHEDULE = 1
    MAX_RESCHEDULE_DAYS_BEFORE = 3  # Must reschedule at least 3 days before
    
    def __init__(self):
        self.current_step = RescheduleStep.INIT
        self.reschedule_data = RescheduleData()
        self.available_dates: List[Dict[str, Any]] = []
        self.is_active = False
    
    def start_flow(self, booking_code: str = None, booking_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """Bắt đầu reschedule flow"""
        self.is_active = True
        self.current_step = RescheduleStep.INIT
        
        if booking_code:
            self.reschedule_data.booking_code = booking_code
        
        if booking_data:
            self._update_from_booking_data(booking_data)
        
        return self._get_status()
    
    def _update_from_booking_data(self, data: Dict[str, Any]):
        """Cập nhật data từ booking"""
        self.reschedule_data.booking_id = data.get("booking_id")
        self.reschedule_data.booking_code = data.get("booking_code")
        self.reschedule_data.tour_id = data.get("tour_id")
        self.reschedule_data.tour_name = data.get("tour_name")
        self.reschedule_data.original_price = data.get("total_price", 0)
        
        if data.get("departure_date"):
            if isinstance(data["departure_date"], str):
                self.reschedule_data.original_date = datetime.fromisoformat(data["departure_date"])
            else:
                self.reschedule_data.original_date = data["departure_date"]
    
    def check_eligibility(self) -> Dict[str, Any]:
        """Kiểm tra eligibility để đổi lịch"""
        data = self.reschedule_data
        
        if not data.original_date:
            return {
                **self._get_status(),
                "eligible": False,
                "error": "Không tìm thấy thông tin booking"
            }
        
        days_until = (data.original_date - datetime.now()).days
        
        # Check eligibility
        if days_until < self.MIN_DAYS_FOR_RESCHEDULE:
            return {
                **self._get_status(),
                "eligible": False,
                "error": f"Chỉ có thể đổi lịch khi còn ít nhất {self.MIN_DAYS_FOR_RESCHEDULE} ngày trước ngày khởi hành."
            }
        
        # Check if tour can be rescheduled
        # (In real system, check with tour schedule)
        self.current_step = RescheduleStep.SELECT_NEW_DATE
        
        return {
            **self._get_status(),
            "eligible": True,
            "message": self._build_eligibility_message(days_until)
        }
    
    def _build_eligibility_message(self, days_until: int) -> str:
        """Build message về eligibility"""
        data = self.reschedule_data
        
        return f"""
## 🔄 ĐỔI LỊCH TOUR

**Mã booking:** `{data.booking_code}`
**Tour:** {data.tour_name}
**Ngày khởi hành hiện tại:** {data.original_date.strftime('%d/%m/%Y') if data.original_date else 'N/A'}
**Còn lại:** {days_until} ngày

---

### ✅ Có thể đổi lịch

Bạn có thể đổi sang ngày khởi hành mới.

**Lưu ý:**
- Ngày mới phải có slot trống
- Giá tour có thể thay đổi theo ngày mới
- Phí đổi lịch: Miễn phí (nếu đổi trước 7 ngày)

Bạn muốn đổi sang ngày nào?
"""
    
    def set_new_date(self, new_date_str: str) -> Dict[str, Any]:
        """Đặt ngày mới"""
        try:
            # Try multiple date formats
            for fmt in ["%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y"]:
                try:
                    self.reschedule_data.new_date = datetime.strptime(new_date_str, fmt)
                    break
                except:
                    continue
            
            if not self.reschedule_data.new_date:
                return {
                    **self._get_status(),
                    "error": "Định dạng ngày không hợp lệ. Vui lòng nhập theo định dạng DD/MM/YYYY"
                }
            
            self.current_step = RescheduleStep.CHECK_AVAILABILITY
            return self._check_availability()
            
        except Exception as e:
            return {
                **self._get_status(),
                "error": f"Lỗi: {str(e)}"
            }
    
    def _check_availability(self) -> Dict[str, Any]:
        """Kiểm tra availability của ngày mới"""
        # In real system, check with database
        # For now, simulate availability check
        
        new_date = self.reschedule_data.new_date
        original_date = self.reschedule_data.original_date
        
        if not new_date or not original_date:
            return {
                **self._get_status(),
                "error": "Không có thông tin ngày"
            }
        
        days_diff = (new_date - original_date).days
        
        if days_diff < 0:
            return {
                **self._get_status(),
                "error": "Ngày mới phải sau ngày khởi hành ban đầu"
            }
        
        if days_diff == 0:
            return {
                **self._get_status(),
                "error": "Ngày mới phải khác ngày khởi hành ban đầu"
            }
        
        # Simulate: check if within reasonable range
        if days_diff > 180:
            return {
                **self._get_status(),
                "error": "Chỉ có thể đổi trong vòng 180 ngày"
            }
        
        # Simulate availability (in real system, check tour schedule)
        is_available = True  # Assume available
        self.reschedule_data.availability_status = "AVAILABLE" if is_available else "FULL"
        
        if is_available:
            # Calculate price difference
            self._calculate_price_diff()
            self.current_step = RescheduleStep.CONFIRM_RESCHEDULE
            
            return {
                **self._get_status(),
                "available": True,
                "message": self._build_availability_message()
            }
        else:
            return {
                **self._get_status(),
                "available": False,
                "error": f"Ngày {new_date.strftime('%d/%m/%Y')} đã hết chỗ. Vui lòng chọn ngày khác."
            }
    
    def _calculate_price_diff(self):
        """Tính chênh lệch giá"""
        # In real system, get price for new date
        # For now, assume same price
        self.reschedule_data.new_price = self.reschedule_data.original_price
        self.reschedule_data.price_difference = 0
        self.reschedule_data.is_upgrade = False
    
    def _build_availability_message(self) -> str:
        """Build message khi có availability"""
        data = self.reschedule_data
        days_diff = (data.new_date - data.original_date).days if data.new_date and data.original_date else 0
        
        lines = ["""
## ✅ NGÀY MỚI CÓ SẴN

"""]
        
        lines.append(f"""
| | Ngày cũ | Ngày mới |
|---|---|---|
| Ngày khởi hành | {data.original_date.strftime('%d/%m/%Y') if data.original_date else 'N/A'} | {data.new_date.strftime('%d/%m/%Y') if data.new_date else 'N/A'} |
| Chênh lệch | - | {days_diff} ngày |
""")
        
        if data.price_difference > 0:
            lines.append(f"""
### 💰 Thanh toán thêm

| Mục | Số tiền |
|-----|---------|
| Giá tour cũ | {data.original_price:,.0f}đ |
| Giá tour mới | {data.new_price:,.0f}đ |
| **Chênh lệch** | **{data.price_difference:,.0f}đ** |
""")
        elif data.price_difference < 0:
            lines.append(f"""
### 💰 Hoàn tiền

| Mục | Số tiền |
|-----|---------|
| Giá tour cũ | {data.original_price:,.0f}đ |
| Giá tour mới | {data.new_price:,.0f}đ |
| **Hoàn lại** | **{abs(data.price_difference):,.0f}đ** |
""")
        else:
            lines.append("""
### 💰 Không phát sinh phí

Giá tour giữ nguyên, không phải thanh toán thêm.
""")
        
        lines.append("""
---

Bạn xác nhận đổi lịch không?
""")
        
        return "".join(lines)
    
    def get_available_dates(self, tour_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Lấy danh sách ngày có sẵn"""
        # In real system, query from database
        # Return sample dates
        if not self.reschedule_data.original_date:
            return []
        
        available = []
        current_date = self.reschedule_data.original_date + timedelta(days=1)
        
        for i in range(limit):
            # Simulate: every 3rd day is available
            if i % 3 == 0:
                available.append({
                    "date": current_date.strftime("%Y-%m-%d"),
                    "date_display": current_date.strftime("%d/%m/%Y"),
                    "day_of_week": current_date.strftime("%A"),
                    "available": True
                })
            current_date += timedelta(days=1)
        
        return available
    
    def confirm_reschedule(self, confirmed: bool) -> Dict[str, Any]:
        """Xác nhận đổi lịch"""
        if not confirmed:
            self.is_active = False
            return {
                "is_active": False,
                "current_step": RescheduleStep.COMPLETED.value,
                "message": "Đã hủy yêu cầu đổi lịch."
            }
        
        self.current_step = RescheduleStep.PROCESSING
        return {
            **self._get_status(),
            "ready_to_process": True,
            "message": "Đang xử lý đổi lịch..."
        }
    
    def process_reschedule(self) -> Dict[str, Any]:
        """Xử lý đổi lịch"""
        self.current_step = RescheduleStep.SUCCESS
        
        return {
            **self._get_status(),
            "success": True,
            "message": self._build_success_message()
        }
    
    def _build_success_message(self) -> str:
        """Build message thành công"""
        data = self.reschedule_data
        
        lines = ["""
## ✅ ĐỔI LỊCH THÀNH CÔNG
"""]
        
        lines.append(f"""
**Mã booking:** `{data.booking_code}`
**Tour:** {data.tour_name}

### 📅 Lịch trình mới

| | Trước | Sau |
|---|---|---|
| Ngày khởi hành | {data.original_date.strftime('%d/%m/%Y') if data.original_date else 'N/A'} | **{data.new_date.strftime('%d/%m/%Y') if data.new_date else 'N/A'}** |
""")
        
        if data.price_difference != 0:
            if data.price_difference > 0:
                lines.append(f"""
### 💰 Thanh toán thêm

Số tiền cần thanh toán: **{data.price_difference:,.0f}đ**

Vui lòng thanh toán trong 24 giờ để xác nhận đổi lịch.
""")
            else:
                lines.append(f"""
### 💰 Hoàn tiền

Số tiền được hoàn: **{abs(data.price_difference):,.0f}đ**

Tiền sẽ được hoàn về tài khoản trong 7-14 ngày làm việc.
""")
        
        lines.append("""
### 📧 Xác nhận

Email xác nhận đổi lịch đã được gửi đến email của bạn.

---

Cảm ơn bạn đã sử dụng TravelGPT!
""")
        
        return "".join(lines)
    
    def _get_status(self) -> Dict[str, Any]:
        """Lấy trạng thái hiện tại"""
        return {
            "is_active": self.is_active,
            "current_step": self.current_step.value,
            "booking_code": self.reschedule_data.booking_code,
            "original_date": self.reschedule_data.original_date.isoformat() if self.reschedule_data.original_date else None,
            "new_date": self.reschedule_data.new_date.isoformat() if self.reschedule_data.new_date else None,
            "price_difference": self.reschedule_data.price_difference
        }
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "current_step": self.current_step.value,
            "is_active": self.is_active,
            "reschedule_data": {
                "booking_id": self.reschedule_data.booking_id,
                "booking_code": self.reschedule_data.booking_code,
                "tour_id": self.reschedule_data.tour_id,
                "tour_name": self.reschedule_data.tour_name,
                "original_date": self.reschedule_data.original_date.isoformat() if self.reschedule_data.original_date else None,
                "new_date": self.reschedule_data.new_date.isoformat() if self.reschedule_data.new_date else None,
                "original_price": self.reschedule_data.original_price,
                "new_price": self.reschedule_data.new_price,
                "price_difference": self.reschedule_data.price_difference
            }
        }
