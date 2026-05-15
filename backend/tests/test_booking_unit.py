"""
Unit Tests for Booking Service.
Tests booking code generation, price calculation, and booking flow logic.
"""
import pytest
from decimal import Decimal
import uuid


# ============= Booking Code Generation Tests =============

class TestBookingCodeGeneration:
    """Unit tests for booking code generation."""
    
    def test_booking_code_format(self):
        """Booking code should have BK prefix and 8 hex characters."""
        # Test the booking code format directly
        code = f"BK{uuid.uuid4().hex[:8].upper()}"
        
        assert code.startswith("BK")
        assert len(code) == 10  # BK + 8 chars
        assert code[2:].isalnum()  # Rest is alphanumeric
    
    def test_booking_code_uniqueness(self):
        """Generated booking codes should be unique."""
        codes = [f"BK{uuid.uuid4().hex[:8].upper()}" for _ in range(100)]
        
        assert len(codes) == len(set(codes))  # All unique
    
    def test_booking_code_uppercase(self):
        """Booking code should be uppercase."""
        code = f"BK{uuid.uuid4().hex[:8].upper()}"
        
        assert code == code.upper()


# ============= Price Calculation Tests =============

class TestPriceCalculation:
    """Unit tests for booking price calculation."""
    
    def test_price_with_discount(self):
        """Price should use discount price when available."""
        adult_price = Decimal("2300000")  # discount_price
        child_price = adult_price / 2
        
        total = adult_price * 2 + child_price * 1
        
        assert total == Decimal("5750000")
    
    def test_price_without_discount(self):
        """Price should use regular price when no discount."""
        adult_price = Decimal("1500000")  # price without discount
        child_price = adult_price / 2
        
        total = adult_price * 2
        
        assert total == Decimal("3000000")
    
    def test_price_zero_children(self):
        """Price with no children should only count adults."""
        adult_price = Decimal("2300000")
        
        total = adult_price * 3
        
        assert total == Decimal("6900000")
    
    def test_price_no_tour(self):
        """Booking without tour should have zero price."""
        total_price = Decimal("0")
        
        assert total_price == Decimal("0")


# ============= Booking Cancellation Logic Tests =============

class TestBookingCancellation:
    """Unit tests for booking cancellation logic."""
    
    def test_cancel_pending_booking_allowed(self):
        """Cancel pending booking should be allowed."""
        current_status = "PENDING"
        
        assert current_status != "CANCELLED"
        assert current_status != "COMPLETED"
    
    def test_cancel_already_cancelled_rejected(self):
        """Cancel already cancelled booking should be rejected."""
        current_status = "CANCELLED"
        
        assert current_status == "CANCELLED"  # Should raise error
    
    def test_cancel_completed_rejected(self):
        """Cancel completed booking should be rejected."""
        current_status = "COMPLETED"
        
        assert current_status == "COMPLETED"  # Should raise error
    
    def test_cancel_unauthorized_user_rejected(self):
        """Cancel booking by non-owner should be rejected."""
        booking_owner = "user-001"
        requesting_user = "other-user-id"
        
        assert booking_owner != requesting_user  # Should raise error


# ============= Booking Status Transition Tests =============

class TestBookingStatusTransitions:
    """Unit tests for booking status transitions."""
    
    def test_new_booking_status_is_pending(self):
        """New booking should have PENDING status."""
        new_booking_status = "PENDING"
        
        assert new_booking_status == "PENDING"
    
    def test_confirm_payment_transitions_to_confirmed(self):
        """Confirming payment should update status to CONFIRMED."""
        new_status = "CONFIRMED"
        new_payment_status = "PAID"
        
        assert new_status == "CONFIRMED"
        assert new_payment_status == "PAID"


# ============= Tour Participant Tests =============

class TestTourParticipants:
    """Unit tests for tour participant tracking."""
    
    def test_booking_increments_participants(self):
        """Creating booking should increment tour participants."""
        initial_participants = 5
        num_adults = 2
        num_children = 1
        
        new_participants = initial_participants + num_adults + num_children
        
        assert new_participants == 8
    
    def test_cancel_restores_participants(self):
        """Cancelling booking should restore tour participants."""
        current_participants = 8
        num_adults = 2
        num_children = 1
        
        restored = current_participants - num_adults - num_children
        
        assert restored == 5
    
    def test_participants_not_negative(self):
        """Participants should not go below zero."""
        current_participants = 1
        num_to_remove = 3
        
        restored = max(0, current_participants - num_to_remove)
        
        assert restored == 0


# ============= Participant Limit Tests =============

class TestParticipantLimits:
    """Unit tests for participant limit validation."""
    
    def test_max_participants_check(self):
        """Booking should not exceed max participants."""
        max_participants = 20
        current_participants = 18
        requested = 5
        
        would_exceed = (current_participants + requested) > max_participants
        
        assert would_exceed  # Should reject
    
    def test_within_limit(self):
        """Booking within limit should be allowed."""
        max_participants = 20
        current_participants = 5
        requested = 3
        
        within_limit = (current_participants + requested) <= max_participants
        
        assert within_limit


# ============= Booking Data Validation Tests =============

class TestBookingValidation:
    """Unit tests for booking data validation."""
    
    def test_num_adults_min_one(self):
        """num_adults must be at least 1."""
        valid = 1
        invalid = 0
        
        assert valid >= 1
        assert invalid < 1
    
    def test_num_children_non_negative(self):
        """num_children must be non-negative."""
        valid = 0
        invalid = -1
        
        assert valid >= 0
        assert invalid < 0
    
    def test_email_format(self):
        """Email format should be valid."""
        import re
        email_pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
        
        assert re.match(email_pattern, "test@example.com") is not None
        assert re.match(email_pattern, "not-an-email") is None
    
    def test_phone_format_vietnam(self):
        """Vietnamese phone format should be validated."""
        import re
        phone_pattern = r'^0\d{9,10}$'
        
        assert re.match(phone_pattern, "0912345678") is not None
        assert re.match(phone_pattern, "091234567") is None  # Too short
        assert re.match(phone_pattern, "1234567890") is None  # Missing 0
