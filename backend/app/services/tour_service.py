from typing import Optional
from decimal import Decimal
from prisma import Prisma
from prisma.models import Tour
from app.schemas.tour import TourFilter


class TourService:
    def __init__(self, db: Prisma):
        self.db = db

    async def get_tour_by_id(self, tour_id: str) -> Optional[Tour]:
        return await self.db.tour.find_unique(where={"id": tour_id})

    async def get_tour_by_slug(self, slug: str) -> Optional[Tour]:
        return await self.db.tour.find_unique(where={"slug": slug})

    async def list_tours(
        self,
        filters: TourFilter,
        page: int = 1,
        page_size: int = 12,
    ) -> tuple[list[Tour], int]:
        where: dict = {}

        if filters.destination:
            where["destination"] = {"contains": filters.destination}
        if filters.region:
            # Guard against Pydantic coercing Region(str, Enum) to plain str
            region_val = filters.region.value if hasattr(filters.region, 'value') else filters.region
            where["region"] = region_val
        if filters.category:
            where["category"] = {"contains": filters.category}
        if filters.is_featured is not None:
            where["isFeatured"] = filters.is_featured
        if filters.min_price:
            where["price"] = {"gte": str(filters.min_price)}
        if filters.max_price:
            if "price" in where:
                where["price"]["lte"] = str(filters.max_price)
            else:
                where["price"] = {"lte": str(filters.max_price)}
        if filters.search:
            where["OR"] = [
                {"name": {"contains": filters.search}},
                {"description": {"contains": filters.search}},
                {"destination": {"contains": filters.search}},
            ]

        skip = (page - 1) * page_size

        tours = await self.db.tour.find_many(
            where=where,
            skip=skip,
            take=page_size,
            order=[{"isFeatured": "desc"}, {"rating": "desc"}],
        )

        # Get total count
        total = len(tours)

        return tours, total

    async def get_featured_tours(self, limit: int = 6) -> list[Tour]:
        return await self.db.tour.find_many(
            where={"isFeatured": True, "isActive": True},
            take=limit,
            order={"rating": "desc"},
        )

    async def search_tours(self, query: str, limit: int = 10) -> list[Tour]:
        return await self.db.tour.find_many(
            where={
                "isActive": True,
                "OR": [
                    {"name": {"contains": query}},
                    {"destination": {"contains": query}},
                    {"description": {"contains": query}},
                    {"category": {"contains": query}},
                ],
            },
            take=limit,
        )

    async def search_tours_semantic(
        self,
        query: str,
        filters: TourFilter,
        page: int = 1,
        page_size: int = 5,
    ) -> tuple[list[Tour], int]:
        """
        Search tours using semantic (vector) similarity when a free-text query
        is provided. Falls back to keyword search if ChromaDB is unavailable.

        Args:
            query: Natural language search query (triggers semantic search)
            filters: TourFilter with additional filters (region, price, etc.)
            page: Page number
            page_size: Number of results per page

        Returns:
            Tuple of (list of tours, total count)
        """
        try:
            from app.services.embedding_service import get_embedding_service

            embed_svc = get_embedding_service()
            if not embed_svc.is_ready():
                # Fallback to keyword search
                return await self._search_keyword(query, filters, page, page_size)

            # 1. Get tour IDs from semantic search (fetch more for filtering)
            semantic_results = await embed_svc.semantic_search(
                query=query,
                top_k=min(page_size * 3, 30),
                region_filter=filters.region.value if (filters.region and hasattr(filters.region, "value")) else (filters.region if filters.region else None),
                max_price=float(filters.max_price) if filters.max_price else None,
            )

            if not semantic_results:
                # No semantic matches — fall back to keyword
                return await self._search_keyword(query, filters, page, page_size)

            semantic_ids = [r["tour_id"] for r in semantic_results]

            # 2. Build additional DB filters
            db_where: dict = {"isActive": True, "id": {"in": semantic_ids}}

            # Region filter (already done in semantic_search, but also apply to DB)
            if filters.region:
                region_val = filters.region.value if hasattr(filters.region, "value") else filters.region
                db_where["region"] = region_val
            if filters.category:
                db_where["category"] = {"contains": filters.category}
            if filters.min_price:
                db_where["price"] = {"gte": str(filters.min_price)}
            if filters.max_price:
                if "price" in db_where:
                    db_where["price"]["lte"] = str(filters.max_price)
                else:
                    db_where["price"] = {"lte": str(filters.max_price)}

            # 3. Fetch from DB preserving semantic order
            skip = (page - 1) * page_size
            all_filtered = await self.db.tour.find_many(where=db_where)
            total = len(all_filtered)

            # Preserve semantic ranking order
            id_order = {tid: i for i, tid in enumerate(semantic_ids)}
            all_filtered.sort(key=lambda t: id_order.get(t.id, 999))
            tours = all_filtered[skip:skip + page_size]

            return tours, total

        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"Semantic search failed, falling back to keyword: {e}")
            return await self._search_keyword(query, filters, page, page_size)

    async def _search_keyword(
        self,
        query: str,
        filters: TourFilter,
        page: int = 1,
        page_size: int = 5,
    ) -> tuple[list[Tour], int]:
        """Keyword-based fallback search when semantic search is unavailable."""
        where: dict = {"isActive": True}

        if filters.region:
            region_val = filters.region.value if hasattr(filters.region, "value") else filters.region
            where["region"] = region_val
        if filters.category:
            where["category"] = {"contains": filters.category}
        if filters.min_price:
            where["price"] = {"gte": str(filters.min_price)}
        if filters.max_price:
            if "price" in where:
                where["price"]["lte"] = str(filters.max_price)
            else:
                where["price"] = {"lte": str(filters.max_price)}

        # Free-text keyword match
        where["OR"] = [
            {"name": {"contains": query}},
            {"description": {"contains": query}},
            {"destination": {"contains": query}},
            {"category": {"contains": query}},
        ]

        skip = (page - 1) * page_size
        tours = await self.db.tour.find_many(
            where=where,
            skip=skip,
            take=page_size,
            order=[{"isFeatured": "desc"}, {"rating": "desc"}],
        )
        total = len(tours)
        return tours, total
