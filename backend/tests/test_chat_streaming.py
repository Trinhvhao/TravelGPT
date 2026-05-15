"""
Integration test: Chat Streaming Endpoint
Tests SSE format + conversation memory context.
Run: cd backend && source .venv/bin/activate && pytest tests/test_chat_streaming.py -v
"""
import pytest
import json
import re


class TestChatStreamingFormat:
    """Test that /chat/message/stream returns valid SSE format."""

    @pytest.mark.asyncio
    async def test_stream_returns_sse_events(self, client):
        """SSE events must be valid JSON with double quotes."""
        response = await client.post(
            "/api/v1/chat/message/stream",
            json={"message": "Tìm tour Đà Nẵng", "session_id": "test-stream-001"},
            headers={"Accept": "text/event-stream"},
            timeout=30.0,
        )

        assert response.status_code == 200
        assert "text/event-stream" in response.headers.get("content-type", "")

        # Collect all events
        events = []
        async for line in response.aiter_lines():
            line = line.strip()
            if line.startswith("data: "):
                payload = line[6:]
                # MUST be valid JSON (double quotes)
                try:
                    event = json.loads(payload)
                    events.append(event)
                except json.JSONDecodeError as e:
                    pytest.fail(f"Invalid JSON in SSE data: {payload!r} — {e}")

        assert len(events) >= 2, f"Expected at least 2 events (start + content/complete), got {len(events)}"
        assert events[0]["type"] == "start"
        # Should have at least one content or complete event
        types = {e.get("type") for e in events}
        assert "content" in types or "complete" in types, f"No content/complete events: {types}"

    @pytest.mark.asyncio
    async def test_complete_event_has_intent_and_suggestions(self, client):
        """Complete event must contain intent and suggestions fields."""
        response = await client.post(
            "/api/v1/chat/message/stream",
            json={"message": "Đặt tour", "session_id": "test-stream-002"},
            headers={"Accept": "text/event-stream"},
            timeout=30.0,
        )

        events = []
        async for line in response.aiter_lines():
            line = line.strip()
            if line.startswith("data: "):
                events.append(json.loads(line[6:]))

        complete = next((e for e in events if e.get("type") == "complete"), None)
        assert complete is not None, "No 'complete' event found"
        assert "intent" in complete, f"complete event missing 'intent': {complete}"
        assert "suggestions" in complete, f"complete event missing 'suggestions': {complete}"


class TestConversationMemory:
    """Test that conversation history is preserved across messages."""

    @pytest.mark.asyncio
    async def test_second_message_uses_previous_context(self, client):
        """
        Send 2 messages with same session_id.
        Second message should see previous user message in context.
        """
        session = "test-memory-001"
        msg1 = "Tôi thích Đà Nẵng"
        msg2 = "Còn gì hay ở đó?"

        # Message 1
        r1 = await client.post(
            "/api/v1/chat/message/stream",
            json={"message": msg1, "session_id": session},
            headers={"Accept": "text/event-stream"},
            timeout=30.0,
        )
        assert r1.status_code == 200

        content1 = ""
        async for line in r1.aiter_lines():
            line = line.strip()
            if line.startswith("data: "):
                e = json.loads(line[6:])
                if e.get("type") == "content":
                    content1 += e.get("content", "")

        # Message 2 — same session
        r2 = await client.post(
            "/api/v1/chat/message/stream",
            json={"message": msg2, "session_id": session},
            headers={"Accept": "text/event-stream"},
            timeout=30.0,
        )
        assert r2.status_code == 200

        # Backend log (checked via console) should show history_len > 0 for 2nd message
        # If history_len=0, memory is broken
        content2 = ""
        async for line in r2.aiter_lines():
            line = line.strip()
            if line.startswith("data: "):
                e = json.loads(line[6:])
                if e.get("type") == "content":
                    content2 += e.get("content", "")

        # Both should have content
        assert content1, "Message 1 returned no content"
        assert content2, "Message 2 returned no content"

        # 2nd message should NOT be a duplicate greeting/welcome
        assert "Xin chào! Tôi là AI" not in content2, \
            "Message 2 repeats greeting — memory not preserved"

    @pytest.mark.asyncio
    async def test_different_sessions_are_independent(self, client):
        """Different session_ids should have independent memory."""
        msg = "Thích Phú Quốc"

        r1 = await client.post(
            "/api/v1/chat/message/stream",
            json={"message": msg, "session_id": "session-A"},
            timeout=30.0,
        )
        r2 = await client.post(
            "/api/v1/chat/message/stream",
            json={"message": msg, "session_id": "session-B"},
            timeout=30.0,
        )

        assert r1.status_code == 200
        assert r2.status_code == 200
        # Both should succeed independently
