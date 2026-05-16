"""
Tests for TravelGPT AI Agent Enhancement — Parts 1–4.

These tests cover:
- Part 1: TourFilter Region enum coercion fix
- Part 2: TOOL_DEFINITIONS + ToolExecutor + streaming pipeline
- Part 3: EmbeddingService + semantic search integration
- Part 4: LangGraph (informational only)

Fixtures come from tests/conftest.py (MockDB, client, auth_client, tokens).
"""

import pytest
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch


# =============================================================================
# PART 1 — TourFilter Region Enum Coercion Bug
# =============================================================================

class TestPart1RegionEnumCoercion:
    """Test that Region(str, Enum) coerced to plain str doesn't crash on .value."""

    def test_tour_filter_accepts_string_region(self):
        """TourFilter should accept a plain string for region field."""
        from app.schemas.tour import TourFilter, Region

        # String value — Pydantic coerces "NORTH" → str (not Region)
        f = TourFilter(region="NORTH")
        # f.region is a string, not a Region enum
        assert isinstance(f.region, str), f"Expected str, got {type(f.region)}"
        assert f.region == "NORTH"

    def test_tour_filter_accepts_enum_region(self):
        """TourFilter should accept Region enum value."""
        from app.schemas.tour import TourFilter, Region

        f = TourFilter(region=Region.CENTRAL)
        assert isinstance(f.region, Region)
        assert f.region == Region.CENTRAL

    def test_region_enum_value_access(self):
        """Region.value should work for enum, hasattr guard works for string."""
        from app.schemas.tour import Region

        # Enum — has .value
        assert Region.NORTH.value == "NORTH"
        assert hasattr(Region.NORTH, "value")

        # String — no .value
        s = "NORTH"
        assert not hasattr(s, "value")

        # Guard pattern should work for both
        def safe_value(obj):
            if hasattr(obj, "value"):
                return obj.value
            return obj

        assert safe_value(Region.SOUTH) == "SOUTH"
        assert safe_value("SOUTH") == "SOUTH"

    @pytest.mark.asyncio
    async def test_tour_service_list_tours_with_string_region(self):
        """TourService.list_tours() should not crash when region is a plain string."""
        from app.services.tour_service import TourService
        from app.schemas.tour import TourFilter

        mock_db = MagicMock()
        mock_db.tour.find_many = AsyncMock(return_value=[
            MagicMock(
                id="tour-001", name="Tour Da Nang", slug="da-nang",
                destination="Da Nang", region="CENTRAL",
                price=Decimal("2500000"),
                discount_price=Decimal("2300000"),
                duration="3N2D", short_description="Test",
                rating=Decimal("4.5"), review_count=10,
                is_featured=True, is_active=True, category="bien",
                images=[], highlights=[], includes=[], excludes=[],
                schedule=None, departure_dates=[],
                max_participants=20, current_participants=5, tags=[],
            )
        ])

        service = TourService(mock_db)

        # Pass string region (not Region enum) — the bug scenario
        filters = TourFilter(region="CENTRAL")
        assert isinstance(filters.region, str)  # Pydantic coerced it to str

        tours, total = await service.list_tours(filters)

        # Should NOT raise AttributeError: 'str' object has no attribute 'value'
        mock_db.tour.find_many.assert_called_once()
        call_args = mock_db.tour.find_many.call_args
        # Region value should be passed as string to Prisma
        assert call_args.kwargs.get("where", {}).get("region") == "CENTRAL"

    @pytest.mark.asyncio
    async def test_tour_service_list_tours_with_enum_region(self):
        """TourService.list_tours() works normally with Region enum."""
        from app.services.tour_service import TourService
        from app.schemas.tour import TourFilter, Region

        mock_db = MagicMock()
        mock_db.tour.find_many = AsyncMock(return_value=[])

        service = TourService(mock_db)
        filters = TourFilter(region=Region.NORTH)

        await service.list_tours(filters)

        call_args = mock_db.tour.find_many.call_args
        assert call_args.kwargs.get("where", {}).get("region") == "NORTH"


# =============================================================================
# PART 2 — LLM-Driven Tool Calling
# =============================================================================

class TestPart2ToolDefinitions:
    """Tests for TOOL_DEFINITIONS structure."""

    def test_exactly_five_tools_defined(self):
        """TOOL_DEFINITIONS should contain exactly 5 tools."""
        from app.ai.tools import TOOL_DEFINITIONS
        assert len(TOOL_DEFINITIONS) == 5

    def test_tool_names_are_correct(self):
        """Tool names should match expected set."""
        from app.ai.tools import TOOL_DEFINITIONS
        names = {t["function"]["name"] for t in TOOL_DEFINITIONS}
        assert names == {
            "search_tours",
            "get_tour_details",
            "get_user_bookings",
            "cancel_booking",
            "web_search_travel",
        }

    def test_search_tours_params(self):
        """search_tours tool should have all expected parameters."""
        from app.ai.tools import TOOL_DEFINITIONS
        search = next(t for t in TOOL_DEFINITIONS if t["function"]["name"] == "search_tours")
        params = search["function"]["parameters"]["properties"]
        assert set(params.keys()) >= {"destination", "region", "max_price", "min_price",
                                        "duration", "category", "query", "limit", "is_featured"}
        # No required params
        assert search["function"]["parameters"]["required"] == []

    def test_get_user_bookings_requires_user_id(self):
        """get_user_bookings should require user_id."""
        from app.ai.tools import TOOL_DEFINITIONS
        tool = next(t for t in TOOL_DEFINITIONS if t["function"]["name"] == "get_user_bookings")
        assert "user_id" in tool["function"]["parameters"]["required"]

    def test_cancel_booking_requires_booking_id_and_user_id(self):
        """cancel_booking should require both booking_id and user_id."""
        from app.ai.tools import TOOL_DEFINITIONS
        tool = next(t for t in TOOL_DEFINITIONS if t["function"]["name"] == "cancel_booking")
        required = tool["function"]["parameters"]["required"]
        assert "booking_id" in required
        assert "user_id" in required

    def test_web_search_requires_query(self):
        """web_search_travel should require query."""
        from app.ai.tools import TOOL_DEFINITIONS
        tool = next(t for t in TOOL_DEFINITIONS if t["function"]["name"] == "web_search_travel")
        assert "query" in tool["function"]["parameters"]["required"]

    def test_get_tool_by_name_found(self):
        """get_tool_by_name returns correct tool."""
        from app.ai.tools import get_tool_by_name
        tool = get_tool_by_name("search_tours")
        assert tool is not None
        assert tool["function"]["name"] == "search_tours"

    def test_get_tool_by_name_not_found(self):
        """get_tool_by_name returns None for unknown tool."""
        from app.ai.tools import get_tool_by_name
        assert get_tool_by_name("nonexistent_tool") is None


class TestPart2ToolExecutor:
    """Tests for ToolExecutor class."""

    @pytest.fixture
    def mock_db(self):
        return MagicMock()

    @pytest.fixture
    def executor(self, mock_db):
        from app.ai.tools_executor import ToolExecutor
        with patch("app.ai.tools_executor.get_web_search_service") as mock_ws:
            mock_ws.return_value = MagicMock()
            return ToolExecutor(mock_db)

    def test_parse_args_dict(self, executor):
        """_parse_args returns dict unchanged."""
        result = executor._parse_args({"key": "value"})
        assert result == {"key": "value"}

    def test_parse_args_json_string(self, executor):
        """_parse_args parses JSON string."""
        result = executor._parse_args('{"key": "value"}')
        assert result == {"key": "value"}

    def test_parse_args_invalid_string(self, executor):
        """_parse_args returns empty dict for invalid JSON."""
        result = executor._parse_args("not valid json")
        assert result == {}

    def test_parse_args_none(self, executor):
        """_parse_args returns empty dict for None."""
        result = executor._parse_args(None)
        assert result == {}

    @pytest.mark.asyncio
    async def test_execute_search_tours_no_query_uses_list_tours(self, executor):
        """Without query param, execute_search_tours calls list_tours."""
        mock_tour = MagicMock(
            id="tour-001", name="Tour Test", slug="test",
            destination="Da Nang", region="CENTRAL",
            price=Decimal("2500000"), discount_price=Decimal("2300000"),
            duration="3N2D", short_description="Test",
            rating=Decimal("4.5"), review_count=10, is_featured=True,
        )

        with patch.object(executor.tour_service, "list_tours",
                          new_callable=AsyncMock) as mock_list:
            mock_list.return_value = ([mock_tour], 1)
            result = await executor.execute_search_tours({})

        mock_list.assert_called_once()
        assert len(result["tours"]) == 1
        assert result["tours"][0]["id"] == "tour-001"

    @pytest.mark.asyncio
    async def test_execute_search_tours_with_query_uses_semantic(self, executor):
        """With query param, execute_search_tours calls search_tours_semantic."""
        mock_tour = MagicMock(
            id="tour-002", name="Tour Beach", slug="beach",
            destination="Nha Trang", region="SOUTH",
            price=Decimal("4200000"), discount_price=Decimal("3900000"),
            duration="3N2D", short_description="Beach tour",
            rating=Decimal("4.5"), review_count=10, is_featured=True,
        )

        with patch.object(executor.tour_service, "search_tours_semantic",
                          new_callable=AsyncMock) as mock_sem:
            mock_sem.return_value = ([mock_tour], 1)
            result = await executor.execute_search_tours({"query": "tour bien mua he"})

        mock_sem.assert_called_once()
        # Check result has tours key (don't compare mock vs string on MagicMock)
        assert "tours" in result
        assert len(result["tours"]) == 1

    @pytest.mark.asyncio
    async def test_execute_search_tours_with_region_string(self, executor):
        """execute_search_tours handles region as plain string (not enum)."""
        mock_tour = MagicMock(
            id="tour-003", name="Tour North", slug="north",
            destination="Sapa", region="NORTH",
            price=Decimal("4500000"), discount_price=None,
            duration="3N2D", short_description="Mountain tour",
            rating=Decimal("4.7"), review_count=10, is_featured=True,
        )

        with patch.object(executor.tour_service, "list_tours",
                          new_callable=AsyncMock) as mock_list:
            mock_list.return_value = ([mock_tour], 1)
            result = await executor.execute_search_tours({"region": "NORTH"})

        # Should not crash — Region enum is constructed from string
        assert "tours" in result

    @pytest.mark.asyncio
    async def test_execute_get_tour_details_by_id(self, executor, mock_db):
        """execute_get_tour_details returns tour by ID."""
        mock_tour = MagicMock(
            id="tour-001", slug="da-nang", name="Tour Da Nang",
            destination="Da Nang", region="CENTRAL", duration="3N2D",
            category="bien", description="Full desc", short_description="Short",
            price=Decimal("2500000"), discount_price=Decimal("2300000"),
            max_participants=20, current_participants=5,
            rating=Decimal("4.5"), review_count=10, is_featured=True, is_active=True,
        )
        mock_db.tour.find_unique = AsyncMock(return_value=mock_tour)

        result = await executor.execute_get_tour_details({"tour_id": "tour-001"})
        assert result["id"] == "tour-001"
        # Verify name key exists and is non-empty (don't compare mock to string)
        assert "name" in result
        assert result["name"]
        mock_db.tour.find_unique.assert_called_once_with(where={"id": "tour-001"})

    @pytest.mark.asyncio
    async def test_execute_get_tour_details_by_slug(self, executor, mock_db):
        """execute_get_tour_details returns tour by slug."""
        mock_tour = MagicMock(
            id="tour-001", slug="da-nang-3n2d", name="Tour Slug",
            destination="Da Nang", region="CENTRAL", duration="3N2D",
            category="bien", description="", short_description="",
            price=Decimal("2500000"), discount_price=None,
            max_participants=20, current_participants=5,
            rating=Decimal("4.5"), review_count=10, is_featured=True, is_active=True,
        )
        mock_db.tour.find_unique = AsyncMock(return_value=mock_tour)

        result = await executor.execute_get_tour_details({"slug": "da-nang-3n2d"})
        assert result["id"] == "tour-001"
        mock_db.tour.find_unique.assert_called_once_with(where={"slug": "da-nang-3n2d"})

    @pytest.mark.asyncio
    async def test_execute_get_tour_details_not_found(self, executor, mock_db):
        """execute_get_tour_details returns error when not found."""
        mock_db.tour.find_unique = AsyncMock(return_value=None)
        result = await executor.execute_get_tour_details({"tour_id": "nonexistent"})
        assert "error" in result
        # Vietnamese error: "Không tìm thấy tour"
        assert "tìm thấy" in result["error"] or "tim thay" in result["error"].lower()

    @pytest.mark.asyncio
    async def test_execute_get_tour_details_missing_params(self, executor):
        """execute_get_tour_details returns error when neither ID nor slug provided."""
        result = await executor.execute_get_tour_details({})
        assert "error" in result
        assert "cung cấp" in result["error"] or "cung cap" in result["error"].lower()

    @pytest.mark.asyncio
    async def test_execute_get_user_bookings_success(self, executor):
        """execute_get_user_bookings returns bookings for logged-in user."""
        mock_booking = MagicMock(
            id="booking-001", booking_code="BK123",
            status="PENDING", payment_status="UNPAID",
            total_price=Decimal("5000000"), participant_count=2,
            created_at=None, tour=MagicMock(
                id="tour-001", name="Tour Test", destination="Da Nang",
                duration="3N2D", slug="test",
            ),
        )

        with patch.object(executor.booking_service, "list_user_bookings",
                          new_callable=AsyncMock) as mock_list:
            mock_list.return_value = ([mock_booking], 1)
            result = await executor.execute_get_user_bookings({"user_id": "user-001"})

        assert result["total"] == 1
        assert result["bookings"][0]["id"] == "booking-001"

    @pytest.mark.asyncio
    async def test_execute_get_user_bookings_anonymous(self, executor):
        """execute_get_user_bookings prompts login for anonymous user."""
        result = await executor.execute_get_user_bookings({"user_id": "anonymous"})
        assert "error" in result
        # Vietnamese: "Vui lòng đăng nhập để xem booking"
        assert "đăng nhập" in result["error"] or "dang nhap" in result["error"].lower()

    @pytest.mark.asyncio
    async def test_execute_cancel_booking_success(self, executor):
        """execute_cancel_booking returns success."""
        mock_cancelled = MagicMock(
            id="booking-001", booking_code="BK123", status="CANCELLED",
        )

        with patch.object(executor.booking_service, "cancel_booking",
                          new_callable=AsyncMock) as mock_cancel:
            mock_cancel.return_value = mock_cancelled
            result = await executor.execute_cancel_booking({
                "booking_id": "booking-001",
                "user_id": "user-001",
                "reason": "Thay doi ke hoach",
            })

        assert result["success"] is True
        assert result["status"] == "CANCELLED"

    @pytest.mark.asyncio
    async def test_execute_cancel_booking_anonymous(self, executor):
        """execute_cancel_booking prompts login for anonymous."""
        result = await executor.execute_cancel_booking({
            "booking_id": "booking-001",
            "user_id": "anonymous",
        })
        assert "error" in result
        # Vietnamese: "Vui lòng đăng nhập để xem booking"
        assert "đăng nhập" in result["error"] or "dang nhap" in result["error"].lower()

    @pytest.mark.asyncio
    async def test_execute_tool_unknown_tool(self, executor):
        """execute_tool returns error for unknown tool name."""
        from app.core.llm_client import ToolCall
        tc = ToolCall(name="fake_tool", arguments={}, id="call-001")
        result = await executor.execute_tool(tc)
        assert "error" in result
        assert "Unknown tool" in result["error"]

    def test_extract_tours_from_results(self, executor):
        """extract_tours_from_results pulls tour data from search_tour results."""
        tool_results = [
            {
                "tool": "search_tours",
                "result": {
                    "tours": [
                        {"id": "tour-001", "name": "Tour A"},
                        {"id": "tour-002", "name": "Tour B"},
                    ]
                }
            }
        ]
        tours = executor.extract_tours_from_results(tool_results)
        assert len(tours) == 2
        assert tours[0]["id"] == "tour-001"
        assert tours[1]["id"] == "tour-002"

    def test_extract_tours_from_results_detail(self, executor):
        """extract_tours_from_results handles get_tour_details result."""
        tool_results = [
            {
                "tool": "get_tour_details",
                "result": {"id": "tour-005", "name": "Tour Detail"}
            }
        ]
        tours = executor.extract_tours_from_results(tool_results)
        assert len(tours) == 1
        assert tours[0]["id"] == "tour-005"


class TestPart2StreamingPipeline:
    """Tests for the streaming chat endpoint integration."""

    def test_streaming_endpoint_in_router(self):
        """POST /chat/message/stream should be a route in the chat router."""
        from app.api.v1.chat import router
        paths = [r.path for r in router.routes]
        # Full path: /chat/message/stream — check that message/stream is in a route
        assert any("/message/stream" in p for p in paths)

    def test_streaming_context_class_exists(self):
        """StreamingContext should exist and have required attributes."""
        from app.api.v1.chat import StreamingContext
        ctx = StreamingContext()
        assert hasattr(ctx, "memory")
        assert hasattr(ctx, "intent_detector")
        assert hasattr(ctx, "recommendation_engine")

    def test_session_id_validation(self):
        """validate_session_id should accept valid IDs and reject injection."""
        from app.api.v1.chat import validate_session_id

        # Valid IDs
        assert validate_session_id("session-abc-123")
        assert validate_session_id("my_session")
        assert validate_session_id("abcABC123")
        assert validate_session_id("test-session-001")

        # Invalid IDs (injection attempts)
        assert not validate_session_id("../etc/passwd")
        assert not validate_session_id("session<script>")
        assert not validate_session_id("")
        assert not validate_session_id("a" * 200)  # too long

    def test_system_prompt_exists_and_not_empty(self):
        """SYSTEM_PROMPT constant should exist and have meaningful content."""
        from app.ai.conversation import SYSTEM_PROMPT
        assert SYSTEM_PROMPT is not None
        assert len(SYSTEM_PROMPT) > 100
        assert "TravelGPT" in SYSTEM_PROMPT or "TRAVELGPT" in SYSTEM_PROMPT


# =============================================================================
# PART 3 — Semantic Search with ChromaDB
# =============================================================================

class TestPart3EmbeddingService:
    """Tests for EmbeddingService."""

    def test_get_embedding_service_singleton(self):
        """get_embedding_service should return the same instance."""
        from app.services.embedding_service import get_embedding_service
        svc1 = get_embedding_service()
        svc2 = get_embedding_service()
        assert svc1 is svc2

    def test_embedding_service_init(self):
        """EmbeddingService initializes with correct defaults."""
        from app.services.embedding_service import EmbeddingService
        svc = EmbeddingService()
        assert svc.model_name == "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
        assert svc._client is None  # lazy init
        assert svc._collection is None
        assert svc._embedder is None

    def test_is_ready_false_when_uninitialized(self):
        """is_ready() should return False when not fully initialized."""
        from app.services.embedding_service import EmbeddingService
        svc = EmbeddingService()
        result = svc.is_ready()
        assert result is False

    def test_tour_to_text(self):
        """_tour_to_text should concatenate tour fields."""
        from app.services.embedding_service import EmbeddingService
        svc = EmbeddingService()

        mock_tour = MagicMock()
        # Configure all accessed attributes explicitly as strings
        mock_tour.name = "Tour Da Nang"
        mock_tour.shortDescription = "Bien va nui"
        mock_tour.description = "Full description"
        mock_tour.destination = "Da Nang"
        mock_tour.category = "bien"
        mock_tour.region = "CENTRAL"
        mock_tour.duration = "3N2D"

        text = svc._tour_to_text(mock_tour)
        assert "Tour Da Nang" in text
        assert "Da Nang" in text
        assert "bien" in text
        assert "CENTRAL" in text


class TestPart3SemanticSearchIntegration:
    """Tests for TourService.semantic_search integration."""

    @pytest.mark.asyncio
    async def test_search_tours_semantic_calls_embedding_service(self):
        """search_tours_semantic should call embedding service with query."""
        from app.services.tour_service import TourService
        from app.schemas.tour import TourFilter

        mock_db = MagicMock()
        mock_db.tour.find_many = AsyncMock(return_value=[])

        mock_tour1 = MagicMock(
            id="tour-001", name="Tour A", slug="a",
            destination="Da Nang", region="CENTRAL",
            price=Decimal("2500000"), discount_price=None,
            duration="3N2D", short_description="A",
            rating=Decimal("4.5"), review_count=10, is_featured=True, is_active=True,
            category="bien", images=[], highlights=[], includes=[], excludes=[],
            schedule=None, departure_dates=[],
            max_participants=20, current_participants=5, tags=[],
        )
        mock_tour2 = MagicMock(
            id="tour-002", name="Tour B", slug="b",
            destination="Da Nang", region="CENTRAL",
            price=Decimal("3000000"), discount_price=None,
            duration="3N2D", short_description="B",
            rating=Decimal("4.3"), review_count=5, is_featured=False, is_active=True,
            category="bien", images=[], highlights=[], includes=[], excludes=[],
            schedule=None, departure_dates=[],
            max_participants=20, current_participants=5, tags=[],
        )

        mock_db.tour.find_many = AsyncMock(return_value=[mock_tour1, mock_tour2])

        mock_embed = MagicMock()
        mock_embed.is_ready = MagicMock(return_value=True)
        mock_embed.semantic_search = AsyncMock(return_value=[
            {"tour_id": "tour-001", "distance": 0.1, "name": "Tour A",
             "destination": "Da Nang", "region": "CENTRAL"},
            {"tour_id": "tour-002", "distance": 0.2, "name": "Tour B",
             "destination": "Da Nang", "region": "CENTRAL"},
        ])

        service = TourService(mock_db)

        with patch("app.services.embedding_service.get_embedding_service",
                   return_value=mock_embed):
            tours, total = await service.search_tours_semantic(
                query="tour bien mua he",
                filters=TourFilter(),
                page=1,
                page_size=5,
            )

        mock_embed.semantic_search.assert_called_once()
        assert len(tours) == 2
        # Should preserve semantic order
        assert tours[0].id == "tour-001"

    @pytest.mark.asyncio
    async def test_search_tours_semantic_fallback_on_error(self):
        """search_tours_semantic falls back to keyword search when ChromaDB fails."""
        from app.services.tour_service import TourService
        from app.schemas.tour import TourFilter

        mock_db = MagicMock()
        mock_tour = MagicMock(
            id="tour-001", name="Tour Fallback", slug="fallback",
            destination="Da Nang", region="CENTRAL",
            price=Decimal("2500000"), discount_price=None,
            duration="3N2D", short_description="Test",
            rating=Decimal("4.5"), review_count=10, is_featured=True, is_active=True,
            category="bien", images=[], highlights=[], includes=[], excludes=[],
            schedule=None, departure_dates=[],
            max_participants=20, current_participants=5, tags=[],
        )
        mock_db.tour.find_many = AsyncMock(return_value=[mock_tour])

        mock_embed = MagicMock()
        # is_ready raises — simulate ChromaDB unavailable
        mock_embed.is_ready = MagicMock(side_effect=Exception("ChromaDB not available"))
        mock_embed.semantic_search = AsyncMock(return_value=[])

        service = TourService(mock_db)

        with patch("app.services.embedding_service.get_embedding_service",
                   return_value=mock_embed):
            tours, total = await service.search_tours_semantic(
                query="tour bien",
                filters=TourFilter(),
                page=1,
                page_size=5,
            )

        # Should fall back gracefully
        assert isinstance(tours, list)

    @pytest.mark.asyncio
    async def test_search_tours_semantic_empty_results(self):
        """search_tours_semantic falls back when semantic returns no results."""
        from app.services.tour_service import TourService
        from app.schemas.tour import TourFilter

        mock_db = MagicMock()
        mock_db.tour.find_many = AsyncMock(return_value=[])

        mock_embed = MagicMock()
        mock_embed.is_ready = MagicMock(return_value=True)
        mock_embed.semantic_search = AsyncMock(return_value=[])  # Empty results

        service = TourService(mock_db)

        with patch("app.services.embedding_service.get_embedding_service",
                   return_value=mock_embed):
            tours, total = await service.search_tours_semantic(
                query="nonexistent query",
                filters=TourFilter(),
                page=1,
                page_size=5,
            )

        # Falls back to keyword search
        assert isinstance(tours, list)


class TestPart3StartupHook:
    """Tests for embedding service startup hook."""

    def test_reindex_on_startup_is_called_in_main(self):
        """reindex_tours_on_startup should be called in main.py lifespan."""
        import ast
        main_path = "/home/nhannv/Hello/TrinhHao/TravelGPT/backend/app/main.py"
        with open(main_path) as f:
            source = f.read()
        tree = ast.parse(source)

        # Find lifespan function
        lifespan_found = False
        for node in ast.walk(tree):
            if isinstance(node, ast.AsyncFunctionDef) and node.name == "lifespan":
                func_source = ast.get_source_segment(source, node)
                if func_source and "reindex_tours_on_startup" in func_source:
                    lifespan_found = True
        assert lifespan_found, "reindex_tours_on_startup not called in main.py lifespan"


# =============================================================================
# PART 4 — LangGraph (informational)
# =============================================================================

class TestPart4LangGraph:
    """Tests for LangGraph workflow (optional enhancement)."""

    def test_langgraph_module_exists(self):
        """graph.py should exist in app/ai/."""
        import app.ai.graph as graph_module
        assert graph_module is not None

    def test_graph_has_create_agent_graph_function(self):
        """graph.py should define create_agent_graph function."""
        import app.ai.graph as graph_module
        assert hasattr(graph_module, "create_agent_graph")

    def test_graph_defines_nodes(self):
        """graph.py should define workflow nodes (router, search, booking, etc)."""
        import ast
        graph_path = "/home/nhannv/Hello/TrinhHao/TravelGPT/backend/app/ai/graph.py"
        with open(graph_path) as f:
            source = f.read()
        assert "router_node" in source
        assert "search_node" in source
        assert "booking_node" in source

    def test_chat_v2_uses_langgraph(self):
        """chat_v2() in agent.py should use LangGraph."""
        import ast
        agent_path = "/home/nhannv/Hello/TrinhHao/TravelGPT/backend/app/ai/agent.py"
        with open(agent_path) as f:
            source = f.read()

        assert "chat_v2" in source
        # chat_v2 uses LangGraph conditionally
        assert "langgraph" in source or "graph" in source
