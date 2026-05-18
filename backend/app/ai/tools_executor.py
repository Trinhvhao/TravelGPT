"""
Tool Executor - Executes LLM-decided tool calls in TravelGPT.

This replaces the hard-coded intent branches in the streaming endpoint.
The LLM decides which tools to call; this class executes them.
"""
import json
import logging
import re
from datetime import datetime, timedelta
from typing import Any, Optional
from prisma import Prisma

from app.core.llm_client import ToolCall, ToolCallsResult
from app.services.tour_service import TourService
from app.services.booking_service import BookingService
from app.services.weather_service import get_weather_service
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
        self._weather_svc = None

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
            
            # Fallback: If no results, try fuzzy search with the query/destination
            if not tours and (args.get("query") or args.get("destination") or args.get("search")):
                fallback_query = args.get("query") or args.get("destination") or args.get("search") or ""
                fuzzy_tours = await self.tour_service.fuzzy_search_tours(
                    query=fallback_query,
                    limit=limit
                )
                if fuzzy_tours:
                    logger.info(f"Fuzzy search fallback: found {len(fuzzy_tours)} tours for '{fallback_query}'")
                    tours = fuzzy_tours
                    total = len(fuzzy_tours)

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
                    # Rich content: populate images for chat display
                    "images": self._extract_tour_images(t.images),
                    "category": t.category,
                    "highlights": t.highlights if isinstance(t.highlights, list) else [],
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
                # Rich content
                "images": self._extract_tour_images(tour.images),
                "highlights": tour.highlights if isinstance(tour.highlights, list) else [],
                "includes": tour.includes if isinstance(tour.includes, list) else [],
                "excludes": tour.excludes if isinstance(tour.excludes, list) else [],
                "departure_dates": tour.departureDates if isinstance(tour.departureDates, list) else [],
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

    @property
    def _weather_service(self):
        """Lazy-load weather service to avoid import overhead."""
        if self._weather_svc is None:
            from app.services.weather_service import get_weather_async
            self._weather_svc = get_weather_async
        return self._weather_svc

    async def execute_show_tour_cards(self, args: dict) -> dict:
        """Execute show_tour_cards tool — returns structured block data for frontend."""
        try:
            tours = args.get("tours", [])
            message = args.get("message", "")

            if not tours:
                return {
                    "cards": [],
                    "message": message,
                    "total": 0,
                    "status": "no_tours"
                }

            cards = []
            for t in tours:
                price = t.get("price") or 0
                discount = t.get("discount_price")
                image = t.get("image") or (t.get("images", [None])[0] if t.get("images") else None)

                price_str = f"{float(price):,.0f}".replace(",", ".")
                discount_str = f"{float(discount):,.0f}".replace(",", ".") if discount else None

                cards.append({
                    "id": t.get("id", ""),
                    "name": t.get("name", "Tour không tên"),
                    "slug": t.get("slug", ""),
                    "destination": t.get("destination", ""),
                    "duration": t.get("duration", ""),
                    "price": price,
                    "discount_price": discount,
                    "price_display": f"~~{price_str}đ~~ **{discount_str}đ**" if discount_str else f"**{price_str}đ**",
                    "image": image,
                    "rating": t.get("rating", 0),
                    "review_count": t.get("review_count", 0),
                    "short_description": t.get("short_description", ""),
                    "is_featured": t.get("is_featured", False),
                    "category": t.get("category", ""),
                    "highlights": t.get("highlights", [])[:3],
                })

            return {
                "cards": cards,
                "message": message,
                "total": len(cards),
                "status": "display_cards"
            }
        except Exception as e:
            logger.error(f"show_tour_cards tool error: {e}", exc_info=True)
            return {"cards": [], "total": 0, "error": str(e)}

    async def execute_get_weather(self, args: dict) -> dict:
        """Execute get_weather tool."""
        try:
            destination = args.get("destination")
            date = args.get("date")

            if not destination:
                return {"error": "Cần cung cấp destination"}

            weather_data = await self._weather_service(destination, date)

            return {
                "weather": weather_data,
                "status": "display_weather"
            }
        except Exception as e:
            logger.error(f"get_weather tool error: {e}", exc_info=True)
            return {"error": str(e)}

    async def execute_get_post_trip_summary(self, args: dict) -> dict:
        """Execute get_post_trip_summary tool — fetches real booking data and computes loyalty."""
        try:
            booking_code = args.get("booking_code")
            user_id = args.get("user_id", "anonymous")

            # Resolve booking from DB if code is provided
            booking = None
            if booking_code:
                booking = await self.db.booking.find_unique(
                    where={"bookingCode": booking_code},
                    include={"tour": True, "user": True}
                )
            elif user_id and user_id != "anonymous":
                # Fallback: get most recent completed/confirmed booking for user
                recent = await self.db.booking.find_many(
                    where={"userId": user_id},
                    include={"tour": True},
                    order={"createdAt": "desc"},
                    take=1
                )
                if recent:
                    booking = recent[0]

            # Extract real data from booking, or fall back to args
            from app.ai.trip_support import PostTripSupport

            if booking:
                tour = booking.tour
                total_price = float(booking.totalPrice) if booking.totalPrice else 0

                # Check if this is user's first booking
                user_bookings_count = await self.db.booking.count(
                    where={"userId": booking.userId}
                )
                is_first_booking = user_bookings_count <= 1

                num_adults = booking.numAdults or 1
                num_children = booking.numChildren or 0
                departure_date = (
                    booking.departureDate.strftime("%Y-%m-%d")
                    if booking.departureDate
                    else None
                )
                # Compute return date from tour duration
                return_date = None
                if tour and departure_date:
                    try:
                        dur_str = tour.duration or "3 ngày 2 đêm"
                        m = re.search(r"(\d+)\s*ngày", dur_str)
                        if m:
                            days = int(m.group(1))
                            dep = datetime.strptime(departure_date, "%Y-%m-%d")
                            return_date = (dep + timedelta(days=days)).strftime("%Y-%m-%d")
                    except Exception:
                        pass

                loyalty = PostTripSupport.calculate_loyalty_points(
                    num_adults=num_adults,
                    num_children=num_children,
                    total_spent=total_price,
                    is_first_booking=is_first_booking
                )

                return {
                    "status": "display_post_trip",
                    "booking_code": booking.bookingCode,
                    "tour_name": tour.name if tour else "Tour của bạn",
                    "destination": tour.destination if tour else None,
                    "departure_date": departure_date,
                    "return_date": return_date,
                    "num_adults": num_adults,
                    "num_children": num_children,
                    "total_spent": total_price,
                    "is_first_booking": is_first_booking,
                    "loyalty_points": loyalty["earned_points"],
                    "loyalty_tier": loyalty["tier"],
                    "loyalty_benefits": loyalty["benefits"],
                    "points_to_next_tier": loyalty["points_to_next_tier"],
                    "feedback_survey": PostTripSupport.generate_feedback_survey(
                        booking.bookingCode,
                        tour.name if tour else "Tour của bạn"
                    ),
                    "review_prompt": PostTripSupport.generate_review_prompt(
                        tour.name if tour else "Tour của bạn",
                        tour.destination if tour else ""
                    ),
                    "return_reminder": PostTripSupport.get_return_reminders(
                        tour.name if tour else "Tour của bạn",
                        datetime.now()
                    ) if not return_date else PostTripSupport.get_return_reminders(
                        tour.name if tour else "Tour của bạn",
                        datetime.strptime(return_date, "%Y-%m-%d") if return_date else datetime.now()
                    ),
                }
            else:
                # No booking found — use args directly (e.g. demo mode)
                from app.ai.trip_support import PostTripSupport

                num_adults = args.get("num_adults", 1)
                num_children = args.get("num_children", 0)
                total_spent = args.get("total_spent", 0)
                is_first = args.get("is_first_booking", False)

                loyalty = PostTripSupport.calculate_loyalty_points(
                    num_adults=num_adults,
                    num_children=num_children,
                    total_spent=total_spent,
                    is_first_booking=is_first
                )

                return {
                    "status": "display_post_trip",
                    "booking_code": booking_code or "DEMO",
                    "tour_name": args.get("tour_name", "Tour Demo"),
                    "destination": args.get("destination"),
                    "departure_date": args.get("departure_date"),
                    "return_date": args.get("return_date"),
                    "num_adults": num_adults,
                    "num_children": num_children,
                    "total_spent": total_spent,
                    "is_first_booking": is_first,
                    "loyalty_points": loyalty["earned_points"],
                    "loyalty_tier": loyalty["tier"],
                    "loyalty_benefits": loyalty["benefits"],
                    "points_to_next_tier": loyalty["points_to_next_tier"],
                    "feedback_survey": None,
                    "review_prompt": None,
                    "return_reminder": None,
                    "warning": "Dữ liệu booking không tìm thấy trong hệ thống. Hiển thị dữ liệu mẫu."
                }
        except Exception as e:
            logger.error(f"get_post_trip_summary tool error: {e}", exc_info=True)
            return {"error": str(e)}

    async def execute_search_knowledge(self, args: dict) -> dict:
        """Execute search_knowledge tool - search knowledge base for safety, policies, FAQs, etc."""
        try:
            from app.ai.tools.knowledge_retriever import execute_knowledge_search

            query = args.get("query", "")
            kb_type = args.get("kb_type", "all")
            destination = args.get("destination")
            top_k = args.get("top_k", 3)

            if not query:
                return {"error": "Query is required"}

            # Execute semantic search
            context = await execute_knowledge_search(
                query=query,
                kb_type=kb_type,
                destination=destination,
                top_k=top_k,
            )

            return {
                "status": "success",
                "query": query,
                "kb_type": kb_type,
                "destination": destination,
                "context": context,
                "message": f"Đã tìm thấy thông tin liên quan đến: {query}"
            }

        except Exception as e:
            logger.error(f"search_knowledge tool error: {e}", exc_info=True)
            return {"error": str(e)}

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
        elif name == "show_tour_cards":
            return await self.execute_show_tour_cards(args)
        elif name == "get_weather":
            return await self.execute_get_weather(args)
        elif name == "get_post_trip_summary":
            return await self.execute_get_post_trip_summary(args)
        elif name == "search_knowledge":
            return await self.execute_search_knowledge(args)
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
            if tc.name in ("get_user_bookings", "cancel_booking", "get_post_trip_summary") and not args.get("user_id"):
                args["user_id"] = user_id

            result = await self.execute_tool(tc)
            results.append({
                "tool_call_id": tc.id,
                "tool": tc.name,
                "result": result
            })
        return results

    def _extract_tour_images(self, images_field) -> list[str]:
        """Extract image URLs from tour.images JSON field."""
        if not images_field:
            return []
        if isinstance(images_field, list):
            urls = []
            for item in images_field:
                if isinstance(item, str):
                    urls.append(item)
                elif isinstance(item, dict):
                    url = item.get("url") or item.get("src")
                    if url:
                        urls.append(url)
            return urls
        if isinstance(images_field, str):
            try:
                parsed = json.loads(images_field)
                return self._extract_tour_images(parsed)
            except json.JSONDecodeError:
                return [images_field]
        return []

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
