"""
TravelGPT AI Agent - Core Agent with Full Feature Set
Phase 1 + Phase 2: Smart Booking, Recommendations, Multi-turn, Pre/Post-trip
With LangGraph + Mem0 integration

PRODUCTION FIXES:
- Uses production LLM client with timeout, retry, circuit breaker
- Session management via Redis (production) with TTL
- Proper error handling and logging
- Web search integration for travel sites (Traveloka, Booking, Viator)
- Internal tour DB for booking data
"""
from typing import List, Dict, Any, Optional
import logging
from datetime import datetime

from app.core.config import get_settings
from app.core.llm_client import get_llm_client, LLMClient, LLMCircuitOpenError, LLMTimeoutError
from app.ai.conversation import ConversationMemory, session_manager, SYSTEM_PROMPT, TravelMemory
from app.ai.intent import AdvancedIntentDetector
from app.ai.booking_flow import SmartBookingFlow, BookingStep, PriceCalculator
from app.ai.recommendation import RecommendationEngine
from app.ai.multi_turn import MultiTurnConversationManager, get_conversation_manager
from app.ai.trip_support import TripAssistant
from app.ai.cancellation import CancellationFlow, RescheduleFlow, CancellationStep, RescheduleStep
from app.ai.state import AgentState, create_initial_state
# langgraph is optional — imported lazily in chat_v2() and graph.py
from app.services.web_search_service import get_web_search_service, WebSearchService

logger = logging.getLogger(__name__)
settings = get_settings()


class TravelAgent:
    """
    TravelGPT AI Agent - Full-featured agent
    Phase 1: Intent Detection, Smart Booking, Recommendations
    Phase 2: Multi-turn Conversation, Pre/Post-trip, Cancellation/Reschedule
    Phase 3: Web Search Integration for external travel sites

    PRODUCTION: Uses external LLM client with circuit breaker and session Redis.
    """

    def __init__(self, db, llm_client: Optional[LLMClient] = None):
        self.db = db
        # Use production LLM client with timeout, retry, circuit breaker
        self.llm = llm_client or get_llm_client()

        # Core components
        self.intent_detector = AdvancedIntentDetector()
        self.recommendation_engine = RecommendationEngine()

        # Session-based stores - migrated to Redis in production
        # See: app/core/session.py for Redis-backed session management
        self._local_memories: Dict[str, ConversationMemory] = {}
        self._local_booking_flows: Dict[str, SmartBookingFlow] = {}
        self._local_cancellation_flows: Dict[str, CancellationFlow] = {}
        self._local_reschedule_flows: Dict[str, RescheduleFlow] = {}
        self._local_multi_turn_managers: Dict[str, MultiTurnConversationManager] = {}

        # Web search service for external travel sites
        self.web_search = get_web_search_service()

        # Trip assistant
        self.trip_assistant = TripAssistant()

        # Mem0 memory - uses fallback if no API key
        self.memory = TravelMemory.get_instance(
            api_key=settings.mem0_api_key,
            host=settings.mem0_host
        )
    
    def get_memory(self, session_id: str) -> ConversationMemory:
        if session_id not in self._local_memories:
            self._local_memories[session_id] = ConversationMemory()
        return self._local_memories[session_id]
    
    def get_booking_flow(self, session_id: str) -> SmartBookingFlow:
        if session_id not in self._local_booking_flows:
            self._local_booking_flows[session_id] = SmartBookingFlow()
        return self._local_booking_flows[session_id]
    
    def get_multi_turn_manager(self, session_id: str) -> MultiTurnConversationManager:
        if session_id not in self._local_multi_turn_managers:
            self._local_multi_turn_managers[session_id] = get_conversation_manager(session_id)
        return self._local_multi_turn_managers[session_id]
    
    def get_cancellation_flow(self, session_id: str) -> CancellationFlow:
        if session_id not in self._local_cancellation_flows:
            self._local_cancellation_flows[session_id] = CancellationFlow()
        return self._local_cancellation_flows[session_id]

    def get_reschedule_flow(self, session_id: str) -> RescheduleFlow:
        if session_id not in self._local_reschedule_flows:
            self._local_reschedule_flows[session_id] = RescheduleFlow()
        return self._local_reschedule_flows[session_id]

    async def search_external_travel(
        self,
        query: str,
        location: Optional[str] = None,
        search_types: Optional[List[str]] = None
    ) -> str:
        """
        Search external travel websites (Traveloka, Booking, Viator).
        Returns formatted results for display.
        """
        try:
            results = await self.web_search.search_multi(
                query=query,
                location=location,
                search_types=search_types or ["traveloka", "viator", "booking"]
            )

            all_results = []
            for site, site_results in results.items():
                all_results.extend(site_results)

            return self.web_search.format_results(all_results)

        except Exception as e:
            logger.error(f"Web search error: {e}")
            return f"Không thể tìm kiếm web: {str(e)}"

    async def search_traveloka(self, query: str, location: Optional[str] = None) -> str:
        """Search Traveloka only."""
        try:
            results = await self.web_search.search_traveloka(query, location)
            return self.web_search.format_results(results)
        except Exception as e:
            logger.error(f"Traveloka search error: {e}")
            return f"Không thể tìm kiếm Traveloka: {str(e)}"

    async def search_booking(self, query: str, location: Optional[str] = None) -> str:
        """Search Booking.com only."""
        try:
            results = await self.web_search.search_booking(query, location)
            return self.web_search.format_results(results)
        except Exception as e:
            logger.error(f"Booking.com search error: {e}")
            return f"Không thể tìm kiếm Booking.com: {str(e)}"

    async def search_viator(self, query: str, location: Optional[str] = None) -> str:
        """Search Viator only."""
        try:
            results = await self.web_search.search_viator(query, location)
            return self.web_search.format_results(results)
        except Exception as e:
            logger.error(f"Viator search error: {e}")
            return f"Không thể tìm kiếm Viator: {str(e)}"
        if session_id not in self.reschedule_flows:
            self.reschedule_flows[session_id] = RescheduleFlow()
        return self.reschedule_flows[session_id]
    
    async def chat(
        self, 
        user_id: str, 
        session_id: str, 
        message: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Main chat method"""
        
        memory = self.get_memory(session_id)
        booking_flow = self.get_booking_flow(session_id)
        multi_turn = self.get_multi_turn_manager(session_id)
        
        # Detect intent
        intent, extracted_params = self.intent_detector.detect(message)
        
        # Start multi-turn tracking
        turn_id = multi_turn.start_turn(message, intent, extracted_params)
        
        # Check active flows first
        response = None
        response_metadata = {}
        
        if booking_flow.is_active and intent not in ["cancel_booking", "goodbye"]:
            response, response_metadata = await self._handle_booking_flow(
                user_id, session_id, message, intent, extracted_params, booking_flow, memory
            )
        
        elif intent == "cancel_booking":
            response, response_metadata = await self._handle_cancel_flow(
                user_id, session_id, message, extracted_params, memory
            )
        
        elif intent == "modify_booking":
            # Check if it's cancel or reschedule
            message_lower = message.lower()
            if any(kw in message_lower for kw in ["đổi ngày", "chuyển ngày", "đổi lịch"]):
                response, response_metadata = await self._handle_reschedule_flow(
                    user_id, session_id, message, extracted_params, memory
                )
            else:
                response, response_metadata = await self._handle_modify(
                    user_id, session_id, message, extracted_params, memory
                )
        
        elif intent == "start_booking":
            response, response_metadata = await self._handle_start_booking(
                session_id, message, intent, extracted_params, memory
            )

        elif intent == "web_search":
            response, response_metadata = await self._handle_web_search(
                session_id, message, extracted_params, memory
            )

        else:
            # General conversation with multi-turn support
            response, response_metadata = await self._handle_general(
                user_id, session_id, message, intent, extracted_params, memory, multi_turn
            )
        
        # Complete the turn
        multi_turn.complete_turn(turn_id, response, response_metadata)
        
        # Learn preferences
        self.recommendation_engine.learn_from_conversation(user_id, message, intent, extracted_params)
        
        # Generate suggestions
        suggestions = self._get_suggestions(intent, extracted_params, user_id)
        
        return {
            "response": response,
            "intent": intent,
            "params": extracted_params,
            "suggestions": suggestions,
            **response_metadata
        }
    
    async def chat_v2(
        self,
        user_id: str,
        session_id: str,
        message: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Chat v2 - LangGraph + Mem0 enhanced version
        
        This method uses LangGraph for workflow management
        and Mem0 for long-term memory
        """
        from app.ai.graph import get_agent_graph
        
        # Create initial state
        initial_state = create_initial_state(user_id, session_id, message)
        
        # Get or create graph
        graph = get_agent_graph()
        
        # Run the graph
        try:
            result = await graph.ainvoke(initial_state)
        except Exception as e:
            print(f"Graph execution error: {e}")
            # Fallback to regular chat
            return await self.chat(user_id, session_id, message, context)
        
        # Get response
        response = result.get("response", "")
        intent = result.get("intent", "")
        entities = result.get("entities", {})
        
        # If no response from graph, fallback to regular flow
        if not response:
            return await self.chat(user_id, session_id, message, context)
        
        # Save to Mem0
        self.memory.add_interaction(
            user_id=user_id,
            user_message=message,
            assistant_response=response,
            metadata={
                "session_id": session_id,
                "intent": intent,
                "entities": entities
            }
        )
        
        # Learn preferences
        self.recommendation_engine.learn_from_conversation(
            user_id, message, intent, entities
        )
        
        # Generate suggestions
        suggestions = self._get_suggestions(intent, entities, user_id)
        
        return {
            "response": response,
            "intent": intent,
            "params": entities,
            "suggestions": suggestions or result.get("suggestions", []),
            "memory_context": result.get("memory_context", "")
        }
    
    async def chat_with_memory(
        self,
        user_id: str,
        session_id: str,
        message: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Chat with Mem0 memory enhancement
        
        Enhanced version of chat() that retrieves and uses
        long-term memory from Mem0 for personalization
        """
        # Retrieve memory context
        memory_context = self.memory.search(message, user_id, top_k=3)
        
        # Detect intent
        intent, extracted_params = self.intent_detector.detect(message)
        
        # Get conversation memory
        memory = self.get_memory(session_id)
        
        # Check active booking flow
        booking_flow = self.get_booking_flow(session_id)
        
        # Process based on active flows (same as regular chat)
        response = None
        response_metadata = {}
        
        if booking_flow.is_active and intent not in ["cancel_booking", "goodbye"]:
            response, response_metadata = await self._handle_booking_flow(
                user_id, session_id, message, intent, extracted_params, booking_flow, memory
            )
        elif intent == "cancel_booking":
            response, response_metadata = await self._handle_cancel_flow(
                user_id, session_id, message, extracted_params, memory
            )
        elif intent == "modify_booking":
            message_lower = message.lower()
            if any(kw in message_lower for kw in ["đổi ngày", "chuyển ngày", "đổi lịch"]):
                response, response_metadata = await self._handle_reschedule_flow(
                    user_id, session_id, message, extracted_params, memory
                )
            else:
                response, response_metadata = await self._handle_modify(
                    user_id, session_id, message, extracted_params, memory
                )
        elif intent == "start_booking":
            response, response_metadata = await self._handle_start_booking(
                session_id, message, intent, extracted_params, memory
            )
        else:
            response, response_metadata = await self._handle_general(
                user_id, session_id, message, intent, extracted_params, memory, None
            )
        
        # Save interaction to Mem0
        if response:
            self.memory.add_interaction(
                user_id=user_id,
                user_message=message,
                assistant_response=response,
                metadata={
                    "session_id": session_id,
                    "intent": intent
                }
            )
        
        # Learn preferences
        self.recommendation_engine.learn_from_conversation(
            user_id, message, intent, extracted_params
        )
        
        # Generate suggestions
        suggestions = self._get_suggestions(intent, extracted_params, user_id)
        
        return {
            "response": response or "",
            "intent": intent,
            "params": extracted_params,
            "suggestions": suggestions,
            "memory_context": memory_context,
            **response_metadata
        }
    
    async def _handle_booking_flow(
        self, user_id, session_id, message, intent, params, booking_flow, memory
    ) -> tuple:
        """Handle active booking flow"""
        booking_result = booking_flow.process_message(message, intent, params)
        
        if booking_result.get("ready_to_book"):
            booking_response = await self._create_booking_from_flow(user_id, booking_flow)
            if booking_response.get("success"):
                booking_flow.complete_booking(booking_response["booking_code"])
                
                # Generate pre-trip info
                pre_trip = self.trip_assistant.get_trip_assistant_message(
                    action="countdown",
                    booking_code=booking_response["booking_code"],
                    tour_name=booking_flow.booking_data.tour_name or "Tour của bạn",
                    destination="",
                    departure_date=datetime.now(),
                    return_date=datetime.now()
                )
                
                response = f"{booking_response['message']}\n\n{pre_trip}"
                
                return response, {
                    "booking_code": booking_response["booking_code"],
                    "booking_flow_complete": True,
                    "booking_step": "success"
                }
        
        memory.add_message("user", message, intent=intent, entities=params)
        memory.add_message("assistant", booking_result["message"], intent=intent)
        
        suggestions = self._get_booking_suggestions(booking_flow.current_step)
        
        return booking_result["message"], {
            "booking_flow_active": True,
            "booking_step": booking_flow.current_step.value,
            "booking_data": booking_result.get("booking_data"),
            "suggestions": suggestions
        }
    
    async def _handle_cancel_flow(
        self, user_id, session_id, message, params, memory
    ) -> tuple:
        """Handle cancellation flow"""
        cancel_flow = self.get_cancellation_flow(session_id)
        
        # Check if booking code is provided
        booking_code = params.get("booking_code")
        
        if not cancel_flow.is_active:
            # Start cancellation flow
            if booking_code:
                # Verify booking
                booking = await self._get_booking(booking_code, user_id)
                if booking:
                    booking_data = self._booking_to_dict(booking)
                    result = cancel_flow.start_flow(booking_code, booking_data)
                    verify_result = cancel_flow.verify_booking(booking_code, booking_data)
                    
                    return verify_result.get("message", result.get("message")), {
                        "cancellation_flow_active": True,
                        "cancellation_step": cancel_flow.current_step.value
                    }
                else:
                    return f"Không tìm thấy booking: {booking_code}", {}
            else:
                cancel_flow.start_flow()
                return "Bạn cho tôi biết mã booking cần hủy nhé!", {
                    "cancellation_flow_active": True,
                    "cancellation_step": "init"
                }
        
        # Process cancellation flow
        message_lower = message.lower()
        
        if cancel_flow.current_step == CancellationStep.CONFIRM_CANCELLATION:
            # User needs to confirm
            if any(kw in message_lower for kw in ["đúng", "xác nhận", "hủy", "yes", "y"]):
                # Check if reason is selected
                if not cancel_flow.cancellation_data.reason:
                    reasons = "\n".join([f"{i+1}. {r}" for i, r in enumerate(cancel_flow.CANCELLATION_REASONS[:5])])
                    return f"Vui lòng chọn lý do hủy:\n{reasons}\n\n(Reply số để chọn)", {}
                
                result = cancel_flow.confirm_cancellation(True)
                if result.get("ready_to_process"):
                    result = cancel_flow.process_cancellation()
                    return result["message"], {
                        "cancellation_flow_complete": True,
                        "cancellation_step": "success"
                    }
            else:
                cancel_flow.confirm_cancellation(False)
                return "Đã hủy yêu cầu hủy booking. Bạn cần hỗ trợ gì khác?", {
                    "cancellation_flow_active": False
                }
        
        # Check if user is selecting reason
        for i, reason in enumerate(cancel_flow.CANCELLATION_REASONS):
            if str(i+1) in message or reason.lower() in message_lower:
                result = cancel_flow.select_reason(reason)
                return result.get("message", ""), {
                    "cancellation_flow_active": True,
                    "cancellation_step": cancel_flow.current_step.value
                }
        
        return cancel_flow._build_verification_message(), {
            "cancellation_flow_active": True,
            "cancellation_step": cancel_flow.current_step.value
        }
    
    async def _handle_reschedule_flow(
        self, user_id, session_id, message, params, memory
    ) -> tuple:
        """Handle reschedule flow"""
        reschedule_flow = self.get_reschedule_flow(session_id)
        
        booking_code = params.get("booking_code")
        
        if not reschedule_flow.is_active:
            if booking_code:
                booking = await self._get_booking(booking_code, user_id)
                if booking:
                    booking_data = self._booking_to_dict(booking)
                    result = reschedule_flow.start_flow(booking_code, booking_data)
                    eligibility = reschedule_flow.check_eligibility()
                    
                    if eligibility.get("eligible"):
                        available_dates = reschedule_flow.get_available_dates(booking.tourId)
                        
                        message_text = eligibility.get("message", "") + "\n\n"
                        if available_dates:
                            message_text += "### 📅 Ngày có sẵn:\n"
                            for d in available_dates[:5]:
                                message_text += f"- {d['date_display']} ({d['day_of_week']})\n"
                        
                        return message_text, {
                            "reschedule_flow_active": True,
                            "reschedule_step": reschedule_flow.current_step.value,
                            "available_dates": available_dates[:5]
                        }
                    else:
                        return eligibility.get("error", "Không thể đổi lịch"), {}
                else:
                    return f"Không tìm thấy booking: {booking_code}", {}
            else:
                reschedule_flow.start_flow()
                return "Bạn cho tôi biết mã booking cần đổi lịch nhé!", {
                    "reschedule_flow_active": True,
                    "reschedule_step": "init"
                }
        
        # Process reschedule flow
        if reschedule_flow.current_step == RescheduleStep.SELECT_NEW_DATE:
            # Try to extract date from message
            date_match = self._extract_date(message)
            if date_match:
                result = reschedule_flow.set_new_date(date_match)
                if result.get("available"):
                    return result["message"], {
                        "reschedule_flow_active": True,
                        "reschedule_step": reschedule_flow.current_step.value
                    }
                elif result.get("error"):
                    return result["error"], {
                        "reschedule_flow_active": True,
                        "reschedule_step": reschedule_flow.current_step.value
                    }
            else:
                available_dates = reschedule_flow.get_available_dates("")
                if available_dates:
                    lines = ["Vui lòng chọn ngày hoặc nhập ngày (DD/MM/YYYY):\n"]
                    for i, d in enumerate(available_dates[:5]):
                        lines.append(f"{i+1}. {d['date_display']} ({d['day_of_week']})")
                    return "\n".join(lines), {
                        "reschedule_flow_active": True,
                        "reschedule_step": reschedule_flow.current_step.value
                    }
        
        elif reschedule_flow.current_step == RescheduleStep.CONFIRM_RESCHEDULE:
            message_lower = message.lower()
            if any(kw in message_lower for kw in ["đúng", "xác nhận", "đổi", "yes", "y"]):
                result = reschedule_flow.confirm_reschedule(True)
                if result.get("ready_to_process"):
                    result = reschedule_flow.process_reschedule()
                    return result["message"], {
                        "reschedule_flow_complete": True,
                        "reschedule_step": "success"
                    }
            else:
                reschedule_flow.confirm_reschedule(False)
                return "Đã hủy yêu cầu đổi lịch.", {
                    "reschedule_flow_active": False
                }
        
        return "Tôi đang chờ bạn chọn ngày mới...", {
            "reschedule_flow_active": True,
            "reschedule_step": reschedule_flow.current_step.value
        }
    
    async def _handle_modify(
        self, user_id, session_id, message, params, memory
    ) -> tuple:
        """Handle general modify requests"""
        booking_code = params.get("booking_code")
        
        if booking_code:
            booking = await self._get_booking(booking_code, user_id)
            if booking:
                return f"""## 📝 CHỈNH SỬA BOOKING: {booking_code}

**Tour:** {booking.tour.name if booking.tour else 'N/A'}

Bạn muốn thay đổi gì?

1. 📅 Đổi ngày khởi hành
2. 👥 Thay đổi số người
3. 📞 Cập nhật thông tin liên hệ
4. 📝 Yêu cầu đặc biệt

Reply số hoặc nói rõ yêu cầu của bạn.""", {}
        
        return "Bạn cho tôi biết mã booking để chỉnh sửa nhé!", {}
    
    async def _handle_start_booking(
        self, session_id, message, intent, params, memory
    ) -> tuple:
        """Handle start booking"""
        booking_flow = self.get_booking_flow(session_id)
        
        tour_id = params.get("tour_id")
        tour_name = params.get("tour_name")
        
        # If tour ID is provided, get tour name
        if tour_id and not tour_name:
            tour = await self._get_tour(tour_id)
            if tour:
                tour_name = tour.name
        
        result = booking_flow.start_flow(tour_id=tour_id, tour_name=tour_name)
        
        memory.add_message("user", message, intent=intent, entities=params)
        
        if tour_name:
            message = f"🎉 Tuyệt vời! Bạn muốn đặt tour **{tour_name}**!\n\n{result['message']}"
        else:
            message = result["message"]
        
        memory.add_message("assistant", message, intent=intent)
        
        return message, {
            "booking_flow_active": True,
            "booking_step": booking_flow.current_step.value,
            "booking_data": result.get("booking_data")
        }

    async def _handle_web_search(
        self,
        session_id: str,
        message: str,
        params: Dict[str, Any],
        memory: ConversationMemory
    ) -> tuple:
        """
        Handle web search requests.
        Searches external travel sites (Traveloka, Booking, Viator).
        """
        query = params.get("query", message)
        location = params.get("location")
        search_types = params.get("search_types")

        memory.add_message("user", message, intent="web_search", entities=params)

        # Perform search
        if search_types:
            results = await self.search_external_travel(query, location, search_types)
        else:
            results = await self.search_external_travel(query, location)

        response = f"Tìm kiếm web cho: **{query}**\n\n{results}"

        memory.add_message("assistant", response, intent="web_search")
        self.memory.add_interaction(
            user_id=session_id,
            user_message=message,
            assistant_response=response,
            metadata={"type": "web_search", "query": query}
        )

        return response, {
            "intent": "web_search",
            "search_results": results
        }

    async def _handle_general(
        self, user_id, session_id, message, intent, params, memory, multi_turn
    ) -> tuple:
        """Handle general conversation with multi-turn support"""
        
        # Check for pre-trip / post-trip requests
        message_lower = message.lower()
        
        if any(kw in message_lower for kw in ["checklist", "chuẩn bị", "cần mang", "đồ dùng"]):
            if "checklist" in message_lower or "chuẩn bị" in message_lower:
                checklist = self.trip_assistant.pre_trip.get_complete_checklist("beach")
                response = self.trip_assistant.pre_trip.format_checklist(checklist)
                return response, {"intent": "pre_trip_checklist"}
        
        if any(kw in message_lower for kw in ["mẹo", "lưu ý", "tips", "nên"]):
            destination = params.get("destination", "đà nẵng")
            tips = self.trip_assistant.pre_trip.get_local_tips(destination)
            
            lines = [f"## 💡 MẸO CHO {destination.upper()}"]
            for tip in tips:
                lines.append(f"\n### {tip['title']}\n{tip['tip']}")
            
            return "\n".join(lines), {"intent": "local_tips"}
        
        if any(kw in message_lower for kw in ["thời tiết", "weather"]):
            destination = params.get("destination", "")
            if destination:
                response = self.trip_assistant.pre_trip.get_weather_reminder(
                    destination, datetime.now() + timedelta(days=7)
                )
                return response, {"intent": "weather_info"}
        
        if any(kw in message_lower for kw in ["feedback", "khảo sát", "đánh giá", "review"]):
            response = self.trip_assistant.post_trip.generate_feedback_survey(
                "DEMO123", "Tour Demo"
            )
            return response, {"intent": "post_trip_feedback"}
        
        if any(kw in message_lower for kw in ["tích điểm", "loyalty", "điểm thưởng"]):
            loyalty = self.trip_assistant.post_trip.calculate_loyalty_points(
                num_adults=2,
                num_children=0,
                total_spent=5000000,
                is_first_booking=False
            )
            lines = [
                "## 🎁 CHƯƠNG TRÌNH TÍCH ĐIỂM",
                f"\nBạn đã nhận được: **{loyalty['earned_points']} điểm**",
                f"\n**Hạng thành viên:** {loyalty['tier']} 🏅",
                "\n### Quyền lợi:"
            ]
            for benefit in loyalty["benefits"]:
                lines.append(f"• {benefit}")
            
            return "\n".join(lines), {"intent": "loyalty"}
        
        # Check context from multi-turn
        context = multi_turn.get_context_for_ai(max_turns=5)
        
        # Use AI for general conversation
        conversation_history = memory.get_messages()
        pref = self.recommendation_engine.get_user_preference(user_id)
        
        context_msg = ""
        if pref.preferred_destinations:
            context_msg = f"\n[User preferences: thích đi {', '.join(pref.preferred_destinations[-2:])}]"
        
        system_msg = {"role": "system", "content": SYSTEM_PROMPT + context_msg}
        all_messages = [system_msg] + conversation_history
        
        try:
            response = await self.llm.chat_completion(
                messages=all_messages,
                fallback_fn=lambda: self._fallback_response(params)
            )
        except LLMCircuitOpenError:
            logger.warning("LLM circuit breaker open, using fallback response")
            response = self._fallback_response(params)
        except LLMTimeoutError:
            logger.warning("LLM timeout, using fallback response")
            response = self._fallback_response(params)
        except Exception as e:
            logger.error(f"LLM error: {e}, using fallback")
            response = self._fallback_response(params)
        
        memory.add_message("user", message, intent=intent, entities=params)
        memory.add_message("assistant", response, intent=intent)
        
        return response, {"intent": intent}
    
    # ============= Helper Methods =============
    
    def _extract_date(self, message: str) -> Optional[str]:
        """Extract date from message"""
        import re
        patterns = [
            r'(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})',
            r'(\d{1,2})[/\-](\d{1,2})',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, message)
            if match:
                groups = match.groups()
                if len(groups) == 3:
                    return f"{groups[0]}/{groups[1]}/{groups[2]}"
                elif len(groups) == 2:
                    return f"{groups[0]}/{groups[1]}/{datetime.now().year}"
        
        return None
    
    async def _get_booking(self, booking_code: str, user_id: str):
        """Get booking from database"""
        try:
            booking = await self.db.booking.find_unique(
                where={"booking_code": booking_code},
                include={"tour": True}
            )
            
            if booking and (booking.userId == user_id or user_id == "anonymous"):
                return booking
            
            # Check if admin
            if user_id != "anonymous":
                user = await self.db.user.find_unique(where={"id": user_id})
                if user and user.role == "ADMIN":
                    return booking
            
            return None
        except:
            return None
    
    async def _get_tour(self, tour_id: str):
        """Get tour from database"""
        try:
            return await self.db.tour.find_unique(where={"id": tour_id})
        except:
            return None
    
    async def _create_booking_from_flow(self, user_id: str, booking_flow) -> Dict[str, Any]:
        """Create booking from booking flow data"""
        try:
            import random
            import string
            
            code = "TG" + datetime.now().strftime("%Y%m%d") + "".join(
                random.choices(string.ascii_uppercase + string.digits, k=4)
            )
            
            booking = await self.db.booking.create(
                data={
                    "user_id": user_id if user_id != "anonymous" else None,
                    "tour_id": booking_flow.booking_data.tour_id,
                    "booking_code": code,
                    "status": "PENDING",
                    "num_adults": booking_flow.booking_data.num_adults,
                    "num_children": booking_flow.booking_data.num_children,
                    "total_price": booking_flow.booking_data.total_price or 0,
                    "contact_name": booking_flow.booking_data.name,
                    "contact_email": booking_flow.booking_data.email,
                    "contact_phone": booking_flow.booking_data.phone,
                    "departure_date": booking_flow.booking_data.departure_date,
                    "special_requests": booking_flow.booking_data.special_requests,
                    "payment_status": "UNPAID"
                }
            )
            
            return {
                "success": True,
                "booking_code": code,
                "message": f"Đặt tour thành công! Mã booking: {code}"
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _booking_to_dict(self, booking) -> Dict[str, Any]:
        """Convert booking to dict"""
        return {
            "booking_id": booking.id,
            "booking_code": booking.bookingCode,
            "tour_name": booking.tour.name if booking.tour else None,
            "total_price": str(booking.totalPrice) if booking.totalPrice else None,
            "payment_status": booking.paymentStatus,
            "departure_date": booking.departureDate,
            "num_adults": booking.numAdults,
            "num_children": booking.numChildren
        }
    
    def _fallback_response(self, params: Dict[str, Any]) -> str:
        """Fallback response"""
        if params.get("destination"):
            return f"Tôi sẽ tìm tour ở {params['destination']} cho bạn. Bạn có ngân sách và thời gian cụ thể không?"
        
        return """Tôi có thể giúp bạn:
🔍 Tìm kiếm tour theo điểm đến, ngân sách
📋 Đặt tour tự động
📝 Hủy hoặc đổi lịch tour
💡 Gợi ý điểm đến phù hợp
📋 Checklist chuẩn bị chuyến đi

Bạn muốn làm gì?"""
    
    def _get_suggestions(self, intent: str, params: Dict[str, Any], user_id: str) -> List[str]:
        """Get suggestions"""
        return self.recommendation_engine.get_conversation_suggestions(user_id, intent, params)
    
    def _get_booking_suggestions(self, step: BookingStep) -> List[str]:
        """Get booking-specific suggestions"""
        suggestions = {
            BookingStep.GREETING: ["Bắt đầu đặt tour", "Tìm tour trước"],
            BookingStep.COLLECT_NAME: ["Hủy đặt tour"],
            BookingStep.COLLECT_EMAIL: ["Quay lại"],
            BookingStep.COLLECT_PHONE: ["Quay lại"],
            BookingStep.COLLECT_TOUR: ["Hủy đặt tour"],
            BookingStep.COLLECT_DATE: ["Xem tour khác"],
            BookingStep.COLLECT_PARTICIPANTS: ["Quay lại"],
            BookingStep.COLLECT_SPECIAL_REQUESTS: ["Bỏ qua"],
            BookingStep.CONFIRM_BOOKING: ["Đúng, đặt luôn", "Sửa thông tin"]
        }
        return suggestions.get(step, ["Tiếp tục"])
    
    def get_session_stats(self, session_id: str) -> Dict[str, Any]:
        """Get session statistics"""
        memory = self.get_memory(session_id)
        booking_flow = self.get_booking_flow(session_id)
        multi_turn = self.get_multi_turn_manager(session_id)
        
        return {
            "total_messages": len(memory.messages),
            "current_intent": memory.get_last_intent(),
            "booking_flow_active": booking_flow.is_active,
            "booking_step": booking_flow.current_step.value if booking_flow.is_active else None,
            "conversation_state": multi_turn.state.value,
            "active_goal": multi_turn.active_goal.goal_type if multi_turn.active_goal else None,
            "context": memory.context
        }


# Import timedelta for weather forecast
from datetime import timedelta
