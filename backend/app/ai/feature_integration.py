"""
AI Feature Integration - Tích hợp tất cả các tính năng AI mới
- Sentiment Analysis
- Context-Aware Recommendations
- Enhanced Memory với Coreference Resolution
- Unified Agent Interface
"""
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime

from app.ai.sentiment import SentimentAnalyzer, SentimentResult, SentimentLabel, sentiment_tracker
from app.ai.context_recommender import ConversationAwareRecommender, recommender, UserPreference
from app.ai.enhanced_memory import (
    EnhancedConversationMemory, 
    CoreferenceResolver,
    ExtractedEntity,
    get_conversation_memory,
    ConversationPhase
)
from app.ai.intent import AdvancedIntentDetector


@dataclass
class AIAnalysisResult:
    """Kết quả phân tích AI tổng hợp"""
    original_message: str
    resolved_message: str
    intent: str
    entities: Dict[str, Any]
    sentiment: SentimentResult
    preferences: UserPreference
    context_summary: str
    needs_escalation: bool
    suggested_tone: str
    recommendation_context: Dict[str, Any]


class SmartAIAnalyzer:
    """
    Smart AI Analyzer - Tích hợp tất cả AI features
    """
    
    def __init__(self, session_id: str):
        self.session_id = session_id
        
        # Initialize components
        self.intent_detector = AdvancedIntentDetector()
        self.sentiment_analyzer = sentiment_tracker.get_tracker(session_id)
        self.memory = get_conversation_memory(session_id)
        self.recommender = recommender
    
    def analyze(
        self,
        user_id: str,
        message: str,
        context: Optional[Dict[str, Any]] = None
    ) -> AIAnalysisResult:
        """
        Phân tích message với tất cả AI features
        """
        # Step 1: Resolve coreferences first
        resolved_message, resolved_entities = self.memory.resolve_message(message)
        
        # Step 2: Detect intent với resolved message
        intent, entities = self.intent_detector.detect(resolved_message)
        
        # Step 3: Merge resolved entities
        for key, value in resolved_entities.items():
            if key not in entities or not entities[key]:
                entities[key] = value
        
        # Step 4: Analyze sentiment
        sentiment = self.sentiment_analyzer.analyze(
            resolved_message,
            {"intent": intent, "entities": entities}
        )
        
        # Step 5: Learn from conversation
        self.recommender.learn_from_conversation(
            user_id=user_id,
            session_id=self.session_id,
            message=message,
            intent=intent,
            params=entities
        )
        
        # Step 6: Add turn to memory
        extracted_entities = self._convert_to_extracted_entities(entities)
        self.memory.add_turn(
            role="user",
            content=message,
            intent=intent,
            entities=extracted_entities,
            sentiment_label=sentiment.label.value,
            sentiment_score=sentiment.score
        )
        
        # Step 7: Get context summary
        context_summary = self.memory.get_conversation_summary()
        recommendation_context = self.recommender.get_context_summary(self.session_id)
        
        # Step 8: Get preferences
        preferences = self.recommender.get_session_preference(self.session_id)
        
        return AIAnalysisResult(
            original_message=message,
            resolved_message=resolved_message,
            intent=intent,
            entities=entities,
            sentiment=sentiment,
            preferences=preferences,
            context_summary=context_summary,
            needs_escalation=sentiment.needs_escalation or self.sentiment_analyzer.should_adjust_response(),
            suggested_tone=sentiment.suggested_tone,
            recommendation_context=recommendation_context
        )
    
    def _convert_to_extracted_entities(self, entities: Dict[str, Any]) -> List[ExtractedEntity]:
        """Convert entities dict to ExtractedEntity list"""
        extracted = []
        
        entity_mapping = {
            "destination": "destination",
            "budget": "budget",
            "date": "date",
            "duration_days": "duration",
            "num_adults": "num_people",
            "name": "name",
            "email": "email",
            "phone": "phone",
            "tour_id": "tour_id"
        }
        
        for key, value in entities.items():
            if key in entity_mapping and value:
                extracted.append(ExtractedEntity(
                    type=entity_mapping[key],
                    value=value,
                    canonical=str(value),
                    source="explicit"
                ))
        
        return extracted
    
    def get_personalized_tours(
        self,
        user_id: str,
        tours: List[Dict[str, Any]],
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Get personalized tour recommendations"""
        return self.recommender.get_recommendations(
            user_id=user_id,
            session_id=self.session_id,
            tours=tours,
            limit=limit
        )
    
    def adjust_response(self, response: str) -> str:
        """
        Điều chỉnh response tone dựa trên sentiment
        """
        additions = self.sentiment_analyzer.get_recommended_response_additions()
        
        if not additions["add_prefix"] and not additions["add_suffix"]:
            return response
        
        adjusted = response
        
        if additions["add_prefix"]:
            adjusted = additions["prefix_text"] + adjusted
        
        if additions["add_suffix"]:
            adjusted = adjusted + "\n\n" + additions["suffix_text"]
        
        return adjusted
    
    def get_conversation_insights(self) -> Dict[str, Any]:
        """Get insights about the conversation"""
        return {
            "sentiment_trend": self.sentiment_analyzer.get_conversation_sentiment_trend(),
            "conversation_phase": self.memory.conversation_phase.value,
            "entities_collected": self.memory.get_last_entities(),
            "missing_info": self.memory.get_missing_info([
                "destination", "date", "num_people"
            ]),
            "followup_suggestions": self.recommender.get_followup_suggestions(
                self.session_id,
                self.memory.turns[-1].intent if self.memory.turns else "greeting"
            )
        }
    
    def add_assistant_message(self, message: str):
        """Add assistant response to memory"""
        last_intent = self.memory.turns[-1].intent if self.memory.turns else None
        self.memory.add_turn(
            role="assistant",
            content=message,
            intent=last_intent
        )
    
    def clear(self):
        """Clear all session data"""
        self.memory.clear()
        self.sentiment_analyzer.reset()


class EnhancedTravelAgent:
    """
    Enhanced Travel Agent với đầy đủ AI features
    """
    
    def __init__(self):
        self.analyzers: Dict[str, SmartAIAnalyzer] = {}
    
    def get_analyzer(self, session_id: str) -> SmartAIAnalyzer:
        """Get or create analyzer for session"""
        if session_id not in self.analyzers:
            self.analyzers[session_id] = SmartAIAnalyzer(session_id)
        return self.analyzers[session_id]
    
    def analyze_message(
        self,
        user_id: str,
        session_id: str,
        message: str,
        context: Optional[Dict[str, Any]] = None
    ) -> AIAnalysisResult:
        """Analyze message with all AI features"""
        analyzer = self.get_analyzer(session_id)
        return analyzer.analyze(user_id, message, context)
    
    def get_personalized_tours(
        self,
        user_id: str,
        session_id: str,
        tours: List[Dict[str, Any]],
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Get personalized recommendations"""
        analyzer = self.get_analyzer(session_id)
        return analyzer.get_personalized_tours(user_id, tours, limit)
    
    def adjust_bot_response(
        self,
        session_id: str,
        response: str
    ) -> str:
        """Adjust response based on sentiment"""
        analyzer = self.get_analyzer(session_id)
        return analyzer.adjust_response(response)
    
    def should_escalate(self, session_id: str) -> bool:
        """Check if session needs escalation"""
        if session_id in self.analyzers:
            return self.analyzers[session_id].sentiment_analyzer.should_adjust_response()
        return False
    
    def get_session_insights(self, session_id: str) -> Dict[str, Any]:
        """Get insights for session"""
        if session_id in self.analyzers:
            return self.analyzers[session_id].get_conversation_insights()
        return {}
    
    def add_response(self, session_id: str, message: str):
        """Add assistant response to memory"""
        if session_id in self.analyzers:
            self.analyzers[session_id].add_assistant_message(message)
    
    def clear_session(self, session_id: str):
        """Clear session data"""
        if session_id in self.analyzers:
            self.analyzers[session_id].clear()
            del self.analyzers[session_id]


# Global instance
enhanced_agent = EnhancedTravelAgent()
