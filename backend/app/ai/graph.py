"""
LangGraph Workflow for TravelGPT Agent
(Requires `langgraph` package to be installed)
"""
from typing import Literal, Dict, Any, Optional

try:
    from langgraph.graph import StateGraph, END, START
except ImportError:
    StateGraph = None  # type: ignore
    END = None  # type: ignore
    START = None  # type: ignore

from app.ai.state import AgentState, create_initial_state
from app.ai.conversation import TravelMemory, ConversationMemory, SYSTEM_PROMPT


def create_agent_graph():
    """Create the main LangGraph workflow"""
    if StateGraph is None:
        raise ImportError("langgraph is required for graph workflow. Install with: pip install langgraph")

    graph = StateGraph(AgentState)
    
    # Add nodes
    graph.add_node("router", router_node)
    graph.add_node("search", search_node)
    graph.add_node("booking", booking_node)
    graph.add_node("cancellation", cancellation_node)
    graph.add_node("general", general_node)
    
    # Define edges
    graph.add_edge(START, "router")
    
    # Conditional routing from router
    graph.add_conditional_edges(
        "router",
        route_by_intent,
        {
            "search": "search",
            "booking": "booking",
            "cancel": "cancellation",
            "general": "general"
        }
    )
    
    # End edges
    graph.add_edge("search", END)
    graph.add_edge("booking", END)
    graph.add_edge("cancellation", END)
    graph.add_edge("general", END)
    
    return graph.compile()


def router_node(state: AgentState) -> AgentState:
    """
    Router node - classify intent and retrieve memory context
    """
    from app.ai.intent import AdvancedIntentDetector
    
    messages = state["messages"]
    user_id = state["user_id"]
    
    # Get last user message
    last_message = ""
    for msg in reversed(messages):
        if msg.get("role") == "user":
            last_message = msg.get("content", "")
            break
    
    if not last_message:
        state["intent"] = "unknown"
        state["memory_context"] = ""
        return state
    
    # Detect intent
    intent_detector = AdvancedIntentDetector()
    intent, entities = intent_detector.detect(last_message)
    
    state["intent"] = intent
    state["entities"] = entities
    
    # Retrieve memory context from Mem0
    travel_memory = TravelMemory.get_instance()
    memory_context = travel_memory.search(last_message, user_id, top_k=3)
    state["memory_context"] = memory_context
    
    return state


def route_by_intent(state: AgentState) -> str:
    """
    Route to appropriate node based on intent
    """
    intent = state.get("intent", "")
    
    # Map intent to node
    routing_map = {
        "search_tour": "search",
        "get_tour_detail": "search",
        "start_booking": "booking",
        "provide_booking_info": "booking",
        "confirm_booking": "booking",
        "cancel_booking": "cancel",
        "check_booking": "cancel",
        "modify_booking": "cancel",
        "reschedule_booking": "cancel",
    }
    
    return routing_map.get(intent, "general")


def search_node(state: AgentState) -> AgentState:
    """
    Search node - handle tour search requests
    """
    from app.ai.recommendation import RecommendationEngine
    
    intent = state.get("intent", "")
    entities = state.get("entities", {})
    memory_context = state.get("memory_context", "")
    
    # Get search parameters
    destination = entities.get("destination", "")
    budget = entities.get("budget", "")
    duration = entities.get("duration", "")
    
    # Build search context
    search_parts = []
    
    if destination:
        search_parts.append(f"Tìm tour ở {destination}")
    if budget:
        search_parts.append(f"Ngân sách: {budget}")
    if duration:
        search_parts.append(f"Thời gian: {duration}")
    if memory_context:
        search_parts.append(f"Context: {memory_context}")
    
    # Generate response based on search params
    if destination or budget:
        bullet_list = "".join(f"- {p}\n" for p in search_parts)
        response = f"""🔍 **Kết quả tìm kiếm**

{bullet_list}
Tôi sẽ tìm các tour phù hợp với yêu cầu của bạn.

**Gợi ý:**
- Đặt tour ngay khi tìm được tour ưng ý
- So sánh các tour cùng mức giá
- Xem review từ khách đã đi"""
    else:
        response = """🔍 **Tìm kiếm tour**

Bạn muốn tìm tour ở đâu? Cho tôi biết thêm:
- Điểm đến (Đà Nẵng, Phú Quốc, Nha Trang...)
- Ngân sách (ví dụ: 5 triệu, 10 triệu)
- Thời gian (3 ngày 2 đêm, 4 ngày 3 đêm...)"""
    
    state["response"] = response
    state["suggestions"] = [
        "Tour Đà Nẵng 3 ngày",
        "Tour dưới 5 triệu",
        "Tour biển cuối tuần"
    ]
    
    return state


def booking_node(state: AgentState) -> AgentState:
    """
    Booking node - handle booking flow
    """
    intent = state.get("intent", "")
    entities = state.get("entities", {})
    
    tour_name = entities.get("tour_name", "")
    tour_id = entities.get("tour_id", "")
    
    # Check if booking info is complete
    has_tour = tour_name or tour_id
    has_date = entities.get("departure_date")
    has_participants = entities.get("num_adults") or entities.get("num_children")
    
    if intent == "start_booking" and not has_tour:
        response = """🎉 **Bắt đầu đặt tour**

Bạn muốn đặt tour nào? Vui lòng cho tôi biết:
- Tên tour hoặc điểm đến bạn quan tâm
- Hoặc để tôi gợi ý tour phù hợp"""
    
    elif has_tour and not has_date:
        tour_info = f"**{tour_name or 'Tour đã chọn'}**" if tour_name else "Tour đã chọn"
        response = f"""✅ **Xác nhận thông tin đặt tour**

{tour_info}

**Bước tiếp theo:** Chọn ngày khởi hành

Bạn muốn đi vào ngày nào? (VD: 15/06/2025)"""
    
    elif has_tour and has_date and not has_participants:
        response = """👥 **Số người tham gia**

Bao nhiêu người đi tour?
- Số người lớn: ?
- Số trẻ em (dưới 12 tuổi): ?"""
    
    elif has_tour and has_date and has_participants:
        num_adults = entities.get("num_adults", 1)
        num_children = entities.get("num_children", 0)
        date = entities.get("departure_date", "N/A")
        
        response = f"""📋 **Xác nhận đặt tour**

| Thông tin | Chi tiết |
|-----------|----------|
| Tour | {tour_name or 'Tour đã chọn'} |
| Ngày khởi hành | {date} |
| Người lớn | {num_adults} |
| Trẻ em | {num_children} |

**Bạn xác nhận đặt tour này chứ?**

1. Đúng, đặt luôn
2. Sửa thông tin
3. Hủy"""
    
    else:
        response = """🎉 **Đặt Tour**

Tôi sẽ giúp bạn đặt tour! Bạn cần cung cấp:
- Tên tour muốn đặt
- Ngày khởi hành
- Số người tham gia

Bắt đầu nào!"""
    
    state["response"] = response
    state["is_booking_active"] = True
    state["booking_flow_step"] = intent or "start"
    state["booking_data"] = entities
    state["suggestions"] = [
        "Đúng, đặt luôn" if has_tour and has_date and has_participants else "Tiếp tục",
        "Sửa thông tin",
        "Hủy đặt tour"
    ]
    
    return state


def cancellation_node(state: AgentState) -> AgentState:
    """
    Cancellation node - handle cancellation/reschedule
    """
    intent = state.get("intent", "")
    entities = state.get("entities", {})
    
    booking_code = entities.get("booking_code", "")
    message_lower = state.get("messages", [{}])[0].get("content", "").lower() if state.get("messages") else ""
    
    # Check for reschedule keywords
    is_reschedule = any(kw in message_lower for kw in ["đổi ngày", "chuyển ngày", "đổi lịch", "reschedule"])
    
    if is_reschedule:
        if not booking_code:
            response = """📅 **Đổi lịch tour**

Bạn muốn đổi ngày khởi hành. Vui lòng cung cấp:
- Mã booking cần đổi lịch

(Mã booking có dạng: TG2025XXXX)"""
        else:
            response = f"""📅 **Xác nhận đổi lịch**

**Mã booking:** {booking_code}

Để đổi lịch, tôi cần biết:
- Ngày khởi hành mới bạn muốn

*(Lưu ý: Việc đổi lịch phụ thuộc vào tình trạng chỗ của tour)*"""
    
    elif intent == "cancel_booking":
        if not booking_code:
            response = """❌ **Hủy Booking**

Bạn muốn hủy booking. Vui lòng cung cấp:
- Mã booking cần hủy

*(Mã booking có dạng: TG2025XXXX)*

**Chính sách hoàn tiền:**
- Hủy trước 14+ ngày: Hoàn 90%
- Hủy trước 7-13 ngày: Hoàn 70%
- Hủy trước 3-6 ngày: Hoàn 50%
- Hủy trước 1-2 ngày: Hoàn 20%
- Hủy trong ngày: Không hoàn tiền"""
        else:
            response = f"""⚠️ **Xác nhận hủy booking**

**Mã booking:** {booking_code}

**Chính sách hoàn tiền:**
| Thời gian hủy | Hoàn tiền |
|----------------|-----------|
| 14+ ngày trước | 90% |
| 7-13 ngày | 70% |
| 3-6 ngày | 50% |
| 1-2 ngày | 20% |
| Trong ngày | 0% |

**Bạn có chắc muốn hủy booking này?**

1. Đúng, hủy booking
2. Không, giữ booking"""
    
    else:
        response = """📝 **Hỗ trợ Booking**

Bạn cần hỗ trợ gì về booking?

1. ❌ Hủy booking
2. 📅 Đổi ngày khởi hành
3. 📞 Cập nhật thông tin liên hệ"""
    
    state["response"] = response
    state["cancellation_active"] = True
    state["cancellation_step"] = intent or "init"
    state["suggestions"] = [
        "Xác nhận hủy",
        "Đổi ngày khởi hành",
        "Giữ booking"
    ]
    
    return state


def general_node(state: AgentState) -> AgentState:
    """
    General node - handle general conversation with AI
    """
    from app.ai.agent import AIClien2Client
    from app.core.config import get_settings
    
    messages = state.get("messages", [])
    memory_context = state.get("memory_context", "")
    user_id = state.get("user_id", "")
    
    settings = get_settings()
    
    # Get last user message
    last_message = ""
    for msg in reversed(messages):
        if msg.get("role") == "user":
            last_message = msg.get("content", "")
            break
    
    # Build context for AI
    context_parts = [SYSTEM_PROMPT]
    
    if memory_context:
        context_parts.append(f"\n[Memory context]:\n{memory_context}")
    
    if user_id != "anonymous":
        # Try to get user preferences
        travel_memory = TravelMemory.get_instance()
        prefs = travel_memory.get_user_preferences(user_id)
        if prefs.get("preferred_destinations"):
            dests = ", ".join(prefs["preferred_destinations"][-2:])
            context_parts.append(f"\n[User preferences]: Thích đi {dests}")
    
    system_msg = {"role": "system", "content": "\n".join(context_parts)}
    
    # Build conversation messages
    conversation = [system_msg]
    for msg in messages[-10:]:  # Last 10 messages
        if msg.get("role") in ["user", "assistant"]:
            conversation.append({"role": msg["role"], "content": msg["content"]})
    
    # Call AI
    try:
        client = AIClien2Client(settings.aiclien2api_key)
        response = client.chat_completion_sync(conversation)
    except Exception as e:
        print(f"AI call error: {e}")
        response = """Xin chào! Tôi là trợ lý du lịch của TravelGPT.

Tôi có thể giúp bạn:
🔍 Tìm kiếm tour du lịch
📋 Đặt tour trực tuyến
❌ Hủy hoặc đổi lịch tour
💡 Gợi ý điểm đến phù hợp

Bạn cần tôi hỗ trợ gì?"""
    
    state["response"] = response
    state["suggestions"] = [
        "Tìm tour Đà Nẵng",
        "Đặt tour biển",
        "Liên hệ hỗ trợ"
    ]
    
    return state


# Create global graph instance
_agent_graph = None


def get_agent_graph():
    """Get or create the agent graph singleton"""
    global _agent_graph
    if _agent_graph is None:
        _agent_graph = create_agent_graph()
    return _agent_graph
