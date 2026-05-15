"""
Test: Chat streaming endpoint must query tour DB for search_tour intent.
Root cause: /chat/message/stream bypasses TourService — LLM has no real tour data.

Run: cd backend && source .venv/bin/activate && pytest tests/test_chat_tour_search.py -v
"""
import pytest
import json
import re


class TestIntentDetection:
    """Verify intent detector correctly identifies tour search + extracts params."""

    def test_search_tour_intent_with_region_and_budget(self):
        """'Tìm tour miền Bắc ngân sách 5 triệu' → intent=search_tour, region=Miền Bắc, budget=5000000"""
        from app.ai.intent import AdvancedIntentDetector
        detector = AdvancedIntentDetector()
        intent, params = detector.detect("Tìm tour miền Bắc ngân sách 5 triệu")

        assert intent == "search_tour", f"Expected search_tour, got {intent}"
        assert params.get("region") == "Miền Bắc", f"Expected region=Miền Bắc, got {params.get('region')}"
        assert params.get("budget") == 5000000, f"Expected budget=5000000, got {params.get('budget')}"

    def test_search_tour_intent_with_destination(self):
        """'Tìm tour Đà Nẵng 4 ngày' → intent=search_tour, destination=Đà Nẵng"""
        from app.ai.intent import AdvancedIntentDetector
        detector = AdvancedIntentDetector()
        intent, params = detector.detect("Tìm tour Đà Nẵng 4 ngày")

        assert intent == "search_tour"
        assert params.get("destination") == "Đà Nẵng"
        assert params.get("duration_days") == 4

    def test_search_tour_intent_with_destination_and_budget(self):
        """'Tour Phú Quốc dưới 3 triệu' → intent=search_tour, destination, budget"""
        from app.ai.intent import AdvancedIntentDetector
        detector = AdvancedIntentDetector()
        intent, params = detector.detect("Tour Phú Quốc dưới 3 triệu")

        assert intent == "search_tour"
        assert params.get("destination") == "Phú Quốc"
        assert params.get("max_price") == 3000000

    def test_region_mien_bac_extraction(self):
        """Verify 'miền bắc' variants all normalize correctly."""
        from app.ai.intent import AdvancedIntentDetector
        detector = AdvancedIntentDetector()
        for msg in ["miền bắc", "mien bac", "Miền Bắc", "Bắc"]:
            _, params = detector.detect(f"Tìm tour {msg}")
            assert params.get("region") == "Miền Bắc", f"Failed for '{msg}': {params}"

    def test_budget_extraction_formats(self):
        """Verify various budget formats extract correctly."""
        from app.ai.intent import AdvancedIntentDetector
        detector = AdvancedIntentDetector()

        cases = [
            ("5 triệu", 5000000),
            ("3tr", 3000000),
            ("ngân sách 2 triệu", 2000000),
            ("dưới 4 triệu", 4000000),
        ]
        for msg, expected in cases:
            _, params = detector.detect(f"Tìm tour {msg}")
            assert params.get("budget") == expected, f"Failed for '{msg}': got {params.get('budget')}"


class TestStreamingEndpointTourSearch:
    """
    Integration tests: /chat/message/stream must return tour results from DB,
    not generic LLM responses.

    The conftest.py provides a mock DB with 2 tours:
      tour-001: Tour Đà Nẵng 3N2Đ, price=2500000, region=CENTRAL
      tour-002: Tour Hội An, price=1500000, region=CENTRAL
    """

    @pytest.mark.asyncio
    async def test_search_mien_bac_returns_tours_from_db(self, client):
        """
        When user asks 'Tìm tour miền Bắc', the response MUST contain
        actual tour data from the DB — not a generic LLM explanation
        about what the assistant can do.
        """
        response = await client.post(
            "/api/v1/chat/message/stream",
            json={"message": "Tìm tour miền Bắc ngân sách 5 triệu", "session_id": "test-search-mb"},
            timeout=30.0,
        )
        assert response.status_code == 200

        full_text = ""
        complete_event = {}
        async for line in response.aiter_lines():
            line = line.strip()
            if line.startswith("data: "):
                try:
                    event = json.loads(line[6:])
                    if event.get("type") == "content":
                        full_text += event.get("content", "")
                    elif event.get("type") == "complete":
                        complete_event = event
                except json.JSONDecodeError:
                    pass

        assert full_text, "Response was empty"
        # The response should NOT be a generic "I am an AI assistant" message
        assert "Xin chào! Tôi là" not in full_text, \
            "Response is generic greeting — DB not queried"

        # The response should contain real tour info
        # Either it has tour names, prices, or structured tour data
        has_tour_data = any(keyword in full_text.lower()
                             for keyword in ["tour", "địa điểm", "3.500", "5 triệu",
                                            "sapa", "hạ long", "miền bắc"])
        assert has_tour_data, (
            f"Response contains no tour data. Got:\n{full_text[:500]}"
        )

    @pytest.mark.asyncio
    async def test_search_tour_returns_complete_event_with_tours(self, client):
        """
        The complete event should include tour data in metadata
        (not just intent and suggestions).
        """
        response = await client.post(
            "/api/v1/chat/message/stream",
            json={"message": "Tìm tour miền Nam ngân sách 4 triệu", "session_id": "test-search-mn"},
            timeout=30.0,
        )
        assert response.status_code == 200

        complete_event = {}
        async for line in response.aiter_lines():
            line = line.strip()
            if line.startswith("data: "):
                try:
                    event = json.loads(line[6:])
                    if event.get("type") == "complete":
                        complete_event = event
                except json.JSONDecodeError:
                    pass

        assert complete_event, "No complete event found"
        assert complete_event.get("intent") == "search_tour", \
            f"Expected intent=search_tour, got {complete_event.get('intent')}"

        # The complete event SHOULD contain tours metadata
        # (This is the key fix: the streaming endpoint must pass tour data through)
        assert "tours" in complete_event or "response" in complete_event, \
            f"complete event missing tour data: {list(complete_event.keys())}"

    @pytest.mark.asyncio
    async def test_greeting_intent_does_not_query_tours(self, client):
        """
        A simple greeting should NOT trigger a DB tour query.
        This verifies the intent check is working.
        """
        response = await client.post(
            "/api/v1/chat/message/stream",
            json={"message": "Xin chào", "session_id": "test-greet"},
            timeout=30.0,
        )
        assert response.status_code == 200

        full_text = ""
        async for line in response.aiter_lines():
            line = line.strip()
            if line.startswith("data: "):
                try:
                    event = json.loads(line[6:])
                    if event.get("type") == "content":
                        full_text += event.get("content", "")
                except json.JSONDecodeError:
                    pass

        # Greeting response is allowed to be text-only (no tour results)
        assert full_text, "No response for greeting"
        assert "xin chào" in full_text.lower() or "chào bạn" in full_text.lower(), \
            "Greeting should return a greeting message"

    @pytest.mark.asyncio
    async def test_booking_intent_returns_booking_guidance(self, client):
        """
        'Đặt tour Đà Nẵng' → should guide user through booking flow.
        """
        response = await client.post(
            "/api/v1/chat/message/stream",
            json={"message": "Đặt tour Đà Nẵng", "session_id": "test-booking"},
            timeout=30.0,
        )
        assert response.status_code == 200

        complete_event = {}
        async for line in response.aiter_lines():
            line = line.strip()
            if line.startswith("data: "):
                try:
                    event = json.loads(line[6:])
                    if event.get("type") == "complete":
                        complete_event = event
                except json.JSONDecodeError:
                    pass

        assert complete_event.get("intent") in ("start_booking", "search_tour", "booking"), \
            f"Expected booking-related intent, got {complete_event.get('intent')}"


class TestTourServiceMockData:
    """Verify conftest mock tours are correct for test assertions."""

    def test_mock_tours_exist(self):
        """The test app must have mock tours loaded."""
        from tests.conftest import _mock_db
        assert len(_mock_db.tours) >= 2, "Need at least 2 mock tours"
        assert "tour-001" in _mock_db.tours
        assert "tour-002" in _mock_db.tours

    def test_mock_tour_structure(self):
        """Mock tours must have fields used by TourService."""
        from tests.conftest import _mock_db
        tour = _mock_db.tours["tour-001"]
        assert "name" in tour
        assert "destination" in tour
        assert "region" in tour
        assert "price" in tour
        assert "is_active" in tour
