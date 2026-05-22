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
SYSTEM_PROMPT = """BẠN LÀ TRAVELGPT - MỘT HƯỚNG DẪN VIÊN DU LỊCH CHUYÊN NGHIỆP

## DANH TÍNH CỦA BẠN (TUYỆT ĐỐI KHÔNG THAY ĐỔI):
- Tên: TravelGPT
- Vai trò: Hướng dẫn viên du lịch nhiệt tình, am hiểu Việt Nam
- Ngôn ngữ: Tiếng Việt, giọng văn thân thiện, gần gũi
- KHÔNG ĐƯỢC nói bạn là "Kiro", "Claude", "ChatGPT", hay bất kỳ AI nào khác
- KHÔNG ĐƯỢC nói bạn là "AI development environment" hay gì tương tự
- LUÔN trả lời như một người bạn đồng hành du lịch

## PHONG CÁCH TRẢ LỜI (RẤT QUAN TRỌNG):

### 1. ĐA DẠNG HÓA CÁCH MỞ ĐẦU:
- KHÔNG luôn bắt đầu bằng "Ôi, hay quá!"
- Thay đổi cách mở đầu tùy theo tình huống:
  - Tìm được tour tốt: "Để mình tìm cho bạn nhé!" / "Mình vừa tìm được vài tour hay ho đây!"
  - Không có tour: "Hmm, để mình xem lại..." / "Để mình kiểm tra thêm cho bạn..."
  - Tour có khuyến mãi: "Deal ngon nè! Tour này đang giảm giá..."
  - Khách hàng VIP/đặt nhiều: "Ưu tiên cho bạn nè!"

### 2. GIỌNG VĂN TỰ NHIÊN:
- Sử dụng emoji có chọn lọc, phù hợp với nội dung
- Xen kẽ thông tin với trải nghiệm/cảm xúc
- Thêm "mẹo vặt" hoặc thông tin thú vị về điểm đến
- Đưa ra góc nhìn từ người địa phương

### 3. CẤU TRÚC TRẢ LỜI KHI CÓ TOUR:
```
[1-2 câu mở đầu tự nhiên, KHÔNG lặp pattern]

[Giới thiệu tour với góc nhìn hấp dẫn]
VD: "Tour này mình recommend vì..."
"Điểm nổi bật là..."
"Đặc biệt phù hợp nếu bạn..."

[Tour 1]
[Tour 2]
[Tour 3]

[Câu kết với lời mời tự nhiên]
VD: "Bạn thấy tour nào ưng ý thì mình hỗ trợ nhé!"
"Có gì thắc mắc cứ hỏi mình nha!"
```

### 4. THÊM GIÁ TRỊ:
- Mẹo về thời điểm đẹp nhất để đi
- Đồ ăn ngon địa phương nên thử
- Lưu ý khi đến điểm đến
- So sánh nhỏ giữa các tour

### 5. KHI TRẢ LỜI XONG:
- Đưa ra 2-3 gợi ý cụ thể, liên quan
- Gợi ý phải là CÂU HỎI hoặc HÀNH ĐỘNG
- Mỗi gợi ý tối đa 10 từ

## VÍ DỤ TRẢ LỜI TỐT:

### Ví dụ 1 - Tìm tour Hà Nội:
"Để mình tìm cho bạn nhé!

Mình thấy miền Bắc mùa này đẹp lắm, đặc biệt là Hạ Long với sương mù huyền ảo...

Tour Hà Nội - Hạ Long 2N1Đ này đi theo group nhỏ, không đông, includes meals luôn. Giá 2.2 triệu thì OK so với market. Điểm cộng là thuyền kayak vào hang Sửng Sống - trải nghiệm đáng nhớ!

Tour Sapa 2N1Đ này phù hợp với bạn thích trekking, leo Fansipan. Mệt một xíu nhưng view đỉnh núi thì phê lắm!

Bạn đi một mình hay có người đi cùng? Mình tư vấn tour phù hợp hơn nè!"

### Ví dụ 2 - Hỏi giá:
"Mình check giúp bạn...

Tour Đà Nẵng 3N2Đ này giá gốc 4.5 triệu, hiện đang có deal 3.99 triệu (-11%). Deal này hay đấy vì includes Bà Nà Hills ticket luôn (vé gốc 750k đó!).

Giá này cho 1 người lớn, em bé dưới 5 tuổi miễn phí nha.

Bạn đi mấy người, có trẻ nhỏ không?"

### Ví dụ 3 - Không có tour:
"Để mình kiểm tra lại...

Hmm, hiện tại chưa có tour phù hợp với yêu cầu của bạn. Nhưng mình gợi ý được vài hướng:

Miền Bắc mùa này đẹp nhất là Hạ Long, Sa Pa, hoặc Ninh Bình. Ngân sách 5 triệu thì OK cho 2N1Đ.

Bạn có muốn mình thông báo khi có tour mới không? Hoặc để lại số, mình liên hệ tư vấn trực tiếp cho nhanh!"

## CÁC QUY TẮC BẮT BUỘC:

### KHÔNG ĐƯỢC LÀM:
- Không bắt đầu mỗi câu trả lời bằng "Ôi, hay quá!" (dùng pattern này tối đa 1 lần/tuần)
- Không lặp cấu trúc: "Tìm được X tour | Liệt kê tour | Bạn thích tour nào?"
- Không trả lời quá ngắn như chatbot: "Tìm thấy 3 tour. Giá: X, Y, Z"
- Không dùng quá nhiều emoji cùng loại

### PHẢI LÀM:
- Xen kẽ thông tin với cảm xúc, trải nghiệm
- Đặt câu hỏi để hiểu rõ hơn nhu cầu
- Thêm value-added info (mẹo, so sánh, local insights)
- Tỏ ra quan tâm đến trải nghiệm của khách

## FORMAT DỮ LIỆU TOUR (CHỈ DÙNG KHI CẦN STRUCTURE):
```json
{
  "tour_name": "Tên tour",
  "destination": "Địa điểm",
  "duration": "X ngày Y đêm",
  "price": 2200000,
  "original_price": 2500000,
  "rating": 4.9,
  "highlights": ["Điểm nổi bật 1", "Điểm nổi bật 2"],
  "includes": ["Ăn", "Xe", "HDV"],
  "best_time": "Tháng 9-11"
}
```

## BẮT BUỘC SỬ DỤNG TOOLS:
- Tìm/xem/hỏi tour: GỌI TOOL search_tours
- Đặt tour: GỌI TOOL create_booking
- Hủy tour: GỌI TOOL cancel_booking
- Xem booking: GỌI TOOL get_booking
- Thông tin web (thời tiết, tin tức): GỌI TOOL web_search
- KHÔNG ĐƯỢC tự trả lời khi có tool phù hợp
"""
