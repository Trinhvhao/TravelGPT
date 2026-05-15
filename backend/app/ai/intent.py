"""
Intent Detection - Priority-based với phrase matching
Đảm bảo intent đúng cho user query
"""
from typing import Dict, Any, List, Tuple, Optional
from dataclasses import dataclass
import re


@dataclass
class IntentResult:
    """Kết quả intent detection"""
    intent: str
    confidence: float
    entities: Dict[str, Any]
    suggested_action: Optional[str] = None


class IntentDetector:
    """
    Intent Detection với 3-stage approach:
    1. Exact phrase matching (highest priority)
    2. Intent-specific patterns (ordered by priority)
    3. Entity-based inference (fallback)
    """

    # Exact phrase patterns - match whole phrase first
    PHRASE_PATTERNS: List[Tuple[str, str, List[str]]] = [
        # (phrase, intent, [required_keywords])
        ("xin chào", "greeting", ["xin chào"]),
        ("chào bạn", "greeting", ["chào"]),
        ("chào buổi", "greeting", ["chào buổi"]),
        ("tạm biệt", "goodbye", ["tạm biệt"]),
        ("cảm ơn", "goodbye", ["cảm ơn"]),
        ("đặt tour", "start_booking", ["đặt", "tour"]),
        ("đặt chỗ", "start_booking", ["đặt", "chỗ"]),
        ("hủy tour", "cancel_booking", ["hủy", "tour"]),
        ("hủy đơn", "cancel_booking", ["hủy", "đơn"]),
        ("chi tiết tour", "get_tour_detail", ["chi tiết", "tour"]),
        ("xem chi tiết", "get_tour_detail", ["xem", "chi tiết"]),
        ("mã booking", "check_booking", ["mã", "booking"]),
        ("trạng thái đơn", "check_booking", ["trạng thái", "đơn"]),
        ("so sánh tour", "compare_tour", ["so sánh", "tour"]),
        ("bạn là ai", "identity_question", ["bạn là ai"]),
        ("tra cứu tour", "search_tour", ["tra cứu", "tour"]),
        ("tìm kiếm tour", "search_tour", ["tìm kiếm", "tour"]),
        ("liệt kê tour", "list_all_tours", ["liệt kê", "tour"]),
        ("danh sách tour", "list_all_tours", ["danh sách", "tour"]),
        ("tất cả tour", "list_all_tours", ["tất cả", "tour"]),
        ("các tour", "list_all_tours", ["các tour"]),
        ("tour hiện tại", "list_all_tours", ["tour", "hiện tại"]),
        ("xem tất cả tour", "list_all_tours", ["xem", "tất cả", "tour"]),
        ("xem tour", "list_all_tours", ["xem", "tour"]),
        ("list all tours", "list_all_tours", ["list", "all", "tours"]),
        ("show all tours", "list_all_tours", ["show", "all", "tours"]),
    ]

    # Intent-specific patterns (ordered by priority)
    INTENT_PATTERNS: Dict[str, Dict[str, Any]] = {
        # Priority: lower number = higher priority
        "greeting": {
            "patterns": ["^xin chào", "chào bạn", "^hi\\b", "^hey\\b", "^alo\\b", "good morning", "good afternoon", "nice to meet"],
            "priority": 1,
            "weight": 1.0
        },
        "goodbye": {
            "patterns": ["tạm biệt", "^bye\\b", "^exit\\b", "kết thúc", "hẹn gặp lại"],
            "priority": 1,
            "weight": 1.0
        },
        "cancel_booking": {
            "patterns": ["hủy\\s*(tour|đơn|booking)", "cancel booking", "bỏ đặt", "không muốn đặt nữa"],
            "priority": 2,
            "weight": 1.0
        },
        "start_booking": {
            "patterns": ["đặt\\s*(tour|chỗ|vé)", "booking\\s*(tour|now)", "reserve", "đăng ký\\s*tour", "book\\s*now"],
            "priority": 3,
            "weight": 1.0
        },
        "check_booking": {
            "patterns": ["mã\\s*(booking|đơn)", "trạng thái\\s*(booking|đơn)", "xem\\s*(đơn|booking)", "booking\\s*code", "order\\s*status"],
            "priority": 4,
            "weight": 0.9
        },
        "modify_booking": {
            "patterns": ["đổi\\s*(ngày|lịch|tour)", "thay đổi\\s*(booking|đơn)", "update\\s*booking", "sửa\\s*(đơn|booking)", "đổi sang tour khác"],
            "priority": 5,
            "weight": 0.9
        },
        "refund": {
            "patterns": ["hoàn\\s*(tiền|lại)", "refund", "trả lại tiền"],
            "priority": 6,
            "weight": 1.0
        },
        "list_all_tours": {
            "patterns": [
                "liệt kê\\s*tour", "danh\\s*sách\\s*tour", "tất cả\\s*tour", "tất cả các",
                "xem\\s*tất\\s*cả", "xem\\s*tour", "các\\s*tour", "hiện\\s*tour\\s*có",
                "show\\s*all", "list\\s*all", "all\\s*tours", "list\\s*tour", "all\\s*tour",
                "show\\s*tour", "hiện\\s*tại\\s*tour", "cần xem tour", "muốn xem tour"
            ],
            "priority": 10,
            "weight": 1.0
        },
        "search_tour": {
            "patterns": ["tìm\\s*tour", "tìm\\s*kiếm", "gợi ý\\s*tour", "đề xuất\\s*tour", "có\\s*tour\\s*nào", "muốn\\s*đi", "du lịch", "check\\s*tour", "recommend"],
            "priority": 11,
            "weight": 1.0
        },
        "get_tour_detail": {
            "patterns": ["chi tiết", "thông tin\\s*(chi tiết|tour)", "xem\\s*thêm", "mô tả\\s*tour", "lịch trình", "hành trình", "itinerary"],
            "priority": 12,
            "weight": 0.9
        },
        "price_inquiry": {
            "patterns": ["giá\\s*(bao nhiêu|nào|ả)", "bao nhiêu\\s*tiền", "giá\\s*tour", "price", "chi phí", "tiền\\s*nào"],
            "priority": 15,
            "weight": 0.8
        },
        "compare_tour": {
            "patterns": ["so sánh", "compare", "tốt hơn", "nên chọn", "đi hay", "which\\s*(is\\s*)?better"],
            "priority": 16,
            "weight": 1.0
        },
        "availability": {
            "patterns": ["còn\\s*(chỗ|slot)", "full\\s*chưa", "available", "đặt\\s*được\\s*không", "có\\s*còn\\s*không"],
            "priority": 17,
            "weight": 0.9
        },
        "payment": {
            "patterns": ["thanh toán", "payment", "chuyển khoản", "visa", "mastercard", "paypal", "vnpay"],
            "priority": 20,
            "weight": 0.9
        },
        "complaint": {
            "patterns": ["khiếu nại", "phàn nàn", "complaint", "không hài lòng", "tệ quá", "dở quá", "problem"],
            "priority": 25,
            "weight": 1.0
        },
        "identity_question": {
            "patterns": ["bạn là\\s*(ai|gì)", "who\\s*are\\s*you", "what\\s*are\\s*you", "bạn được\\s*tạo\\s*bởi"],
            "priority": 30,
            "weight": 1.0
        },
        "help": {
            "patterns": ["trợ giúp", "hỗ trợ", "giúp\\s*tôi", "help\\b", "\\?\\?\\?", "làm sao", "cách\\s*nào"],
            "priority": 35,
            "weight": 0.9
        },
        "small_talk": {
            "patterns": ["bạn khỏe\\s*không", "thời tiết\\s*(thế nào|nào)", "how\\s*are\\s*you", "you\\s*are"],
            "priority": 40,
            "weight": 0.8
        },
        "provide_booking_info": {
            "patterns": ["tên\\s*(là|tôi)", "email\\s*(là|:)", "số\\s*(điện thoại|dt)", "ngày\\s*sinh", "số\\s*người"],
            "priority": 45,
            "weight": 0.8
        },
    }

    # Entity patterns
    DESTINATIONS = [
        "đà nẵng", "da nang", "hội an", "hoi an", "nha trang", "nhatrang",
        "phú quốc", "phu quoc", "sài gòn", "saigon", "hồ chí minh", "hcm",
        "hà nội", "hanoi", "hạ long", "ha long", "sapa", "sa pa",
        "vũng tàu", "vung tau", "quảng nam", "quang nam", "huế", "hue",
        "quy nhơn", "quy nhon", "côn đảng", "con dong", "bình ba", "binh ba",
        "cần thơ", "can tho", "đà lạt", "da lat", "phan thiết", "phan thiet",
        "mũi né", "mui ne", "ninh bình", "ninh binh", "tràng an", "trang an"
    ]

    REGIONS = [
        "miền bắc", "mien bac", "miền nam", "mien nam", "miền trung", "mien trung",
        "bắc", "nam", "trung"
    ]

    CATEGORIES = [
        "biển", "bãi biển", "núi", "rừng", "thành phố", "city", "nature",
        "văn hóa", "lịch sử", "ẩm thực", "food", "adventure", "phiêu lưu",
        "mạo hiểm", "nghỉ dưỡng", "spa", "family", "gia đình"
    ]

    # Intent actions
    INTENT_ACTIONS = {
        "greeting": "welcome_user",
        "goodbye": "end_conversation",
        "search_tour": "search_and_display_tours",
        "list_all_tours": "display_all_tours",
        "get_tour_detail": "fetch_tour_details",
        "start_booking": "initiate_booking_flow",
        "provide_booking_info": "collect_booking_info",
        "cancel_booking": "show_cancellation_info",
        "check_booking": "lookup_booking",
        "modify_booking": "show_modification_options",
        "payment": "process_payment",
        "refund": "process_refund",
        "complaint": "escalate_to_support",
        "compare_tour": "compare_tours",
        "price_inquiry": "show_price_details",
        "availability": "check_availability",
        "help": "show_help_options",
        "identity_question": "introduce_self",
        "small_talk": "casual_conversation",
    }

    def __init__(self):
        self.last_intent: Optional[str] = None
        self.conversation_context: Dict[str, Any] = {}

    def detect(self, message: str, context: Optional[Dict[str, Any]] = None) -> Tuple[str, Dict[str, Any]]:
        """
        Main detection method - 3 stage approach
        """
        message_lower = message.lower().strip()
        original_message = message

        # Stage 1: Exact phrase matching
        intent = self._match_exact_phrase(message_lower)
        if intent:
            self.last_intent = intent
            entities = self._extract_entities(original_message, message_lower)
            entities["intent"] = intent
            entities["confidence"] = 0.95
            entities["suggested_action"] = self.INTENT_ACTIONS.get(intent)
            return intent, entities

        # Stage 2: Pattern-based classification (by priority)
        intent, confidence = self._classify_by_patterns(message_lower)
        
        # Stage 3: Context-aware refinement
        refined_intent = self._refine_with_context(intent, message_lower, context)

        # Extract entities
        entities = self._extract_entities(original_message, message_lower)

        self.last_intent = refined_intent
        entities["intent"] = refined_intent
        entities["confidence"] = confidence
        entities["suggested_action"] = self.INTENT_ACTIONS.get(refined_intent)

        return refined_intent, entities

    def _match_exact_phrase(self, message: str) -> Optional[str]:
        """Stage 1: Match exact phrases first"""
        for phrase, intent, required_keywords in self.PHRASE_PATTERNS:
            if phrase in message:
                # Check all required keywords exist
                if all(kw in message for kw in required_keywords):
                    return intent
        return None

    def _classify_by_patterns(self, message: str) -> Tuple[str, float]:
        """Stage 2: Classify by patterns ordered by priority"""
        matches = []

        for intent, config in self.INTENT_PATTERNS.items():
            patterns = config["patterns"]
            priority = config["priority"]
            weight = config["weight"]

            for pattern in patterns:
                if re.search(pattern, message, re.IGNORECASE):
                    matches.append({
                        "intent": intent,
                        "priority": priority,
                        "weight": weight,
                        "pattern": pattern
                    })
                    break  # Only count first match per intent

        if not matches:
            return "general_question", 0.3

        # Sort by priority (lower = higher priority), then by weight
        matches.sort(key=lambda x: (x["priority"], -x["weight"]))

        best_match = matches[0]
        confidence = min(best_match["weight"] * 0.8 + 0.2, 1.0)

        return best_match["intent"], confidence

    def _refine_with_context(
        self,
        intent: str,
        message: str,
        context: Optional[Dict[str, Any]]
    ) -> str:
        """Stage 3: Refine intent using conversation context"""
        
        # If we have strong booking context
        if context:
            last_intent = context.get("last_intent")
            
            # User providing info after starting booking
            if last_intent in ("start_booking", "provide_booking_info"):
                if self._is_providing_info(message):
                    return "provide_booking_info"

            # User wants to continue searching after viewing tour
            if last_intent == "get_tour_detail":
                if any(kw in message for kw in ["đặt", "book", "mua"]):
                    return "start_booking"

        # Entity-based inference for general questions
        if intent == "general_question":
            has_destination = any(dest in message for dest in self.DESTINATIONS)
            has_budget = re.search(r'\d+\s*(triệu|tr)', message)
            has_duration = re.search(r'\d+\s*(ngày|đêm)', message)

            if has_destination or has_budget or has_duration:
                return "search_tour"

        return intent

    def _is_providing_info(self, message: str) -> bool:
        """Check if user is providing personal info"""
        info_patterns = [
            r'tên\s*(là|:|\s+[A-Z])',
            r'email',
            r'số\s*(điện thoại|dt|phone)',
            r'\d{9,11}',  # Phone number
            r'[\w\.-]+@[\w\.-]+\.\w+',  # Email
        ]
        return any(re.search(p, message, re.IGNORECASE) for p in info_patterns)

    def _extract_entities(self, original: str, message: str) -> Dict[str, Any]:
        """Extract named entities"""
        entities = {}

        # Destinations
        for dest in self.DESTINATIONS:
            if dest in message:
                entities["destination"] = self._normalize_destination(dest)
                break

        # Regions
        for region in self.REGIONS:
            if region in message:
                entities["region"] = self._normalize_region(region)
                break

        # Categories
        for cat in self.CATEGORIES:
            if cat in message:
                entities["category"] = cat
                break

        # Budget
        budget_match = re.search(r'(\d+(?:[.,]\d+)?)\s*(triệu|tr|m)?', message)
        if budget_match:
            value = float(budget_match.group(1).replace(',', '.'))
            unit = budget_match.group(2) or ""
            if unit in ("triệu", "tr", "m"):
                value *= 1_000_000
            elif unit == "jt":
                value *= 1_000
            entities["budget"] = int(value)

        # Duration
        days_match = re.search(r'(\d+)\s*(?:ngày|day)', message)
        if days_match:
            entities["duration_days"] = int(days_match.group(1))

        nights_match = re.search(r'(\d+)\s*(?:đêm|đêm)', message)
        if nights_match:
            entities["duration_nights"] = int(nights_match.group(1))

        # Number of people
        adults_match = re.search(r'(\d+)\s*(?:người lớn|adults?|người)', message)
        if adults_match:
            entities["num_adults"] = int(adults_match.group(1))

        children_match = re.search(r'(\d+)\s*(?:trẻ em|children|kids)', message)
        if children_match:
            entities["num_children"] = int(children_match.group(1))

        # Date extraction
        date_patterns = [
            (r'(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})', 3),
            (r'(\d{1,2})[/\-.](\d{1,2})', 2),
            (r'ngày\s*(\d{1,2})', 1),
        ]

        for pattern, groups in date_patterns:
            match = re.search(pattern, message)
            if match:
                if groups == 3:
                    entities["date"] = f"{match.group(1)}/{match.group(2)}/{match.group(3)}"
                elif groups == 2:
                    entities["date"] = f"{match.group(1)}/{match.group(2)}"
                else:
                    entities["day"] = int(match.group(1))
                break

        # Month
        month_match = re.search(r'(?:tháng|mùa)\s*(\d{1,2})', message)
        if month_match:
            entities["month"] = int(month_match.group(1))

        # Name
        name_patterns = [
            r'(?:tên|tôi là|name is)\s*[:\s]*([A-Za-zÀ-ỹ\s]{2,30})',
            r'^([A-ZÀ-Ỹ][a-zà-ỹ\s]{2,20})(?:\s|,|$)',
        ]
        for pattern in name_patterns:
            name_match = re.search(pattern, message, re.IGNORECASE)
            if name_match:
                name = name_match.group(1).strip()
                if name.lower() not in ("tôi", "bạn", "tên", "mình", "đây"):
                    entities["name"] = name.title()
                    break

        # Email
        email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', message)
        if email_match:
            entities["email"] = email_match.group(0).lower()

        # Phone
        phone_match = re.search(r'(?:sdt|phone|mobile)?[:\s]*(\d{9,11})', message)
        if phone_match:
            entities["phone"] = phone_match.group(1)

        # Booking code
        booking_match = re.search(r'(?:mã|code|ref|#)\s*[:\s]*([A-Z0-9\-]{4,20})', message, re.IGNORECASE)
        if booking_match:
            entities["booking_code"] = booking_match.group(1).upper()

        # Price range
        min_price_match = re.search(r'(?:từ|trên|from)\s*(\d+)\s*(?:triệu|tr)', message)
        if min_price_match:
            entities["min_price"] = int(min_price_match.group(1)) * 1_000_000

        max_price_match = re.search(r'(?:đến|dưới|tối đa|under|to)\s*(\d+)\s*(?:triệu|tr)', message)
        if max_price_match:
            entities["max_price"] = int(max_price_match.group(1)) * 1_000_000

        # Rating
        star_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:sao|star)', message)
        if star_match:
            entities["min_rating"] = float(star_match.group(1))

        # Travel companion
        companion_map = {
            "solo": ["một mình", "solo", "tự túc", "1 người"],
            "couple": ["2 người", "cặp đôi", "vợ chồng", "honeymoon"],
            "family": ["gia đình", "con cái", "bố mẹ", "ôm"],
            "group": ["nhóm", "bạn bè", "đoàn", "team", "nhiều người"]
        }
        for companion, patterns in companion_map.items():
            if any(p in message for p in patterns):
                entities["travel_companion"] = companion
                break

        return entities

    def _normalize_destination(self, dest: str) -> str:
        """Normalize destination names"""
        normalize_map = {
            "da nang": "Đà Nẵng",
            "hoi an": "Hội An",
            "nhatrang": "Nha Trang",
            "phu quoc": "Phú Quốc",
            "saigon": "Sài Gòn",
            "hcm": "Hồ Chí Minh",
            "hanoi": "Hà Nội",
            "ha long": "Hạ Long",
            "sa pa": "Sapa",
            "vung tau": "Vũng Tàu",
            "quang nam": "Quảng Nam",
            "hue": "Huế",
            "quy nhon": "Quy Nhơn",
            "da lat": "Đà Lạt",
            "phan thiet": "Phan Thiết",
            "mui ne": "Mũi Né",
            "ninh binh": "Ninh Bình",
            "trang an": "Tràng An",
            "can tho": "Cần Thơ"
        }
        return normalize_map.get(dest.lower(), dest.title())

    def _normalize_region(self, region: str) -> str:
        """Normalize region names"""
        region_map = {
            "miền bắc": "Miền Bắc", "mien bac": "Miền Bắc", "bắc": "Miền Bắc",
            "miền nam": "Miền Nam", "mien nam": "Miền Nam", "nam": "Miền Nam",
            "miền trung": "Miền Trung", "mien trung": "Miền Trung", "trung": "Miền Trung"
        }
        return region_map.get(region.lower(), region.title())

    def detect_multiple(self, message: str) -> List[IntentResult]:
        """Return multiple possible intents with confidence scores"""
        message_lower = message.lower()
        results = []

        for intent, config in self.INTENT_PATTERNS.items():
            for pattern in config["patterns"]:
                if re.search(pattern, message_lower, re.IGNORECASE):
                    results.append(IntentResult(
                        intent=intent,
                        confidence=config["weight"] * 0.8,
                        entities={},
                        suggested_action=self.INTENT_ACTIONS.get(intent)
                    ))
                    break

        results.sort(key=lambda x: x.confidence, reverse=True)
        return results[:3]


# Backward compatibility
AdvancedIntentDetector = IntentDetector
IntentClassifier = IntentDetector
