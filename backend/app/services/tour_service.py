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
            where["region"] = filters.region.value
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
