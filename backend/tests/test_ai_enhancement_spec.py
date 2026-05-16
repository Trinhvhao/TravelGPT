"""
Test Specs for TravelGPT AI Agent Enhancement

Covers:
- Part 1: Fix 'str' object has no attribute 'value' bug (Region enum coercion)
- Part 2: LLM-driven tool calling (TOOL_DEFINITIONS, ToolExecutor, streaming pipeline)
- Part 3: Semantic search with ChromaDB (EmbeddingService)
- Part 4: LangGraph activation (optional)

All tests run against the mock DB in conftest.py — no real Prisma/PostgreSQL needed.
"""

# =============================================================================
# PART 1 — TourFilter Region Enum Coercion Bug
# =============================================================================
# Bug: Region(str, Enum) gets coerced to plain str by Pydantic when passed as
#      a string query parameter. Calling .value on the coerced str raises
#      AttributeError: 'str' object has no attribute 'value'.
#
# Fix verified: TourService.list_tours() and TourService.search_tours_semantic()
# guard with hasattr(obj, 'value') before calling .value.
#
# Test cases:
#   1. TourFilter with region as string "NORTH" should NOT raise on .value guard
#   2. TourFilter with region as Region.NORTH enum should work normally
#   3. TourService.list_tours() with string region "CENTRAL" returns correct tours
#   4. TourService.search_tours_semantic() with string region "SOUTH" falls back gracefully
#
# Key files: app/schemas/tour.py, app/services/tour_service.py
# =============================================================================

# =============================================================================
# PART 2 — LLM-Driven Tool Calling
# =============================================================================
# Architecture:
#   POST /chat/message/stream
#     → intent detection (fast, non-LLM)
#     → LLM with TOOL_DEFINITIONS + tool_choice="auto" (FIRST CALL)
#     → if tool_calls:
#         → ToolExecutor.execute_tools() → service calls
#         → LLM synthesis (SECOND CALL)
#         → SSE stream of synthesized response + tour data in complete event
#     → else: stream LLM response directly
#
# Components:
#   - TOOL_DEFINITIONS (app/ai/tools.py): 5 OpenAI-format tool schemas
#   - ToolExecutor (app/ai/tools_executor.py): executes named tools against services
#   - Streaming endpoint (app/api/v1/chat.py ~line 1000+): orchestrates the pipeline
#
# Test cases:
#   2a. TOOL_DEFINITIONS:
#       - Exactly 5 tools defined
#       - Tool names: search_tours, get_tour_details, get_user_bookings,
#                     cancel_booking, web_search_travel
#       - search_tours has parameters: destination, region, max_price, min_price,
#         duration, category, query, limit, is_featured
#       - search_tours has "required": [] (no required params)
#       - get_user_bookings requires user_id
#       - cancel_booking requires booking_id AND user_id
#       - web_search_travel requires query
#       - get_tool_by_name() returns correct tool or None
#
#   2b. ToolExecutor:
#       - execute_search_tours with region string → builds TourFilter correctly
#       - execute_search_tours with region enum → builds TourFilter correctly
#       - execute_search_tours with query param → calls search_tours_semantic
#       - execute_search_tours without query → calls list_tours
#       - execute_search_tours returns tours array with id, name, destination,
#         price, rating, region
#       - execute_get_tour_details with tour_id → returns tour details
#       - execute_get_tour_details with slug → returns tour details
#       - execute_get_tour_details with neither → returns error
#       - execute_get_user_bookings with user_id → returns booking list
#       - execute_get_user_bookings with anonymous → returns login prompt
#       - execute_cancel_booking → returns success result
#       - execute_web_search_travel → calls web search service
#       - execute_tool with unknown name → returns error
#       - execute_tools executes multiple tools sequentially
#       - execute_tools injects user_id into get_user_bookings/cancel_booking
#       - extract_tours_from_results → extracts tour data from tool results
#       - _parse_args handles dict, JSON string, and invalid input
#
#   2c. Streaming endpoint (/chat/message/stream):
#       - POST /chat/message/stream returns StreamingResponse
#       - SSE events: start, content, complete, error
#       - complete event includes intent, suggestions, response, tours
#       - Tours in complete event match the tool results
#       - Error events are sent on exception
#       - Validates session_id format (alphanumeric + hyphen/underscore)
#
#   2d. SYSTEM_PROMPT:
#       - SYSTEM_PROMPT constant exists in app/ai/conversation.py
#       - SYSTEM_PROMPT is not empty
#       - SYSTEM_PROMPT contains TravelGPT identity guidance
#
# =============================================================================

# =============================================================================
# PART 3 — Semantic Search with ChromaDB
# =============================================================================
# Architecture:
#   Tour data → EmbeddingService.index_tours() (batch upsert to ChromaDB)
#   User query → EmbeddingService.semantic_search() → top-k tour IDs
#   → TourService.search_tours_semantic() → fetch from DB, preserve semantic order
#
# Components:
#   - EmbeddingService (app/services/embedding_service.py):
#       - get_embedding_service() returns singleton
#       - is_ready() returns True when model+collection loaded
#       - index_tour(tour) → ChromaDB upsert, returns bool
#       - index_tours(tours) → batch upsert, returns count
#       - semantic_search(query, top_k) → list of {tour_id, distance, name, ...}
#       - delete_tour(tour_id) → remove from index
#       - reindex_all(db) → clear + reindex all active tours
#   - TourService.search_tours_semantic() → combines semantic IDs with DB filters
#   - Startup hook (app/main.py): reindex_tours_on_startup() called on startup
#
# ChromaDB config:
#   - Persistent storage: backend/data/embeddings/
#   - Collection: "tours", metadata={"hnsw:space": "cosine"}
#   - Embedding model: paraphrase-multilingual-MiniLM-L12-v2
#
# Test cases:
#   3a. EmbeddingService singleton:
#       - get_embedding_service() returns same instance on multiple calls
#       - is_ready() is True when collection + embedder exist
#
#   3b. index_tour():
#       - Successfully upserts a tour dict to ChromaDB
#       - Returns True on success
#       - Handles tour without optional fields gracefully
#
#   3c. index_tours():
#       - Batch indexes multiple tours
#       - Returns correct count of indexed tours
#       - Skips malformed tours and continues
#
#   3d. semantic_search():
#       - Returns list of dicts with tour_id and distance
#       - Respects top_k parameter
#       - Returns empty list on empty query or error
#       - Filters by region_filter when provided
#
#   3e. delete_tour():
#       - Removes tour from ChromaDB index
#       - Returns True on success
#
#   3f. reindex_all():
#       - Deletes existing collection and recreates
#       - Fetches all isActive=True tours from DB
#       - Returns number of tours indexed
#
#   3g. TourService.search_tours_semantic():
#       - Calls semantic_search when query provided
#       - Falls back to _search_keyword when ChromaDB unavailable
#       - Preserves semantic ordering (not alphabetical)
#       - Applies region/max_price filters from TourFilter
#       - Handles AttributeError on region.value gracefully
#
#   3h. Startup hook:
#       - reindex_tours_on_startup() called in main.py lifespan
#       - Logs number of indexed tours on success
#       - Logs warning and continues on failure
#
# =============================================================================

# =============================================================================
# PART 4 — LangGraph Activation (Optional / Informational)
# =============================================================================
# graph.py exists with LangGraph workflow:
#   Nodes: router, search, booking, cancellation, general
#   Edges: intent → node (conditional)
#   Used by: TravelAgent.chat_v2() — NOT called by main streaming endpoint
#
# This is informational only — no tests required for this plan step.
#
# =============================================================================
