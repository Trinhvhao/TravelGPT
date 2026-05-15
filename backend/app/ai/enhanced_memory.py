"""
Enhanced Conversation Memory - Multi-turn với Coreference Resolution
- Memory management cho multi-turn conversations
- Coreference resolution (đại từ, "tour đó", "ở đó")
- Entity tracking và resolution
- Context compression cho long conversations
"""
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import re
import json


class ConversationPhase(str, Enum):
    """Phase của cuộc trò chuyện"""
    INITIAL = "initial"
    EXPLORING = "exploring"
    BOOKING = "booking"
    COMPLETED = "completed"
    FRUSTRATED = "frustrated"


@dataclass
class ExtractedEntity:
    """Entity được trích xuất từ message"""
    type: str  # destination, date, budget, tour_id, etc.
    value: Any
    canonical: str  # Normalized form
    source: str  # "explicit", "inferred", "coreference"
    confidence: float = 1.0
    mentioned_at: datetime = field(default_factory=datetime.now)


@dataclass
class ConversationTurn:
    """Một turn trong cuộc trò chuyện"""
    turn_id: int
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime = field(default_factory=datetime.now)
    intent: Optional[str] = None
    entities: List[ExtractedEntity] = field(default_factory=list)
    sentiment_label: Optional[str] = None
    sentiment_score: float = 0.0
    metadata: Dict[str, Any] = field(default_factory=dict)


class CoreferenceResolver:
    """
    Coreference Resolution - Giải quyết đại từ và tham chiếu
    - "tour đó" -> actual tour
    - "ở đó" -> actual destination
    - "giá đó" -> actual price
    - "ngày đó" -> actual date
    """
    
    # Pronoun and reference patterns
    PRONOUN_PATTERNS = {
        # Vietnamese pronouns
        "nó": ["tour", "địa điểm", "nơi", "chỗ"],
        "đó": ["tour", "địa điểm", "nơi", "chỗ", "ngày", "giá"],
        "này": ["tour", "địa điểm", "nơi", "chỗ", "ngày", "giá"],
        "vậy": [],  # Standalone reference
        "thế": [],  # Standalone reference
    }
    
    # Reference keywords that indicate coreference
    REFERENCE_KEYWORDS = [
        "đó", "này", "kia", "vậy", "thế", "nó", "của nó", "của này",
        "có", "cùng", "cũng", "tương tự", "giống"
    ]
    
    # Entity types to track for coreference
    TRACKABLE_ENTITIES = [
        "destination", "tour_id", "tour_name", "budget", "date", 
        "duration", "num_people", "name", "email", "phone"
    ]
    
    def __init__(self):
        self.entity_history: Dict[str, List[Dict[str, Any]]] = {
            et: [] for et in self.TRACKABLE_ENTITIES
        }
    
    def register_entity(self, entity_type: str, value: Any, canonical: str, source: str = "explicit"):
        """Register an entity for tracking"""
        if entity_type in self.entity_history:
            self.entity_history[entity_type].append({
                "value": value,
                "canonical": canonical,
                "source": source,
                "timestamp": datetime.now().isoformat()
            })
    
    def register_entities(self, entities: List[ExtractedEntity]):
        """Register multiple entities"""
        for entity in entities:
            self.register_entity(entity.type, entity.value, entity.canonical, entity.source)
    
    def resolve_reference(
        self, 
        message: str, 
        context: Dict[str, Any]
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Resolve coreference in message
        Returns: (resolved_message, resolved_entities)
        """
        message_lower = message.lower()
        resolved = message
        resolved_entities = {}
        
        # Check if message contains coreference patterns
        has_reference = any(kw in message_lower for kw in self.REFERENCE_KEYWORDS)
        
        if not has_reference:
            return message, {}
        
        # Patterns to check
        coreference_patterns = [
            # Tour references
            (r'tour\s+(?:đó|này|kia|vậy|thế)', 'tour'),
            (r'(?:đó|này|kia|vậy|thế)\s+tour', 'tour'),
            (r'(?:ở|tại)\s+(?:đó|kia|vậy|thế)', 'destination'),
            
            # Price references
            (r'giá\s+(?:đó|này|vậy|thế)', 'budget'),
            (r'(?:đó|này|vậy|thế)\s+giá', 'budget'),
            (r'(?:đắt|rẻ)\s+hơn', 'budget'),
            
            # Date references
            (r'ngày\s+(?:đó|này|kia|vậy|thế)', 'date'),
            (r'(?:đó|này|vậy|thế)\s+ngày', 'date'),
            (r'(?:chuyển|sang|đổi)\s+ngày', 'date'),
            
            # General references
            (r'(?:ở|tại)\s+(?:đó|này)', 'destination'),
            (r'cùng\s+(?:địa điểm|nơi|chỗ)', 'destination'),
            (r'giống\s+(?:vậy|thế|đó)', 'similar'),
        ]
        
        for pattern, entity_type in coreference_patterns:
            if re.search(pattern, message_lower):
                # Find the most recent entity of this type
                recent_entity = self._get_most_recent(entity_type)
                
                if recent_entity:
                    resolved_entities[entity_type] = recent_entity
                    
                    # Replace coreference in message
                    if entity_type == 'tour':
                        resolved = self._replace_tour_reference(resolved, recent_entity)
                    elif entity_type == 'destination':
                        resolved = self._replace_destination_reference(resolved, recent_entity)
                    elif entity_type == 'budget':
                        resolved = self._replace_budget_reference(resolved, recent_entity)
                    elif entity_type == 'date':
                        resolved = self._replace_date_reference(resolved, recent_entity)
        
        # Handle standalone "có gì" type questions
        if re.search(r'(?:có|muốn)\s+(?:gì|thêm|khác)', message_lower):
            # Check what entities are in context
            recent_tour = self._get_most_recent('tour')
            recent_dest = self._get_most_recent('destination')
            
            if recent_dest:
                resolved_entities['destination'] = recent_dest
        
        return resolved, resolved_entities
    
    def _get_most_recent(self, entity_type: str) -> Optional[Dict[str, Any]]:
        """Get most recent entity of given type"""
        history = self.entity_history.get(entity_type, [])
        if history:
            return history[-1]  # Most recent
        return None
    
    def _replace_tour_reference(self, text: str, entity: Dict[str, Any]) -> str:
        """Replace tour references with actual tour info"""
        replacements = {
            r'tour\s+(?:đó|này|kia|vậy|thế)': f'tour "{entity.get("canonical", entity.get("value", ""))}"',
            r'(?:đó|này|kia|vậy|thế)\s+tour': f'"{entity.get("canonical", entity.get("value", ""))}"',
        }
        
        result = text
        for pattern, replacement in replacements.items():
            result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)
        
        return result
    
    def _replace_destination_reference(self, text: str, entity: Dict[str, Any]) -> str:
        """Replace destination references"""
        dest = entity.get("canonical", entity.get("value", ""))
        
        replacements = [
            (r'ở\s+(?:đó|kia|vậy|thế)', f'ở {dest}'),
            (r'tại\s+(?:đó|kia|vậy|thế)', f'tại {dest}'),
            (r'(?:đó|này|kia|vậy|thế)\s+địa điểm', dest),
        ]
        
        result = text
        for pattern, replacement in replacements:
            result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)
        
        return result
    
    def _replace_budget_reference(self, text: str, entity: Dict[str, Any]) -> str:
        """Replace budget references"""
        budget = entity.get("canonical", entity.get("value", ""))
        
        replacements = [
            (r'giá\s+(?:đó|này|vậy|thế)', f'giá {budget}'),
            (r'(?:đó|này|vậy|thế)\s+giá', f'{budget}'),
        ]
        
        result = text
        for pattern, replacement in replacements:
            result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)
        
        return result
    
    def _replace_date_reference(self, text: str, entity: Dict[str, Any]) -> str:
        """Replace date references"""
        date = entity.get("canonical", entity.get("value", ""))
        
        replacements = [
            (r'ngày\s+(?:đó|này|kia|vậy|thế)', f'ngày {date}'),
            (r'(?:đó|này|vậy|thế)\s+ngày', f'ngày {date}'),
        ]
        
        result = text
        for pattern, replacement in replacements:
            result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)
        
        return result
    
    def clear_history(self):
        """Clear entity history"""
        for key in self.entity_history:
            self.entity_history[key] = []


class EnhancedConversationMemory:
    """
    Enhanced Memory với Coreference Resolution
    - Multi-turn conversation memory
    - Entity tracking across turns
    - Context summarization
    - Smart context retrieval for AI
    """
    
    MAX_TURNS = 30
    MAX_CONTEXT_TURNS = 15
    CONTEXT_COMPRESSION_THRESHOLD = 20
    
    def __init__(self, session_id: str):
        self.session_id = session_id
        self.turns: List[ConversationTurn] = []
        self.current_turn_id = 0
        
        # Entity tracking
        self.entities: Dict[str, List[ExtractedEntity]] = {
            et: [] for et in CoreferenceResolver.TRACKABLE_ENTITIES
        }
        
        # Coreference resolver
        self.coreference_resolver = CoreferenceResolver()
        
        # Context
        self.shared_context: Dict[str, Any] = {}
        self.conversation_phase = ConversationPhase.INITIAL
        
        # Compressed summaries
        self.summaries: List[str] = []
    
    def add_turn(
        self,
        role: str,
        content: str,
        intent: Optional[str] = None,
        entities: Optional[List[ExtractedEntity]] = None,
        sentiment_label: Optional[str] = None,
        sentiment_score: float = 0.0,
        metadata: Optional[Dict[str, Any]] = None
    ) -> int:
        """Add a turn to conversation"""
        self.current_turn_id += 1
        
        turn = ConversationTurn(
            turn_id=self.current_turn_id,
            role=role,
            content=content,
            intent=intent,
            entities=entities or [],
            sentiment_label=sentiment_label,
            sentiment_score=sentiment_score,
            metadata=metadata or {}
        )
        
        self.turns.append(turn)
        
        # Register entities
        if entities:
            for entity in entities:
                self._register_entity(entity)
        
        # Update conversation phase
        self._update_phase(intent, sentiment_label)
        
        # Check for compression
        if len(self.turns) > self.CONTEXT_COMPRESSION_THRESHOLD:
            self._compress_memory()
        
        # Trim old turns
        if len(self.turns) > self.MAX_TURNS:
            self.turns = self.turns[-self.MAX_TURNS:]
        
        return self.current_turn_id
    
    def _register_entity(self, entity: ExtractedEntity):
        """Register entity in both memory and coreference resolver"""
        # Update entities dict
        if entity.type in self.entities:
            self.entities[entity.type].append(entity)
            # Keep last 10 entities per type
            if len(self.entities[entity.type]) > 10:
                self.entities[entity.type] = self.entities[entity.type][-10:]
        
        # Update coreference resolver
        self.coreference_resolver.register_entity(
            entity.type, entity.value, entity.canonical, entity.source
        )
    
    def _update_phase(self, intent: Optional[str], sentiment_label: Optional[str]):
        """Update conversation phase based on recent activity"""
        if sentiment_label == "negative":
            self.conversation_phase = ConversationPhase.FRUSTRATED
        elif intent in ["start_booking", "provide_booking_info"]:
            self.conversation_phase = ConversationPhase.BOOKING
        elif len(self.turns) > 2:
            self.conversation_phase = ConversationPhase.EXPLORING
        else:
            self.conversation_phase = ConversationPhase.INITIAL
    
    def resolve_message(self, message: str) -> Tuple[str, Dict[str, Any]]:
        """Resolve coreferences in a new message"""
        return self.coreference_resolver.resolve_reference(message, self.shared_context)
    
    def get_context_for_ai(
        self, 
        include_summary: bool = True,
        max_turns: int = 10
    ) -> List[Dict[str, Any]]:
        """Get conversation context for AI processing"""
        context = []
        
        # Add summary if available
        if include_summary and self.summaries:
            context.append({
                "role": "system",
                "content": f"[Previous Summary] {self.summaries[-1]}"
            })
        
        # Add recent turns
        recent_turns = self.turns[-max_turns:]
        for turn in recent_turns:
            context.append({
                "role": turn.role,
                "content": turn.content
            })
        
        return context
    
    def get_entity_context(self) -> Dict[str, Any]:
        """Get current entity context for AI"""
        context = {}
        
        for entity_type, entities in self.entities.items():
            if entities:
                # Get most recent
                recent = entities[-1]
                context[entity_type] = {
                    "value": recent.value,
                    "canonical": recent.canonical,
                    "confidence": recent.confidence
                }
        
        return context
    
    def get_last_entities(self) -> Dict[str, Any]:
        """Get merged entities from recent turns"""
        merged = {}
        
        for entity_type, entities in self.entities.items():
            if entities:
                recent = entities[-1]
                merged[entity_type] = recent.value
        
        return merged
    
    def get_missing_info(self, required_fields: List[str]) -> List[str]:
        """Get list of missing required information"""
        current = self.get_last_entities()
        missing = []
        
        for field in required_fields:
            if field not in current or not current[field]:
                missing.append(field)
        
        return missing
    
    def _compress_memory(self):
        """Compress old turns into summary"""
        if len(self.turns) <= 10:
            return
        
        old_turns = self.turns[:-10]
        
        # Generate summary
        summary = self._generate_summary(old_turns)
        self.summaries.append(summary)
        
        # Keep only recent turns
        self.turns = self.turns[-10:]
        
        # Keep only recent summaries (max 5)
        if len(self.summaries) > 5:
            self.summaries = self.summaries[-5:]
    
    def _generate_summary(self, turns: List[ConversationTurn]) -> str:
        """Generate summary of old turns"""
        intents = [t.intent for t in turns if t.intent]
        unique_intents = list(dict.fromkeys(intents))
        
        destinations = []
        for turn in turns:
            for entity in turn.entities:
                if entity.type == "destination":
                    destinations.append(entity.canonical)
        
        summary_parts = [
            f"Previous conversation ({len(turns)} turns):",
            f"Intents covered: {', '.join(unique_intents) if unique_intents else 'none'}"
        ]
        
        if destinations:
            summary_parts.append(f"Destinations mentioned: {', '.join(set(destinations))}")
        
        # Add key entities
        key_entities = {}
        for entity_type, entities in self.entities.items():
            if entities:
                key_entities[entity_type] = entities[-1].canonical
        
        if key_entities:
            summary_parts.append(f"Known entities: {key_entities}")
        
        return " | ".join(summary_parts)
    
    def get_conversation_summary(self) -> str:
        """Get full conversation summary"""
        if not self.turns:
            return "Cuộc trò chuyện mới."
        
        total_turns = len(self.turns)
        user_turns = len([t for t in self.turns if t.role == "user"])
        
        parts = [
            f"Tổng cộng {total_turns} tin nhắn ({user_turns} từ user)",
            f"Phase: {self.conversation_phase.value}",
        ]
        
        # Recent intents
        recent_intents = [t.intent for t in self.turns[-5:] if t.intent]
        if recent_intents:
            parts.append(f"Recent intents: {recent_intents[-1]}")
        
        # Key entities
        key_entities = {}
        for entity_type, entities in self.entities.items():
            if entities:
                key_entities[entity_type] = entities[-1].canonical
        
        if key_entities:
            parts.append(f"Key info: {key_entities}")
        
        return " | ".join(parts)
    
    def clear(self):
        """Clear all conversation data"""
        self.turns = []
        self.current_turn_id = 0
        self.entities = {et: [] for et in CoreferenceResolver.TRACKABLE_ENTITIES}
        self.shared_context = {}
        self.summaries = []
        self.coreference_resolver.clear_history()


# Session memory management
_session_memories: Dict[str, EnhancedConversationMemory] = {}


def get_conversation_memory(session_id: str) -> EnhancedConversationMemory:
    """Get or create conversation memory for session"""
    if session_id not in _session_memories:
        _session_memories[session_id] = EnhancedConversationMemory(session_id)
    return _session_memories[session_id]


def clear_conversation_memory(session_id: str):
    """Clear conversation memory for session"""
    if session_id in _session_memories:
        _session_memories[session_id].clear()


def get_all_session_memories() -> List[str]:
    """Get list of active session IDs"""
    return list(_session_memories.keys())
