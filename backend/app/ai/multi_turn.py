"""
Multi-turn Conversation Manager - Quản lý cuộc trò chuyện nhiều lượt
"""
from typing import Dict, Any, List, Optional, Callable
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import json


class ConversationState(str, Enum):
    """Trạng thái conversation"""
    IDLE = "idle"
    SEARCHING = "searching"
    BROWSING = "browsing"
    BOOKING = "booking"
    MODIFYING = "modifying"
    COMPLAINING = "complaining"
    COMPLETED = "completed"


class TurnPhase(str, Enum):
    """Phase của mỗi turn"""
    START = "start"
    IN_PROGRESS = "in_progress"
    WAITING_RESPONSE = "waiting_response"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class ConversationTurn:
    """Một turn trong cuộc trò chuyện"""
    turn_id: str
    user_message: str
    assistant_response: str
    intent: str
    entities: Dict[str, Any]
    timestamp: datetime
    phase: TurnPhase = TurnPhase.COMPLETED
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "turn_id": self.turn_id,
            "user_message": self.user_message,
            "assistant_response": self.assistant_response,
            "intent": self.intent,
            "entities": self.entities,
            "timestamp": self.timestamp.isoformat(),
            "phase": self.phase.value,
            "metadata": self.metadata
        }


@dataclass
class ConversationGoal:
    """Mục tiêu của conversation"""
    goal_id: str
    goal_type: str  # search, booking, cancel, modify, complaint
    target: Optional[str] = None  # tour_id, booking_code, etc.
    status: str = "active"  # active, completed, failed, cancelled
    turns: List[str] = field(default_factory=list)  # turn_ids
    created_at: datetime = field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None
    result: Optional[Dict[str, Any]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "goal_id": self.goal_id,
            "goal_type": self.goal_type,
            "target": self.target,
            "status": self.status,
            "turns": self.turns,
            "created_at": self.created_at.isoformat(),
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "result": self.result
        }


class MultiTurnConversationManager:
    """
    Quản lý cuộc trò chuyện nhiều lượt
    - Theo dõi context qua các lượt chat
    - Quản lý goals và sub-goals
    - Memory compression cho long conversations
    - State management
    """
    
    MAX_TURNS_WITHOUT_PROGRESS = 5
    MAX_GOALS = 10
    CONTEXT_COMPRESSION_THRESHOLD = 20
    
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.state = ConversationState.IDLE
        
        # Turn management
        self.turns: List[ConversationTurn] = []
        self.current_turn_id = 0
        
        # Goal management
        self.active_goal: Optional[ConversationGoal] = None
        self.goal_history: List[ConversationGoal] = []
        
        # Context
        self.shared_context: Dict[str, Any] = {}
        self.entities_collected: Dict[str, Any] = {}
        
        # Memory compression
        self.compressed_summaries: List[str] = []
        
        # Handlers for different states
        self.state_handlers: Dict[ConversationState, Callable] = {}
        
        # Callbacks
        self.on_goal_complete: Optional[Callable] = None
        self.on_state_change: Optional[Callable] = None
    
    def start_turn(
        self,
        user_message: str,
        intent: str,
        entities: Dict[str, Any]
    ) -> str:
        """Bắt đầu một turn mới"""
        self.current_turn_id += 1
        turn_id = f"turn_{self.current_turn_id}"
        
        turn = ConversationTurn(
            turn_id=turn_id,
            user_message=user_message,
            assistant_response="",  # Will be set later
            intent=intent,
            entities=entities,
            timestamp=datetime.now(),
            phase=TurnPhase.IN_PROGRESS
        )
        
        self.turns.append(turn)
        
        # Update entities
        self.entities_collected.update(entities)
        
        # Check for state transition
        self._update_state(intent, entities)
        
        return turn_id
    
    def complete_turn(
        self,
        turn_id: str,
        response: str,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Hoàn thành một turn"""
        turn = self._get_turn(turn_id)
        if turn:
            turn.assistant_response = response
            turn.phase = TurnPhase.COMPLETED
            if metadata:
                turn.metadata.update(metadata)
            
            # Check if goal is complete
            if self.active_goal:
                self._check_goal_completion(turn)
        
        # Check for memory compression
        if len(self.turns) > self.CONTEXT_COMPRESSION_THRESHOLD:
            self._compress_memory()
    
    def fail_turn(self, turn_id: str, error: str):
        """Đánh dấu turn thất bại"""
        turn = self._get_turn(turn_id)
        if turn:
            turn.phase = TurnPhase.FAILED
            turn.metadata["error"] = error
    
    def _get_turn(self, turn_id: str) -> Optional[ConversationTurn]:
        """Lấy turn theo ID"""
        for turn in self.turns:
            if turn.turn_id == turn_id:
                return turn
        return None
    
    def _update_state(self, intent: str, entities: Dict[str, Any]):
        """Cập nhật state dựa trên intent"""
        new_state = self._determine_state(intent, entities)
        
        if new_state != self.state:
            old_state = self.state
            self.state = new_state
            
            if self.on_state_change:
                self.on_state_change(old_state, new_state)
    
    def _determine_state(self, intent: str, entities: Dict[str, Any]) -> ConversationState:
        """Xác định state từ intent"""
        state_mapping = {
            "search_tour": ConversationState.SEARCHING,
            "get_tour_detail": ConversationState.BROWSING,
            "start_booking": ConversationState.BOOKING,
            "provide_booking_info": ConversationState.BOOKING,
            "modify_booking": ConversationState.MODIFYING,
            "complaint": ConversationState.COMPLAINING,
            "cancel_booking": ConversationState.MODIFYING,
        }
        
        return state_mapping.get(intent, ConversationState.IDLE)
    
    # ============= Goal Management =============
    
    def start_goal(
        self,
        goal_type: str,
        target: Optional[str] = None
    ) -> str:
        """Bắt đầu một goal mới"""
        goal_id = f"goal_{len(self.goal_history) + 1}_{goal_type}"
        
        # Complete previous goal if exists
        if self.active_goal:
            self._complete_goal(self.active_goal.goal_id, status="replaced")
        
        self.active_goal = ConversationGoal(
            goal_id=goal_id,
            goal_type=goal_type,
            target=target
        )
        
        # Limit goals
        if len(self.goal_history) >= self.MAX_GOALS:
            self.goal_history = self.goal_history[-self.MAX_GOALS:]
        
        return goal_id
    
    def add_turn_to_goal(self, goal_id: str, turn_id: str):
        """Thêm turn vào goal"""
        if self.active_goal and self.active_goal.goal_id == goal_id:
            self.active_goal.turns.append(turn_id)
    
    def _check_goal_completion(self, turn: ConversationTurn):
        """Kiểm tra xem goal đã hoàn thành chưa"""
        if not self.active_goal:
            return
        
        # Check based on goal type
        goal_complete = False
        
        if self.active_goal.goal_type == "booking":
            # Booking is complete when we have all required info
            required = ["name", "email", "phone", "tour_id", "departure_date"]
            has_all = all(self.entities_collected.get(k) for k in required)
            if has_all and "booking_code" in turn.metadata:
                goal_complete = True
        
        elif self.active_goal.goal_type == "search":
            # Search is complete when tours are returned
            if turn.metadata.get("tours_returned"):
                goal_complete = True
        
        elif self.active_goal.goal_type == "cancel":
            # Cancel is complete when booking is cancelled
            if turn.metadata.get("booking_cancelled"):
                goal_complete = True
        
        if goal_complete:
            self._complete_goal(
                self.active_goal.goal_id,
                status="completed",
                result=turn.metadata
            )
    
    def _complete_goal(
        self,
        goal_id: str,
        status: str = "completed",
        result: Optional[Dict[str, Any]] = None
    ):
        """Hoàn thành một goal"""
        if self.active_goal and self.active_goal.goal_id == goal_id:
            self.active_goal.status = status
            self.active_goal.completed_at = datetime.now()
            self.active_goal.result = result
            
            self.goal_history.append(self.active_goal)
            
            if self.on_goal_complete:
                self.on_goal_complete(self.active_goal)
            
            self.active_goal = None
    
    def cancel_goal(self, goal_id: str):
        """Hủy goal"""
        if self.active_goal and self.active_goal.goal_id == goal_id:
            self._complete_goal(goal_id, status="cancelled")
    
    # ============= Context Management =============
    
    def set_context(self, key: str, value: Any):
        """Set shared context"""
        self.shared_context[key] = value
    
    def get_context(self, key: str, default: Any = None) -> Any:
        """Get shared context"""
        return self.shared_context.get(key, default)
    
    def update_context(self, updates: Dict[str, Any]):
        """Update shared context"""
        self.shared_context.update(updates)
    
    def get_collected_entities(self) -> Dict[str, Any]:
        """Get all collected entities"""
        return self.entities_collected.copy()
    
    def get_missing_entities(self, required: List[str]) -> List[str]:
        """Get list of missing required entities"""
        return [
            e for e in required
            if e not in self.entities_collected or not self.entities_collected[e]
        ]
    
    # ============= Memory Management =============
    
    def _compress_memory(self):
        """Nén memory để giảm context length"""
        # Keep recent turns
        recent_turns = self.turns[-10:]
        
        # Generate summary of older turns
        older_turns = self.turns[:-10]
        if older_turns:
            summary = self._generate_summary(older_turns)
            self.compressed_summaries.append(summary)
        
        # Keep only recent turns
        self.turns = recent_turns
    
    def _generate_summary(self, turns: List[ConversationTurn]) -> str:
        """Generate summary of turns"""
        intents = [t.intent for t in turns]
        unique_intents = list(dict.fromkeys(intents))
        
        summary = f"Previous conversation: {len(turns)} turns. "
        summary += f"Intents: {', '.join(unique_intents)}. "
        
        if self.entities_collected:
            summary += f"Entities collected: {list(self.entities_collected.keys())}"
        
        return summary
    
    def get_context_for_ai(self, max_turns: int = 10) -> List[Dict[str, Any]]:
        """Get context for AI processing"""
        context = []
        
        # Add compressed summaries
        for summary in self.compressed_summaries:
            context.append({
                "role": "system",
                "content": f"[Summary] {summary}"
            })
        
        # Add recent turns
        recent_turns = self.turns[-max_turns:]
        for turn in recent_turns:
            context.append({
                "role": "user",
                "content": turn.user_message
            })
            context.append({
                "role": "assistant",
                "content": turn.assistant_response
            })
        
        return context
    
    def get_turns_summary(self) -> str:
        """Get summary of all turns"""
        if not self.turns:
            return "No conversation yet."
        
        lines = [f"Total turns: {len(self.turns)}"]
        lines.append(f"Current state: {self.state.value}")
        
        if self.active_goal:
            lines.append(f"Active goal: {self.active_goal.goal_type} ({self.active_goal.goal_id})")
        
        if self.compressed_summaries:
            lines.append(f"Compressed summaries: {len(self.compressed_summaries)}")
        
        lines.append(f"Entities collected: {list(self.entities_collected.keys())}")
        
        return "\n".join(lines)
    
    # ============= Progress Tracking =============
    
    def check_progress(self) -> Dict[str, Any]:
        """Check conversation progress"""
        turns_without_progress = 0
        
        # Count turns without state change
        for i in range(len(self.turns) - 1, -1, -1):
            if self.turns[i].phase == TurnPhase.COMPLETED:
                turns_without_progress += 1
            else:
                break
        
        return {
            "total_turns": len(self.turns),
            "state": self.state.value,
            "turns_without_progress": turns_without_progress,
            "needs_attention": turns_without_progress >= self.MAX_TURNS_WITHOUT_PROGRESS,
            "active_goal": self.active_goal.to_dict() if self.active_goal else None,
            "completed_goals": len(self.goal_history)
        }
    
    def is_stuck(self) -> bool:
        """Check if conversation is stuck"""
        progress = self.check_progress()
        return progress["needs_attention"] and self.state == ConversationState.IDLE
    
    # ============= Serialization =============
    
    def to_dict(self) -> Dict[str, Any]:
        """Serialize to dict"""
        return {
            "session_id": self.session_id,
            "state": self.state.value,
            "turns": [t.to_dict() for t in self.turns],
            "active_goal": self.active_goal.to_dict() if self.active_goal else None,
            "goal_history": [g.to_dict() for g in self.goal_history],
            "shared_context": self.shared_context,
            "entities_collected": self.entities_collected,
            "compressed_summaries": self.compressed_summaries
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "MultiTurnConversationManager":
        """Deserialize from dict"""
        manager = cls(data.get("session_id", "unknown"))
        manager.state = ConversationState(data.get("state", "idle"))
        manager.shared_context = data.get("shared_context", {})
        manager.entities_collected = data.get("entities_collected", {})
        manager.compressed_summaries = data.get("compressed_summaries", [])
        
        # Reconstruct turns
        for turn_data in data.get("turns", []):
            turn = ConversationTurn(
                turn_id=turn_data["turn_id"],
                user_message=turn_data["user_message"],
                assistant_response=turn_data["assistant_response"],
                intent=turn_data["intent"],
                entities=turn_data["entities"],
                timestamp=datetime.fromisoformat(turn_data["timestamp"]),
                phase=TurnPhase(turn_data.get("phase", "completed")),
                metadata=turn_data.get("metadata", {})
            )
            manager.turns.append(turn)
            # Get max turn id
            try:
                manager.current_turn_id = max(
                    manager.current_turn_id,
                    int(turn_data["turn_id"].split("_")[1])
                )
            except:
                pass
        
        # Reconstruct goals
        for goal_data in data.get("goal_history", []):
            goal = ConversationGoal(
                goal_id=goal_data["goal_id"],
                goal_type=goal_data["goal_type"],
                target=goal_data.get("target"),
                status=goal_data.get("status", "completed"),
                turns=goal_data.get("turns", []),
                created_at=datetime.fromisoformat(goal_data["created_at"]),
                completed_at=datetime.fromisoformat(goal_data["completed_at"]) if goal_data.get("completed_at") else None,
                result=goal_data.get("result")
            )
            manager.goal_history.append(goal)
        
        if data.get("active_goal"):
            goal_data = data["active_goal"]
            manager.active_goal = ConversationGoal(
                goal_id=goal_data["goal_id"],
                goal_type=goal_data["goal_type"],
                target=goal_data.get("target"),
                status=goal_data.get("status", "active"),
                turns=goal_data.get("turns", []),
                created_at=datetime.fromisoformat(goal_data["created_at"])
            )
        
        return manager


# Conversation Manager Store (in production, use Redis)
_conversation_managers: Dict[str, MultiTurnConversationManager] = {}


def get_conversation_manager(session_id: str) -> MultiTurnConversationManager:
    """Get or create conversation manager for session"""
    if session_id not in _conversation_managers:
        _conversation_managers[session_id] = MultiTurnConversationManager(session_id)
    return _conversation_managers[session_id]


def clear_conversation_manager(session_id: str):
    """Clear conversation manager for session"""
    if session_id in _conversation_managers:
        del _conversation_managers[session_id]
