"""
Personalized Recommendation Engine - Gợi ý tour thông minh dựa trên user preferences
"""
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from datetime import datetime, date
import json


@dataclass
class UserPreference:
    """Lưu trữ preferences của user"""
    preferred_destinations: List[str] = None
    preferred_regions: List[str] = None
    preferred_categories: List[str] = None
    budget_range: tuple = (0, 50000000)  # min, max
    preferred_duration: tuple = (1, 7)  # min, max days
    travel_companion: str = "solo"  # solo, couple, family, group
    preferred_season: List[str] = None
    previous_tours: List[str] = None
    interests: List[str] = None
    
    def __post_init__(self):
        if self.preferred_destinations is None:
            self.preferred_destinations = []
        if self.preferred_regions is None:
            self.preferred_regions = []
        if self.preferred_categories is None:
            self.preferred_categories = []
        if self.preferred_season is None:
            self.preferred_season = []
        if self.previous_tours is None:
            self.previous_tours = []
        if self.interests is None:
            self.interests = []
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "preferred_destinations": self.preferred_destinations,
            "preferred_regions": self.preferred_regions,
            "preferred_categories": self.preferred_categories,
            "budget_range": self.budget_range,
            "preferred_duration": self.preferred_duration,
            "travel_companion": self.travel_companion,
            "preferred_season": self.preferred_season,
            "previous_tours": self.previous_tours,
            "interests": self.interests
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "UserPreference":
        pref = cls()
        for key, value in data.items():
            if hasattr(pref, key):
                setattr(pref, key, value)
        return pref


class RecommendationEngine:
    """
    Personalized Recommendation Engine
    - Gợi ý tour dựa trên lịch sử và preferences
    - Seasonal suggestions
    - Budget-based recommendations
    - Similar tours
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
    
    # Map companion type to group size
    COMPANION_SIZE = {
        "solo": (1, 1),
        "couple": (2, 2),
        "family": (2, 6),
        "group": (5, 20)
    }
    
    # Interest keywords mapping
    INTEREST_KEYWORDS = {
        "beach": ["biển", "bãi biển", "tắm biển", "beach", "du lịch biển"],
        "mountain": ["núi", "leo núi", " Trekking", "mountain", "sapa", " Fansipan"],
        "culture": ["văn hóa", "lịch sử", "di tích", "cổ", "museum", "làng"],
        "food": ["ẩm thực", "món ngon", "đặc sản", "food", "ăn uống", "street food"],
        "adventure": ["mạo hiểm", "khám phá", "adventure", "activity", "trải nghiệm"],
        "nature": ["thiên nhiên", "cảnh đẹp", "nature", "phong cảnh", "non nước"],
        "romantic": ["lãng mạn", "honeymoon", "couple", "2 người", "romantic"],
        "family": ["gia đình", "trẻ em", "family", "nhiều người"]
    }
    
    def __init__(self):
        self.preference_store: Dict[str, UserPreference] = {}
    
    def get_user_preference(self, user_id: str) -> UserPreference:
        """Lấy hoặc tạo preference cho user"""
        if user_id not in self.preference_store:
            self.preference_store[user_id] = UserPreference()
        return self.preference_store[user_id]
    
    def update_preference(self, user_id: str, preference: UserPreference):
        """Cập nhật preference cho user"""
        self.preference_store[user_id] = preference
    
    def learn_from_conversation(self, user_id: str, message: str, intent: str, params: Dict[str, Any]):
        """Học từ cuộc trò chuyện để cập nhật preferences"""
        pref = self.get_user_preference(user_id)
        message_lower = message.lower()
        
        # Extract destinations
        destinations = ["đà nẵng", "nha trang", "phú quốc", "sapa", "hạ long", 
                       "hội an", "vũng tàu", "quảng nam", "hà nội", "tp hcm", 
                       "sài gòn", "huế", "quy nhơn", "côn đảng"]
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
        if any(kw in message_lower for kw in ["2 người", "cặp đôi", "vợ chồng", "yêu", "honeymoon"]):
            pref.travel_companion = "couple"
        elif any(kw in message_lower for kw in ["gia đình", "con cái", "bố mẹ", "ôm"]):
            pref.travel_companion = "family"
        elif any(kw in message_lower for kw in ["nhóm", "bạn bè", "đoàn"]):
            pref.travel_companion = "group"
        
        # Extract budget
        import re
        budget_match = re.search(r'(\d+)\s*(?:triệu|tr)', message_lower)
        if budget_match:
            budget_value = int(budget_match.group(1)) * 1000000
            pref.budget_range = (0, budget_value)
        
        # Extract duration
        duration_match = re.search(r'(\d+)\s*(?:ngày|day)', message_lower)
        if duration_match:
            duration = int(duration_match.group(1))
            pref.preferred_duration = (duration - 1, duration + 1) if duration > 1 else (1, 3)
        
        # Learn from intents
        if intent == "search_tour" and params.get("destination"):
            if params["destination"].lower() not in pref.preferred_destinations:
                pref.preferred_destinations.append(params["destination"].lower())
        
        self.update_preference(user_id, pref)
    
    def get_personalized_recommendations(
        self,
        user_id: str,
        tours: List[Dict[str, Any]],
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Gợi ý tour personalized cho user"""
        if user_id == "anonymous":
            return tours[:limit]
        
        pref = self.get_user_preference(user_id)
        scored_tours = []
        
        for tour in tours:
            score = self._calculate_relevance_score(tour, pref)
            
            # Exclude previously booked tours
            if tour.get("id") not in pref.previous_tours:
                scored_tours.append({
                    "tour": tour,
                    "score": score,
                    "reasons": self._get_recommendation_reasons(tour, pref)
                })
        
        # Sort by score descending
        scored_tours.sort(key=lambda x: x["score"], reverse=True)
        
        return [
            {
                **item["tour"],
                "recommendation_score": item["score"],
                "recommendation_reasons": item["reasons"]
            }
            for item in scored_tours[:limit]
        ]
    
    def _calculate_relevance_score(self, tour: Dict[str, Any], pref: UserPreference) -> float:
        """Tính điểm relevance của tour cho user"""
        score = 0.0
        
        # Destination match
        tour_destination = tour.get("destination", "").lower()
        if tour_destination in pref.preferred_destinations:
            score += 30
        
        # Region match
        tour_region = tour.get("region", "").lower()
        if tour_region in pref.preferred_regions:
            score += 20
        
        # Category match
        tour_category = tour.get("category", "").lower()
        if tour_category in pref.preferred_categories:
            score += 15
        
        # Budget match
        tour_price = tour.get("discount_price") or tour.get("price", 0)
        min_budget, max_budget = pref.budget_range
        if min_budget <= tour_price <= max_budget:
            score += 20
        elif tour_price < min_budget:
            score += 10  # Under budget is still ok
        
        # Duration match
        tour_duration = tour.get("duration", 0)
        min_duration, max_duration = pref.preferred_duration
        if min_duration <= tour_duration <= max_duration:
            score += 15
        elif abs(tour_duration - (min_duration + max_duration) / 2) <= 1:
            score += 10
        
        # Interest match
        tour_tags = [t.lower() for t in tour.get("tags", [])]
        tour_desc = tour.get("description", "").lower()
        tour_highlights = " ".join(tour.get("highlights", [])).lower()
        
        for interest in pref.interests:
            interest_keywords = self.INTEREST_KEYWORDS.get(interest, [])
            for keyword in interest_keywords:
                if keyword.lower() in tour_tags or keyword.lower() in tour_desc or keyword.lower() in tour_highlights:
                    score += 5
                    break
        
        # Featured bonus
        if tour.get("is_featured"):
            score += 10
        
        # Rating bonus
        rating = tour.get("rating", 0)
        if rating >= 4.5:
            score += 10
        elif rating >= 4.0:
            score += 5
        
        return min(score, 100)  # Cap at 100
    
    def _get_recommendation_reasons(self, tour: Dict[str, Any], pref: UserPreference) -> List[str]:
        """Tạo danh sách lý do gợi ý"""
        reasons = []
        
        tour_destination = tour.get("destination", "").lower()
        if tour_destination in pref.preferred_destinations:
            reasons.append(f"Điểm đến bạn yêu thích")
        
        if tour.get("is_featured"):
            reasons.append("Tour nổi bật")
        
        rating = tour.get("rating", 0)
        if rating >= 4.5:
            reasons.append(f"Đánh giá cao ({rating}⭐)")
        
        tour_price = tour.get("discount_price") or tour.get("price", 0)
        min_budget, max_budget = pref.budget_range
        if tour_price <= max_budget:
            reasons.append("Phù hợp với ngân sách")
        
        # Check interest match
        tour_tags = [t.lower() for t in tour.get("tags", [])]
        for interest in pref.interests:
            interest_keywords = self.INTEREST_KEYWORDS.get(interest, [])
            for keyword in interest_keywords:
                if keyword.lower() in tour_tags:
                    reason_map = {
                        "beach": "Trải nghiệm biển",
                        "mountain": "Khám phá núi",
                        "culture": "Văn hóa - Lịch sử",
                        "food": "Ẩm thực địa phương",
                        "adventure": "Phiêu lưu - Mạo hiểm",
                        "nature": "Thiên nhiên"
                    }
                    if interest in reason_map:
                        reasons.append(reason_map[interest])
                    break
        
        return reasons[:3]  # Max 3 reasons
    
    def get_seasonal_recommendations(self, tours: List[Dict[str, Any]], limit: int = 5) -> List[Dict[str, Any]]:
        """Gợi ý theo mùa hiện tại"""
        current_month = datetime.now().month
        
        # Determine current season
        if 3 <= current_month <= 5:
            current_season = "spring"
        elif 6 <= current_month <= 8:
            current_season = "summer"
        elif 9 <= current_month <= 11:
            current_season = "autumn"
        else:
            current_season = "winter"
        
        seasonal_tours = []
        
        for tour in tours:
            tour_destination = tour.get("destination", "").lower()
            seasons = self.DESTINATION_SEASONS.get(tour_destination, [])
            
            if current_season in seasons:
                seasonal_tours.append({
                    **tour,
                    "seasonal_reason": self._get_seasonal_reason(tour_destination, current_season)
                })
        
        # Sort by rating
        seasonal_tours.sort(key=lambda x: x.get("rating", 0), reverse=True)
        
        return seasonal_tours[:limit]
    
    def _get_seasonal_reason(self, destination: str, season: str) -> str:
        """Tạo lý do theo mùa"""
        reasons = {
            "spring": {
                "đà nẵng": "🌸 Mùa xuân - Thời tiết dễ chịu, lý tưởng tham quan",
                "sapa": "🌸 Mùa hoa ban nở rộ tháng 3-4",
                "hạ long": "🌸 Mùa xuân - Hang động đẹp nhất năm"
            },
            "summer": {
                "nha trang": "☀️ Mùa hè - Thời tiết lý tưởng cho tắm biển",
                "phú quốc": "☀️ Mùa hè - Bãi biển đẹp nhất",
                "vũng tàu": "☀️ Mùa hè - Kỳ nghỉ biển hoàn hảo"
            },
            "autumn": {
                "hội an": "🍂 Mùa thu - Phố cổ thơ mộng lung linh",
                "đà nẵng": "🍂 Mùa thu - Thời tiết mát mẻ lý tưởng",
                "hà nội": "🍂 Mùa thu - Trời thu Hà Nội lãng mạn"
            },
            "winter": {
                "phú quốc": "❄️ Mùa đông - Tránh rét, tận hưởng biển",
                "sapa": "❄️ Mùa đông - Ngắm tuyết rơi lãng mạn"
            }
        }
        
        return reasons.get(season, {}).get(destination, "Thời tiết lý tưởng để du lịch")
    
    def get_budget_recommendations(
        self,
        tours: List[Dict[str, Any]],
        budget: float,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Gợi ý tour theo ngân sách"""
        budget_tours = []
        
        for tour in tours:
            tour_price = tour.get("discount_price") or tour.get("price", 0)
            
            # Trong ngân sách
            if tour_price <= budget:
                budget_tours.append({
                    **tour,
                    "budget_status": "within_budget",
                    "savings": budget - tour_price
                })
            # Vượt ngân sách nhưng gần
            elif tour_price <= budget * 1.2:
                budget_tours.append({
                    **tour,
                    "budget_status": "over_budget",
                    "overage": tour_price - budget
                })
        
        # Sort by: within budget first, then by savings/overage
        budget_tours.sort(key=lambda x: (
            x.get("budget_status") == "over_budget",
            x.get("savings", 0) if x.get("budget_status") == "within_budget" else x.get("overage", float('inf'))
        ))
        
        return budget_tours[:limit]
    
    def get_similar_tours(
        self,
        current_tour: Dict[str, Any],
        all_tours: List[Dict[str, Any]],
        limit: int = 4
    ) -> List[Dict[str, Any]]:
        """Gợi ý tour tương tự"""
        similar = []
        
        current_destination = current_tour.get("destination", "").lower()
        current_region = current_tour.get("region", "").lower()
        current_category = current_tour.get("category", "").lower()
        current_duration = current_tour.get("duration", 0)
        
        for tour in all_tours:
            if tour.get("id") == current_tour.get("id"):
                continue
            
            similarity_score = 0
            
            # Same destination
            if tour.get("destination", "").lower() == current_destination:
                similarity_score += 30
            
            # Same region
            if tour.get("region", "").lower() == current_region:
                similarity_score += 20
            
            # Same category
            if tour.get("category", "").lower() == current_category:
                similarity_score += 20
            
            # Similar duration (±1 day)
            if abs(tour.get("duration", 0) - current_duration) <= 1:
                similarity_score += 15
            
            # Similar price range (±20%)
            current_price = current_tour.get("discount_price") or current_tour.get("price", 0)
            tour_price = tour.get("discount_price") or tour.get("price", 0)
            if current_price > 0 and tour_price > 0:
                if abs(tour_price - current_price) / current_price <= 0.2:
                    similarity_score += 15
            
            if similarity_score >= 25:
                similar.append({
                    **tour,
                    "similarity_score": similarity_score
                })
        
        # Sort by similarity
        similar.sort(key=lambda x: x["similarity_score"], reverse=True)
        
        return similar[:limit]
    
    def get_travel_companion_suggestions(
        self,
        companion_type: str,
        tours: List[Dict[str, Any]],
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Gợi ý tour phù hợp với loại companion"""
        companion_keywords = {
            "solo": ["1 người", "đi một mình", "solo", "tự túc"],
            "couple": ["2 người", "cặp đôi", "vợ chồng", "honeymoon", "lãng mạn"],
            "family": ["gia đình", "trẻ em", "family", "nhiều người", "đoàn tụ"],
            "group": ["nhóm", "bạn bè", "đoàn", "team building"]
        }
        
        keywords = companion_keywords.get(companion_type, [])
        
        matched_tours = []
        
        for tour in tours:
            tour_tags = " ".join([str(t).lower() for t in tour.get("tags", [])])
            tour_desc = tour.get("description", "").lower()
            tour_name = tour.get("name", "").lower()
            tour_text = f"{tour_name} {tour_desc} {tour_tags}"
            
            # Check for companion-specific keywords
            is_match = False
            match_reason = None
            
            for keyword in keywords:
                if keyword.lower() in tour_text:
                    is_match = True
                    match_reason = f"Phù hợp cho {companion_type}"
                    break
            
            # Also match based on duration and max participants
            min_size, max_size = self.COMPANION_SIZE.get(companion_type, (1, 10))
            tour_max = tour.get("max_participants", 100)
            
            if tour_max >= min_size:
                matched_tours.append({
                    **tour,
                    "companion_match": is_match,
                    "companion_reason": match_reason or f"Linh hoạt cho {min_size}-{min(10, tour_max)} người"
                })
        
        # Sort: companion-matched first, then by rating
        matched_tours.sort(key=lambda x: (x.get("companion_match", False), x.get("rating", 0)), reverse=True)
        
        return matched_tours[:limit]
    
    def get_trending_recommendations(self, tours: List[Dict[str, Any]], limit: int = 5) -> List[Dict[str, Any]]:
        """Gợi ý tour thịnh hành (dựa trên booking count và rating)"""
        trending = []
        
        for tour in tours:
            # Calculate trending score
            booking_count = tour.get("booking_count", 0)  # Giả sử có field này
            rating = tour.get("rating", 0)
            review_count = tour.get("review_count", 0)
            
            trending_score = (rating * 20) + (min(booking_count, 100) * 0.5) + (min(review_count, 50) * 0.2)
            
            trending.append({
                **tour,
                "trending_score": trending_score
            })
        
        trending.sort(key=lambda x: x["trending_score"], reverse=True)
        
        return trending[:limit]
    
    def get_conversation_suggestions(
        self,
        user_id: str,
        intent: str,
        context: Dict[str, Any]
    ) -> List[str]:
        """Tạo suggestions dựa trên context cuộc trò chuyện"""
        suggestions = []
        
        pref = self.get_user_preference(user_id)
        
        if intent == "greeting":
            suggestions.extend([
                "Liệt kê các tour du lịch hiện tại",
                "Tìm tour biển cho gia đình",
                "Gợi ý điểm du lịch mùa hè"
            ])
        
        elif intent in ("list_all_tours", "search_tour"):
            suggestions.extend([
                "Tour Đà Nẵng giá bao nhiêu?",
                "Đặt tour Phú Quốc cuối tuần",
                "Tour nổi bật tháng này"
            ])
            if pref.preferred_destinations:
                suggestions.append(f"Gợi ý tour {pref.preferred_destinations[-1].title()}")
        
        elif intent == "start_booking":
            # Start booking - guide next steps
            suggestions.extend([
                "Xem lại thông tin đặt tour",
                "Chọn ngày khởi hành khác",
                "Liên hệ hỗ trợ"
            ])
        
        elif intent == "get_tour_detail":
            # View tour detail - suggest actions
            suggestions.extend([
                "Đặt tour này ngay",
                "So sánh với tour khác",
                "Xem tour tương tự"
            ])
        
        elif intent == "general_question":
            # General - common actions
            suggestions.extend([
                "Top tour được yêu thích nhất",
                "Gợi ý tour theo ngân sách",
                "Tour phù hợp cho gia đình"
            ])
        
        elif intent == "price_inquiry":
            suggestions.extend([
                "Tour dưới 5 triệu có không?",
                "So sánh giá tour biển",
                "Tour tiết kiệm nhất"
            ])
        
        elif intent == "availability":
            suggestions.extend([
                "Tour nào còn chỗ cuối tuần này?",
                "Đặt tour cho nhóm 5 người",
                "Ngày khởi hành gần nhất"
            ])
        
        # If no suggestions, provide default ones
        if not suggestions:
            suggestions = [
                "Tìm tour phù hợp ngân sách",
                "Đặt tour Đà Nẵng",
                "Gợi ý tour biển"
            ]
        
        return suggestions[:4]  # Max 4 suggestions
