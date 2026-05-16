"""
Tool Executor - Executes LLM-decided tool calls in TravelGPT.

This replaces the hard-coded intent branches in the streaming endpoint.
The LLM decides which tools to call; this class executes them.
"""
import json
import logging
from typing import Any, Optional
from prisma import Prisma

from app.core.llm_client import ToolCall, ToolCallsResult
from app.services.tour_service import TourService
from app.services.booking_service import BookingService
from app.services.web_search_service import get_web_search_service, WebSearchService
from app.schemas.tour import TourFilter, Region

logger = logging.getLogger(__name__)


class ToolExecutor:
    """
    Executes tool calls returned by the LLM.

    Each method corresponds to one tool in TOOL_DEFINITIONS.
    Results are serialized to JSON strings for the LLM to process.
    """

    def __init__(self, db: Prisma):
        self.db = db
        self.tour_service = TourService(db)
        self.booking_service = BookingService(db)
        self.web_search = get_web_search_service()

    def _parse_args(self, raw_args: Any) -> dict:
        """Parse tool arguments — handles JSON string or dict."""
        if isinstance(raw_args, dict):
            return raw_args
        if isinstance(raw_args, str):
            try:
                return json.loads(raw_args)
            except json.JSONDecodeError:
                logger.warning(f"Failed to parse tool arguments: {raw_args}")
                return {}
        return {}

    async def execute_search_tours(self, args: dict) -> dict:
        """Execute search_tours tool."""
        try:
            # Build TourFilter from args
            filters = TourFilter()

            if args.get("destination"):
                filters.destination = args["destination"]
            if args.get("region"):
                region_str = args["region"]
                # Guard: if already a string, use directly; if has .value, extract
                if isinstance(region_str, str):
                    try:
                        filters.region = Region(region_str)
                    except ValueError:
                        pass
                elif hasattr(region_str, "value"):
                    filters.region = region_str
            if args.get("max_price"):
                filters.max_price = args["max_price"]
            if args.get("min_price"):
                filters.min_price = args["min_price"]
            if args.get("duration"):
                filters.duration = args["duration"]
            if args.get("category"):
                filters.category = args["category"]
            if args.get("search"):
                filters.search = args["search"]
            if args.get("is_featured") is not None:
                filters.is_featured = args["is_featured"]

            limit = min(args.get("limit", 5), 20)
            page_size = min(limit, 20)

            # Use semantic search when a free-text query is provided
            if args.get("query"):
                tours, total = await self.tour_service.search_tours_semantic(
                    query=args["query"],
                    filters=filters,
                    page=1,
                    page_size=page_size
                )
            else:
                tours, total = await self.tour_service.list_tours(
                    filters, page=1, page_size=page_size
                )

            tour_results = []
            for t in tours:
                price = float(t.price) if t.price else 0
                discount = float(t.discountPrice) if t.discountPrice else None
                price_str = f"{price:,.0f}".replace(",", ".")
                discount_str = f"{discount:,.0f}".replace(",", ".") if discount else None
                price_display = f"~~{price_str}đ~~ **{discount_str}đ**" if discount_str else f"**{price_str}đ**"

                tour_results.append({
                    "id": t.id,
                    "name": t.name,
                    "slug": t.slug,
                    "destination": t.destination,
                    "region": t.region if t.region else None,
                    "duration": t.duration,
                    "short_description": t.shortDescription,
                    "price": price,
                    "discount_price": discount,
                    "price_display": price_display,
                    "rating": float(t.rating) if t.rating else 0,
                    "review_count": t.reviewCount,
                    "is_featured": t.isFeatured,
                })

            return {
                "tours": tour_results,
                "total": total,
                "returned": len(tour_results),
                "message": f"Tìm thấy {len(tour_results)} tour" + (f" / {total} tổng cộng" if total > len(tour_results) else "")
            }
        except Exception as e:
            logger.error(f"search_tours tool error: {e}", exc_info=True)
            return {"tours": [], "total": 0, "returned": 0, "error": str(e)}

    async def execute_get_tour_details(self, args: dict) -> dict:
        """Execute get_tour_details tool."""
        try:
            tour_id = args.get("tour_id")
            slug = args.get("slug")

            if tour_id:
                tour = await self.tour_service.get_tour_by_id(tour_id)
            elif slug:
                tour = await self.tour_service.get_tour_by_slug(slug)
            else:
                return {"error": "Cần cung cấp tour_id hoặc slug"}

            if not tour:
                return {"error": "Không tìm thấy tour"}

            price = float(tour.price) if tour.price else 0
            discount = float(tour.discountPrice) if tour.discountPrice else None
            discount_str = f"{discount:,.0f}".replace(",", ".") if discount else None
            price_display = f"~~{float(price):,.0f}đ~~ **{discount_str}đ**" if discount_str else f"**{float(price):,.0f}đ**"

            return {
                "id": tour.id,
                "slug": tour.slug,
                "name": tour.name,
                "destination": tour.destination,
                "region": tour.region,
                "duration": tour.duration,
                "category": tour.category,
                "description": tour.description,
                "short_description": tour.shortDescription,
                "price": price,
                "discount_price": discount,
                "price_display": price_display,
                "max_participants": tour.maxParticipants,
                "current_participants": tour.currentParticipants,
                "rating": float(tour.rating) if tour.rating else 0,
                "review_count": tour.reviewCount,
                "is_featured": tour.isFeatured,
                "is_active": tour.isActive,
            }
        except Exception as e:
            logger.error(f"get_tour_details tool error: {e}", exc_info=True)
            return {"error": str(e)}

    async def execute_get_user_bookings(self, args: dict) -> dict:
        """Execute get_user_bookings tool."""
        try:
            user_id = args.get("user_id")
            if not user_id or user_id == "anonymous":
                return {"error": "Vui lòng đăng nhập để xem booking"}

            status = args.get("status")
            bookings, total = await self.booking_service.list_user_bookings(
                user_id, include_tour=True
            )

            if status:
                bookings = [b for b in bookings if b.status == status]

            booking_results = []
            for b in bookings:
                booking_results.append({
                    "id": b.id,
                    "booking_code": b.bookingCode,
                    "status": b.status,
                    "payment_status": b.paymentStatus,
                    "total_price": float(b.totalPrice) if b.totalPrice else 0,
                    "participant_count": b.participantCount,
                    "created_at": str(b.createdAt) if b.createdAt else None,
                    "tour": {
                        "id": b.tour.id if b.tour else None,
                        "name": b.tour.name if b.tour else None,
                        "destination": b.tour.destination if b.tour else None,
                        "duration": b.tour.duration if b.tour else None,
                        "slug": b.tour.slug if b.tour else None,
                    } if b.tour else None
                })

            return {
                "bookings": booking_results,
                "total": len(booking_results),
                "message": f"Bạn có {len(booking_results)} booking"
            }
        except Exception as e:
            logger.error(f"get_user_bookings tool error: {e}", exc_info=True)
            return {"bookings": [], "total": 0, "error": str(e)}

    async def execute_cancel_booking(self, args: dict) -> dict:
        """Execute cancel_booking tool."""
        try:
            booking_id = args.get("booking_id")
            user_id = args.get("user_id")
            reason = args.get("reason")

            if not booking_id:
                return {"error": "Cần cung cấp booking_id"}
            if not user_id or user_id == "anonymous":
                return {"error": "Vui lòng đăng nhập để hủy booking"}

            cancelled = await self.booking_service.cancel_booking(booking_id, user_id)

            return {
                "success": True,
                "booking_id": cancelled.id,
                "booking_code": cancelled.bookingCode,
                "status": cancelled.status,
                "message": f"Đã hủy booking {cancelled.bookingCode} thành công"
            }
        except ValueError as ve:
            logger.warning(f"cancel_booking validation error: {ve}")
            return {"success": False, "error": str(ve)}
        except Exception as e:
            logger.error(f"cancel_booking tool error: {e}", exc_info=True)
            return {"success": False, "error": str(e)}

    async def execute_web_search_travel(self, args: dict) -> dict:
        """Execute web_search_travel tool."""
        try:
            query = args.get("query")
            location = args.get("location")
            site = args.get("site", "all")
            limit = min(args.get("limit", 5), 10)

            if not query:
                return {"error": "Cần cung cấp query"}

            search_types = []
            if site == "all":
                search_types = ["traveloka", "booking", "viator"]
            elif site in ("traveloka", "booking", "viator"):
                search_types = [site]

            results = await self.web_search.search_multi(query, location, search_types)

            all_results = []
            for site_name, site_results in results.items():
                for r in site_results[:limit]:
                    all_results.append({
                        "site": site_name,
                        "title": r.title,
                        "description": r.description,
                        "url": r.url,
                        "price": r.price,
                        "rating": r.rating,
                        "location": r.location,
                    })

            return {
                "results": all_results,
                "total": len(all_results),
                "query": query,
                "message": f"Tìm thấy {len(all_results)} kết quả từ web"
            }
        except Exception as e:
            logger.error(f"web_search_travel tool error: {e}", exc_info=True)
            return {"results": [], "total": 0, "error": str(e)}

    async def execute_tool(self, tool_call: ToolCall) -> dict:
        """Execute a single tool call by name."""
        name = tool_call.name
        args = self._parse_args(tool_call.arguments)

        if name == "search_tours":
            return await self.execute_search_tours(args)
        elif name == "get_tour_details":
            return await self.execute_get_tour_details(args)
        elif name == "get_user_bookings":
            return await self.execute_get_user_bookings(args)
        elif name == "cancel_booking":
            return await self.execute_cancel_booking(args)
        elif name == "web_search_travel":
            return await self.execute_web_search_travel(args)
        else:
            logger.warning(f"Unknown tool: {name}")
            return {"error": f"Unknown tool: {name}"}

    async def execute_tools(
        self,
        tool_calls: list[ToolCall],
        user_id: str = "anonymous"
    ) -> list[dict]:
        """Execute multiple tool calls in sequence. Returns results with tool_call_id."""
        results = []
        for tc in tool_calls:
            # Inject user_id for tools that need it
            args = self._parse_args(tc.arguments)
            if tc.name in ("get_user_bookings", "cancel_booking") and not args.get("user_id"):
                args["user_id"] = user_id

            result = await self.execute_tool(tc)
            results.append({
                "tool_call_id": tc.id,
                "tool": tc.name,
                "result": result
            })
        return results

    def extract_tours_from_results(self, tool_results: list[dict]) -> list[dict]:
        """Extract tour data from tool results for the SSE complete event."""
        tours = []
        for tr in tool_results:
            r = tr.get("result", {})
            if tr.get("tool") == "search_tours" and r.get("tours"):
                tours.extend(r["tours"])
            elif tr.get("tool") == "get_tour_details" and not r.get("error"):
                # Single tour detail — convert to list format
                tours.append(r)
        return tours
