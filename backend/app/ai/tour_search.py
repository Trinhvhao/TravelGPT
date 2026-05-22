"""
Tour Search Engine - Search and filter tours from database
"""
from typing import List, Dict, Any, Optional
from app.core.prisma import get_db


class TourSearchEngine:
    """Search tours from database with filters"""

    def __init__(self, db=None):
        self.db = db or get_db()

    async def search(self, params: Dict[str, Any]) -> List[Any]:
        """
        Search tours with filters.
        Returns list of tour objects.
        """
        try:
            destination = params.get("destination")
            budget = params.get("budget")
            duration = params.get("duration")
            category = params.get("category")
            region = params.get("region")

            # Build filter conditions
            where = {"isActive": True}

            if destination:
                # Search by destination name
                where["OR"] = [
                    {"destination": {"contains": destination}},
                    {"name": {"contains": destination}},
                    {"description": {"contains": destination}},
                ]
            elif region:
                # Map region names
                region_map = {
                    "north": "NORTH",
                    "miền bắc": "NORTH",
                    "bac": "NORTH",
                    "central": "CENTRAL", 
                    "miền trung": "CENTRAL",
                    "trung": "CENTRAL",
                    "south": "SOUTH",
                    "miền nam": "SOUTH",
                    "nam": "SOUTH",
                }
                region_value = region_map.get(region.lower(), region.upper())
                where["region"] = region_value

            # Query database
            tours = await self.db.tour.find_many(
                where=where,
                take=10,
                order=[{"isFeatured": "desc"}, {"rating": "desc"}],
            )

            # Filter by budget if specified
            if budget:
                if isinstance(budget, str):
                    # Parse budget string like "5 triệu"
                    import re
                    match = re.search(r'(\d+)', budget)
                    if match:
                        budget = int(match.group(1)) * 1000000

                if isinstance(budget, (int, float)):
                    tours = [t for t in tours if t.price and t.price <= budget]

            # Filter by duration if specified
            if duration:
                tours = [t for t in tours if duration.lower() in str(t.duration or "").lower()]

            return tours

        except Exception as e:
            print(f"Tour search error: {e}")
            return []

    async def get_all_tours(self, limit: int = 20) -> List[Any]:
        """Get all available tours"""
        try:
            return await self.db.tour.find_many(
                where={"isActive": True},
                take=limit,
                order=[{"isFeatured": "desc"}, {"rating": "desc"}],
            )
        except Exception as e:
            print(f"Get all tours error: {e}")
            return []
