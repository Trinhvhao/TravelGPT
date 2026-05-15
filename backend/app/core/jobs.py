"""
Background Jobs Module - Async task processing cho TravelGPT
- Email notifications
- Booking confirmations
- Report generation
- Scheduled tasks
"""
from typing import Optional, List, Dict, Any, Callable
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import asyncio
import json
from abc import ABC, abstractmethod

try:
    from apscheduler.schedulers.asyncio import AsyncIOScheduler
    from apscheduler.triggers.cron import CronTrigger
    from apscheduler.triggers.date import DateTrigger
    from apscheduler.triggers.interval import IntervalTrigger
    APSCHEDULER_AVAILABLE = True
except ImportError:
    APSCHEDULER_AVAILABLE = False


class JobStatus(str, Enum):
    """Job status"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class JobType(str, Enum):
    """Job types"""
    EMAIL = "email"
    BOOKING_CONFIRMATION = "booking_confirmation"
    BOOKING_REMINDER = "booking_reminder"
    PAYMENT_reminder = "payment_reminder"
    REPORT = "report"
    CACHE_CLEAR = "cache_clear"
    CUSTOM = "custom"


@dataclass
class Job:
    """Background job"""
    job_id: str
    job_type: JobType
    status: JobStatus = JobStatus.PENDING
    payload: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.now)
    scheduled_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error: Optional[str] = None
    retry_count: int = 0
    max_retries: int = 3


class EmailService(ABC):
    """Abstract email service"""
    
    @abstractmethod
    async def send_email(
        self,
        to: str,
        subject: str,
        body: str,
        html: Optional[str] = None
    ) -> bool:
        pass


class ConsoleEmailService(EmailService):
    """Email service that prints to console (for development)"""
    
    async def send_email(
        self,
        to: str,
        subject: str,
        body: str,
        html: Optional[str] = None
    ) -> bool:
        print(f"\n📧 EMAIL")
        print(f"To: {to}")
        print(f"Subject: {subject}")
        print(f"Body: {body[:100]}..." if len(body) > 100 else f"Body: {body}")
        if html:
            print(f"HTML: {html[:100]}..." if len(html) > 100 else f"HTML: {html}")
        print("-" * 50)
        return True


class EmailTemplates:
    """Email templates for TravelGPT"""
    
    @staticmethod
    def booking_confirmation(
        customer_name: str,
        tour_name: str,
        booking_code: str,
        departure_date: str,
        num_adults: int,
        num_children: int,
        total_price: str
    ) -> Dict[str, str]:
        """Generate booking confirmation email"""
        subject = f"🎉 Xác nhận đặt tour thành công - Mã: {booking_code}"
        
        body = f"""
Xin chào {customer_name},

Cảm ơn bạn đã đặt tour tại TravelGPT!

📋 THÔNG TIN ĐẶT TOUR
━━━━━━━━━━━━━━━━━━━━━━━
Mã booking: {booking_code}
Tour: {tour_name}
Ngày khởi hành: {departure_date}
Số người lớn: {num_adults}
Số trẻ em: {num_children}
Tổng giá: {total_price}
━━━━━━━━━━━━━━━━━━━━━━━

📍 ĐIỂM ĐÓN
Vui lòng có mặt tại điểm đón trước 15 phút.

⚠️ LƯU Ý
- Mang theo CCCD/ Passport
- Xuất trình mã booking này
- Liên hệ 1900-xxxx nếu cần hỗ trợ

Chúc bạn có chuyến đi tuyệt vời!

TravelGPT Team
        """
        
        html = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #4F46E5; color: white; padding: 20px; text-align: center; }}
        .content {{ padding: 20px; background: #f9f9f9; }}
        .booking-info {{ background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }}
        .booking-info h3 {{ color: #4F46E5; margin-top: 0; }}
        .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Xác nhận đặt tour thành công!</h1>
        </div>
        <div class="content">
            <p>Xin chào <strong>{customer_name}</strong>,</p>
            <p>Cảm ơn bạn đã đặt tour tại TravelGPT!</p>
            
            <div class="booking-info">
                <h3>📋 THÔNG TIN ĐẶT TOUR</h3>
                <p><strong>Mã booking:</strong> {booking_code}</p>
                <p><strong>Tour:</strong> {tour_name}</p>
                <p><strong>Ngày khởi hành:</strong> {departure_date}</p>
                <p><strong>Số người:</strong> {num_adults} người lớn, {num_children} trẻ em</p>
                <p><strong>Tổng giá:</strong> {total_price}</p>
            </div>
            
            <div class="booking-info">
                <h3>⚠️ LƯU Ý</h3>
                <ul>
                    <li>Mang theo CCCD/Passport</li>
                    <li>Xuất trình mã booking này</li>
                    <li>Có mặt tại điểm đón trước 15 phút</li>
                </ul>
            </div>
        </div>
        <div class="footer">
            <p>TravelGPT - AI Travel Agent</p>
            <p>Hotline: 1900-xxxx | Email: support@travelgpt.vn</p>
        </div>
    </div>
</body>
</html>
        """
        
        return {"subject": subject, "body": body, "html": html}
    
    @staticmethod
    def booking_reminder(
        customer_name: str,
        tour_name: str,
        booking_code: str,
        departure_date: str,
        days_until: int
    ) -> Dict[str, str]:
        """Generate booking reminder email"""
        subject = f"⏰ Nhắc nhở: Tour {tour_name} khởi hành sau {days_until} ngày!"
        
        body = f"""
Xin chào {customer_name},

Đây là email nhắc nhở về chuyến đi sắp tới của bạn!

📅 THÔNG TIN CHUYẾN ĐI
━━━━━━━━━━━━━━━━━━━━━━━
Tour: {tour_name}
Mã booking: {booking_code}
Ngày khởi hành: {departure_date}
Còn lại: {days_until} ngày
━━━━━━━━━━━━━━━━━━━━━━━

📋 CHECKLIST CHUẨN BỊ
- [ ] Pack đồ dùng cá nhân
- [ ] Kiểm tra giấy tờ (CCCD/Passport)
- [ ] Đặt taxi/transport đến điểm đón
- [ ] Thông báo cho người thân về lịch trình

📞 LIÊN HỆ HỖ TRỢ
Nếu cần hỗ trợ, vui lòng liên hệ:
- Hotline: 1900-xxxx
- Email: support@travelgpt.vn

Hẹn gặp bạn tại điểm khởi hành!

TravelGPT Team
        """
        
        html = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #F59E0B; color: white; padding: 20px; text-align: center; }}
        .content {{ padding: 20px; background: #fff; }}
        .highlight {{ background: #FEF3C7; padding: 15px; border-radius: 8px; margin: 15px 0; }}
        .checklist {{ list-style: none; padding: 0; }}
        .checklist li {{ padding: 8px 0; border-bottom: 1px solid #eee; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⏰ Nhắc nhở chuyến đi!</h1>
        </div>
        <div class="content">
            <p>Xin chào <strong>{customer_name}</strong>,</p>
            
            <div class="highlight">
                <p><strong>Tour:</strong> {tour_name}</p>
                <p><strong>Ngày khởi hành:</strong> {departure_date}</p>
                <p><strong>Còn lại:</strong> <strong style="color:#F59E0B">{days_until} ngày</strong></p>
            </div>
            
            <h3>📋 Checklist chuẩn bị</h3>
            <ul class="checklist">
                <li>☐ Pack đồ dùng cá nhân</li>
                <li>☐ Kiểm tra giấy tờ (CCCD/Passport)</li>
                <li>☐ Đặt taxi/transport đến điểm đón</li>
                <li>☐ Thông báo cho người thân</li>
            </ul>
        </div>
    </div>
</body>
</html>
        """
        
        return {"subject": subject, "body": body, "html": html}


class BackgroundJobProcessor:
    """
    Background Job Processor
    """
    
    def __init__(self):
        self.jobs: Dict[str, Job] = {}
        self.scheduler = None
        self.email_service = ConsoleEmailService()
        
        if APSCHEDULER_AVAILABLE:
            self.scheduler = AsyncIOScheduler()
    
    async def start(self):
        """Start the job processor"""
        if APSCHEDULER_AVAILABLE and self.scheduler:
            self.scheduler.start()
            print("Background job scheduler started")
    
    async def stop(self):
        """Stop the job processor"""
        if self.scheduler:
            self.scheduler.shutdown()
    
    async def add_job(
        self,
        job_id: str,
        job_type: JobType,
        payload: Dict[str, Any],
        scheduled_at: Optional[datetime] = None,
        delay_seconds: int = 0
    ) -> Job:
        """Add a new job to the queue"""
        job = Job(
            job_id=job_id,
            job_type=job_type,
            payload=payload
        )
        
        if scheduled_at:
            job.scheduled_at = scheduled_at
        elif delay_seconds > 0:
            job.scheduled_at = datetime.now() + timedelta(seconds=delay_seconds)
        
        self.jobs[job_id] = job
        
        # Schedule if APScheduler is available
        if self.scheduler and job.scheduled_at:
            self.scheduler.add_job(
                self._execute_job,
                DateTrigger(run_date=job.scheduled_at),
                args=[job_id],
                id=job_id
            )
        elif delay_seconds > 0:
            # Run as async task
            asyncio.create_task(self._delayed_execute(job_id, delay_seconds))
        else:
            # Run immediately
            asyncio.create_task(self._execute_job(job_id))
        
        return job
    
    async def _delayed_execute(self, job_id: str, delay: int):
        """Execute job after delay"""
        await asyncio.sleep(delay)
        await self._execute_job(job_id)
    
    async def _execute_job(self, job_id: str):
        """Execute a job"""
        job = self.jobs.get(job_id)
        if not job:
            return
        
        job.status = JobStatus.RUNNING
        job.started_at = datetime.now()
        
        try:
            if job.job_type == JobType.EMAIL:
                await self._send_email(job)
            elif job.job_type == JobType.BOOKING_CONFIRMATION:
                await self._send_booking_confirmation(job)
            elif job.job_type == JobType.BOOKING_REMINDER:
                await self._send_booking_reminder(job)
            elif job.job_type == JobType.PAYMENT_REMINDER:
                await self._send_payment_reminder(job)
            elif job.job_type == JobType.CACHE_CLEAR:
                await self._clear_cache(job)
            
            job.status = JobStatus.COMPLETED
            job.completed_at = datetime.now()
            
        except Exception as e:
            job.status = JobStatus.FAILED
            job.error = str(e)
            job.retry_count += 1
            
            # Retry if not exceeded max retries
            if job.retry_count < job.max_retries:
                job.status = JobStatus.PENDING
                asyncio.create_task(
                    self.add_job(
                        job.job_id,
                        job.job_type,
                        job.payload,
                        delay_seconds=60 * job.retry_count  # Exponential backoff
                    )
                )
    
    async def _send_email(self, job: Job):
        """Send email"""
        to = job.payload.get("to")
        subject = job.payload.get("subject")
        body = job.payload.get("body", "")
        html = job.payload.get("html")
        
        if to and subject:
            await self.email_service.send_email(to, subject, body, html)
    
    async def _send_booking_confirmation(self, job: Job):
        """Send booking confirmation email"""
        p = job.payload
        template = EmailTemplates.booking_confirmation(
            customer_name=p.get("customer_name", "Khách hàng"),
            tour_name=p.get("tour_name", "Tour"),
            booking_code=p.get("booking_code", "N/A"),
            departure_date=p.get("departure_date", "N/A"),
            num_adults=p.get("num_adults", 1),
            num_children=p.get("num_children", 0),
            total_price=p.get("total_price", "N/A")
        )
        
        await self.email_service.send_email(
            to=p.get("email"),
            subject=template["subject"],
            body=template["body"],
            html=template["html"]
        )
    
    async def _send_booking_reminder(self, job: Job):
        """Send booking reminder email"""
        p = job.payload
        template = EmailTemplates.booking_reminder(
            customer_name=p.get("customer_name", "Khách hàng"),
            tour_name=p.get("tour_name", "Tour"),
            booking_code=p.get("booking_code", "N/A"),
            departure_date=p.get("departure_date", "N/A"),
            days_until=p.get("days_until", 7)
        )
        
        await self.email_service.send_email(
            to=p.get("email"),
            subject=template["subject"],
            body=template["body"],
            html=template["html"]
        )
    
    async def _send_payment_reminder(self, job: Job):
        """Send payment reminder email"""
        p = job.payload
        
        subject = f"💰 Nhắc nhở thanh toán - Mã: {p.get('booking_code', 'N/A')}"
        body = f"""
Xin chào {p.get('customer_name', 'Khách hàng')},

Đơn đặt tour của bạn chưa được thanh toán.

Mã booking: {p.get('booking_code', 'N/A')}
Tour: {p.get('tour_name', 'N/A')}
Số tiền: {p.get('total_price', 'N/A')}
Hạn thanh toán: {p.get('payment_deadline', 'N/A')}

Vui lòng thanh toán sớm để xác nhận đặt chỗ.

TravelGPT Team
        """
        
        await self.email_service.send_email(
            to=p.get("email"),
            subject=subject,
            body=body
        )
    
    async def _clear_cache(self, job: Job):
        """Clear cache"""
        from app.core.cache import cache
        
        cache_type = job.payload.get("type", "all")
        if cache_type == "all":
            await cache.clear_all()
        elif cache_type == "tours":
            await cache.invalidate_tour_lists()
    
    def get_job_status(self, job_id: str) -> Optional[Job]:
        """Get job status"""
        return self.jobs.get(job_id)
    
    def cancel_job(self, job_id: str) -> bool:
        """Cancel a job"""
        if job_id in self.jobs:
            job = self.jobs[job_id]
            job.status = JobStatus.CANCELLED
            
            if self.scheduler:
                self.scheduler.remove_job(job_id)
            
            return True
        return False
    
    def schedule_daily_task(
        self,
        job_id: str,
        hour: int,
        minute: int,
        func: Callable,
        args: tuple = ()
    ):
        """Schedule a daily recurring task"""
        if APSCHEDULER_AVAILABLE and self.scheduler:
            self.scheduler.add_job(
                func,
                CronTrigger(hour=hour, minute=minute),
                args=args,
                id=job_id,
                replace_existing=True
            )


# Global job processor
job_processor = BackgroundJobProcessor()


# Convenience functions
async def send_booking_confirmation_email(
    email: str,
    customer_name: str,
    tour_name: str,
    booking_code: str,
    departure_date: str,
    num_adults: int,
    num_children: int,
    total_price: str,
    delay_seconds: int = 0
) -> Job:
    """Send booking confirmation email"""
    return await job_processor.add_job(
        job_id=f"booking_confirm_{booking_code}",
        job_type=JobType.BOOKING_CONFIRMATION,
        payload={
            "email": email,
            "customer_name": customer_name,
            "tour_name": tour_name,
            "booking_code": booking_code,
            "departure_date": departure_date,
            "num_adults": num_adults,
            "num_children": num_children,
            "total_price": total_price
        },
        delay_seconds=delay_seconds
    )


async def schedule_booking_reminder(
    email: str,
    customer_name: str,
    tour_name: str,
    booking_code: str,
    departure_date: str,
    days_before: int = 3
) -> Job:
    """Schedule booking reminder email"""
    # Calculate reminder time
    dep_date = datetime.fromisoformat(departure_date)
    reminder_date = dep_date - timedelta(days=days_before)
    
    # Only schedule if reminder is in the future
    if reminder_date > datetime.now():
        return await job_processor.add_job(
            job_id=f"booking_reminder_{booking_code}_{days_before}d",
            job_type=JobType.BOOKING_REMINDER,
            payload={
                "email": email,
                "customer_name": customer_name,
                "tour_name": tour_name,
                "booking_code": booking_code,
                "departure_date": departure_date,
                "days_until": days_before
            },
            scheduled_at=reminder_date
        )
    
    return None
