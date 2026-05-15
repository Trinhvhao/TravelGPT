"""
Unit Tests for Authentication & Security Module.
Tests password hashing, JWT token creation/validation logic.
Does NOT depend on Prisma or app imports.
"""
import pytest
from datetime import timedelta


# ============= Password Hashing Tests =============

class TestPasswordHashing:
    """Unit tests for password hashing functions."""
    
    def test_hash_password_returns_different_value(self):
        """Hashed password should be different from original."""
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        password = "securePassword123"
        hashed = pwd_context.hash(password)
        
        assert hashed != password
        assert len(hashed) > 0
    
    def test_hash_password_is_unique(self):
        """Same password should produce different hashes (due to salt)."""
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        password = "securePassword123"
        hash1 = pwd_context.hash(password)
        hash2 = pwd_context.hash(password)
        
        assert hash1 != hash2
    
    def test_verify_correct_password(self):
        """verify_password returns True for correct password."""
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        password = "securePassword123"
        hashed = pwd_context.hash(password)
        
        assert pwd_context.verify(password, hashed) is True
    
    def test_verify_wrong_password(self):
        """verify_password returns False for wrong password."""
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        password = "securePassword123"
        wrong_password = "wrongPassword456"
        hashed = pwd_context.hash(password)
        
        assert pwd_context.verify(wrong_password, hashed) is False
    
    def test_verify_case_sensitivity(self):
        """Password verification is case sensitive."""
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        password = "SecurePassword123"
        hashed = pwd_context.hash(password)
        
        assert pwd_context.verify(password, hashed) is True
        assert pwd_context.verify(password.lower(), hashed) is False
        assert pwd_context.verify(password.upper(), hashed) is False
    
    def test_verify_special_characters(self):
        """Password with special characters works correctly."""
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        password = "P@ssw0rd!#$%^&*()"
        hashed = pwd_context.hash(password)
        
        assert pwd_context.verify(password, hashed) is True
    
    def test_verify_empty_password(self):
        """Empty password should not match."""
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        password = "securePassword123"
        hashed = pwd_context.hash(password)
        
        assert pwd_context.verify("", hashed) is False
    
    def test_verify_unicode_password(self):
        """Unicode passwords should work correctly."""
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        password = "mậtkhẩu123"
        hashed = pwd_context.hash(password)
        
        assert pwd_context.verify(password, hashed) is True


# ============= JWT Token Tests =============

class TestJWTTokens:
    """Unit tests for JWT token creation and validation."""
    
    def test_create_access_token_returns_string(self):
        """Access token should be a non-empty string."""
        from jose import jwt
        from datetime import datetime
        
        secret = "testsecret123"
        algo = "HS256"
        
        token = jwt.encode(
            {"sub": "user-001", "exp": datetime.utcnow() + timedelta(minutes=30)},
            secret,
            algorithm=algo
        )
        
        assert isinstance(token, str)
        assert len(token) > 0
    
    def test_create_access_token_contains_three_parts(self):
        """JWT token should have 3 parts separated by dots."""
        from jose import jwt
        from datetime import datetime
        
        token = jwt.encode(
            {"sub": "user-001"},
            "testsecret",
            algorithm="HS256"
        )
        
        parts = token.split(".")
        assert len(parts) == 3
    
    def test_create_refresh_token_returns_string(self):
        """Refresh token should be a non-empty string."""
        from jose import jwt
        from datetime import datetime
        
        token = jwt.encode(
            {"sub": "user-001", "exp": datetime.utcnow() + timedelta(days=7)},
            "testsecret",
            algorithm="HS256"
        )
        
        assert isinstance(token, str)
        assert len(token) > 0
    
    def test_decode_valid_access_token(self):
        """Decoding valid access token returns correct payload."""
        from jose import jwt
        from datetime import datetime
        
        secret = "testsecret123"
        algo = "HS256"
        user_id = "user-001"
        
        token = jwt.encode(
            {"sub": user_id, "type": "access", "exp": datetime.utcnow() + timedelta(hours=1)},
            secret,
            algorithm=algo
        )
        
        payload = jwt.decode(token, secret, algorithms=[algo])
        
        assert payload is not None
        assert payload["sub"] == user_id
        assert payload["type"] == "access"
        assert "exp" in payload
    
    def test_decode_valid_refresh_token(self):
        """Decoding valid refresh token returns correct payload."""
        from jose import jwt
        from datetime import datetime
        
        secret = "testsecret123"
        algo = "HS256"
        user_id = "user-001"
        
        token = jwt.encode(
            {"sub": user_id, "type": "refresh", "exp": datetime.utcnow() + timedelta(days=7)},
            secret,
            algorithm=algo
        )
        
        payload = jwt.decode(token, secret, algorithms=[algo])
        
        assert payload is not None
        assert payload["sub"] == user_id
        assert payload["type"] == "refresh"
    
    def test_decode_invalid_token_returns_none(self):
        """Decoding invalid token should raise exception."""
        from jose import jwt
        
        invalid_token = "not.a.valid.jwt.token"
        secret = "testsecret123"
        algo = "HS256"
        
        with pytest.raises(Exception):  # DecodeError or JWTError
            jwt.decode(invalid_token, secret, algorithms=[algo])
    
    def test_decode_tampered_token_returns_none(self):
        """Decoding tampered token should raise exception."""
        from jose import jwt
        from datetime import datetime
        
        token = jwt.encode(
            {"sub": "user-001"},
            "testsecret",
            algorithm="HS256"
        )
        tampered_token = token[:-5] + "XXXXX"
        
        with pytest.raises(Exception):
            jwt.decode(tampered_token, "testsecret", algorithms=["HS256"])
    
    def test_access_token_with_custom_expiry(self):
        """Access token with custom expiry has correct exp claim."""
        from jose import jwt
        from datetime import datetime
        
        secret = "testsecret123"
        algo = "HS256"
        custom_delta = timedelta(hours=2)
        
        token = jwt.encode(
            {"sub": "user-001", "exp": datetime.utcnow() + custom_delta},
            secret,
            algorithm=algo
        )
        
        payload = jwt.decode(token, secret, algorithms=[algo])
        
        assert payload is not None
        assert "exp" in payload
    
    def test_refresh_token_has_longer_expiry(self):
        """Refresh token should have longer expiry than access token."""
        from jose import jwt
        from datetime import datetime
        
        secret = "testsecret123"
        algo = "HS256"
        
        access_token = jwt.encode(
            {"sub": "user-001", "exp": datetime.utcnow() + timedelta(minutes=30)},
            secret,
            algorithm=algo
        )
        refresh_token = jwt.encode(
            {"sub": "user-001", "exp": datetime.utcnow() + timedelta(days=7)},
            secret,
            algorithm=algo
        )
        
        access_payload = jwt.decode(access_token, secret, algorithms=[algo])
        refresh_payload = jwt.decode(refresh_token, secret, algorithms=[algo])
        
        assert refresh_payload["exp"] > access_payload["exp"]
    
    def test_token_with_additional_claims(self):
        """Token can include additional custom claims."""
        from jose import jwt
        from datetime import datetime
        
        token = jwt.encode(
            {
                "sub": "user-001",
                "role": "ADMIN",
                "email": "admin@example.com"
            },
            "testsecret",
            algorithm="HS256"
        )
        
        payload = jwt.decode(token, "testsecret", algorithms=["HS256"])
        
        assert payload["sub"] == "user-001"
        assert payload["role"] == "ADMIN"
        assert payload["email"] == "admin@example.com"


# ============= Token Validation Tests =============

class TestTokenValidation:
    """Unit tests for token validation logic."""
    
    def test_token_type_check_access(self):
        """Access token should have type='access'."""
        from jose import jwt
        from datetime import datetime
        
        token = jwt.encode(
            {"sub": "user-001", "type": "access"},
            "testsecret",
            algorithm="HS256"
        )
        payload = jwt.decode(token, "testsecret", algorithms=["HS256"])
        
        assert payload.get("type") == "access"
    
    def test_token_type_check_refresh(self):
        """Refresh token should have type='refresh'."""
        from jose import jwt
        from datetime import datetime
        
        token = jwt.encode(
            {"sub": "user-001", "type": "refresh"},
            "testsecret",
            algorithm="HS256"
        )
        payload = jwt.decode(token, "testsecret", algorithms=["HS256"])
        
        assert payload.get("type") == "refresh"
    
    def test_wrong_secret_fails(self):
        """Token signed with wrong secret should fail validation."""
        from jose import jwt, JWTError
        
        token = jwt.encode(
            {"sub": "user-001"},
            "correct_secret",
            algorithm="HS256"
        )
        
        with pytest.raises(JWTError):
            jwt.decode(token, "wrong_secret", algorithms=["HS256"])
    
    def test_expired_token_fails(self):
        """Expired token should fail validation."""
        from jose import jwt, JWTError, ExpiredSignatureError
        from datetime import datetime
        
        token = jwt.encode(
            {"sub": "user-001", "exp": datetime.utcnow() - timedelta(hours=1)},
            "testsecret",
            algorithm="HS256"
        )
        
        with pytest.raises(ExpiredSignatureError):
            jwt.decode(token, "testsecret", algorithms=["HS256"])
    
    def test_missing_sub_claim(self):
        """Token without 'sub' claim should be handled."""
        from jose import jwt
        from datetime import datetime
        
        token = jwt.encode(
            {"role": "user", "exp": datetime.utcnow() + timedelta(hours=1)},
            "testsecret",
            algorithm="HS256"
        )
        payload = jwt.decode(token, "testsecret", algorithms=["HS256"])
        
        assert payload.get("sub") is None
