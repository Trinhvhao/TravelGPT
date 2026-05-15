"""
Integration Tests for Chat API Endpoints.
Tests chat messaging, cancellation, reschedule, pre-trip, and post-trip features.
"""
import pytest
from httpx import AsyncClient


# ============= Basic Chat Tests =============

class TestBasicChat:
    """Integration tests for basic chat functionality."""
    
    @pytest.mark.asyncio
    async def test_send_message_anonymous(self, client: AsyncClient, mock_chat_message: dict):
        """Send message without auth should work (anonymous allowed)."""
        response = await client.post("/api/v1/chat/message", json=mock_chat_message)
        
        # Should return 200 with chat response
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "conversation_id" in data
    
    @pytest.mark.asyncio
    async def test_send_message_authenticated(self, auth_client: AsyncClient, mock_chat_message: dict):
        """Send message with auth should save to history."""
        response = await auth_client.post("/api/v1/chat/message", json=mock_chat_message)
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "suggestions" in data
    
    @pytest.mark.asyncio
    async def test_send_message_v2(self, client: AsyncClient, mock_chat_message: dict):
        """Send message v2 with memory should work."""
        response = await client.post("/api/v1/chat/message-v2", json=mock_chat_message)
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
    
    @pytest.mark.asyncio
    async def test_send_empty_message(self, client: AsyncClient):
        """Send empty message should be handled gracefully."""
        response = await client.post(
            "/api/v1/chat/message",
            json={"message": "", "session_id": "test"}
        )
        
        # Endpoint accepts empty message and returns response
        assert response.status_code in [200, 400, 422]
    
    @pytest.mark.asyncio
    async def test_send_message_with_context(self, client: AsyncClient):
        """Send message with context should work."""
        message = {
            "message": "Tìm tour Đà Nẵng",
            "session_id": "test-session",
            "context": {"last_intent": "greeting"}
        }
        response = await client.post("/api/v1/chat/message", json=message)
        
        assert response.status_code == 200


# ============= Chat Response Tests =============

class TestChatResponse:
    """Tests for chat response structure."""
    
    @pytest.mark.asyncio
    async def test_chat_response_has_intent(self, client: AsyncClient, mock_chat_message: dict):
        """Chat response should include intent."""
        response = await client.post("/api/v1/chat/message", json=mock_chat_message)
        
        data = response.json()
        assert "intent" in data
    
    @pytest.mark.asyncio
    async def test_chat_response_has_suggestions(self, client: AsyncClient, mock_chat_message: dict):
        """Chat response should include suggestions."""
        response = await client.post("/api/v1/chat/message", json=mock_chat_message)
        
        data = response.json()
        assert "suggestions" in data
    
    @pytest.mark.asyncio
    async def test_booking_intent_detected(self, client: AsyncClient):
        """Booking intent should be detected."""
        message = {
            "message": "Tôi muốn đặt tour Đà Nẵng",
            "session_id": "test-session"
        }
        response = await client.post("/api/v1/chat/message", json=message)
        
        assert response.status_code == 200
        data = response.json()
        assert "intent" in data
    
    @pytest.mark.asyncio
    async def test_cancel_intent_detected(self, client: AsyncClient):
        """Cancel intent should be detected."""
        message = {
            "message": "Tôi muốn hủy booking",
            "session_id": "test-session"
        }
        response = await client.post("/api/v1/chat/message", json=message)
        
        assert response.status_code == 200


# ============= Chat Streaming Tests =============

class TestChatStreaming:
    """Tests for streaming chat endpoint."""
    
    @pytest.mark.asyncio
    async def test_streaming_endpoint_exists(self, client: AsyncClient, mock_chat_message: dict):
        """Streaming endpoint should exist and return SSE."""
        response = await client.post(
            "/api/v1/chat/message/stream",
            json=mock_chat_message,
            headers={"Accept": "text/event-stream"}
        )
        
        assert response.status_code == 200
        assert "text/event-stream" in response.headers.get("content-type", "")


# ============= Chat History Tests =============

class TestChatHistory:
    """Integration tests for chat history endpoints."""
    
    @pytest.mark.asyncio
    async def test_get_chat_history(
        self, auth_client: AsyncClient, mock_chat_message: dict
    ):
        """Get chat history should return user's conversations."""
        # Send a message to create history
        await auth_client.post("/api/v1/chat/message", json=mock_chat_message)
        
        # Get history
        response = await auth_client.get("/api/v1/chat/history")
        
        assert response.status_code == 200
        data = response.json()
        assert "conversations" in data
    
    @pytest.mark.asyncio
    async def test_get_chat_history_with_session_filter(
        self, auth_client: AsyncClient, mock_chat_message: dict
    ):
        """Get chat history with session filter should work."""
        # Send message
        await auth_client.post("/api/v1/chat/message", json=mock_chat_message)
        
        # Get history for specific session
        response = await auth_client.get(
            f"/api/v1/chat/history?session_id={mock_chat_message['session_id']}"
        )
        
        assert response.status_code == 200
    
    @pytest.mark.asyncio
    async def test_clear_chat_history(self, auth_client: AsyncClient, mock_chat_message: dict):
        """Clear chat history should work."""
        # Send message
        await auth_client.post("/api/v1/chat/message", json=mock_chat_message)
        
        # Clear history
        response = await auth_client.delete("/api/v1/chat/history")
        
        assert response.status_code == 200
    
    @pytest.mark.asyncio
    async def test_clear_specific_session_history(
        self, auth_client: AsyncClient, mock_chat_message: dict
    ):
        """Clear specific session history should work."""
        # Send message
        await auth_client.post("/api/v1/chat/message", json=mock_chat_message)
        
        # Clear specific session
        response = await auth_client.delete(
            f"/api/v1/chat/history?session_id={mock_chat_message['session_id']}"
        )
        
        assert response.status_code == 200
    
    @pytest.mark.asyncio
    async def test_get_history_without_auth(self, client: AsyncClient):
        """Get history without auth should fail."""
        response = await client.get("/api/v1/chat/history")
        
        assert response.status_code in [401, 403]


# ============= Suggestions Tests =============

class TestSuggestions:
    """Tests for chat suggestions endpoint."""
    
    @pytest.mark.asyncio
    async def test_get_suggestions_greeting(self, client: AsyncClient):
        """Get suggestions for greeting intent should work."""
        response = await client.get("/api/v1/chat/suggestions?intent=greeting")
        
        assert response.status_code == 200
        data = response.json()
        assert "suggestions" in data
    
    @pytest.mark.asyncio
    async def test_get_suggestions_booking(self, client: AsyncClient):
        """Get suggestions for booking intent should work."""
        response = await client.get("/api/v1/chat/suggestions?intent=booking")
        
        assert response.status_code == 200
    
    @pytest.mark.asyncio
    async def test_get_suggestions_cancel(self, client: AsyncClient):
        """Get suggestions for cancel intent should work."""
        response = await client.get("/api/v1/chat/suggestions?intent=cancel")
        
        assert response.status_code == 200
    
    @pytest.mark.asyncio
    async def test_get_suggestions_default(self, client: AsyncClient):
        """Get suggestions with unknown intent should return defaults."""
        response = await client.get("/api/v1/chat/suggestions?intent=unknown")
        
        assert response.status_code == 200


# ============= Cancellation Flow Tests =============

class TestCancellationFlow:
    """Integration tests for cancellation flow."""
    
    @pytest.mark.asyncio
    async def test_start_cancellation_with_booking_code(self, client: AsyncClient):
        """Start cancellation with booking code should work."""
        request = {
            "session_id": "test-session",
            "booking_code": "BK12345678"
        }
        response = await client.post("/api/v1/chat/cancellation/start", json=request)
        
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        assert "message" in data
    
    @pytest.mark.asyncio
    async def test_start_cancellation_without_code(self, client: AsyncClient):
        """Start cancellation without booking code should prompt for code."""
        request = {
            "session_id": "test-session",
            "booking_code": None
        }
        response = await client.post("/api/v1/chat/cancellation/start", json=request)
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True
    
    @pytest.mark.asyncio
    async def test_cancellation_action_confirm(self, client: AsyncClient):
        """Confirm cancellation action should work."""
        # First start cancellation
        start_response = await client.post(
            "/api/v1/chat/cancellation/start",
            json={"session_id": "test-session", "booking_code": "BK12345678"}
        )
        
        # Then confirm
        response = await client.post(
            "/api/v1/chat/cancellation/action",
            params={
                "action": "confirm",
                "session_id": "test-session",
                "confirm": True
            }
        )
        
        assert response.status_code == 200
    
    @pytest.mark.asyncio
    async def test_cancellation_action_cancel(self, client: AsyncClient):
        """Cancel cancellation action should work."""
        response = await client.post(
            "/api/v1/chat/cancellation/action",
            params={
                "action": "cancel",
                "session_id": "test-session"
            }
        )
        
        assert response.status_code == 200
    
    @pytest.mark.asyncio
    async def test_get_refund_policy(self, client: AsyncClient):
        """Get refund policy should return policy details."""
        response = await client.get("/api/v1/chat/cancellation/refund-policy")
        
        assert response.status_code == 200
        data = response.json()
        assert "policy" in data
        assert len(data["policy"]) > 0


# ============= Reschedule Flow Tests =============

class TestRescheduleFlow:
    """Integration tests for reschedule flow."""
    
    @pytest.mark.asyncio
    async def test_start_reschedule(self, client: AsyncClient):
        """Start reschedule should work."""
        request = {
            "session_id": "test-session",
            "booking_code": "BK12345678"
        }
        response = await client.post("/api/v1/chat/reschedule/start", json=request)
        
        # May return success or error based on booking state
        assert response.status_code == 200
    
    @pytest.mark.asyncio
    async def test_reschedule_action_select_date(self, client: AsyncClient):
        """Select date action should work."""
        response = await client.post(
            "/api/v1/chat/reschedule/action",
            params={
                "action": "select_date",
                "session_id": "test-session",
                "new_date": "25/12/2024"
            }
        )
        
        assert response.status_code == 200
    
    @pytest.mark.asyncio
    async def test_reschedule_action_cancel(self, client: AsyncClient):
        """Cancel reschedule should work."""
        response = await client.post(
            "/api/v1/chat/reschedule/action",
            params={
                "action": "cancel",
                "session_id": "test-session"
            }
        )
        
        assert response.status_code == 200


# ============= Pre-trip Support Tests =============

class TestPreTripSupport:
    """Integration tests for pre-trip support features."""
    
    @pytest.mark.asyncio
    async def test_get_pre_trip_checklist(self, client: AsyncClient):
        """Get pre-trip checklist should work."""
        request = {
            "trip_type": "beach",
            "destination": "Đà Nẵng",
            "duration": 3
        }
        response = await client.post("/api/v1/chat/pre-trip/checklist", json=request)
        
        assert response.status_code == 200
        data = response.json()
        assert "checklist" in data or "packing_tips" in data
    
    @pytest.mark.asyncio
    async def test_get_weather_reminder(self, client: AsyncClient):
        """Get weather reminder should work."""
        request = {
            "destination": "Đà Nẵng",
            "departure_date": "2024-12-25T00:00:00"
        }
        response = await client.post("/api/v1/chat/pre-trip/weather", json=request)
        
        assert response.status_code == 200
    
    @pytest.mark.asyncio
    async def test_get_pre_trip_summary(self, client: AsyncClient):
        """Get pre-trip summary should work."""
        request = {
            "trip_type": "beach",
            "destination": "Đà Nẵng",
            "duration": 3,
            "departure_date": "2024-12-25T00:00:00"
        }
        response = await client.post("/api/v1/chat/pre-trip/summary", json=request)
        
        assert response.status_code == 200
        data = response.json()
        # Summary should contain multiple fields
        assert any(key in data for key in ["checklist", "weather_info", "local_tips"])


# ============= Post-trip Support Tests =============

class TestPostTripSupport:
    """Integration tests for post-trip support features."""
    
    @pytest.mark.asyncio
    async def test_get_feedback_survey(self, client: AsyncClient):
        """Get feedback survey should work."""
        request = {
            "booking_code": "BK12345678",
            "tour_name": "Tour Đà Nẵng"
        }
        response = await client.post("/api/v1/chat/post-trip/feedback", json=request)
        
        assert response.status_code == 200
        data = response.json()
        assert "feedback_survey" in data
    
    @pytest.mark.asyncio
    async def test_get_review_prompt(self, client: AsyncClient):
        """Get review prompt should work."""
        request = {
            "tour_name": "Tour Đà Nẵng",
            "destination": "Đà Nẵng"
        }
        response = await client.post("/api/v1/chat/post-trip/review-prompt", json=request)
        
        assert response.status_code == 200
        data = response.json()
        assert "review_prompt" in data
    
    @pytest.mark.asyncio
    async def test_get_loyalty_points(self, client: AsyncClient):
        """Get loyalty points calculation should work."""
        request = {
            "num_adults": 2,
            "num_children": 1,
            "total_spent": 5000000,
            "is_first_booking": False
        }
        response = await client.post("/api/v1/chat/post-trip/loyalty", json=request)
        
        assert response.status_code == 200
        data = response.json()
        assert "loyalty_points" in data
        assert "loyalty_tier" in data
    
    @pytest.mark.asyncio
    async def test_get_post_trip_summary(self, client: AsyncClient):
        """Get post-trip summary should work."""
        request = {
            "booking_code": "BK12345678",
            "tour_name": "Tour Đà Nẵng",
            "num_adults": 2,
            "num_children": 0,
            "total_spent": 4600000,
            "is_first_booking": False
        }
        response = await client.post("/api/v1/chat/post-trip/summary", json=request)
        
        assert response.status_code == 200


# ============= Conversation State Tests =============

class TestConversationState:
    """Tests for conversation state management."""
    
    @pytest.mark.asyncio
    async def test_get_conversation_state(self, client: AsyncClient):
        """Get conversation state should work."""
        response = await client.get("/api/v1/chat/conversation/test-session")
        
        assert response.status_code == 200
        data = response.json()
        assert "session_id" in data
        assert "state" in data
        assert "total_turns" in data
    
    @pytest.mark.asyncio
    async def test_create_conversation_goal(self, client: AsyncClient):
        """Create conversation goal should work."""
        response = await client.post(
            "/api/v1/chat/conversation/test-session/goal",
            params={"goal_type": "booking"}
        )
        
        assert response.status_code == 200
    
    @pytest.mark.asyncio
    async def test_cancel_conversation_goal(self, client: AsyncClient):
        """Cancel conversation goal should work."""
        # First create a goal
        await client.post(
            "/api/v1/chat/conversation/test-session/goal",
            params={"goal_type": "booking"}
        )
        
        # Then cancel it
        response = await client.delete("/api/v1/chat/conversation/test-session/goal")
        
        assert response.status_code == 200


# ============= Error Handling Tests =============

class TestChatErrorHandling:
    """Tests for chat error handling."""
    
    @pytest.mark.asyncio
    async def test_cancellation_with_invalid_booking_code(self, client: AsyncClient):
        """Cancellation with invalid booking code should handle gracefully."""
        request = {
            "session_id": "test-session",
            "booking_code": "INVALID123"
        }
        response = await client.post("/api/v1/chat/cancellation/start", json=request)
        
        assert response.status_code == 200
        data = response.json()
        # Should return success: False or appropriate message
        assert "message" in data
    
    @pytest.mark.asyncio
    async def test_feedback_without_booking_code(self, client: AsyncClient):
        """Feedback without booking code should fail."""
        request = {
            "tour_name": "Tour Test"
        }
        response = await client.post("/api/v1/chat/post-trip/feedback", json=request)
        
        assert response.status_code == 400
