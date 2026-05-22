"""
Tour Renderer - Format tours for display in chat
"""
from typing import List, Dict, Any


class TourRenderer:
    """Format tours for display in chat messages"""

    def format_tours_for_display(self, tours: List[Any]) -> str:
        """
        Format tours as structured content blocks for UI rendering.
        Returns markdown with structured tour info.
        """
        if not tours:
            return ""

        blocks = []

        for i, tour in enumerate(tours[:5], 1):  # Max 5 tours
            block = self._format_single_tour(tour, i)
            blocks.append(block)

        return "\n\n".join(blocks)

    def _format_single_tour(self, tour: Any, index: int) -> str:
        """Format a single tour as a structured block"""

        # Get basic info
        name = tour.name or "Tour không tên"
        destination = tour.destination or ""
        duration = tour.duration or ""
        price = tour.price or 0
        rating = tour.rating or 0.0
        description = tour.description or ""
        slug = tour.slug or ""

        # Format price
        price_str = f"{price:,.0f}".replace(",", ".")

        # Get image
        image_url = self._get_first_image(tour)

        # Truncate description
        desc_short = description[:100] + "..." if len(description) > 100 else description

        # Build block
        block = f"""**{index}. {name}**
📍 {destination} | ⏱️ {duration}
{desc_short}
💰 **{price_str}đ**"""

        if rating > 0:
            block += f" | ⭐ {rating}"

        # Add highlight
        block += f"\n[View details →](/tours/{slug})"

        return block

    def format_tour_cards(self, tours: List[Any]) -> List[Dict[str, Any]]:
        """
        Format tours as card data for frontend rendering.
        Returns list of tour card objects.
        """
        cards = []

        for tour in tours[:5]:
            card = {
                "type": "tour_card",
                "id": tour.id,
                "name": tour.name,
                "slug": tour.slug,
                "destination": tour.destination,
                "duration": tour.duration,
                "price": tour.price,
                "original_price": getattr(tour, 'original_price', None),
                "rating": tour.rating or 0,
                "image_url": self._get_first_image(tour),
                "highlights": self._get_highlights(tour),
                "badge": getattr(tour, 'badge', None),
            }
            cards.append(card)

        return cards

    def _get_first_image(self, tour: Any) -> str:
        """Get first image URL from tour"""
        if hasattr(tour, 'images') and tour.images:
            images = tour.images
            # images could be a JSON string or a list
            if isinstance(images, str):
                import json
                try:
                    images = json.loads(images)
                except:
                    return ""
            if isinstance(images, list) and len(images) > 0:
                if isinstance(images[0], str):
                    return images[0]
                elif isinstance(images[0], dict):
                    return images[0].get('url', '')
        return ""

    def _get_highlights(self, tour: Any) -> List[str]:
        """Get tour highlights"""
        highlights = getattr(tour, 'highlights', None)
        if highlights:
            if isinstance(highlights, list):
                return highlights[:3]
            return [highlights]
        return []
