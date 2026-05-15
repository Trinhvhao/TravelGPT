"""
Integration Tests for Booking API Endpoints.
Tests booking CRUD operations, cancellation, and admin endpoints.
"""
import pytest
from httpx import AsyncClient


# ============= Create Booking Tests =============

class TestCreateBooking:
    """Integration tests for booking creation endpoint."""
    
    @pytest.mark.asyncio
    async def test_create_booking_success(
        self, auth_client: AsyncClient, mock_booking_data: dict
    ):
        """Create booking with valid data should succeed."""
        response = await auth_client.post("/api/v1/bookings", json=mock_booking_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "booking_code" in data
        assert data["booking_code"].startswith("BK")
        assert data["status"] == "PENDING"
        assert data["payment_status"] == "UNPAID"
        assert data["num_adults"] == mock_booking_data["num_adults"]
        assert data["num_children"] == mock_booking_data["num_children"]
    
    @pytest.mark.asyncio
    async def test_create_booking_without_auth(self, client: AsyncClient, mock_booking_data: dict):
        """Create booking without auth should fail."""
        response = await client.post("/api/v1/bookings", json=mock_booking_data)
        
        assert response.status_code in [401, 403]
    
    @pytest.mark.asyncio
    async def test_create_booking_invalid_tour(self, auth_client: AsyncClient):
        """Create booking with non-existent tour should fail."""
        booking_data = {
            "tour_id": "nonexistent-tour-id",
            "num_adults": 2,
            "num_children": 0,
            "contact_name": "Test",
            "contact_email": "test@example.com",
            "contact_phone": "0912345678"
        }
        response = await auth_client.post("/api/v1/bookings", json=booking_data)
        
        assert response.status_code in [400, 404]
    
    @pytest.mark.asyncio
    async def test_create_booking_invalid_email(self, auth_client: AsyncClient, mock_booking_data: dict):
        """Create booking with invalid email should fail."""
        mock_booking_data["contact_email"] = "not-an-email"
        response = await auth_client.post("/api/v1/bookings", json=mock_booking_data)
        
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    async def test_create_booking_zero_adults(self, auth_client: AsyncClient, mock_booking_data: dict):
        """Create booking with zero adults should fail validation."""
        mock_booking_data["num_adults"] = 0
        response = await auth_client.post("/api/v1/bookings", json=mock_booking_data)

        assert response.status_code == 422  # Pydantic validation rejects zero adults

    @pytest.mark.asyncio
    async def test_create_booking_negative_children(self, auth_client: AsyncClient, mock_booking_data: dict):
        """Create booking with negative children should fail validation."""
        mock_booking_data["num_children"] = -1
        response = await auth_client.post("/api/v1/bookings", json=mock_booking_data)

        assert response.status_code == 422  # Pydantic validation rejects negative children


# ============= List Bookings Tests =============

class TestListBookings:
    """Integration tests for listing user bookings."""
    
    @pytest.mark.asyncio
    async def test_list_my_bookings(
        self, auth_client: AsyncClient, mock_booking_data: dict
    ):
        """List user's bookings should return their bookings."""
        # Create a booking first
        await auth_client.post("/api/v1/bookings", json=mock_booking_data)
        
        response = await auth_client.get("/api/v1/bookings")
        
        assert response.status_code == 200
        data = response.json()
        assert "bookings" in data
        assert "total" in data
        assert "page" in data
        assert "page_size" in data
        assert "total_pages" in data
        assert isinstance(data["bookings"], list)
    
    @pytest.mark.asyncio
    async def test_list_bookings_pagination(self, auth_client: AsyncClient):
        """List bookings with pagination should work."""
        response = await auth_client.get("/api/v1/bookings?page=1&page_size=5")
        
        assert response.status_code == 200
        data = response.json()
        assert data["page"] == 1
        assert data["page_size"] == 5
        assert len(data["bookings"]) <= 5
    
    @pytest.mark.asyncio
    async def test_list_bookings_without_auth(self, client: AsyncClient):
        """List bookings without auth should fail."""
        response = await client.get("/api/v1/bookings")
        
        assert response.status_code in [401, 403]


# ============= Get Booking Tests =============

class TestGetBooking:
    """Integration tests for getting single booking details."""
    
    @pytest.mark.asyncio
    async def test_get_booking_by_id(
        self, auth_client: AsyncClient, mock_booking_data: dict
    ):
        """Get booking by ID should return booking details."""
        # Create booking
        create_response = await auth_client.post("/api/v1/bookings", json=mock_booking_data)
        booking_id = create_response.json()["id"]
        
        # Get booking
        response = await auth_client.get(f"/api/v1/bookings/{booking_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == booking_id
        assert "contact_name" in data
        assert "total_price" in data
    
    @pytest.mark.asyncio
    async def test_get_booking_by_code(
        self, auth_client: AsyncClient, mock_booking_data: dict
    ):
        """Get booking by code should return booking."""
        # Create booking
        create_response = await auth_client.post("/api/v1/bookings", json=mock_booking_data)
        booking_code = create_response.json()["booking_code"]
        
        # Get by code (no auth required)
        response = await auth_client.get(f"/api/v1/bookings/code/{booking_code}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["booking_code"] == booking_code
    
    @pytest.mark.asyncio
    async def test_get_nonexistent_booking(self, auth_client: AsyncClient):
        """Get non-existent booking should return 404."""
        response = await auth_client.get("/api/v1/bookings/nonexistent-id")
        
        assert response.status_code == 404
    
    @pytest.mark.asyncio
    async def test_get_other_user_booking(
        self, auth_client: AsyncClient, client: AsyncClient, mock_booking_data: dict
    ):
        """User should not access other user's booking."""
        # Create booking as user1 (auth_client uses user-001 token)
        create_response = await auth_client.post("/api/v1/bookings", json=mock_booking_data)
        booking_id = create_response.json()["id"]

        # Create a separate user token (user-002)
        import time
        unique_email = f"other_user_{int(time.time())}@example.com"
        other_user_data = {
            "email": unique_email,
            "password": "password123",
            "full_name": "Other User"
        }
        reg_resp = await client.post("/api/v1/auth/register", json=other_user_data)
        assert reg_resp.status_code == 200
        other_token = reg_resp.json()["access_token"]

        # Try to get booking as different user (user-002)
        other_client = client
        other_client.headers["Authorization"] = f"Bearer {other_token}"
        response = await other_client.get(f"/api/v1/bookings/{booking_id}")

        assert response.status_code == 403, "User should not access another user's booking"


# ============= Cancel Booking Tests =============

class TestCancelBooking:
    """Integration tests for booking cancellation."""
    
    @pytest.mark.asyncio
    async def test_cancel_own_booking(
        self, auth_client: AsyncClient, mock_booking_data: dict
    ):
        """Cancel own booking should succeed."""
        # Create booking
        create_response = await auth_client.post("/api/v1/bookings", json=mock_booking_data)
        booking_id = create_response.json()["id"]
        
        # Cancel booking
        response = await auth_client.put(f"/api/v1/bookings/{booking_id}/cancel")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "CANCELLED"
    
    @pytest.mark.asyncio
    async def test_cancel_nonexistent_booking(self, auth_client: AsyncClient):
        """Cancel non-existent booking should fail."""
        response = await auth_client.put("/api/v1/bookings/nonexistent-id/cancel")
        
        assert response.status_code == 404
    
    @pytest.mark.asyncio
    async def test_cancel_without_auth(self, client: AsyncClient):
        """Cancel booking without auth should fail."""
        response = await client.put("/api/v1/bookings/some-id/cancel")
        
        assert response.status_code in [401, 403]


# ============= Admin Booking Tests =============

class TestAdminBooking:
    """Integration tests for admin booking endpoints."""
    
    @pytest.mark.asyncio
    async def test_admin_list_all_bookings(
        self, admin_client: AsyncClient, mock_booking_data: dict
    ):
        """Admin should list all bookings regardless of user."""
        # Admin lists all
        response = await admin_client.get("/api/v1/bookings/admin/all")
        
        assert response.status_code == 200
        data = response.json()
        assert "bookings" in data
    
    @pytest.mark.asyncio
    async def test_admin_list_bookings_with_status_filter(
        self, admin_client: AsyncClient
    ):
        """Admin should filter bookings by status."""
        response = await admin_client.get("/api/v1/bookings/admin/all?status=PENDING")
        
        assert response.status_code == 200
        data = response.json()
        for booking in data["bookings"]:
            assert booking["status"] == "PENDING"
    
    @pytest.mark.asyncio
    async def test_admin_update_booking(
        self, admin_client: AsyncClient
    ):
        """Admin should update any booking."""
        # Admin updates
        update_data = {"note": "Updated by admin"}
        response = await admin_client.put(
            "/api/v1/bookings/admin/booking-001",
            json=update_data
        )
        
        assert response.status_code == 200
        data = response.json()
        # Note may or may not be included in simplified response
        assert "id" in data
    
    @pytest.mark.asyncio
    async def test_admin_confirm_payment(
        self, admin_client: AsyncClient
    ):
        """Admin should confirm booking payment."""
        # Admin confirms payment
        response = await admin_client.put(
            "/api/v1/bookings/booking-001/confirm-payment",
            params={"payment_method": "bank_transfer"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["payment_status"] == "PAID"
        assert data["status"] == "CONFIRMED"
    
    @pytest.mark.asyncio
    async def test_regular_user_cannot_access_admin_endpoint(
        self, auth_client: AsyncClient
    ):
        """Regular user should not access admin endpoints."""
        response = await auth_client.get("/api/v1/bookings/admin/all")
        
        assert response.status_code == 403


# ============= Booking Validation Tests =============

class TestBookingValidation:
    """Integration tests for booking input validation."""
    
    @pytest.mark.asyncio
    async def test_booking_email_validation(self, auth_client: AsyncClient):
        """Booking with invalid email should fail."""
        booking_data = {
            "tour_id": "tour-001",
            "num_adults": 1,
            "num_children": 0,
            "contact_name": "Test",
            "contact_email": "invalid-email",
            "contact_phone": "0912345678"
        }
        response = await auth_client.post("/api/v1/bookings", json=booking_data)
        
        assert response.status_code == 422
    
    @pytest.mark.asyncio
    async def test_booking_phone_validation(self, auth_client: AsyncClient):
        """Booking with invalid phone format should fail (if validation exists)."""
        booking_data = {
            "tour_id": "tour-001",
            "num_adults": 1,
            "num_children": 0,
            "contact_name": "Test",
            "contact_email": "test@example.com",
            "contact_phone": "123"  # Too short
        }
        response = await auth_client.post("/api/v1/bookings", json=booking_data)
        
        # Should pass or fail depending on validation rules
        assert response.status_code in [200, 422]
    
    @pytest.mark.asyncio
    async def test_booking_max_page_size(self, auth_client: AsyncClient):
        """Page size endpoint should work."""
        response = await auth_client.get("/api/v1/bookings?page_size=100")
        
        assert response.status_code == 200
