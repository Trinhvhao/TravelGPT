"""
Sentiment Analysis - Phân tích cảm xúc khách hàng
- Detect positive/negative/neutral sentiment
- Track sentiment over conversation
- Trigger escalation for negative sentiment
- Adjust bot response tone accordingly
"""
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import re


class SentimentLabel(str, Enum):
    """Sentiment labels"""
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"
    MIXED = "mixed"


class SentimentIntensity(str, Enum):
    """Sentiment intensity"""
    VERY_LOW = "very_low"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"


@dataclass
class SentimentResult:
    """Kết quả phân tích sentiment"""
    label: SentimentLabel
    intensity: SentimentIntensity
    score: float  # -1 to 1
    keywords: List[str]
    emotions: List[str]
    needs_escalation: bool
    suggested_tone: str  # empathetic, apologetic, enthusiastic, neutral


class SentimentAnalyzer:
    """
    Sentiment Analysis Engine cho tiếng Việt
    - Lexicon-based analysis
    - Keyword extraction
    - Emotion detection
    - Escalation triggers
    """
    
    # Positive words/phrases
    POSITIVE_WORDS = {
        # Strong positive
        "tuyệt vời": 0.9, "tuyệt": 0.9, "hoàn hảo": 0.9, "xuất sắc": 0.9,
        "wow": 0.9, " amazing": 0.9, "awesome": 0.9,
        
        # Medium positive
        "tốt": 0.6, "hay": 0.6, "đẹp": 0.6, "dễ thương": 0.6,
        "hài lòng": 0.7, "vừa ý": 0.6, "ưng ý": 0.7,
        "thích": 0.5, "thích thú": 0.7, "thú vị": 0.6,
        "ngon": 0.6, "ngon": 0.6, "hấp dẫn": 0.6,
        "nhanh": 0.5, "tiện lợi": 0.6, "chuyên nghiệp": 0.7,
        "thanks": 0.6, "cảm ơn": 0.5, "thank you": 0.6,
        
        # Light positive
        "ok": 0.3, "okay": 0.3, "được": 0.3, "ổn": 0.3,
        "khá": 0.4, "tạm được": 0.3, "cũng được": 0.3,
        
        # Emoji sentiment
        "😊": 0.7, "😃": 0.7, "😍": 0.9, "🥰": 0.9,
        "👍": 0.6, "❤️": 0.8, "💯": 0.8,
        "⭐": 0.6, "🌟": 0.7,
    }
    
    # Negative words/phrases
    NEGATIVE_WORDS = {
        # Strong negative
        "tệ": -0.9, "kinh khủng": -0.9, "thảm họa": -0.9,
        "horrible": -0.9, "terrible": -0.9, "worst": -0.9,
        "hối hận": -0.8, "vô vọng": -0.8, "bất lực": -0.8,
        
        # Medium negative
        "không hài lòng": -0.7, "chưa hài lòng": -0.6,
        "dở": -0.6, "tồi": -0.6, "kém": -0.6,
        "bực": -0.6, "tức": -0.6, "bực bội": -0.7,
        "thất vọng": -0.7, "chán": -0.5, "chán nản": -0.6,
        "mệt mỏi": -0.5, "mệt": -0.4, "khó chịu": -0.6,
        "rườm rà": -0.5, "phức tạp": -0.4, "chậm": -0.4,
        "đắt": -0.3, "mắc": -0.3, "cao": -0.2,
        
        # Light negative
        "không": -0.3, "chưa": -0.2, "chẳng": -0.3,
        "hơi": -0.2, "hơi bị": -0.4,
        
        # Emoji sentiment
        "😠": -0.7, "😡": -0.8, "😢": -0.6, "😭": -0.8,
        "😞": -0.7, "😔": -0.5, "😒": -0.5,
        "👎": -0.6,
    }
    
    # Negation words
    NEGATION_WORDS = {
        "không", "chưa", "chẳng", "đừng", "chớ",
        "không hề", "không có", "chưa từng", "đâu có"
    }
    
    # Intensifier words
    INTENSIFIERS = {
        "rất": 1.5, "cực": 1.8, "lắm": 1.4, "quá": 1.5,
        "vô cùng": 1.8, "vô số": 1.6, "hết sức": 1.7,
        "hơi": 0.7, "hơi bị": 1.2, "có vẻ": 0.8,
        "khá": 1.1, "tương đối": 0.9, "tàm tạm": 0.5,
    }
    
    # Emotion keywords
    EMOTION_KEYWORDS = {
        "happy": ["vui", "hạnh phúc", "mãn nguyện", "phấn khích", "excited"],
        "angry": ["giận", "tức", "bực", "nóng", "bực bội"],
        "sad": ["buồn", "thất vọng", "chán", "mệt mỏi", "mất phương hướng"],
        "anxious": ["lo", "lo lắng", "sợ", "băn khoăn", "hoang mang"],
        "confused": ["bối rối", "không hiểu", "rối", "lú", "mù mờ"],
        "surprised": ["bất ngờ", "ngạc nhiên", "shock", "wow", "không tin được"],
        "frustrated": ["thất vọng", "bực bội", "nản", "chán nản", "bế tắc"],
    }
    
    # Escalation triggers
    ESCALATION_KEYWORDS = {
        "complaint": ["khiếu nại", "phàn nàn", "kiện", "tố cáo", "report"],
        "refund": ["hoàn tiền", "hoàn lại", "bồi thường", "đòi tiền"],
        "manager": ["giám đốc", "quản lý", "sếp", "trưởng phòng"],
        "lawyer": ["luật sư", "pháp luật", "kiện", "tố"],
        "social": ["facebook", "twitter", "review", "đăng", "share"],
    }
    
    def __init__(self):
        self.conversation_sentiments: List[SentimentResult] = []
        self.negation_patterns = self._build_negation_patterns()
    
    def _build_negation_patterns(self) -> List[str]:
        """Build regex patterns for negation detection"""
        patterns = []
        for neg in self.NEGATION_WORDS:
            patterns.append(rf"\b{neg}\s+\w+")
        return patterns
    
    def analyze(self, message: str, context: Optional[Dict[str, Any]] = None) -> SentimentResult:
        """
        Phân tích sentiment của message
        """
        message_lower = message.lower()
        words = message_lower.split()
        
        # Calculate base sentiment
        sentiment_score = 0.0
        matched_keywords = []
        
        for word, score in {**self.POSITIVE_WORDS, **self.NEGATIVE_WORDS}.items():
            if word in message_lower:
                # Check for intensifiers
                intensity_multiplier = 1.0
                for intensifier, multiplier in self.INTENSIFIERS.items():
                    if intensifier in message_lower:
                        intensity_multiplier = multiplier
                        break
                
                # Check for negation
                negation_modifier = 1.0
                for pattern in self.negation_patterns:
                    if re.search(pattern, message_lower):
                        negation_modifier = -0.8
                        break
                
                adjusted_score = score * intensity_multiplier * negation_modifier
                sentiment_score += adjusted_score
                matched_keywords.append(word)
        
        # Detect emotions
        emotions = self._detect_emotions(message_lower)
        
        # Determine sentiment label and intensity
        label, intensity = self._classify_sentiment(sentiment_score, emotions)
        
        # Check for escalation triggers
        needs_escalation = self._check_escalation(message_lower)
        
        # Determine suggested tone
        suggested_tone = self._get_suggested_tone(label, intensity, needs_escalation)
        
        result = SentimentResult(
            label=label,
            intensity=intensity,
            score=round(sentiment_score, 3),
            keywords=matched_keywords,
            emotions=emotions,
            needs_escalation=needs_escalation,
            suggested_tone=suggested_tone
        )
        
        # Track in conversation
        self.conversation_sentiments.append(result)
        
        return result
    
    def _detect_emotions(self, message: str) -> List[str]:
        """Detect emotions in message"""
        detected = []
        
        for emotion, keywords in self.EMOTION_KEYWORDS.items():
            for keyword in keywords:
                if keyword in message:
                    if emotion not in detected:
                        detected.append(emotion)
                    break
        
        return detected
    
    def _classify_sentiment(
        self, 
        score: float, 
        emotions: List[str]
    ) -> Tuple[SentimentLabel, SentimentIntensity]:
        """Classify sentiment based on score and emotions"""
        # Base classification from score
        if score >= 1.0:
            label = SentimentLabel.POSITIVE
        elif score <= -1.0:
            label = SentimentLabel.NEGATIVE
        elif score >= -0.5 and score < 0.5:
            label = SentimentLabel.NEUTRAL
        else:
            label = SentimentLabel.MIXED
        
        # Check for emotional override
        if emotions:
            if any(e in ["angry", "sad", "frustrated"] for e in emotions):
                label = SentimentLabel.NEGATIVE
        
        # Determine intensity
        abs_score = abs(score)
        if abs_score < 0.5:
            intensity = SentimentIntensity.VERY_LOW if abs_score < 0.2 else SentimentIntensity.LOW
        elif abs_score < 1.5:
            intensity = SentimentIntensity.MEDIUM
        elif abs_score < 2.5:
            intensity = SentimentIntensity.HIGH
        else:
            intensity = SentimentIntensity.VERY_HIGH
        
        return label, intensity
    
    def _check_escalation(self, message: str) -> bool:
        """Check if message needs escalation"""
        # Check escalation keywords
        for category, keywords in self.ESCALATION_KEYWORDS.items():
            for keyword in keywords:
                if keyword in message:
                    return True
        
        # Check for very negative sentiment
        if len(self.conversation_sentiments) >= 2:
            recent_sentiments = self.conversation_sentiments[-2:]
            negative_count = sum(
                1 for s in recent_sentiments 
                if s.label == SentimentLabel.NEGATIVE and s.intensity in [
                    SentimentIntensity.HIGH, SentimentIntensity.VERY_HIGH
                ]
            )
            if negative_count >= 2:
                return True
        
        return False
    
    def _get_suggested_tone(
        self, 
        label: SentimentLabel, 
        intensity: SentimentIntensity,
        needs_escalation: bool
    ) -> str:
        """Get suggested bot tone based on sentiment"""
        if needs_escalation:
            return "apologetic"
        
        if label == SentimentLabel.NEGATIVE:
            if intensity in [SentimentIntensity.HIGH, SentimentIntensity.VERY_HIGH]:
                return "empathetic"
            return "apologetic"
        
        if label == SentimentLabel.POSITIVE:
            if intensity in [SentimentIntensity.HIGH, SentimentIntensity.VERY_HIGH]:
                return "enthusiastic"
            return "friendly"
        
        return "neutral"
    
    def get_conversation_sentiment_trend(self) -> Dict[str, Any]:
        """
        Get sentiment trend over the conversation
        """
        if not self.conversation_sentiments:
            return {
                "trend": "neutral",
                "average_score": 0.0,
                "negative_count": 0,
                "positive_count": 0,
                "needs_attention": False
            }
        
        scores = [s.score for s in self.conversation_sentiments]
        avg_score = sum(scores) / len(scores)
        
        negative_count = sum(1 for s in self.conversation_sentiments if s.label == SentimentLabel.NEGATIVE)
        positive_count = sum(1 for s in self.conversation_sentiments if s.label == SentimentLabel.POSITIVE)
        
        # Calculate trend
        if len(scores) >= 3:
            recent_avg = sum(scores[-3:]) / 3
            earlier_avg = sum(scores[:-3]) / (len(scores) - 3) if len(scores) > 3 else scores[0]
            
            if recent_avg > earlier_avg + 0.5:
                trend = "improving"
            elif recent_avg < earlier_avg - 0.5:
                trend = "declining"
            else:
                trend = "stable"
        else:
            trend = "stable"
        
        return {
            "trend": trend,
            "average_score": round(avg_score, 3),
            "negative_count": negative_count,
            "positive_count": positive_count,
            "neutral_count": len(scores) - negative_count - positive_count,
            "needs_attention": negative_count >= 2 or avg_score < -1.0
        }
    
    def should_adjust_response(self) -> bool:
        """Check if bot should adjust response tone"""
        if not self.conversation_sentiments:
            return False
        
        recent = self.conversation_sentiments[-1]
        
        # Adjust if very negative or needs escalation
        if recent.label == SentimentLabel.NEGATIVE and recent.intensity in [
            SentimentIntensity.HIGH, SentimentIntensity.VERY_HIGH
        ]:
            return True
        
        if recent.needs_escalation:
            return True
        
        return False
    
    def get_recommended_response_additions(self) -> Dict[str, Any]:
        """
        Get recommended additions to bot response based on sentiment
        """
        if not self.conversation_sentiments:
            return {"add_prefix": False, "prefix_text": "", "add_suffix": False, "suffix_text": ""}
        
        recent = self.conversation_sentiments[-1]
        trend = self.get_conversation_sentiment_trend()
        
        prefix = ""
        suffix = ""
        add_prefix = False
        add_suffix = False
        
        if recent.needs_escalation:
            add_prefix = True
            prefix = "Tôi rất xin lỗi vì trải nghiệm không tốt của bạn. "
            add_suffix = True
            suffix = " Tôi sẽ chuyển bạn đến bộ phận hỗ trợ để giải quyết vấn đề này ngay lập tức."
        
        elif recent.label == SentimentLabel.NEGATIVE:
            if recent.intensity in [SentimentIntensity.HIGH, SentimentIntensity.VERY_HIGH]:
                add_prefix = True
                prefix = "Tôi hiểu bạn đang không hài lòng. "
                add_suffix = True
                suffix = " Hãy cho tôi biết thêm để tôi có thể hỗ trợ bạn tốt hơn."
            elif recent.intensity == SentimentIntensity.MEDIUM:
                add_prefix = True
                prefix = "Tôi xin lỗi vì sự bất tiện này. "
        
        elif recent.label == SentimentLabel.POSITIVE and trend["trend"] == "improving":
            add_suffix = True
            suffix = " Rất vui khi bạn hài lòng! Có gì tôi có thể giúp thêm không?"
        
        return {
            "add_prefix": add_prefix,
            "prefix_text": prefix,
            "add_suffix": add_suffix,
            "suffix_text": suffix,
            "tone": recent.suggested_tone
        }
    
    def reset(self):
        """Reset sentiment tracker for new conversation"""
        self.conversation_sentiments = []


class ConversationSentimentTracker:
    """
    Track sentiment across multiple conversations
    - Per-user sentiment history
    - Session-based tracking
    """
    
    def __init__(self):
        self.user_trackers: Dict[str, SentimentAnalyzer] = {}
    
    def get_tracker(self, session_id: str) -> SentimentAnalyzer:
        """Get or create sentiment tracker for session"""
        if session_id not in self.user_trackers:
            self.user_trackers[session_id] = SentimentAnalyzer()
        return self.user_trackers[session_id]
    
    def analyze_message(
        self, 
        session_id: str, 
        message: str, 
        context: Optional[Dict[str, Any]] = None
    ) -> SentimentResult:
        """Analyze message sentiment for session"""
        tracker = self.get_tracker(session_id)
        return tracker.analyze(message, context)
    
    def get_session_trend(self, session_id: str) -> Dict[str, Any]:
        """Get sentiment trend for session"""
        if session_id in self.user_trackers:
            return self.user_trackers[session_id].get_conversation_sentiment_trend()
        return {"trend": "neutral", "needs_attention": False}
    
    def should_escalate(self, session_id: str) -> bool:
        """Check if session needs escalation"""
        if session_id in self.user_trackers:
            tracker = self.user_trackers[session_id]
            if tracker.conversation_sentiments:
                return tracker.conversation_sentiments[-1].needs_escalation
        return False
    
    def clear_session(self, session_id: str):
        """Clear sentiment tracker for session"""
        if session_id in self.user_trackers:
            self.user_trackers[session_id].reset()


# Global instance
sentiment_tracker = ConversationSentimentTracker()
