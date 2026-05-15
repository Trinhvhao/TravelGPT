from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


# ============= Request/Response Schemas =============

class ChatMessageBase(BaseModel):
    content: str
    role: MessageRole = MessageRole.USER


class ChatMessageCreate(ChatMessageBase):
    pass


class ChatMessageResponse(ChatMessageBase):
    id: str
    conversation_id: str
    metadata: Dict[str, Any] = {}
    created_at: datetime
    
    class Config:
        from_attributes = True


class ChatConversationResponse(BaseModel):
    id: str
    session_id: str
    created_at: datetime
    updated_at: datetime
    messages: List[ChatMessageResponse] = []
    
    class Config:
        from_attributes = True


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    conversation_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None


class ChatResponse(BaseModel):
    message: ChatMessageResponse
    conversation_id: str
    suggestions: List[str] = []
    intent: Optional[str] = None
    params: Optional[Dict[str, Any]] = None
    booking_flow_active: Optional[bool] = None
    booking_step: Optional[str] = None
    booking_data: Optional[Dict[str, Any]] = None
    booking_code: Optional[str] = None
    booking_flow_complete: Optional[bool] = None
    cancellation_flow_active: Optional[bool] = None
    cancellation_step: Optional[str] = None
    reschedule_flow_active: Optional[bool] = None
    reschedule_step: Optional[str] = None


class ChatHistoryResponse(BaseModel):
    conversations: List[ChatConversationResponse]


# ============= Multi-turn Conversation Schemas =============

class ConversationState(str, Enum):
    IDLE = "idle"
    SEARCHING = "searching"
    BROWSING = "browsing"
    BOOKING = "booking"
    MODIFYING = "modifying"
    COMPLAINING = "complaining"
    COMPLETED = "completed"


class TurnPhase(str, Enum):
    START = "start"
    IN_PROGRESS = "in_progress"
    WAITING_RESPONSE = "waiting_response"
    COMPLETED = "completed"
    FAILED = "failed"


class TurnInfo(BaseModel):
    turn_id: str
    user_message: str
    assistant_response: str
    intent: str
    timestamp: datetime


class GoalInfo(BaseModel):
    goal_id: str
    goal_type: str
    target: Optional[str] = None
    status: str = "active"


class ConversationStateResponse(BaseModel):
    session_id: str
    state: str
    total_turns: int
    turns_without_progress: int
    needs_attention: bool
    active_goal_type: Optional[str] = None
    completed_goals: int
    recent_turns: List[TurnInfo] = []
    context: Dict[str, Any] = {}
    collected_entities: Dict[str, Any] = {}


# ============= Booking Flow Schemas =============

class BookingFlowStep(str, Enum):
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


class BookingFlowData(BaseModel):
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
    is_complete: bool = False
    missing_fields: List[str] = []


class BookingFlowStatus(BaseModel):
    is_active: bool
    current_step: BookingFlowStep
    booking_data: BookingFlowData
    message: Optional[str] = None
    confirmation_required: bool = False
    ready_to_book: bool = False


class BookingFlowActionRequest(BaseModel):
    action: str = Field(..., description="Action: start, cancel, modify, confirm")
    session_id: str
    tour_id: Optional[str] = None
    tour_name: Optional[str] = None
    field_to_modify: Optional[str] = None
    new_value: Optional[Any] = None


class BookingFlowActionResponse(BaseModel):
    success: bool
    message: str
    booking_flow: Optional[BookingFlowStatus] = None


# ============= Cancellation Schemas =============

class CancellationStep(str, Enum):
    INIT = "init"
    VERIFY_BOOKING = "verify_booking"
    CONFIRM_CANCELLATION = "confirm_cancellation"
    CALCULATE_REFUND = "calculate_refund"
    SELECT_REASON = "select_reason"
    PROCESSING = "processing"
    SUCCESS = "success"
    COMPLETED = "completed"


class CancellationStatus(BaseModel):
    is_active: bool
    current_step: str
    booking_code: Optional[str] = None
    refund_amount: float = 0
    refund_percent: float = 0
    reason: Optional[str] = None


class CancellationActionRequest(BaseModel):
    session_id: str
    booking_code: Optional[str] = None


class CancellationActionResponse(BaseModel):
    success: bool
    message: str
    current_step: Optional[str] = None
    refund_amount: Optional[float] = None
    refund_percent: Optional[float] = None
    completed: bool = False


# ============= Reschedule Schemas =============

class RescheduleStep(str, Enum):
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


class AvailableDate(BaseModel):
    date: str
    date_display: str
    day_of_week: str
    available: bool = True


class RescheduleStatus(BaseModel):
    is_active: bool
    current_step: str
    booking_code: Optional[str] = None
    original_date: Optional[str] = None
    new_date: Optional[str] = None
    price_difference: float = 0
    eligible: bool = True


class RescheduleActionRequest(BaseModel):
    session_id: str
    booking_code: Optional[str] = None


class RescheduleActionResponse(BaseModel):
    success: bool
    message: str
    current_step: Optional[str] = None
    eligible: Optional[bool] = None
    available: Optional[bool] = None
    available_dates: List[AvailableDate] = []
    original_date: Optional[str] = None
    new_date: Optional[str] = None
    price_difference: Optional[float] = None
    completed: bool = False


# ============= Pre-trip Schemas =============

class PreTripRequest(BaseModel):
    destination: Optional[str] = None
    departure_date: Optional[datetime] = None
    return_date: Optional[datetime] = None
    duration: Optional[int] = 3
    trip_type: Optional[str] = "beach"  # beach, mountain, city, cultural


class PreTripResponse(BaseModel):
    countdown_message: Optional[str] = None
    weather_info: Optional[str] = None
    local_tips: List[str] = []
    packing_tips: Optional[str] = None
    checklist: Optional[str] = None


# ============= Post-trip Schemas =============

class PostTripRequest(BaseModel):
    booking_code: Optional[str] = None
    tour_name: Optional[str] = None
    destination: Optional[str] = None
    departure_date: Optional[datetime] = None
    return_date: Optional[datetime] = None
    num_adults: Optional[int] = 1
    num_children: Optional[int] = 0
    total_spent: Optional[float] = None
    is_first_booking: Optional[bool] = False


class PostTripResponse(BaseModel):
    feedback_survey: Optional[str] = None
    review_prompt: Optional[str] = None
    loyalty_points: Optional[int] = None
    loyalty_tier: Optional[str] = None
    loyalty_benefits: List[str] = []
    points_to_next_tier: Optional[int] = None
    return_reminder: Optional[str] = None


# ============= Recommendation Schemas =============

class TourRecommendation(BaseModel):
    id: str
    name: str
    slug: Optional[str] = None
    destination: str
    region: Optional[str] = None
    duration: int
    price: float
    discount_price: Optional[float] = None
    images: List[str] = []
    rating: float = 0
    review_count: int = 0
    is_featured: bool = False
    category: Optional[str] = None
    tags: List[str] = []
    recommendation_score: Optional[float] = None
    recommendation_reasons: List[str] = []
    seasonal_reason: Optional[str] = None
    similarity_score: Optional[float] = None
    companion_match: Optional[bool] = None
    companion_reason: Optional[str] = None


class RecommendationRequest(BaseModel):
    user_id: Optional[str] = None
    type: str = Field(..., description="Type: personalized, seasonal, budget, similar, companion, trending")
    tour_id: Optional[str] = None
    budget: Optional[float] = None
    companion_type: Optional[str] = None
    limit: int = Field(default=5, ge=1, le=20)


class RecommendationResponse(BaseModel):
    success: bool
    recommendations: List[TourRecommendation]
    total: int
    type: str


# ============= Session Management =============

class SessionStats(BaseModel):
    session_id: str
    total_messages: int
    current_intent: Optional[str] = None
    booking_flow_active: bool
    booking_step: Optional[str] = None
    context: Dict[str, Any] = {}


class ClearSessionRequest(BaseModel):
    session_id: str
    clear_type: str = Field(default="all", description="Type: all, booking, history, cancellation, reschedule")


class ClearSessionResponse(BaseModel):
    success: bool
    message: str
