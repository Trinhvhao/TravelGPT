from typing import Optional, TYPE_CHECKING
from prisma import Prisma

if TYPE_CHECKING:
    from prisma.models import TourWishlist, Tour
else:
    TourWishlist = object
    Tour = object


class WishlistService:
    def __init__(self, prisma: Prisma):
        self.db = prisma

    async def add_to_wishlist(self, user_id: str, tour_id: str) -> TourWishlist:
        """Add a tour to user's wishlist"""
        existing = await self.db.tourwishlist.find_first(
            where={"userId": user_id, "tourId": tour_id}
        )
        
        if existing:
            return existing
        
        return await self.db.tourwishlist.create(
            data={"userId": user_id, "tourId": tour_id}
        )

    async def remove_from_wishlist(self, user_id: str, tour_id: str) -> bool:
        """Remove a tour from user's wishlist"""
        deleted = await self.db.tourwishlist.delete_many(
            where={"userId": user_id, "tourId": tour_id}
        )
        return deleted.count > 0

    async def get_user_wishlists(
        self,
        user_id: str,
        skip: int = 0,
        take: int = 20
    ) -> tuple[list[dict], int]:
        """Get user's wishlist with tour details"""
        wishlists = await self.db.tourwishlist.find_many(
            where={"userId": user_id},
            include={"tour": True},
            order_by={"createdAt": "desc"},
            skip=skip,
            take=take
        )
        
        total = await self.db.tourwishlist.count(where={"userId": user_id})
        
        items = []
        for w in wishlists:
            if w.tour and w.tour.isActive:
                items.append({
                    "id": w.id,
                    "tourId": w.tourId,
                    "addedAt": w.createdAt.isoformat(),
                    "tour": {
                        "id": w.tour.id,
                        "name": w.tour.name,
                        "slug": w.tour.slug,
                        "destination": w.tour.destination,
                        "duration": w.tour.duration,
                        "price": float(w.tour.price),
                        "discountPrice": float(w.tour.discountPrice) if w.tour.discountPrice else None,
                        "images": w.tour.images,
                        "rating": float(w.tour.rating) if w.tour.rating else 0,
                        "reviewCount": w.tour.reviewCount,
                        "isFeatured": w.tour.isFeatured,
                    }
                })
        
        return items, total

    async def is_in_wishlist(self, user_id: str, tour_id: str) -> bool:
        """Check if tour is in user's wishlist"""
        existing = await self.db.tourwishlist.find_first(
            where={"userId": user_id, "tourId": tour_id}
        )
        return existing is not None

    async def get_user_wishlist_ids(self, user_id: str) -> list[str]:
        """Get list of tour IDs in user's wishlist"""
        wishlists = await self.db.tourwishlist.find_many(
            where={"userId": user_id},
            select={"tourId": True}
        )
        return [w.tourId for w in wishlists]

    async def toggle_wishlist(self, user_id: str, tour_id: str) -> tuple[bool, bool]:
        """
        Toggle tour in user's wishlist.
        Returns (is_now_in_wishlist, was_added)
        """
        existing = await self.db.tourwishlist.find_first(
            where={"userId": user_id, "tourId": tour_id}
        )
        
        if existing:
            await self.db.tourwishlist.delete(where={"id": existing.id})
            return False, False  # Now not in wishlist, was removed
        else:
            await self.db.tourwishlist.create(
                data={"userId": user_id, "tourId": tour_id}
            )
            return True, True  # Now in wishlist, was added
