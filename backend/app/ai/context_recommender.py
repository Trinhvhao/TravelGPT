"""
Enhanced Recommendation Engine - Kết hợp Context-Aware với Conversation Memory
- Personalized recommendations dựa trên conversation context
- Real-time preference learning từ cuộc trò chuyện
- Session-based recommendations
- Cross-session user preferences
"""
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime
import json
import re


@dataclass
class UserPreference:
    """Lưu trữ preferences của user"""
    preferred_destinations: List[str] = field(default_factory=list)
    preferred_regions: List[str] = field(default_factory=list)
    preferred_categories: List[str] = field(default_factory=list)
    budget_range: tuple = (0, 50000000)
    preferred_duration: tuple = (1, 7)
    travel_companion: str = "solo"
    preferred_season: List[str] = field(default_factory=list)
    previous_tours: List[str] = field(default_factory=list)
    interests: List[str] = field(default_factory=list)
    travel_style: List[str] = field(default_factory=list)  # luxury, budget, adventure, etc.
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "preferred_destinations": self.preferred_destinations,
            "preferred_regions": self.preferred_regions,
            "preferred_categories": self.preferred_categories,
            "budget_range": list(self.budget_range),
            "preferred_duration": list(self.preferred_duration),
            "travel_companion": self.travel_companion,
            "preferred_season": self.preferred_season,
            "previous_tours": self.previous_tours,
            "interests": self.interests,
            "travel_style": self.travel_style
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "UserPreference":
        pref = cls()
        for key, value in data.items():
            if hasattr(pref, key):
                if key in ["budget_range", "preferred_duration"]:
                    setattr(pref, key, tuple(value))
                else:
                    setattr(pref, key, value)
        return pref


class ConversationAwareRecommender:
    """
    Context-Aware Recommendation Engine
    - Sử dụng conversation context để personalize recommendations
    - Theo dõi implicit preferences từ user messages
    - Học từ tour interactions và bookings
    """
    
    # Map destinations to seasons
    DESTINATION_SEASONS = {
        "đà nẵng": ["spring", "summer", "autumn"],
        "nha trang": ["summer", "autumn"],
        "phú quốc": ["winter", "spring"],
        "sapa": ["autumn", "winter", "spring"],
        "hạ long": ["spring", "summer", "autumn"],
        "hội an": ["spring", "autumn", "winter"],
        "vũng tàu": ["summer", "autumn"],
        "quảng nam": ["spring", "autumn", "winter"]
    }
    
    # Interest keywords mapping
    INTEREST_KEYWORDS = {
        "beach": ["biển", "bãi biển", "tắm biển", "beach", "du lịch biển", "hải đảo", "đảo"],
        "mountain": ["núi", "leo núi", "trekking", "mountain", "sapa", "fansipan", "cao nguyên"],
        "culture": ["văn hóa", "lịch sử", "di tích", "cổ", "museum", "làng", "phố cổ", "đền", "chùa"],
        "food": ["ẩm thực", "món ngon", "đặc sản", "food", "ăn uống", "street food", "chợ", "nhà hàng"],
        "adventure": ["mạo hiểm", "khám phá", "adventure", "activity", "trải nghiệm", "lặn", "diving"],
        "nature": ["thiên nhiên", "cảnh đẹp", "nature", "phong cảnh", "non nước", "rừng", "thác"],
        "romantic": ["lãng mạn", "honeymoon", "couple", "2 người", "romantic", "cặp đôi"],
        "family": ["gia đình", "trẻ em", "family", "nhiều người", "ông bà", "an toàn"],
        "luxury": ["sang trọng", "luxury", "premium", "5 sao", "resort", "VIP"],
        "budget": ["tiết kiệm", "budget", "rẻ", "kinh tế", "giá rẻ", "tiết kiệm"],
        "wellness": ["spa", "wellness", "nghỉ dưỡng", "yoga", "massage", "thư giãn"],
        "nightlife": ["nightlife", "bar", "club", " disco", "phố đêm", "sôi động"]
    }
    
    def __init__(self):
        self.preference_store: Dict[str, UserPreference] = {}
        self.session_preferences: Dict[str, UserPreference] = {}
        self.conversation_contexts: Dict[str, List[Dict[str, Any]]] = {}
    
    def get_user_preference(self, user_id: str) -> UserPreference:
        """Lấy hoặc tạo preference cho user"""
        if user_id not in self.preference_store:
            self.preference_store[user_id] = UserPreference()
        return self.preference_store[user_id]
    
    def get_session_preference(self, session_id: str) -> UserPreference:
        """Lấy preference cho session hiện tại"""
        if session_id not in self.session_preferences:
            self.session_preferences[session_id] = UserPreference()
        return self.session_preferences[session_id]
    
    def learn_from_conversation(
        self, 
        user_id: str, 
        session_id: str,
        message: str, 
        intent: str, 
        params: Dict[str, Any],
        assistant_response: Optional[str] = None
    ):
        """Học từ cuộc trò chuyện để cập nhật preferences"""
        pref = self.get_session_preference(session_id)
        message_lower = message.lower()
        
        # Extract destinations
        destinations = ["đà nẵng", "nha trang", "phú quốc", "sapa", "hạ long", 
                       "hội an", "vũng tàu", "quảng nam", "hà nội", "tp hcm", 
                       "sài gòn", "huế", "quy nhơn", "côn đảng", "bình ba",
                       "cần thơ", "đà lạt", "phan thiết", "mũi né", "ninh bình"]
        
        for dest in destinations:
            if dest in message_lower and dest not in pref.preferred_destinations:
                pref.preferred_destinations.append(dest)
        
        # Extract interests
        for interest, keywords in self.INTEREST_KEYWORDS.items():
            for keyword in keywords:
                if keyword in message_lower:
                    if interest not in pref.interests:
                        pref.interests.append(interest)
                    break
        
        # Extract travel companion
        if any(kw in message_lower for kw in ["2 người", "cặp đôi", "vợ chồng", "yêu", "honeymoon", "người yêu"]):
            pref.travel_companion = "couple"
        elif any(kw in message_lower for kw in ["gia đình", "con cái", "bố mẹ", "ôm", "cả nhà"]):
            pref.travel_companion = "family"
        elif any(kw in message_lower for kw in ["nhóm", "bạn bè", "đoàn", "team"]):
            pref.travel_companion = "group"
        
        # Extract budget
        budget_match = re.search(r'(\d+)\s*(?:triệu|tr)', message_lower)
        if budget_match:
            budget_value = int(budget_match.group(1)) * 1000000
            pref.budget_range = (0, budget_value)
        
        # Extract duration
        duration_match = re.search(r'(\d+)\s*(?:ngày|day)', message_lower)
        if duration_match:
            duration = int(duration_match.group(1))
            pref.preferred_duration = (duration - 1, duration + 1) if duration > 1 else (1, 3)
        
        # Extract travel style
        if any(kw in message_lower for kw in ["sang trọng", "luxury", "premium", "5 sao", "đẳng cấp"]):
            if "luxury" not in pref.travel_style:
                pref.travel_style.append("luxury")
        if any(kw in message_lower for kw in ["tiết kiệm", "budget", "rẻ", "kinh tế"]):
            if "budget" not in pref.travel_style:
                pref.travel_style.append("budget")
        if any(kw in message_lower for kw in ["mạo hiểm", "adventure", "phượt", "khám phá"]):
            if "adventure" not in pref.travel_style:
                pref.travel_style.append("adventure")
        
        # Learn from intents
        if intent == "search_tour" and params.get("destination"):
            dest = params["destination"].lower()
            if dest not in pref.preferred_destinations:
                pref.preferred_destinations.append(dest)
        
        # Track conversation context
        self._add_conversation_context(session_id, {
            "timestamp": datetime.now().isoformat(),
            "intent": intent,
            "message": message,
            "params": params
        })
        
        # Save to persistent store if signed in
        if user_id != "anonymous":
            self.preference_store[user_id] = pref
    
    def _add_conversation_context(self, session_id: str, context: Dict[str, Any]):
        """Add to conversation context history"""
        if session_id not in self.conversation_contexts:
            self.conversation_contexts[session_id] = []
        
        self.conversation_contexts[session_id].append(context)
        
        # Keep last 20 context items
        if len(self.conversation_contexts[session_id]) > 20:
            self.conversation_contexts[session_id] = self.conversation_contexts[session_id][-20:]
    
    def get_conversation_context(self, session_id: str) -> List[Dict[str, Any]]:
        """Get conversation context for session"""
        return self.conversation_contexts.get(session_id, [])
    
    def get_context_summary(self, session_id: str) -> str:
        """Get a text summary of conversation context for AI"""
        context = self.get_conversation_context(session_id)
        if not context:
            return "Khách hàng mới, chưa có thông tin preferences."
        
        parts = []
        
        # Summarize destinations mentioned
        destinations = set()
        for ctx in context:
            params = ctx.get("params", {})
            if params.get("destination"):
                destinations.add(params["destination"])
        if destinations:
            parts.append(f"Điểm đến đã quan tâm: {', '.join(destinations)}")
        
        # Summarize intents
        intents = [ctx["intent"] for ctx in context[-5:] if ctx.get("intent")]
        if intents:
            parts.append(f"Đang quan tâm: {intents[-1]}")
        
        return " | ".join(parts) if parts else "Khách hàng đang tìm hiểu tour."
    
    def get_recommendations(
        self,
        user_id: str,
        session_id: str,
        tours: List[Dict[str, Any]],
        limit: int = 5,
        context: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Get personalized recommendations với context awareness
        """
        # Combine session and user preferences
        session_pref = self.get_session_preference(session_id)
        
        if user_id != "anonymous":
            user_pref = self.get_user_preference(user_id)
            # Merge preferences (session takes precedence)
            pref = self._merge_preferences(user_pref, session_pref)
        else:
            pref = session_pref
        
        scored_tours = []
        
        for tour in tours:
            score = self._calculate_relevance_score(tour, pref, context)
            
            # Exclude previously booked tours
            if tour.get("id") not in pref.previous_tours:
                scored_tours.append({
                    "tour": tour,
                    "score": score,
                    "reasons": self._get_recommendation_reasons(tour, pref, context)
                })
        
        # Sort by score descending
        scored_tours.sort(key=lambda x: x["score"], reverse=True)
        
        return [
            {
                **item["tour"],
                "recommendation_score": item["score"],
                "recommendation_reasons": item["reasons"],
                "personalized": True
            }
            for item in scored_tours[:limit]
        ]
    
    def _merge_preferences(self, user_pref: UserPreference, session_pref: UserPreference) -> UserPreference:
        """Merge user and session preferences"""
        merged = UserPreference()
        
        # Combine destinations (session first, then user)
        all_destinations = list(dict.fromkeys(session_pref.preferred_destinations + user_pref.preferred_destinations))
        merged.preferred_destinations = all_destinations[:10]
        
        # Other preferences from session (most recent)
        merged.preferred_regions = session_pref.preferred_regions or user_pref.preferred_regions
        merged.preferred_categories = session_pref.preferred_categories or user_pref.preferred_categories
        merged.budget_range = session_pref.budget_range if session_pref.budget_range != (0, 50000000) else user_pref.budget_range
        merged.preferred_duration = session_pref.preferred_duration if session_pref.preferred_duration != (1, 7) else user_pref.preferred_duration
        merged.travel_companion = session_pref.travel_companion if session_pref.travel_companion != "solo" else user_pref.travel_companion
        merged.interests = list(dict.fromkeys(session_pref.interests + user_pref.interests))[:10]
        merged.travel_style = list(dict.fromkeys(session_pref.travel_style + user_pref.travel_style))[:5]
        merged.previous_tours = user_pref.previous_tours
        
        return merged
    
    def _calculate_relevance_score(
        self, 
        tour: Dict[str, Any], 
        pref: UserPreference,
        context: Optional[Dict[str, Any]] = None
    ) -> float:
        """Tính điểm relevance với context awareness"""
        score = 0.0
        
        # Destination match (weighted highest)
        tour_destination = tour.get("destination", "").lower()
        
        # Check exact destination match
        if tour_destination in pref.preferred_destinations:
            score += 35
        elif any(dest in tour_destination or tour_destination in dest for dest in pref.preferred_destinations):
            score += 20  # Partial match
        
        # Region match
        tour_region = tour.get("region", "").lower()
        if tour_region in pref.preferred_regions:
            score += 15
        
        # Category match
        tour_category = tour.get("category", "").lower()
        if tour_category in pref.preferred_categories:
            score += 15
        
        # Budget match (penalize if over budget)
        tour_price = tour.get("discount_price") or tour.get("price", 0)
        min_budget, max_budget = pref.budget_range
        if min_budget <= tour_price <= max_budget:
            score += 25
        elif tour_price < min_budget:
            score += 15
        else:
            # Over budget - small penalty based on how much over
            overage_ratio = (tour_price - max_budget) / max_budget
            score += max(0, 10 - overage_ratio * 20)
        
        # Duration match
        tour_duration = tour.get("duration", 0)
        min_duration, max_duration = pref.preferred_duration
        if min_duration <= tour_duration <= max_duration:
            score += 15
        elif abs(tour_duration - (min_duration + max_duration) / 2) <= 1:
            score += 8
        
        # Interest match
        tour_tags = [t.lower() for t in tour.get("tags", [])]
        tour_desc = tour.get("description", "").lower()
        tour_highlights = " ".join(tour.get("highlights", [])).lower() if tour.get("highlights") else ""
        
        interest_matches = 0
        for interest in pref.interests:
            interest_keywords = self.INTEREST_KEYWORDS.get(interest, [])
            for keyword in interest_keywords:
                if keyword.lower() in tour_tags or keyword.lower() in tour_desc or keyword.lower() in tour_highlights:
                    score += 5
                    interest_matches += 1
                    break
        
        # Travel style match
        tour_name = tour.get("name", "").lower()
        tour_text = f"{tour_name} {tour_desc} {' '.join(tour_tags)}"
        
        for style in pref.travel_style:
            style_keywords = self.INTEREST_KEYWORDS.get(style, [])
            for keyword in style_keywords:
                if keyword.lower() in tour_text:
                    score += 8
                    break
        
        # Featured bonus
        if tour.get("is_featured"):
            score += 10
        
        # Rating bonus
        rating = tour.get("rating", 0)
        if rating >= 4.5:
            score += 12
        elif rating >= 4.0:
            score += 6
        
        # Season bonus
        current_month = datetime.now().month
        if 3 <= current_month <= 5:
            season = "spring"
        elif 6 <= current_month <= 8:
            season = "summer"
        elif 9 <= current_month <= 11:
            season = "autumn"
        else:
            season = "winter"
        
        if tour_destination in self.DESTINATION_SEASONS:
            if season in self.DESTINATION_SEASONS[tour_destination]:
                score += 5
        
        # Context-based boost (recent searches)
        if context:
            context_dest = context.get("searched_destination", "").lower()
            if context_dest == tour_destination:
                score += 15  # Boost for same destination as recent search
        
        return min(score, 120)  # Cap at 120
    
    def _get_recommendation_reasons(
        self, 
        tour: Dict[str, Any], 
        pref: UserPreference,
        context: Optional[Dict[str, Any]] = None
    ) -> List[str]:
        """Tạo danh sách lý do gợi ý"""
        reasons = []
        
        tour_destination = tour.get("destination", "").lower()
        
        # Check preference matches
        if tour_destination in pref.preferred_destinations:
            reasons.append("Điểm đến bạn yêu thích")
        
        # Featured badge
        if tour.get("is_featured"):
            reasons.append("Tour nổi bật")
        
        # Rating
        rating = tour.get("rating", 0)
        if rating >= 4.5:
            reasons.append(f"Đánh giá cao ({rating}⭐)")
        
        # Budget match
        tour_price = tour.get("discount_price") or tour.get("price", 0)
        min_budget, max_budget = pref.budget_range
        if tour_price <= max_budget:
            reasons.append("Phù hợp với ngân sách")
        
        # Interest match
        tour_tags = [t.lower() for t in tour.get("tags", [])]
        for interest in pref.interests[:2]:  # Max 2
            interest_keywords = self.INTEREST_KEYWORDS.get(interest, [])
            for keyword in interest_keywords:
                if keyword.lower() in tour_tags:
                    reason_map = {
                        "beach": "Trải nghiệm biển",
                        "mountain": "Khám phá núi",
                        "culture": "Văn hóa - Lịch sử",
                        "food": "Ẩm thực địa phương",
                        "adventure": "Phiêu lưu - Mạo hiểm",
                        "nature": "Thiên nhiên",
                        "romantic": "Lãng mạn",
                        "luxury": "Sang trọng - Đẳng cấp",
                        "budget": "Tiết kiệm - Kinh tế"
                    }
                    if interest in reason_map:
                        reasons.append(reason_map[interest])
                    break
        
        # Season match
        current_month = datetime.now().month
        if 3 <= current_month <= 5:
            season = "spring"
        elif 6 <= current_month <= 8:
            season = "summer"
        elif 9 <= current_month <= 11:
            season = "autumn"
        else:
            season = "winter"
        
        if tour_destination in self.DESTINATION_SEASONS:
            if season in self.DESTINATION_SEASONS[tour_destination]:
                season_names = {
                    "spring": "Mùa xuân",
                    "summer": "Mùa hè", 
                    "autumn": "Mùa thu",
                    "winter": "Mùa đông"
                }
                reasons.append(f"Thời điểm lý tưởng ({season_names.get(season, season)})")
        
        return reasons[:3]
    
    def get_followup_suggestions(self, session_id: str, current_intent: str) -> List[str]:
        """Get follow-up suggestions based on conversation"""
        suggestions = []
        pref = self.get_session_preference(session_id)
        
        if current_intent == "greeting":
            if pref.preferred_destinations:
                suggestions.append(f"Tour {pref.preferred_destinations[0].title()} có gì hay?")
            suggestions.extend([
                "Gợi ý tour cho tôi",
                "Tour nổi bật tháng này",
                "Tour biển hot nhất"
            ])
        
        elif current_intent == "search_tour":
            if pref.preferred_destinations:
                suggestions.append(f"Tour {pref.preferred_destinations[-1].title()} khác")
            if pref.budget_range[1] < 10000000:
                suggestions.append("Tour dưới 5 triệu")
            suggestions.extend([
                "Tour 3 ngày 2 đêm",
                "So sánh tour này với tour khác"
            ])
        
        elif current_intent == "get_tour_detail":
            suggestions.extend([
                "Đặt tour này",
                "Tour tương tự",
                "Xem tour cùng điểm đến"
            ])
        
        elif current_intent == "start_booking":
            suggestions.extend([
                "Hủy đặt tour",
                "Đổi ngày khởi hành",
                "Thay đổi số người"
            ])
        
        return suggestions[:5]
    
    def get_why_recommended(self, tour_id: str, user_id: str, session_id: str) -> str:
        """Generate explanation for why a tour is recommended"""
        pref = self.get_session_preference(session_id)
        context = self.get_conversation_context(session_id)
        
        parts = ["Dựa trên cuộc trò chuyện của bạn:"]
        
        if pref.preferred_destinations:
            parts.append(f"- Bạn đang quan tâm đến: {', '.join(pref.preferred_destinations[:3])}")
        
        if pref.interests:
            parts.append(f"- Sở thích: {', '.join(pref.interests[:3])}")
        
        if pref.budget_range[1] < 50000000:
            budget_millions = pref.budget_range[1] / 1000000
            parts.append(f"- Ngân sách: dưới {int(budget_millions)} triệu")
        
        if pref.travel_companion != "solo":
            companion_names = {
                "couple": "2 người",
                "family": "gia đình",
                "group": "nhóm bạn"
            }
            parts.append(f"- Đi cùng: {companion_names.get(pref.travel_companion, pref.travel_companion)}")
        
        return "\n".join(parts)
    
    def export_user_preferences(self, user_id: str) -> Dict[str, Any]:
        """Export preferences for user profile"""
        if user_id in self.preference_store:
            return self.preference_store[user_id].to_dict()
        return {}


# Global instance
recommender = ConversationAwareRecommender()
