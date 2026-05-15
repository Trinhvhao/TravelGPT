"""
Conversation Memory & Context Management - Lưu trữ và quản lý context cuộc trò chuyện
Plus Mem0 integration for long-term memory
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
from dataclasses import dataclass, field
import json
import hashlib
import requests
import logging

logger = logging.getLogger(__name__)

# Mem0 import with fallback
try:
    from mem0 import Memory
    MEM0_AVAILABLE = True
except ImportError:
    MEM0_AVAILABLE = False
    Memory = None


class Mem0CloudClient:
    """
    Mem0 Cloud API client for long-term memory.
    Uses REST API directly - works without local vector store.
    
    API Notes:
    - POST /memories/ with memory_id and messages returns PENDING
    - GET /memories/ retrieves stored memories
    - POST /memories/search searches memories
    """

    BASE_URL = "https://api.mem0.ai/v1"

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Token {api_key}",
            "Content-Type": "application/json"
        })

    def add(
        self,
        messages: List[Dict[str, str]],
        user_id: Optional[str] = None,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Add memory from messages.
        Note: Mem0 Cloud processes memories asynchronously.
        """
        import uuid
        
        payload = {
            "memory_id": str(uuid.uuid4()),
            "messages": messages,
        }
        if user_id:
            payload["user_id"] = user_id
        if metadata:
            payload["metadata"] = metadata

        response = self.session.post(
            f"{self.BASE_URL}/memories/",
            json=payload
        )
        response.raise_for_status()
        return response.json()

    def search(
        self,
        query: str,
        user_id: Optional[str] = None,
        top_k: int = 5
    ) -> Dict:
        """
        Search memories.
        Uses Mem0 Cloud search API.
        """
        payload = {
            "query": query,
            "top_k": top_k
        }
        if user_id:
            payload["user_id"] = user_id

        response = self.session.post(
            f"{self.BASE_URL}/memories/search/",
            json=payload
        )
        response.raise_for_status()
        return response.json()

    def get_history(
        self,
        user_id: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict]:
        """Get memory history."""
        params = {"limit": limit}
        if user_id:
            params["user_id"] = user_id

        response = self.session.get(
            f"{self.BASE_URL}/memories/",
            params=params
        )
        response.raise_for_status()
        return response.json()

    def delete(self, memory_id: str) -> bool:
        """Delete a memory."""
        response = self.session.delete(
            f"{self.BASE_URL}/memories/{memory_id}"
        )
        return response.status_code == 204

    def close(self):
        """Close session."""
        self.session.close()


@dataclass
class ConversationTurn:
    """Một lượt trò chuyện"""
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime = field(default_factory=datetime.now)
    intent: Optional[str] = None
    entities: Dict[str, Any] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class UserContext:
    """Context của user trong cuộc trò chuyện"""
    user_id: str
    session_id: str
    preferences: Dict[str, Any] = field(default_factory=dict)
    booking_flow_state: Optional[Dict[str, Any]] = None
    search_history: List[Dict[str, Any]] = field(default_factory=list)
    viewed_tours: List[str] = field(default_factory=list)
    last_intent: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)
    last_activity: datetime = field(default_factory=datetime.now)


class ConversationMemory:
    """
    Quản lý bộ nhớ cuộc trò chuyện
    - Lưu message history
    - Quản lý context
    - Context window management
    """
    
    MAX_TURNS = 20  # Keep last 20 turns
    MAX_CONTEXT_MESSAGES = 10  # For AI context
    
    def __init__(self, max_turns: int = MAX_TURNS):
        self.messages: List[ConversationTurn] = []
        self.max_turns = max_turns
        self.context: Dict[str, Any] = {}
        self.intent_history: List[str] = []
        self.extracted_entities: List[Dict[str, Any]] = []
    
    def add_message(
        self, 
        role: str, 
        content: str,
        intent: Optional[str] = None,
        entities: Optional[Dict[str, Any]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Add message to conversation history"""
        turn = ConversationTurn(
            role=role,
            content=content,
            intent=intent,
            entities=entities or {},
            metadata=metadata or {}
        )
        
        self.messages.append(turn)
        
        # Track intent and entities
        if intent:
            self.intent_history.append(intent)
        
        if entities:
            self.extracted_entities.append(entities)
        
        # Trim old messages
        if len(self.messages) > self.max_turns * 2:
            self.messages = self.messages[-self.max_turns * 2:]
        
        # Trim intent history
        if len(self.intent_history) > self.max_turns:
            self.intent_history = self.intent_history[-self.max_turns:]
        
        # Trim entities history
        if len(self.extracted_entities) > self.max_turns:
            self.extracted_entities = self.extracted_entities[-self.max_turns:]
    
    def get_messages(self) -> List[Dict[str, str]]:
        """Get messages for AI context"""
        return [
            {"role": turn.role, "content": turn.content}
            for turn in self.messages[-self.MAX_CONTEXT_MESSAGES * 2:]
        ]
    
    def get_contextual_messages(self, include_metadata: bool = False) -> List[Dict[str, Any]]:
        """Get messages with full metadata"""
        msgs = []
        for turn in self.messages[-self.MAX_CONTEXT_MESSAGES * 2:]:
            msg = {
                "role": turn.role,
                "content": turn.content
            }
            if include_metadata:
                msg["intent"] = turn.intent
                msg["entities"] = turn.entities
                msg["timestamp"] = turn.timestamp.isoformat()
            msgs.append(msg)
        return msgs
    
    def get_last_intent(self) -> Optional[str]:
        """Get last detected intent"""
        return self.intent_history[-1] if self.intent_history else None
    
    def get_last_entities(self) -> Dict[str, Any]:
        """Get merged entities from recent messages"""
        merged = {}
        for entities in self.extracted_entities[-3:]:
            merged.update(entities)
        return merged
    
    def set_context(self, key: str, value: Any):
        """Set context value"""
        self.context[key] = value
    
    def get_context(self, key: str) -> Any:
        """Get context value"""
        return self.context.get(key)
    
    def update_context(self, updates: Dict[str, Any]):
        """Update multiple context values"""
        self.context.update(updates)
    
    def get_conversation_summary(self) -> str:
        """Generate conversation summary"""
        if not self.messages:
            return "Chưa có cuộc trò chuyện nào."
        
        turns = len(self.messages)
        user_turns = len([m for m in self.messages if m.role == "user"])
        last_intent = self.get_last_intent()
        last_entities = self.get_last_entities()
        
        summary_parts = [
            f"Tổng cộng {turns} tin nhắn ({user_turns} từ user)",
        ]
        
        if last_intent:
            summary_parts.append(f"Intent gần nhất: {last_intent}")
        
        if last_entities:
            entity_keys = list(last_entities.keys())
            if entity_keys:
                summary_parts.append(f"Entities: {', '.join(entity_keys[:5])}")
        
        return " | ".join(summary_parts)
    
    def clear(self):
        """Clear all conversation data"""
        self.messages = []
        self.context = {}
        self.intent_history = []
        self.extracted_entities = []
    
    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dict"""
        return {
            "messages": [
                {
                    "role": turn.role,
                    "content": turn.content,
                    "intent": turn.intent,
                    "entities": turn.entities,
                    "metadata": turn.metadata,
                    "timestamp": turn.timestamp.isoformat()
                }
                for turn in self.messages
            ],
            "context": self.context,
            "intent_history": self.intent_history,
            "extracted_entities": self.extracted_entities
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ConversationMemory":
        """Deserialize from dict"""
        memory = cls()
        memory.context = data.get("context", {})
        memory.intent_history = data.get("intent_history", [])
        memory.extracted_entities = data.get("extracted_entities", [])
        
        for msg_data in data.get("messages", []):
            turn = ConversationTurn(
                role=msg_data["role"],
                content=msg_data["content"],
                intent=msg_data.get("intent"),
                entities=msg_data.get("entities", {}),
                metadata=msg_data.get("metadata", {}),
                timestamp=datetime.fromisoformat(msg_data["timestamp"])
            )
            memory.messages.append(turn)
        
        return memory


class TravelMemory:
    """
    Mem0 integration for long-term user memory
    - Stores user preferences across sessions
    - Remembers conversation history
    - Provides personalized context
    
    Uses Mem0 Cloud API directly (no local vector store needed).
    Falls back to in-memory storage if Mem0 is not available.
    """

    _instance: Optional["TravelMemory"] = None

    def __init__(self, api_key: Optional[str] = None, host: Optional[str] = None):
        self.client = None
        self.fallback_store: Dict[str, List[Dict[str, Any]]] = {}
        self.use_fallback = True

        if api_key:
            try:
                # Use Mem0 Cloud API directly
                self.client = Mem0CloudClient(api_key)
                # Test connection - just verify client can be created
                self.use_fallback = False
                logger.info("Mem0 Cloud client initialized successfully")
            except Exception as e:
                logger.warning(f"Mem0 Cloud initialization failed: {e}")
                self.client = None

    @classmethod
    def get_instance(cls, api_key: Optional[str] = None, host: Optional[str] = None) -> "TravelMemory":
        """Get singleton instance"""
        if cls._instance is None:
            cls._instance = cls(api_key, host)
        return cls._instance

    def is_available(self) -> bool:
        """Check if Mem0 is available"""
        return self.client is not None and not self.use_fallback

    def search(
        self,
        query: str,
        user_id: str,
        top_k: int = 5
    ) -> str:
        """
        Search memories for a user and return context string.
        """
        if self.use_fallback or not self.client:
            return self._fallback_search(query, user_id, top_k)

        try:
            result = self.client.search(
                query=query,
                user_id=user_id,
                top_k=top_k
            )

            # Parse Mem0 Cloud response - returns list directly
            memories = result if isinstance(result, list) else result.get("results", [])
            if not memories:
                return ""

            context_parts = []
            for mem in memories:
                # Handle Mem0 Cloud format: {'memory': 'text', 'score': 0.9}
                if isinstance(mem, dict):
                    content = mem.get("memory", "") or mem.get("text", "") or mem.get("content", "")
                else:
                    content = str(mem)
                if content:
                    context_parts.append(content)

            return "\n".join(context_parts)
        except Exception as e:
            logger.error(f"Mem0 search error: {e}")
            return self._fallback_search(query, user_id, top_k)
    
    def _fallback_search(self, query: str, user_id: str, top_k: int = 5) -> str:
        """
        Fallback in-memory search when Mem0 is not available
        """
        user_memories = self.fallback_store.get(user_id, [])
        
        if not user_memories:
            return ""
        
        # Simple keyword matching
        query_lower = query.lower()
        query_words = query_lower.split()
        
        scored = []
        for mem in user_memories:
            content = mem.get("content", "").lower()
            score = 0
            
            # Score based on keyword matches
            for word in query_words:
                if word in content:
                    score += 1
            
            # Score based on recency
            score += mem.get("recency", 0) * 0.5
            
            if score > 0:
                scored.append((score, mem))
        
        # Sort by score and return top k
        scored.sort(reverse=True, key=lambda x: x[0])
        results = [mem["content"] for _, mem in scored[:top_k]]
        
        return "\n".join(results)
    
    def _fallback_add(
        self,
        user_id: str,
        user_message: str,
        assistant_response: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Fallback in-memory storage when Mem0 is not available
        """
        if user_id not in self.fallback_store:
            self.fallback_store[user_id] = []
        
        # Store conversation as a single memory entry
        memory_entry = {
            "content": f"User: {user_message}\nAssistant: {assistant_response}",
            "timestamp": datetime.now().isoformat(),
            "recency": 1.0,
            "metadata": metadata or {}
        }
        
        self.fallback_store[user_id].append(memory_entry)
        
        # Keep only last 100 memories per user
        if len(self.fallback_store[user_id]) > 100:
            self.fallback_store[user_id] = self.fallback_store[user_id][-100:]
        
        return True
    
    def add_interaction(
        self,
        user_id: str,
        user_message: str,
        assistant_response: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Store a conversation turn in memory
        """
        if self.use_fallback or not self.client:
            return self._fallback_add(user_id, user_message, assistant_response, metadata)
        
        try:
            messages = [
                {"role": "user", "content": user_message},
                {"role": "assistant", "content": assistant_response}
            ]
            
            meta = metadata or {}
            meta["user_id"] = user_id
            
            result = self.client.add(messages, user_id=user_id, metadata=meta)
            return True
        except Exception as e:
            print(f"Mem0 add error: {e}")
            return self._fallback_add(user_id, user_message, assistant_response, metadata)
    
    def add_booking_memory(
        self,
        user_id: str,
        booking_info: Dict[str, Any]
    ) -> bool:
        """
        Store booking information
        """
        if not self.is_available():
            return False
        
        try:
            content = self._format_booking_memory(booking_info)
            
            self.client.add(
                [{"role": "system", "content": content}],
                user_id=user_id,
                metadata={
                    "type": "booking",
                    "booking_id": booking_info.get("booking_code")
                }
            )
            return True
        except Exception as e:
            print(f"Mem0 add booking error: {e}")
            return False
    
    def _format_booking_memory(self, booking: Dict[str, Any]) -> str:
        """Format booking info for memory"""
        parts = []
        
        if booking.get("tour_name"):
            parts.append(f"Tour: {booking['tour_name']}")
        if booking.get("destination"):
            parts.append(f"Điểm đến: {booking['destination']}")
        if booking.get("departure_date"):
            parts.append(f"Ngày khởi hành: {booking['departure_date']}")
        if booking.get("num_adults"):
            parts.append(f"Số người lớn: {booking['num_adults']}")
        if booking.get("num_children"):
            parts.append(f"Số trẻ em: {booking['num_children']}")
        if booking.get("total_price"):
            parts.append(f"Tổng giá: {booking['total_price']} VND")
        
        return " | ".join(parts)
    
    def get_user_preferences(self, user_id: str) -> Dict[str, Any]:
        """Extract user preferences from memory"""
        if self.use_fallback or not self.client:
            return self._fallback_get_preferences(user_id)
        
        try:
            result = self.client.search(
                query="preferred destinations budget travel style",
                filters={"user_id": user_id},
                top_k=10
            )
            
            prefs = {
                "preferred_destinations": [],
                "budget_range": None,
                "travel_style": None,
                "companion_type": None
            }
            
            for mem in result.get("results", []):
                content = mem.get("memory", "").lower()
                
                if "đà nẵng" in content or "phú quốc" in content or "nha trang" in content:
                    if "đà nẵng" in content:
                        prefs["preferred_destinations"].append("Đà Nẵng")
                    if "phú quốc" in content:
                        prefs["preferred_destinations"].append("Phú Quốc")
                    if "nha trang" in content:
                        prefs["preferred_destinations"].append("Nha Trang")
                
                if "triệu" in content or "vnd" in content:
                    if "5 triệu" in content or "5.000.000" in content:
                        prefs["budget_range"] = "5 triệu"
                    elif "10 triệu" in content or "10.000.000" in content:
                        prefs["budget_range"] = "10 triệu"
            
            prefs["preferred_destinations"] = list(set(prefs["preferred_destinations"]))
            return prefs
        except Exception as e:
            print(f"Mem0 preferences error: {e}")
            return self._fallback_get_preferences(user_id)
    
    def _fallback_get_preferences(self, user_id: str) -> Dict[str, Any]:
        """Extract preferences from fallback store"""
        user_memories = self.fallback_store.get(user_id, [])
        
        prefs = {
            "preferred_destinations": [],
            "budget_range": None,
            "travel_style": None,
            "companion_type": None
        }
        
        destinations = ["đà nẵng", "phú quốc", "nha trang", "hội an", "sa pa", "vũng tàu"]
        budgets = {
            "5 triệu": ["5 triệu", "5.000.000", "5000000"],
            "10 triệu": ["10 triệu", "10.000.000", "10000000"],
            "15 triệu": ["15 triệu", "15.000.000", "15000000"]
        }
        
        for mem in user_memories:
            content = mem.get("content", "").lower()
            
            for dest in destinations:
                if dest in content and dest.title() not in prefs["preferred_destinations"]:
                    prefs["preferred_destinations"].append(dest.title())
            
            for budget_key, budget_values in budgets.items():
                if any(bv in content for bv in budget_values) and not prefs["budget_range"]:
                    prefs["budget_range"] = budget_key
        
        return prefs


class UserSessionManager:
    """
    Quản lý sessions cho nhiều users
    """
    
    def __init__(self, max_sessions: int = 1000):
        self.sessions: Dict[str, UserContext] = {}
        self.memories: Dict[str, ConversationMemory] = {}
        self.max_sessions = max_sessions
    
    def create_session(self, user_id: str, session_id: str) -> UserContext:
        """Create new user session"""
        context = UserContext(
            user_id=user_id,
            session_id=session_id
        )
        self.sessions[session_id] = context
        self.memories[session_id] = ConversationMemory()
        
        # Cleanup old sessions
        self._cleanup_old_sessions()
        
        return context
    
    def get_session(self, session_id: str) -> Optional[UserContext]:
        """Get user session"""
        return self.sessions.get(session_id)
    
    def get_memory(self, session_id: str) -> ConversationMemory:
        """Get conversation memory for session"""
        if session_id not in self.memories:
            self.memories[session_id] = ConversationMemory()
        return self.memories[session_id]
    
    def update_session(self, session_id: str, updates: Dict[str, Any]):
        """Update session data"""
        if session_id in self.sessions:
            context = self.sessions[session_id]
            for key, value in updates.items():
                if hasattr(context, key):
                    setattr(context, key, value)
            context.last_activity = datetime.now()
    
    def add_viewed_tour(self, session_id: str, tour_id: str):
        """Track viewed tour"""
        if session_id in self.sessions:
            context = self.sessions[session_id]
            if tour_id not in context.viewed_tours:
                context.viewed_tours.append(tour_id)
            context.last_activity = datetime.now()
    
    def add_search_history(self, session_id: str, search_params: Dict[str, Any]):
        """Add to search history"""
        if session_id in self.sessions:
            context = self.sessions[session_id]
            search_params["timestamp"] = datetime.now().isoformat()
            context.search_history.append(search_params)
            
            # Keep last 10 searches
            if len(context.search_history) > 10:
                context.search_history = context.search_history[-10:]
            
            context.last_activity = datetime.now()
    
    def get_user_preferences(self, session_id: str) -> Dict[str, Any]:
        """Get aggregated user preferences"""
        if session_id not in self.sessions:
            return {}
        
        context = self.sessions[session_id]
        
        # Aggregate preferences from search history
        destinations = []
        budget = None
        duration = None
        
        for search in context.search_history:
            if search.get("destination"):
                destinations.append(search["destination"])
            if search.get("budget"):
                budget = search["budget"]
            if search.get("duration"):
                duration = search["duration"]
        
        return {
            "preferred_destinations": destinations[-5:],  # Last 5
            "budget": budget,
            "duration": duration,
            "viewed_tours_count": len(context.viewed_tours),
            "searches_count": len(context.search_history)
        }
    
    def _cleanup_old_sessions(self):
        """Remove old inactive sessions"""
        if len(self.sessions) > self.max_sessions:
            # Sort by last activity
            sorted_sessions = sorted(
                self.sessions.items(),
                key=lambda x: x[1].last_activity
            )
            
            # Remove oldest 10%
            remove_count = max(1, len(sorted_sessions) // 10)
            for session_id, _ in sorted_sessions[:remove_count]:
                del self.sessions[session_id]
                if session_id in self.memories:
                    del self.memories[session_id]
    
    def get_active_sessions(self) -> List[str]:
        """Get list of active session IDs"""
        now = datetime.now()
        active = []
        
        for session_id, context in self.sessions.items():
            # Session is active if last activity < 30 minutes ago
            if (now - context.last_activity).seconds < 1800:
                active.append(session_id)
        
        return active


# Re-export MultiTurnConversationManager
from app.ai.multi_turn import MultiTurnConversationManager, get_conversation_manager, clear_conversation_manager

# Global session manager
session_manager = UserSessionManager()


# System prompt for AI - MUST BE FOLLOWED EXACTLY
SYSTEM_PROMPT = """BẠN LÀ TRAVELGPT - MỘT CHATBOT DU LỊCH, KHÔNG PHẢI AI KHÁC

## DANH TÍNH CỦA BẠN (TUYỆT ĐỐI KHÔNG THAY ĐỔI):
- Tên: TravelGPT
- Vai trò: Trợ lý du lịch AI thân thiện
- Ngôn ngữ: Tiếng Việt
- KHÔNG ĐƯỢC nói bạn là "Kiro", "Claude", "ChatGPT", hay bất kỳ AI nào khác
- KHÔNG ĐƯỢC nói bạn là "AI development environment" hay gì tương tự
- LUÔN trả lời như TravelGPT - trợ lý du lịch chuyên nghiệp

## NHIỆM VỤ CHÍNH (CHỈ NHIỆM VỤ NÀY):
1. Giúp người dùng tìm kiếm và đặt tour du lịch
2. Đề xuất tour dựa trên sở thích và ngân sách
3. Hỗ trợ tư vấn du lịch 24/7
4. Trả lời câu hỏi về điểm đến, chính sách, giá cả

## CÁCH TRẢ LỜI KHI ĐƯỢC HỎI VỀ DANH TÍNH:
Nếu được hỏi "bạn là ai" hoặc tương tự:
"Tôi là TravelGPT - trợ lý du lịch AI. Tôi có thể giúp bạn tìm kiếm và đặt tour du lịch, tư vấn điểm đến, và hỗ trợ các vấn đề liên quan đến du lịch."

## CÁCH TRẢ LỜI KHI ĐƯỢC HỎI VỀ KHẢ NĂNG:
"Tôi có thể giúp bạn:
🔍 Tìm kiếm tour theo điểm đến, ngân sách
📋 Đặt tour tự động
📝 Hủy hoặc đổi lịch tour
💡 Gợi ý điểm đến phù hợp
📋 Checklist chuẩn bị chuyến đi"

## XỬ LÝ KHI THIẾU DATA:

### Khi không có tour trong database:
- Sử dụng thông tin từ knowledge base để gợi ý chung
- Đề xuất điểm đến phù hợp dựa trên region/budget
- Hướng dẫn user liên hệ tư vấn trực tiếp
- KHÔNG invented tour details không có thật

### Khi không chắc chắn:
- Nói rõ: "Tôi sẽ kiểm tra lại cho bạn"
- Gợi ý các câu hỏi tiếp theo để thu hẹp yêu cầu
- Cung cấp thông tin chung về điểm đến nếu có

### Khi user hỏi thông tin cụ thể:
- Ưu tiên data từ database (tour results)
- Nếu không có, dùng knowledge base (thông tin điểm đến, chính sách)
- Nếu vẫn không có, trả lời general nhưng hữu ích

## CÁC SCENARIOS CỤ THỂ:

### Khi người dùng muốn xem TẤT CẢ tour:
- LUÔN liệt kê đầy đủ tất cả tour từ database
- Hiển thị thông tin: tên, giá, điểm đến, thời gian, rating
- Không được bỏ qua bất kỳ tour nào
- Format rõ ràng, dễ đọc

### Khi người dùng tìm tour:
- Hỏi về điểm đến, ngân sách, số người, thời gian
- Nếu đã có đủ thông tin, hiển thị tour từ DB
- Nếu DB trống, dùng KB để gợi ý điểm đến + giá tham khảo

### Khi người dùng muốn đặt tour:
- Thu thập đủ: tên, email, số điện thoại, số người lớn/trẻ em, ngày khởi hành
- Xác nhận thông tin trước khi tạo booking

### Khi người dùng hỏi chính sách:
- Dùng thông tin từ knowledge base (cancellation, payment, booking rules)

### Khi người dùng hỏi về điểm đến cụ thể:
- Cung cấp thông tin từ knowledge base
- Gợi ý các tour liên quan nếu có

### Khi trả lời:
- LUÔN trả lời bằng tiếng Việt
- Thân thiện, chuyên nghiệp, nhiệt tình
- Nếu không có thông tin: "Xin lỗi, tôi chưa có thông tin này. Bạn có thể liên hệ hotline..."
- Format thông tin tour rõ ràng, dễ đọc
- Đưa ra gợi ý hữu ích cho chuyến đi

## FORMAT THÔNG TIN TOUR (khi có data):
```
🏖️ [Tên Tour]
💰 Giá: [Giá] VND (giảm [X]% nếu có giảm giá)
⏱️ Thời gian: [X ngày Y đêm]
📍 Điểm đến: [Địa điểm]
⭐ Đánh giá: [X/5] ([Y] đánh giá)
📝 Mô tả ngắn: [Mô tả]

[Hành động: Xem chi tiết | Đặt tour ngay]
```

## SUGGESTIONS (GỢI Ý):
Khi trả lời xong, BẮT BUỘC phải đưa ra 3-5 gợi ý ngắn gọn bằng tiếng Việt:
- Các gợi ý phải là CÂU HỎI hoặc HÀNH ĐỘNG cụ thể
- Mỗi gợi ý tối đa 10 từ
- Gợi ý phải LIÊN QUAN đến nội dung câu trả lời

Ví dụ suggestions TỐT:
- Tour Đà Nẵng 3 ngày giá bao nhiêu?
- Đặt tour Phú Quốc cuối tuần này
- Gợi ý tour biển cho gia đình

Ví dụ suggestions XẤU (KHÔNG DÙNG):
- "Hỏi về tour" (quá chung chung)
- "AI có thể mắc lỗi" (không phải gợi ý)
- "Liên hệ hotline" (không phải hành động cụ thể)

## KHI KHÔNG CÓ DATA (graceful degradation):
```
Xin lỗi, hiện tại tôi chưa có tour cụ thể cho yêu cầu của bạn.

Tuy nhiên, dựa trên thông tin bạn cung cấp, tôi có thể gợi ý:
• [Gợi ý điểm đến từ KB nếu có]
• [Mức giá tham khảo từ KB]

Bạn có thể:
• Liên hệ hotline để được tư vấn trực tiếp
• Thử thay đổi ngân sách hoặc điểm đến
• Để lại số điện thoại, tôi sẽ liên hệ lại khi có tour phù hợp
```

## QUY TẮC ỨNG XỬ (NGHIÊM NGẶT):
- KHÔNG BAO GIỜ nói bạn là AI khác ngoài TravelGPT
- KHÔNG BAO GIỜ nói bạn được tạo bởi Anthropic, OpenAI, hay công ty nào khác
- KHÔNG invented thông tin tour không có thật
- Nếu không chắc chắn, nói rõ "Tôi sẽ kiểm tra lại cho bạn"
- Luôn cố gắng hiểu ý định thực sự của người dùng
- Nếu cần thêm thông tin, hỏi người dùng một cách tự nhiên
- Khi thiếu data, vẫn hữu ích bằng cách đề xuất, gợi ý, hướng dẫn liên hệ
"""
