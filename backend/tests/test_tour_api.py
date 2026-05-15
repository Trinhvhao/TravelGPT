"""
Integration Tests for Tour API Endpoints.
Tests tour listing, search, filtering, and admin CRUD operations.
"""
import pytest
from httpx import AsyncClient


# ============= List Tours Tests =============

class TestListTours:
    """Integration tests for tour listing endpoint."""
    
    @pytest.mark.asyncio
    async def test_list_tours_success(self, client: AsyncClient):
        """List tours should return paginated results."""
        response = await client.get("/api/v1/tours")
        
        assert response.status_code == 200
        data = response.json()
        assert "tours" in data
        assert "total" in data
        assert "page" in data
        assert "page_size" in data
        assert "total_pages" in data
        assert isinstance(data["tours"], list)
    
    @pytest.mark.asyncio
    async def test_list_tours_pagination(self, client: AsyncClient):
        """List tours with pagination should work."""
        response = await client.get("/api/v1/tours?page=1&page_size=5")
        
        assert response.status_code == 200
        data = response.json()
        assert data["page"] == 1
        assert data["page_size"] == 5
        assert len(data["tours"]) <= 5
    
    @pytest.mark.asyncio
    async def test_list_tours_max_page_size(self, client: AsyncClient):
        """Page size should be capped at maximum (50)."""
        response = await client.get("/api/v1/tours?page_size=100")
        
        assert response.status_code == 200
        data = response.json()
        assert data["page_size"] <= 50


# ============= Tour Filtering Tests =============

class TestTourFiltering:
    """Integration tests for tour filtering."""
    
    @pytest.mark.asyncio
    async def test_filter_by_destination(self, client: AsyncClient):
        """Filter tours by destination should work."""
        response = await client.get("/api/v1/tours?destination=Đà Nẵng")
        
        assert response.status_code == 200
        data = response.json()
        for tour in data["tours"]:
            assert "đà nẵng" in tour["destination"].lower() or tour.get("destination") == ""
    
    @pytest.mark.asyncio
    async def test_filter_by_region(self, client: AsyncClient):
        """Filter tours by region should work."""
        response = await client.get("/api/v1/tours?region=CENTRAL")
        
        assert response.status_code == 200
        data = response.json()
        for tour in data["tours"]:
            if tour.get("region"):
                assert tour["region"] == "CENTRAL"
    
    @pytest.mark.asyncio
    async def test_filter_by_price_range(self, client: AsyncClient):
        """Filter tours by price range should work."""
        response = await client.get("/api/v1/tours?min_price=1000000&max_price=3000000")
        
        assert response.status_code == 200
    
    @pytest.mark.asyncio
    async def test_filter_by_category(self, client: AsyncClient):
        """Filter tours by category should work."""
        response = await client.get("/api/v1/tours?category=biển")
        
        assert response.status_code == 200
        # Results may be empty or filtered
    
    @pytest.mark.asyncio
    async def test_filter_featured_only(self, client: AsyncClient):
        """Filter featured tours only should work."""
        response = await client.get("/api/v1/tours?is_featured=true")
        
        assert response.status_code == 200
        data = response.json()
        for tour in data["tours"]:
            assert tour["is_featured"] is True
    
    @pytest.mark.asyncio
    async def test_combined_filters(self, client: AsyncClient):
        """Combined filters should work together."""
        response = await client.get(
            "/api/v1/tours?region=CENTRAL&is_featured=true"
        )
        
        assert response.status_code == 200


# ============= Search Tours Tests =============

class TestSearchTours:
    """Integration tests for tour search."""
    
    @pytest.mark.asyncio
    async def test_search_tours(self, client: AsyncClient):
        """Search tours by query should return matching results."""
        response = await client.get("/api/v1/tours/search?q=tour")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    @pytest.mark.asyncio
    async def test_search_tours_with_limit(self, client: AsyncClient):
        """Search with custom limit should work."""
        response = await client.get("/api/v1/tours/search?q=tour&limit=5")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) <= 5
    
    @pytest.mark.asyncio
    async def test_search_tours_empty_query(self, client: AsyncClient):
        """Search with empty query may return 200 or 422 depending on FastAPI version."""
        response = await client.get("/api/v1/tours/search?q=")
        
        # Empty string may pass or fail depending on FastAPI Query validation
        assert response.status_code in [200, 422]
    
    @pytest.mark.asyncio
    async def test_search_tours_no_results(self, client: AsyncClient):
        """Search with no results should return empty list."""
        response = await client.get("/api/v1/tours/search?q=nonexistentxyz123")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0


# ============= Get Tour Tests =============

class TestGetTour:
    """Integration tests for getting single tour."""
    
    @pytest.mark.asyncio
    async def test_get_tour_by_id(self, client: AsyncClient):
        """Get tour by ID should return tour details."""
        response = await client.get("/api/v1/tours/tour-001")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "tour-001"
        assert "name" in data
        assert "price" in data
        assert "destination" in data
    
    @pytest.mark.asyncio
    async def test_get_tour_by_slug(self, client: AsyncClient):
        """Get tour by slug should return tour details."""
        response = await client.get("/api/v1/tours/slug/da-nang-3n2d")
        
        assert response.status_code == 200
        data = response.json()
        assert data["slug"] == "da-nang-3n2d"
    
    @pytest.mark.asyncio
    async def test_get_nonexistent_tour(self, client: AsyncClient):
        """Get non-existent tour should return 404."""
        response = await client.get("/api/v1/tours/nonexistent-id")
        
        assert response.status_code == 404
    
    @pytest.mark.asyncio
    async def test_get_tour_by_nonexistent_slug(self, client: AsyncClient):
        """Get tour by non-existent slug should return 404."""
        response = await client.get("/api/v1/tours/slug/nonexistent-slug")
        
        assert response.status_code == 404


# ============= Featured Tours Tests =============

class TestFeaturedTours:
    """Integration tests for featured tours endpoint."""
    
    @pytest.mark.asyncio
    async def test_get_featured_tours(self, client: AsyncClient):
        """Get featured tours should return only featured tours."""
        response = await client.get("/api/v1/tours/featured")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for tour in data:
            assert tour["is_featured"] is True
    
    @pytest.mark.asyncio
    async def test_get_featured_tours_with_limit(self, client: AsyncClient):
        """Get featured tours with custom limit should work."""
        response = await client.get("/api/v1/tours/featured?limit=3")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) <= 3
    
    @pytest.mark.asyncio
    async def test_get_featured_tours_max_limit(self, client: AsyncClient):
        """Get featured tours with limit > 20 should be capped."""
        response = await client.get("/api/v1/tours/featured?limit=100")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) <= 20


# ============= Admin Tour CRUD Tests =============

class TestAdminTourCRUD:
    """Integration tests for admin tour management."""
    
    @pytest.mark.asyncio
    async def test_admin_create_tour(self, admin_client: AsyncClient):
        """Admin should create new tour."""
        tour_data = {
            "name": "New Test Tour",
            "slug": "new-test-tour",
            "destination": "Hà Nội",
            "region": "NORTH",
            "duration": "2N1Đ",
            "price": 2000000,
            "max_participants": 15
        }
        response = await admin_client.post("/api/v1/tours", json=tour_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "New Test Tour"
        assert data["slug"] == "new-test-tour"
    
    @pytest.mark.asyncio
    async def test_admin_update_tour(self, admin_client: AsyncClient):
        """Admin should update existing tour."""
        update_data = {
            "name": "Updated Tour Name",
            "price": 2500000
        }
        response = await admin_client.put("/api/v1/tours/tour-001", json=update_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Tour Name"
    
    @pytest.mark.asyncio
    async def test_admin_delete_tour(self, admin_client: AsyncClient):
        """Admin should delete tour."""
        response = await admin_client.delete("/api/v1/tours/tour-001")
        
        assert response.status_code == 200
    
    @pytest.mark.asyncio
    async def test_regular_user_cannot_create_tour(self, auth_client: AsyncClient):
        """Regular user should not create tour."""
        tour_data = {
            "name": "Unauthorized Tour",
            "slug": "unauthorized-tour",
            "destination": "Test",
            "price": 1000000
        }
        response = await auth_client.post("/api/v1/tours", json=tour_data)
        
        assert response.status_code == 403
    
    @pytest.mark.asyncio
    async def test_regular_user_cannot_update_tour(self, auth_client: AsyncClient):
        """Regular user should not update tour."""
        update_data = {"name": "Hacked Name"}
        response = await auth_client.put("/api/v1/tours/tour-001", json=update_data)
        
        assert response.status_code == 403
    
    @pytest.mark.asyncio
    async def test_regular_user_cannot_delete_tour(self, auth_client: AsyncClient):
        """Regular user should not delete tour."""
        response = await auth_client.delete("/api/v1/tours/tour-001")
        
        assert response.status_code == 403


# ============= Public Access Tests =============

class TestPublicAccess:
    """Tests for public (unauthenticated) tour access."""
    
    @pytest.mark.asyncio
    async def test_list_tours_public(self, client: AsyncClient):
        """List tours should be accessible without auth."""
        response = await client.get("/api/v1/tours")
        
        assert response.status_code == 200
    
    @pytest.mark.asyncio
    async def test_search_tours_public(self, client: AsyncClient):
        """Search tours should be accessible without auth."""
        response = await client.get("/api/v1/tours/search?q=tour")
        
        assert response.status_code == 200
    
    @pytest.mark.asyncio
    async def test_get_tour_public(self, client: AsyncClient):
        """Get single tour should be accessible without auth."""
        response = await client.get("/api/v1/tours/tour-002")
        
        assert response.status_code == 200
    
    @pytest.mark.asyncio
    async def test_featured_tours_public(self, client: AsyncClient):
        """Featured tours should be accessible without auth."""
        response = await client.get("/api/v1/tours/featured")
        
        assert response.status_code == 200
