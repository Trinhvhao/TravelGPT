"""
Enhanced Chat API với Phase 1 & Phase 2 Features
Plus LangGraph + Mem0 Integration

PRODUCTION FIXES:
- Uses session-based agent management (per user/session)
- Proper input validation
- Cancellation flow updates DB properly
- Error handling with logging
"""
import re
from fastapi import APIRouter, Depends, Query, HTTPException, Header
from fastapi.responses import StreamingResponse
from typing import Optional, List
from prisma import Prisma
from datetime import datetime, timedelta
import json
import asyncio
import logging

from app.core.prisma import get_db
from app.api.deps import get_current_user, get_optional_user
from app.core.llm_client import ToolCallsResult
from app.schemas.chat import (
    ChatRequest, ChatResponse, ChatMessageResponse, ChatHistoryResponse,
    ChatConversationResponse, MessageRole,
    BookingFlowStatus, BookingFlowActionRequest, BookingFlowActionResponse,
    BookingFlowStep, BookingFlowData,
    RecommendationRequest, RecommendationResponse, TourRecommendation,
    SessionStats, ClearSessionRequest, ClearSessionResponse,
    CancellationStatus, CancellationActionRequest, CancellationActionResponse,
    RescheduleStatus, RescheduleActionRequest, RescheduleActionResponse,
    PreTripRequest, PreTripResponse,
    PostTripRequest, PostTripResponse,
    ConversationStateResponse, TurnInfo
)
from app.ai.agent import TravelAgent
from app.ai.multi_turn import get_conversation_manager, MultiTurnConversationManager
from app.ai.trip_support import PreTripSupport, PostTripSupport
from app.ai.cancellation import CancellationFlow, RescheduleFlow
from app.services.booking_service import BookingService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["Chat"])

# Session-scoped cache for streaming endpoint
_streaming_cache: dict[str, "StreamingContext"] = {}

class StreamingContext:
    """Holds per-session objects for streaming chat."""
    __slots__ = ("memory", "intent_detector", "recommendation_engine")
    def __init__(self):
        from app.ai.conversation import ConversationMemory
        from app.ai.intent import AdvancedIntentDetector
        from app.ai.recommendation import RecommendationEngine
        self.memory = ConversationMemory()
        self.intent_detector = AdvancedIntentDetector()
        self.recommendation_engine = RecommendationEngine()

def get_streaming_context(session_id: str) -> StreamingContext:
    """Get or create StreamingContext for a session."""
    if session_id not in _streaming_cache:
        _streaming_cache[session_id] = StreamingContext()
    return _streaming_cache[session_id]

# Session ID validation pattern (alphanumeric, hyphens, underscores)
SESSION_ID_PATTERN = re.compile(r"^[a-zA-Z0-9_-]{1,128}$")


def validate_session_id(session_id: str) -> bool:
    """Validate session ID format to prevent injection."""
    return bool(SESSION_ID_PATTERN.match(session_id))


def get_agent_for_session(db: Prisma, session_id: str) -> TravelAgent:
    """
    Get or create TravelAgent for a session.
    In production, this should use Redis to share agents across workers.
    """
    # Use session_id as key for better isolation
    # In production with multiple workers, use Redis hash
    return TravelAgent(db)


def convert_message_response(msg):
    return {
        "id": msg.id,
        "conversation_id": msg.conversation_id,
        "role": msg.role,
        "content": msg.content,
        "metadata": msg.metadata if isinstance(msg.metadata, dict) else {},
        "created_at": msg.created_at
    }


# ============= Main Chat Endpoint =============

@router.post("/message", response_model=ChatResponse)
async def send_message(
    request: ChatRequest,
    current_user = Depends(get_optional_user),
    db: Prisma = Depends(get_db)
):
    """
    Gửi tin nhắn cho AI chatbot - Main chat endpoint
    """
    user_id = current_user.id if current_user else "anonymous"
    session_id = request.session_id or f"session_{user_id}"
    
    # Validate session_id to prevent injection
    if session_id and not validate_session_id(session_id):
        raise HTTPException(status_code=400, detail="Invalid session_id format")

    try:
        agent = get_agent_for_session(db, session_id)
        result = await agent.chat(user_id, session_id, request.message, request.context)
    except Exception as e:
        logger.error(f"Chat error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Chat service temporarily unavailable")

    # Save to database
    conversation = None
    saved_message = None

    if current_user:
        try:
            conversation = await db.chatconversation.upsert(
                where={
                    "session_id_user_id": {
                        "session_id": session_id,
                        "user_id": user_id
                    }
                },
                data={
                    "create": {"user_id": user_id, "session_id": session_id},
                    "update": {}
                }
            )

            await db.chatmessage.create(
                data={
                    "conversation_id": conversation.id,
                    "role": MessageRole.USER.value,
                    "content": request.message,
                    "metadata": {"intent": result.get("intent")},
                },
            )

            saved_message = await db.chatmessage.create(
                data={
                    "conversation_id": conversation.id,
                    "role": MessageRole.ASSISTANT.value,
                    "content": result["response"],
                    "metadata": {
                        "intent": result.get("intent"),
                        "suggestions": result.get("suggestions", [])
                    }
                }
            )

            await db.chatconversation.update(
                where={"id": conversation.id},
                data={}
            )

        except Exception as db_error:
            logger.warning(f"Failed to save chat message: {db_error}")

    return ChatResponse(
        message=ChatMessageResponse(
            id=saved_message.id if saved_message else "",
            conversation_id=conversation.id if conversation else session_id,
            role=MessageRole.ASSISTANT,
            content=result["response"],
            metadata={
                "intent": result.get("intent"),
                "suggestions": result.get("suggestions", [])
            },
            created_at=saved_message.created_at if saved_message else datetime.utcnow()
        ) if saved_message else ChatMessageResponse(
            id="", conversation_id=session_id, role=MessageRole.ASSISTANT,
            content=result["response"], metadata={}, created_at=datetime.utcnow()
        ),
        conversation_id=conversation.id if conversation else session_id,
        suggestions=result.get("suggestions", []),
        intent=result.get("intent"),
        booking_flow_active=result.get("booking_flow_active"),
        booking_step=result.get("booking_step"),
        booking_data=result.get("booking_data"),
        booking_code=result.get("booking_code"),
        booking_flow_complete=result.get("booking_flow_complete"),
        cancellation_flow_active=result.get("cancellation_flow_active"),
        cancellation_step=result.get("cancellation_step"),
        reschedule_flow_active=result.get("reschedule_flow_active"),
        reschedule_step=result.get("reschedule_step")
    )


# ============= Multi-turn Conversation =============

@router.get("/conversation/{session_id}", response_model=ConversationStateResponse)
async def get_conversation_state(
    session_id: str,
    db: Prisma = Depends(get_db)
):
    """
    Lấy trạng thái cuộc trò chuyện đa lượt
    """
    manager = get_conversation_manager(session_id)
    
    progress = manager.check_progress()
    
    turns = [
        TurnInfo(
            turn_id=t.turn_id,
            user_message=t.user_message,
            assistant_response=t.assistant_response,
            intent=t.intent,
            timestamp=t.timestamp
        )
        for t in manager.turns[-10:]
    ]
    
    return ConversationStateResponse(
        session_id=session_id,
        state=progress["state"],
        total_turns=progress["total_turns"],
        turns_without_progress=progress["turns_without_progress"],
        needs_attention=progress["needs_attention"],
        active_goal_type=progress["active_goal"]["goal_type"] if progress["active_goal"] else None,
        completed_goals=progress["completed_goals"],
        recent_turns=turns,
        context=manager.shared_context,
        collected_entities=manager.entities_collected
    )


@router.post("/conversation/{session_id}/goal")
async def create_conversation_goal(
    session_id: str,
    goal_type: str,
    target: Optional[str] = None,
    db: Prisma = Depends(get_db)
):
    """
    Tạo goal mới cho conversation
    """
    manager = get_conversation_manager(session_id)
    goal_id = manager.start_goal(goal_type, target)
    
    return {"goal_id": goal_id, "message": f"Đã tạo goal: {goal_type}"}


@router.delete("/conversation/{session_id}/goal")
async def cancel_conversation_goal(
    session_id: str,
    db: Prisma = Depends(get_db)
):
    """
    Hủy goal hiện tại
    """
    manager = get_conversation_manager(session_id)
    if manager.active_goal:
        goal_id = manager.active_goal.goal_id
        manager.cancel_goal(goal_id)
        return {"success": True, "message": f"Đã hủy goal: {goal_id}"}
    
    return {"success": False, "message": "Không có goal đang hoạt động"}


# ============= Pre-trip Support =============

@router.post("/pre-trip/checklist", response_model=PreTripResponse)
async def get_pre_trip_checklist(
    request: PreTripRequest,
    db: Prisma = Depends(get_db)
):
    """
    Lấy checklist chuẩn bị trước chuyến đi
    """
    trip_type = request.trip_type or "beach"
    checklist = PreTripSupport.get_complete_checklist(trip_type)
    
    checklist_formatted = PreTripSupport.format_checklist(checklist)
    
    # Get packing tips
    packing_tips = PreTripSupport.get_packing_tips(
        trip_type, request.destination or "", request.duration or 3
    )
    
    return PreTripResponse(
        checklist=checklist_formatted,
        packing_tips=packing_tips,
        countdown_message=PreTripSupport.get_countdown_message(
            request.departure_date or datetime.now() + timedelta(days=7)
        )
    )


@router.post("/pre-trip/weather", response_model=PreTripResponse)
async def get_weather_reminder(
    request: PreTripRequest,
    db: Prisma = Depends(get_db)
):
    """
    Lấy thông tin thời tiết và nhắc nhở
    """
    if not request.destination:
        raise HTTPException(status_code=400, detail="Destination is required")
    
    weather_message = PreTripSupport.get_weather_reminder(
        request.destination,
        request.departure_date or datetime.now() + timedelta(days=7)
    )
    
    local_tips = PreTripSupport.get_local_tips(request.destination)
    
    return PreTripResponse(
        weather_info=weather_message,
        local_tips=[t["tip"] for t in local_tips],
        countdown_message=PreTripSupport.get_countdown_message(
            request.departure_date or datetime.now() + timedelta(days=7)
        )
    )


@router.post("/pre-trip/summary", response_model=PreTripResponse)
async def get_pre_trip_summary(
    request: PreTripRequest,
    db: Prisma = Depends(get_db)
):
    """
    Lấy tổng hợp thông tin chuẩn bị trước chuyến đi
    """
    trip_assistant = PreTripSupport()
    
    departure = request.departure_date or datetime.now() + timedelta(days=7)
    return_date = request.return_date or departure + timedelta(days=request.duration or 3)
    
    # Get all pre-trip info
    countdown = PreTripSupport.get_countdown_message(departure)
    weather = PreTripSupport.get_weather_reminder(request.destination or "Đà Nẵng", departure)
    local_tips = PreTripSupport.get_local_tips(request.destination or "đà nẵng")
    packing_tips = PreTripSupport.get_packing_tips(
        request.trip_type or "beach",
        request.destination or "",
        request.duration or 3
    )
    
    checklist = PreTripSupport.get_complete_checklist(request.trip_type or "beach")
    checklist_text = PreTripSupport.format_checklist(checklist)
    
    return PreTripResponse(
        countdown_message=countdown,
        weather_info=weather,
        local_tips=[t["tip"] for t in local_tips],
        packing_tips=packing_tips,
        checklist=checklist_text
    )


# ============= Post-trip Support =============

@router.post("/post-trip/feedback", response_model=PostTripResponse)
async def get_feedback_survey(
    request: PostTripRequest,
    db: Prisma = Depends(get_db)
):
    """
    Lấy survey feedback sau chuyến đi
    """
    if not request.booking_code:
        raise HTTPException(status_code=400, detail="Booking code is required")
    
    survey = PostTripSupport.generate_feedback_survey(
        request.booking_code,
        request.tour_name or "Tour của bạn"
    )
    
    return PostTripResponse(
        feedback_survey=survey
    )


@router.post("/post-trip/review-prompt", response_model=PostTripResponse)
async def get_review_prompt(
    request: PostTripRequest,
    db: Prisma = Depends(get_db)
):
    """
    Lấy prompt viết review
    """
    if not request.tour_name:
        raise HTTPException(status_code=400, detail="Tour name is required")
    
    prompt = PostTripSupport.generate_review_prompt(
        request.tour_name,
        request.destination or ""
    )
    
    return PostTripResponse(
        review_prompt=prompt
    )


@router.post("/post-trip/loyalty", response_model=PostTripResponse)
async def get_loyalty_points(
    request: PostTripRequest,
    db: Prisma = Depends(get_db)
):
    """
    Tính điểm tích lũy
    """
    loyalty = PostTripSupport.calculate_loyalty_points(
        num_adults=request.num_adults or 1,
        num_children=request.num_children or 0,
        total_spent=request.total_spent or 0,
        is_first_booking=request.is_first_booking or False
    )
    
    return PostTripResponse(
        loyalty_points=loyalty["earned_points"],
        loyalty_tier=loyalty["tier"],
        loyalty_benefits=loyalty["benefits"],
        points_to_next_tier=loyalty["points_to_next_tier"]
    )


@router.post("/post-trip/summary", response_model=PostTripResponse)
async def get_post_trip_summary(
    request: PostTripRequest,
    current_user=Depends(get_optional_user),
    db: Prisma = Depends(get_db)
):
    """
    Lấy tổng hợp thông tin sau chuyến đi.
    Nếu không cung cấp booking_code, tự động lấy booking gần nhất của user.
    """
    # Resolve booking from DB
    booking = None
    if request.booking_code:
        booking = await db.booking.find_unique(
            where={"bookingCode": request.booking_code},
            include={"tour": True}
        )
    elif current_user:
        # Auto-lookup: get most recent COMPLETED/CONFIRMED booking for user
        recent = await db.booking.find_many(
            where={
                "userId": current_user.id,
                "status": {"in": ["COMPLETED", "CONFIRMED"]}
            },
            include={"tour": True},
            order={"createdAt": "desc"},
            take=1
        )
        if recent:
            booking = recent[0]

    # Extract real data from booking
    tour_name = request.tour_name or (booking.tour.name if booking and booking.tour else None)
    destination = request.destination or (booking.tour.destination if booking and booking.tour else None)
    departure_date = request.departure_date or booking.departureDate if booking else None
    return_date = request.return_date
    num_adults = request.num_adults or (booking.numAdults if booking else 1)
    num_children = request.num_children or (booking.numChildren if booking else 0)
    total_spent = request.total_spent or (float(booking.totalPrice) if booking and booking.totalPrice else 0)

    # Compute return date from tour duration if not provided
    if not return_date and booking and booking.tour and departure_date:
        try:
            from datetime import timedelta
            import re
            dur_str = booking.tour.duration or "3 ngày 2 đêm"
            m = re.search(r"(\d+)\s*ngày", dur_str)
            if m:
                days = int(m.group(1))
                dep = datetime.strptime(departure_date.strftime("%Y-%m-%d"), "%Y-%m-%d")
                return_date = dep + timedelta(days=days)
        except Exception:
            pass

    # Determine is_first_booking
    is_first = request.is_first_booking
    if is_first is None and current_user:
        count = await db.booking.count(where={"userId": current_user.id})
        is_first = count <= 1

    # Build loyalty
    loyalty = PostTripSupport.calculate_loyalty_points(
        num_adults=num_adults,
        num_children=num_children,
        total_spent=total_spent,
        is_first_booking=is_first or False
    )

    booking_code = request.booking_code or (booking.bookingCode if booking else None)

    # Generate feedback + reminders
    survey = PostTripSupport.generate_feedback_survey(
        booking_code or "UNKNOWN",
        tour_name or "Tour của bạn"
    )
    return_reminder = PostTripSupport.get_return_reminders(
        tour_name or "Tour của bạn",
        return_date or datetime.now()
    )

    return PostTripResponse(
        feedback_survey=survey,
        loyalty_points=loyalty["earned_points"],
        loyalty_tier=loyalty["tier"],
        loyalty_benefits=loyalty["benefits"],
        points_to_next_tier=loyalty["points_to_next_tier"],
        return_reminder=return_reminder
    )


# ============= Cancellation Flow =============

@router.post("/cancellation/start", response_model=CancellationActionResponse)
async def start_cancellation(
    request: CancellationActionRequest,
    current_user = Depends(get_optional_user),
    db: Prisma = Depends(get_db)
):
    """
    Bắt đầu cancellation flow
    """
    session_id = request.session_id
    
    # Get or create cancellation flow
    agent = get_agent_for_session(db, session_id)
    cancel_flow = agent.get_cancellation_flow(session_id)
    
    booking_code = request.booking_code
    
    if booking_code:
        # Get booking from database
        booking = await db.booking.find_unique(
            where={"booking_code": booking_code},
            include={"tour": True}
        )
        
        if not booking:
            return CancellationActionResponse(
                success=False,
                message=f"Không tìm thấy booking: {booking_code}"
            )
        
        # Check authorization
        user_id = current_user.id if current_user else "anonymous"
        if booking.userId and booking.userId != user_id:
            user = await db.user.find_unique(where={"id": user_id})
            if not user or user.role != "ADMIN":
                return CancellationActionResponse(
                    success=False,
                    message="Bạn không có quyền hủy booking này"
                )
        
        booking_data = {
            "booking_id": booking.id,
            "booking_code": booking.bookingCode,
            "tour_name": booking.tour.name if booking.tour else None,
            "departure_date": booking.departureDate,
            "total_price": str(booking.totalPrice) if booking.totalPrice else None,
            "payment_status": booking.paymentStatus
        }
        
        result = cancel_flow.start_flow(booking_code, booking_data)
        verify_result = cancel_flow.verify_booking(booking_code, booking_data)
        
        return CancellationActionResponse(
            success=True,
            message=verify_result.get("message", "Đã xác minh booking"),
            current_step=verify_result.get("current_step"),
            refund_amount=verify_result.get("refund_amount"),
            refund_percent=verify_result.get("refund_percent")
        )
    
    # No booking code, start empty flow
    cancel_flow.start_flow()
    
    return CancellationActionResponse(
        success=True,
        message="Vui lòng cung cấp mã booking để bắt đầu hủy."
    )


@router.post("/cancellation/action", response_model=CancellationActionResponse)
async def cancellation_action(
    action: str,
    session_id: str,
    reason: Optional[str] = None,
    confirm: Optional[bool] = None,
    db: Prisma = Depends(get_db)
):
    """
    Thực hiện action trên cancellation flow.
    Khi confirm, cập nhật DB thực tế.
    """
    # Validate session_id
    if not validate_session_id(session_id):
        raise HTTPException(status_code=400, detail="Invalid session_id format")

    agent = get_agent_for_session(db, session_id)
    cancel_flow = agent.get_cancellation_flow(session_id)

    if action == "cancel":
        cancel_flow.is_active = False
        return CancellationActionResponse(
            success=True,
            message="Đã hủy yêu cầu hủy booking"
        )

    elif action == "status":
        return CancellationActionResponse(
            success=True,
            message="Trạng thái cancellation flow",
            current_step=cancel_flow.current_step.value if cancel_flow.is_active else "completed",
            refund_amount=cancel_flow.cancellation_data.refund_amount,
            refund_percent=cancel_flow.cancellation_data.refund_percent
        )

    elif action == "select_reason" and reason:
        result = cancel_flow.select_reason(reason)
        return CancellationActionResponse(
            success=True,
            message=result.get("message", f"Đã chọn lý do: {reason}"),
            current_step=result.get("current_step")
        )

    elif action == "confirm" and confirm is not None:
        result = cancel_flow.confirm_cancellation(confirm)
        if result.get("ready_to_process"):
            # Process cancellation - update DB actually
            booking_code = cancel_flow.cancellation_data.booking_code
            if booking_code:
                try:
                    booking_service = BookingService(db)
                    # Get booking to find ID
                    booking = await booking_service.get_booking_by_code(booking_code)
                    if booking:
                        # Get user from agent or use None for anonymous
                        user_id = "anonymous"  # Could extract from session
                        await booking_service.cancel_booking(booking.id, user_id)
                        logger.info(f"Cancellation processed for booking: {booking_code}")
                except ValueError as e:
                    logger.error(f"Cancellation failed: {e}")
                    return CancellationActionResponse(
                        success=False,
                        message=f"Lỗi khi hủy booking: {str(e)}",
                        current_step="error"
                    )
                except Exception as e:
                    logger.error(f"Cancellation error: {e}", exc_info=True)
                    return CancellationActionResponse(
                        success=False,
                        message="Đã xảy ra lỗi khi xử lý hủy booking",
                        current_step="error"
                    )

            result = cancel_flow.process_cancellation()
            return CancellationActionResponse(
                success=True,
                message=result.get("message", "Đã hủy booking thành công!"),
                current_step="success",
                completed=True
            )
        return CancellationActionResponse(
            success=not confirm,
            message=result.get("message", "Đã xác nhận")
        )
    
    return CancellationActionResponse(
        success=False,
        message="Unknown action"
    )


@router.get("/cancellation/refund-policy")
async def get_refund_policy(db: Prisma = Depends(get_db)):
    """
    Lấy chính sách hoàn tiền
    """
    return {
        "policy": [
            {"days_before": "14+", "refund_percent": 90, "description": "Hoàn 90% giá tour"},
            {"days_before": "7-13", "refund_percent": 70, "description": "Hoàn 70% giá tour"},
            {"days_before": "3-6", "refund_percent": 50, "description": "Hoàn 50% giá tour"},
            {"days_before": "1-2", "refund_percent": 20, "description": "Hoàn 20% giá tour"},
            {"days_before": "0", "refund_percent": 0, "description": "Không hoàn tiền"}
        ],
        "processing_fee_percent": 5,
        "note": "Phí xử lý 5% sẽ được trừ vào số tiền hoàn"
    }


# ============= Reschedule Flow =============

@router.post("/reschedule/start", response_model=RescheduleActionResponse)
async def start_reschedule(
    request: RescheduleActionRequest,
    current_user = Depends(get_optional_user),
    db: Prisma = Depends(get_db)
):
    """
    Bắt đầu reschedule flow
    """
    session_id = request.session_id
    
    agent = get_agent_for_session(db, session_id)
    reschedule_flow = agent.get_reschedule_flow(session_id)
    
    booking_code = request.booking_code
    
    if booking_code:
        booking = await db.booking.find_unique(
            where={"booking_code": booking_code},
            include={"tour": True}
        )
        
        if not booking:
            return RescheduleActionResponse(
                success=False,
                message=f"Không tìm thấy booking: {booking_code}"
            )
        
        user_id = current_user.id if current_user else "anonymous"
        if booking.userId and booking.userId != user_id:
            user = await db.user.find_unique(where={"id": user_id})
            if not user or user.role != "ADMIN":
                return RescheduleActionResponse(
                    success=False,
                    message="Bạn không có quyền đổi lịch booking này"
                )
        
        booking_data = {
            "booking_id": booking.id,
            "booking_code": booking.bookingCode,
            "tour_id": booking.tourId,
            "tour_name": booking.tour.name if booking.tour else None,
            "departure_date": booking.departureDate,
            "total_price": str(booking.totalPrice) if booking.totalPrice else None
        }
        
        result = reschedule_flow.start_flow(booking_code, booking_data)
        eligibility = reschedule_flow.check_eligibility()
        
        if eligibility.get("eligible"):
            available_dates = reschedule_flow.get_available_dates(booking.tourId)
            
            message = eligibility.get("message", "") + "\n\n### 📅 Ngày có sẵn:\n"
            for d in available_dates[:5]:
                message += f"- {d['date_display']} ({d['day_of_week']})\n"
            
            return RescheduleActionResponse(
                success=True,
                message=message,
                current_step=reschedule_flow.current_step.value,
                eligible=True,
                available_dates=available_dates[:5]
            )
        else:
            return RescheduleActionResponse(
                success=False,
                message=eligibility.get("error", "Không thể đổi lịch"),
                eligible=False
            )
    
    reschedule_flow.start_flow()
    return RescheduleActionResponse(
        success=True,
        message="Vui lòng cung cấp mã booking để đổi lịch."
    )


@router.post("/reschedule/action", response_model=RescheduleActionResponse)
async def reschedule_action(
    action: str,
    session_id: str,
    new_date: Optional[str] = None,
    confirm: Optional[bool] = None,
    db: Prisma = Depends(get_db)
):
    """
    Thực hiện action trên reschedule flow
    """
    agent = get_agent_for_session(db, session_id)
    reschedule_flow = agent.get_reschedule_flow(session_id)
    
    if action == "cancel":
        reschedule_flow.is_active = False
        return RescheduleActionResponse(
            success=True,
            message="Đã hủy yêu cầu đổi lịch"
        )
    
    elif action == "status":
        return RescheduleActionResponse(
            success=True,
            message="Trạng thái reschedule flow",
            current_step=reschedule_flow.current_step.value if reschedule_flow.is_active else "completed",
            original_date=str(reschedule_flow.reschedule_data.original_date) if reschedule_flow.reschedule_data.original_date else None,
            new_date=str(reschedule_flow.reschedule_data.new_date) if reschedule_flow.reschedule_data.new_date else None,
            price_difference=reschedule_flow.reschedule_data.price_difference
        )
    
    elif action == "select_date" and new_date:
        result = reschedule_flow.set_new_date(new_date)
        if result.get("available"):
            return RescheduleActionResponse(
                success=True,
                message=result.get("message", "Ngày có sẵn"),
                current_step=result.get("current_step"),
                available=True,
                price_difference=result.get("price_difference")
            )
        elif result.get("error"):
            return RescheduleActionResponse(
                success=False,
                message=result.get("error"),
                current_step=result.get("current_step")
            )
    
    elif action == "confirm" and confirm is not None:
        result = reschedule_flow.confirm_reschedule(confirm)
        if result.get("ready_to_process"):
            result = reschedule_flow.process_reschedule()
            return RescheduleActionResponse(
                success=True,
                message=result.get("message"),
                current_step="success",
                completed=True
            )
        return RescheduleActionResponse(
            success=not confirm,
            message=result.get("message", "Đã xác nhận")
        )
    
    elif action == "available_dates":
        available = reschedule_flow.get_available_dates("")
        return RescheduleActionResponse(
            success=True,
            available_dates=available,
            message=f"Có {len(available)} ngày có sẵn"
        )
    
    return RescheduleActionResponse(
        success=False,
        message="Unknown action"
    )


# ============= Legacy Endpoints =============

@router.get("/history", response_model=ChatHistoryResponse)
async def get_chat_history(
    session_id: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    current_user = Depends(get_current_user),
    db: Prisma = Depends(get_db)
):
    """Lấy lịch sử trò chuyện"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    where = {"user_id": current_user.id}
    if session_id:
        where["session_id"] = session_id
    
    conversations = await db.chatconversation.find_many(
        where=where,
        take=limit,
        order={"updated_at": "desc"},
        include={
            "messages": {"order": {"created_at": "asc"}, "take": 100}
        }
    )
    
    return ChatHistoryResponse(
        conversations=[
            ChatConversationResponse(
                id=conv.id,
                session_id=conv.session_id,
                created_at=conv.created_at,
                updated_at=conv.updated_at,
                messages=[ChatMessageResponse(**convert_message_response(msg)) for msg in conv.messages]
            )
            for conv in conversations
        ]
    )


@router.delete("/history")
async def clear_chat_history(
    session_id: Optional[str] = None,
    current_user = Depends(get_current_user),
    db: Prisma = Depends(get_db)
):
    """Xóa lịch sử trò chuyện"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    where = {"user_id": current_user.id}
    if session_id:
        where["session_id"] = session_id
    
    conversations = await db.chatconversation.find_many(where=where)
    
    for conv in conversations:
        await db.chatmessage.delete_many(where={"conversation_id": conv.id})
    
    await db.chatconversation.delete_many(where=where)
    
    return {"success": True, "message": "Chat history cleared"}


@router.get("/suggestions")
async def get_suggestions(
    intent: str = "general",
    current_user = Depends(get_optional_user),
    db: Prisma = Depends(get_db)
):
    """Lấy suggestions dựa trên intent"""
    suggestions_map = {
        "greeting": ["Tìm tour Đà Nẵng", "Tour biển 3 ngày", "Đặt tour Hội An"],
        "search": ["Tour dưới 5 triệu", "Tour 3 ngày 2 đêm", "Tour nổi bật"],
        "booking": ["Xem lại thông tin", "Chọn ngày khác", "Liên hệ hỗ trợ"],
        "cancel": ["Xác nhận hủy", "Không hủy nữa"],
        "general": ["Tour gần đây", "Tour giá tốt nhất", "Liên hệ tư vấn"]
    }
    
    return {"suggestions": suggestions_map.get(intent, suggestions_map["general"])}


# ============= Enhanced Chat with Mem0 =============

@router.post("/message-v2", response_model=ChatResponse)
async def send_message_v2(
    request: ChatRequest,
    current_user = Depends(get_optional_user),
    db: Prisma = Depends(get_db)
):
    """
    Gửi tin nhắn với Mem0 memory - Enhanced chat endpoint
    Sử dụng long-term memory để cá nhân hóa cuộc trò chuyện
    """
    user_id = current_user.id if current_user else "anonymous"
    session_id = request.session_id or f"session_{user_id}"
    
    agent = get_agent_for_session(db, session_id)
    result = await agent.chat_with_memory(user_id, session_id, request.message, request.context)
    
    # Save to database
    conversation = None
    saved_message = None
    
    if current_user:
        conversation = await db.chatconversation.upsert(
            where={
                "session_id_user_id": {
                    "session_id": session_id,
                    "user_id": user_id
                }
            },
            data={
                "create": {"user_id": user_id, "session_id": session_id},
                "update": {}
            }
        )

        await db.chatmessage.create(
            data={
                "conversation_id": conversation.id,
                "role": MessageRole.USER.value,
                "content": request.message,
                "metadata": {"intent": result.get("intent")},
            },
        )

        saved_message = await db.chatmessage.create(
            data={
                "conversation_id": conversation.id,
                "role": MessageRole.ASSISTANT.value,
                "content": result["response"],
                "metadata": {
                    "intent": result.get("intent"),
                    "suggestions": result.get("suggestions", [])
                }
            }
        )

    return ChatResponse(
        message=ChatMessageResponse(
            id=saved_message.id if saved_message else "",
            conversation_id=conversation.id if conversation else session_id,
            role=MessageRole.ASSISTANT,
            content=result["response"],
            metadata={
                "intent": result.get("intent"),
                "suggestions": result.get("suggestions", []),
                "memory_context": result.get("memory_context", "")
            },
            created_at=saved_message.created_at if saved_message else datetime.utcnow()
        ) if saved_message else ChatMessageResponse(
            id="", conversation_id=session_id, role=MessageRole.ASSISTANT,
            content=result["response"], metadata={}, created_at=datetime.utcnow()
        ),
        conversation_id=conversation.id if conversation else session_id,
        suggestions=result.get("suggestions", []),
        intent=result.get("intent"),
        booking_flow_active=result.get("booking_flow_active"),
        booking_step=result.get("booking_step"),
        booking_data=result.get("booking_data"),
        booking_code=result.get("booking_code"),
        booking_flow_complete=result.get("booking_flow_complete"),
        cancellation_flow_active=result.get("cancellation_flow_active"),
        cancellation_step=result.get("cancellation_step"),
        reschedule_flow_active=result.get("reschedule_flow_active"),
        reschedule_step=result.get("reschedule_step")
    )


# ============= Helper Functions =============

async def _get_related_tours(executor, destination: str, limit: int = 5) -> List:
    """
    Get related tours when exact search fails.
    Uses fuzzy search and region-based search.
    """
    from app.core.llm_client import ToolCall

    # Common destination region mappings
    region_mappings = {
        "hà nội": "NORTH", "ha noi": "NORTH", "hanoi": "NORTH", "sapa": "NORTH", "sa pa": "NORTH",
        "hạ long": "NORTH", "ha long": "NORTH",
        "huế": "CENTRAL", "hue": "CENTRAL", "đà nẵng": "CENTRAL", "da nang": "CENTRAL",
        "hội an": "CENTRAL", "hoi an": "CENTRAL",
        "nha trang": "CENTRAL", "nhatrang": "CENTRAL",
        "tp hcm": "SOUTH", "hồ chí minh": "SOUTH", "saigon": "SOUTH",
        "phú quốc": "SOUTH", "phu quoc": "SOUTH",
        "cần thơ": "SOUTH", "can tho": "SOUTH",
    }

    dest_lower = destination.lower().strip()
    region = region_mappings.get(dest_lower)

    # First try fuzzy search
    fuzzy_args = {"query": destination, "limit": limit}
    fuzzy_tool_calls = [ToolCall(id="fallback_fuzzy", name="search_tours", arguments=fuzzy_args)]
    fuzzy_results = await executor.execute_tools(fuzzy_tool_calls, user_id="system")

    if fuzzy_results:
        for tr in fuzzy_results:
            if tr.get("result", {}).get("tours"):
                return tr["result"]["tours"]

    # If fuzzy fails, try by region
    if region:
        region_args = {"region": region, "limit": limit}
        region_tool_calls = [ToolCall(id="fallback_region", name="search_tours", arguments=region_args)]
        region_results = await executor.execute_tools(region_tool_calls, user_id="system")

        if region_results:
            for tr in region_results:
                if tr.get("result", {}).get("tours"):
                    return tr["result"]["tours"][:limit]

    # Last resort: get any featured tours
    featured_args = {"is_featured": True, "limit": limit}
    featured_tool_calls = [ToolCall(id="fallback_featured", name="search_tours", arguments=featured_args)]
    featured_results = await executor.execute_tools(featured_tool_calls, user_id="system")

    if featured_results:
        for tr in featured_results:
            if tr.get("result", {}).get("tours"):
                return tr["result"]["tours"][:limit]

    return []


# ============= Streaming Chat Endpoint =============

@router.post("/message/stream")
async def send_message_stream(
    request: ChatRequest,
    current_user = Depends(get_optional_user),
    db: Prisma = Depends(get_db)
):
    """
    Gửi tin nhắn với streaming response.
    Response được stream từ LLM theo thời gian thực.
    Backend gọi LLM streaming, yield từng chunk về frontend.
    """
    from app.ai.conversation import SYSTEM_PROMPT

    user_id = current_user.id if current_user else "anonymous"
    session_id = request.session_id or f"session_{user_id}"

    # Get session-scoped context (preserves conversation history)
    ctx = get_streaming_context(session_id)
    memory = ctx.memory
    intent_detector = ctx.intent_detector
    recommendation_engine = ctx.recommendation_engine

    async def _stream_text(text: str, chunk_size: int = 20):
        """Simulate streaming by yielding text in small chunks."""
        for i in range(0, len(text), chunk_size):
            yield text[i : i + chunk_size]

    async def generate_stream():
        try:
            # Send start signal
            yield f"data: {json.dumps({'type': 'start'})}\n\n"

            # Detect intent (fast, non-LLM)
            intent, extracted_params = intent_detector.detect(request.message)

            # Build user context from preferences
            pref = recommendation_engine.get_user_preference(user_id)
            context_msg = ""
            if pref.preferred_destinations:
                context_msg = f"\n[User preferences: thích đi {', '.join(pref.preferred_destinations[-2:])}]"

            logger.info(f"Streaming chat: session={session_id}, user={user_id}, msg_len={len(request.message)}, history_msgs={len(memory.get_messages())}")

            # Import required modules
            from app.core.llm_client import get_llm_client, LLMCircuitOpenError, LLMTimeoutError, ToolCallsResult
            from app.ai.llm_tools import TOOL_DEFINITIONS
            from app.ai.tools_executor import ToolExecutor

            llm_client = get_llm_client()
            executor = ToolExecutor(db)

            # Build system prompt with tool descriptions
            tool_descriptions = "\n\n## CÔNG CỤ CÓ SẴN (LUỒNG HÀNH ĐỘNG TỰ ĐỘNG):\n"
            for tool in TOOL_DEFINITIONS:
                func = tool["function"]
                params = func.get("parameters", {}).get("properties", {})
                required = func.get("parameters", {}).get("required", [])
                param_lines = []
                for pname, pdef in params.items():
                    req_mark = " (BẮT BUỘC)" if pname in required else " (tùy chọn)"
                    param_lines.append(f"  - {pname}: {pdef.get('description', '')}{req_mark}")
                param_str = "\n".join(param_lines) if param_lines else "  (không có tham số)"
                tool_descriptions += f"\n### {func['name']}\n  Mô tả: {func['description']}\n  Tham số:\n{param_str}\n"

            # Enrich system prompt with tools
            system_with_tools = SYSTEM_PROMPT + context_msg + tool_descriptions

            # INTENT-DRIVEN TOOL EXECUTION (bypass LLM tool calling)
            # The LLM doesn't reliably call tools, so we use intent detection instead
            tour_results_for_complete: List = []
            content_blocks_for_complete: List = []
            tool_related_intents = {
                "search_tour", "list_tours", "list_all_tours", "booking", "cancel", 
                "reschedule", "get_booking", "get_tour_detail", "compare_tour", 
                "price_inquiry", "availability", "weather_inquiry", "post_trip",
                "general_question"  # Also check for tour-related queries
            }
            
            # Check if this general question might be about tours
            is_tour_query = any(keyword in request.message.lower() for keyword in [
                "tour", "đi", "du lịch", "khám phá", "biển", "núi", "thành phố"
            ])
            
            if intent in tool_related_intents or extracted_params.get("destination") or extracted_params.get("query") or extracted_params.get("category") or (intent == "general_question" and is_tour_query):
                # Map intent to tool name
                tool_name_map = {
                    "search_tour": "search_tours",
                    "list_tours": "search_tours",
                    "list_all_tours": "search_tours",
                    "get_tour_detail": "get_tour_details",
                    "booking": "create_booking",
                    "cancel": "cancel_booking",
                    "reschedule": "reschedule_booking",
                    "get_booking": "get_user_bookings",
                    "weather_inquiry": "get_weather",
                    "post_trip": "get_post_trip_summary",
                }
                
                tool_name = tool_name_map.get(intent, "search_tours")
                
                # Build tool arguments from extracted params
                tool_args = {}
                if extracted_params.get("destination"):
                    tool_args["destination"] = extracted_params["destination"]
                if extracted_params.get("query"):
                    tool_args["query"] = extracted_params["query"]
                if extracted_params.get("region"):
                    # Map Vietnamese region names to DB enum values
                    region_map = {
                        "miền bắc": "NORTH",
                        "bac": "NORTH",
                        "mien bac": "NORTH",
                        "miền trung": "CENTRAL",
                        "trung": "CENTRAL",
                        "mien trung": "CENTRAL",
                        "miền nam": "SOUTH",
                        "nam": "SOUTH",
                        "mien nam": "SOUTH",
                        "quốc tế": "INTERNATIONAL",
                        "international": "INTERNATIONAL",
                    }
                    reg = extracted_params["region"].lower()
                    tool_args["region"] = region_map.get(reg, reg)
                if extracted_params.get("budget"):
                    tool_args["max_price"] = extracted_params["budget"]
                if extracted_params.get("duration"):
                    tool_args["duration"] = extracted_params["duration"]
                if extracted_params.get("category"):
                    # Map Vietnamese category names to English DB values
                    category_map = {
                        "biển": "beach",
                        "bãi biển": "beach",
                        "núi": "mountain",
                        "thành phố": "city",
                        "city": "city",
                        "đảo": "island",
                        "di sản": "heritage",
                        "mạo hiểm": "adventure",
                        "thiên nhiên": "nature",
                    }
                    cat = extracted_params["category"].lower()
                    tool_args["category"] = category_map.get(cat, cat)

                # For post_trip intent: extract booking_code from conversation history or params
                if intent == "post_trip" and extracted_params.get("booking_code"):
                    tool_args["booking_code"] = extracted_params["booking_code"]

                # Set limit based on intent
                if intent == "list_all_tours":
                    tool_args["limit"] = 20  # Return more tours when listing all
                else:
                    tool_args["limit"] = 5
                
                # Create a mock tool call result
                from app.core.llm_client import ToolCall
                mock_tool_calls = [ToolCall(
                    id=f"call_{intent}",
                    name=tool_name,
                    arguments=tool_args
                )]
                
                # Execute tools directly
                logger.info(f"Intent-driven tool execution: intent={intent}, tool={tool_name}, args={tool_args}")
                tool_results = await executor.execute_tools(mock_tool_calls, user_id=user_id)
                
                # Extract tours for the complete event
                tour_results_for_complete = executor.extract_tours_from_results(tool_results)
                
                # Build content_blocks from tool results for frontend rendering
                for tr in tool_results:
                    tool_name_key = tr["tool"]
                    tool_result = tr["result"]
                    
                    # show_tour_cards → tour_carousel block
                    if tool_name_key == "show_tour_cards" and tool_result.get("cards"):
                        content_blocks_for_complete.append({
                            "type": "tour_carousel",
                            "data": {
                                "title": tool_result.get("message", "Tour phù hợp cho bạn"),
                                "tours": tool_result["cards"],
                            }
                        })
                    
                    # search_tours → tour_carousel block (when show_tour_cards not called)
                    elif tool_name_key == "search_tours" and tool_result.get("tours") and not any(
                        tr2["tool"] == "show_tour_cards" for tr2 in tool_results
                    ):
                        content_blocks_for_complete.append({
                            "type": "tour_carousel",
                            "data": {
                                "title": tool_result.get("message", "Tour tìm được"),
                                "tours": tool_result["tours"],
                            }
                        })
                    
                    # get_weather → weather block
                    elif tool_name_key == "get_weather" and tool_result.get("weather"):
                        content_blocks_for_complete.append({
                            "type": "weather",
                            "data": tool_result["weather"]
                        })
                    
                    # get_tour_details → tour_card block
                    elif tool_name_key == "get_tour_details" and not tool_result.get("error"):
                        content_blocks_for_complete.append({
                            "type": "tour_card",
                            "data": tool_result
                        })

                    # get_post_trip_summary → post_trip block
                    elif tool_name_key == "get_post_trip_summary" and tool_result.get("status") == "display_post_trip":
                        content_blocks_for_complete.append({
                            "type": "post_trip",
                            "data": {
                                "booking_code": tool_result.get("booking_code"),
                                "tour_name": tool_result.get("tour_name"),
                                "destination": tool_result.get("destination"),
                                "departure_date": tool_result.get("departure_date"),
                                "return_date": tool_result.get("return_date"),
                                "num_adults": tool_result.get("num_adults"),
                                "num_children": tool_result.get("num_children"),
                                "total_spent": tool_result.get("total_spent"),
                                "is_first_booking": tool_result.get("is_first_booking"),
                                "loyalty_points": tool_result.get("loyalty_points"),
                                "loyalty_tier": tool_result.get("loyalty_tier"),
                                "loyalty_benefits": tool_result.get("loyalty_benefits"),
                                "points_to_next_tier": tool_result.get("points_to_next_tier"),
                                "feedback_survey": None,
                                "review_prompt": None,
                                "return_reminder": tool_result.get("return_reminder"),
                            }
                        })
                
                # Build messages for LLM synthesis
                all_messages = [
                    {"role": "system", "content": system_with_tools}
                ]
                all_messages.extend(memory.get_messages())
                all_messages.append({"role": "user", "content": request.message})
                all_messages.append({
                    "role": "assistant",
                    "content": "",
                    "tool_calls": [
                        {
                            "id": tr["tool_call_id"],
                            "type": "function",
                            "function": {"name": tr["tool"], "arguments": json.dumps(tr["result"])}
                        }
                        for tr in tool_results
                    ]
                })
                for tr in tool_results:
                    all_messages.append({
                        "role": "tool",
                        "tool_call_id": tr["tool_call_id"],
                        "content": json.dumps(tr["result"])
                    })
                
                # LLM synthesizes response with tool results
                logger.info(f"Synthesizing response with {len(tool_results)} tool results for intent={intent}")
                
                try:
                    final_llm_response = await llm_client.chat_completion(
                        all_messages,
                        max_tokens=2048
                    )
                except Exception as e:
                    # Fall back to generating response from tool results directly
                    logger.warning(f"LLM synthesis failed, using fallback: {e}")
                    tour_data = tool_results[0]["result"] if tool_results else {}
                    tours = tour_data.get("tours", [])
                    if tours:
                        # Generate warm, conversational response
                        intro_lines = [
                            f"Ôi, hay quá! Mình tìm được **{len(tours)} tour** phù hợp với bạn rồi đó! 🌟",
                            ""
                        ]
                        
                        # Group by destination for better organization
                        tour_lines = []
                        for i, t in enumerate(tours[:8], 1):
                            name = t.get('name', 'Tour')
                            dest = t.get('destination', '')
                            short_desc = t.get('short_description', '')
                            price_display = t.get('price_display', 'Liên hệ')
                            duration = t.get('duration', '')
                            
                            # Check for discounted price
                            original_price = t.get('original_price') or t.get('price')
                            discount_badge = ""
                            if original_price and original_price != t.get('price'):
                                discount_badge = " 🔥"
                            
                            tour_lines.append(f"**{i}. {name}**{discount_badge}")
                            if dest:
                                tour_lines.append(f"   📍 {dest}" + (f" | ⏱️ {duration}" if duration else ""))
                            if short_desc:
                                tour_lines.append(f"   {short_desc}")
                            tour_lines.append(f"   💰 **{price_display}**")
                            tour_lines.append("")
                        
                        closing_lines = []
                        if len(tours) > 8:
                            closing_lines.append(f"... còn **{len(tours) - 8} tour** khác nữa nhé!")
                            closing_lines.append("")
                        closing_lines.append("Bạn thích tour nào? Mình có thể gợi ý thêm hoặc hỗ trợ đặt tour ngay!")
                        
                        final_text = "\n".join(intro_lines + tour_lines + closing_lines).strip()
                    else:
                        final_text = "Hmm, mình chưa tìm được tour nào phù hợp lắm. Bạn thử điều chỉnh ngân sách hoặc địa điểm xem sao? 😊"
                    final_llm_response = None
                
                if final_llm_response is not None and isinstance(final_llm_response, ToolCallsResult):
                    final_text = final_llm_response.content or ""
                elif final_llm_response is not None:
                    final_text = str(final_llm_response)
                
                # Check if we have no tours - trigger expert fallback
                has_tours = tour_results_for_complete or any(
                    tr.get("result", {}).get("tours") or tr.get("result", {}).get("cards")
                    for tr in tool_results
                )
                
                # If no tours found, try to get related tours and trigger expert response
                if not has_tours and extracted_params.get("destination"):
                    # Try to get related tours from the same region/destination area
                    related_tours = await _get_related_tours(executor, extracted_params.get("destination"))
                    if related_tours:
                        # Add related tours to content_blocks
                        content_blocks_for_complete.append({
                            "type": "tour_carousel",
                            "data": {
                                "title": f"Tour tại {extracted_params.get('destination')} có thể bạn sẽ thích",
                                "tours": related_tours,
                            }
                        })
                        tour_results_for_complete = related_tours
                        # Add suggestion block with expert advice
                        content_blocks_for_complete.append({
                            "type": "suggestion",
                            "data": {
                                "title": "💡 Gợi ý từ chuyên gia",
                                "content": f"Mình gợi ý bạn một số tour tương tự tại {extracted_params.get('destination')}. Bạn có thể điều chỉnh ngân sách hoặc thời gian để mình tìm tour phù hợp hơn nhé!"
                            }
                        })
                        has_tours = True
                
                # Stream the synthesized response
                full_text = final_text
                async for chunk_text in _stream_text(final_text):
                    yield f"data: {json.dumps({'type': 'content', 'content': chunk_text})}\n\n"
            
            else:
                # No tool needed — stream directly from LLM
                all_messages = [
                    {"role": "system", "content": system_with_tools}
                ]
                all_messages.extend(memory.get_messages())
                
                full_text = ""
                try:
                    llm_response_obj = await llm_client.chat_completion(
                        all_messages,
                        max_tokens=2048
                    )
                    
                    if isinstance(llm_response_obj, ToolCallsResult):
                        first_text = llm_response_obj.content or ""
                    else:
                        first_text = str(llm_response_obj)
                    async for chunk_text in _stream_text(first_text):
                        full_text += chunk_text
                        yield f"data: {json.dumps({'type': 'content', 'content': chunk_text})}\n\n"
                except Exception as e:
                    logger.warning(f"LLM direct response failed: {e}")
                    # Generate fallback response based on intent
                    fallback_responses = {
                        "greeting": "Xin chào! Mình là TravelGPT, trợ lý du lịch AI của bạn. Mình có thể giúp bạn tìm tour, đặt tour, và lên kế hoạch chuyến đi. Bạn muốn đi đâu?",
                        "identity_question": "Mình là TravelGPT - trợ lý du lịch AI. Mình có thể giúp bạn tìm và đặt tour du lịch, cung cấp thông tin về điểm đến, và hỗ trợ các vấn đề liên quan đến booking.",
                        "goodbye": "Tạm biệt bạn! Hẹn gặp lại trong những chuyến đi tiếp theo nhé! 👋",
                    }
                    fallback_text = fallback_responses.get(intent, "Xin lỗi, mình đang gặp chút trục trặc. Bạn thử lại sau nhé!")
                    full_text = fallback_text
                    async for chunk_text in _stream_text(fallback_text):
                        yield f"data: {json.dumps({'type': 'content', 'content': chunk_text})}\n\n"

            # Save conversation to memory
            memory.add_message("user", request.message, intent=intent, entities=extracted_params)
            memory.add_message("assistant", full_text, intent=intent)

            # Get suggestions
            suggestions = recommendation_engine.get_conversation_suggestions(user_id, intent, extracted_params)

            # Extract booking info from tool results for booking_complete event
            booking_code_from_tool = None
            for tr in tool_results:
                result = tr.get("result", {})
                if result.get("booking_code"):
                    booking_code_from_tool = result["booking_code"]
                    break

            # Send complete with metadata
            complete_payload = {
                "type": "complete",
                "intent": intent,
                "suggestions": suggestions or [],
                "response": full_text,
                "tours": tour_results_for_complete,
                "content_blocks": content_blocks_for_complete,
                "booking_code": booking_code_from_tool,
                "booking_flow_complete": True if (intent == "booking" and booking_code_from_tool) else None,
                "booking_flow_active": None,
            }
            yield f"data: {json.dumps(complete_payload)}\n\n"

            # Save conversation to database if user is authenticated
            if current_user:
                try:
                    conversation = await db.chatconversation.upsert(
                        where={
                            "session_id_user_id": {
                                "session_id": session_id,
                                "user_id": user_id
                            }
                        },
                        data={
                            "create": {"user_id": user_id, "session_id": session_id},
                            "update": {}
                        }
                    )
                    
                    await db.chatmessage.create(data={
                        "conversation_id": conversation.id,
                        "role": MessageRole.USER.value,
                        "content": request.message,
                        "metadata": {"intent": intent},
                    })
                    
                    await db.chatmessage.create(data={
                        "conversation_id": conversation.id,
                        "role": MessageRole.ASSISTANT.value,
                        "content": full_text,
                        "metadata": {"intent": intent, "suggestions": suggestions},
                    })
                except Exception as db_error:
                    logger.warning(f"Failed to save stream message to DB: {db_error}")

        except Exception as e:
            logger.error(f"Stream error: {e}", exc_info=True)
            yield f"data: {json.dumps({'type': 'error', 'error': 'Đã xảy ra lỗi'})}\n\n"

    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
