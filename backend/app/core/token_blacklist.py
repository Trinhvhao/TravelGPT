"""
Token Blacklist Service
Manages revoked JWT tokens for logout functionality.
Uses Redis for production, with TTL matching token expiry.
"""
import logging
from typing import Optional
from datetime import datetime, timedelta
from dataclasses import dataclass

logger = logging.getLogger(__name__)

# Try to import Redis
try:
    import redis.asyncio as redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False


@dataclass
class TokenBlacklist:
    """Token blacklist entry."""
    token_id: str  # jti claim or token hash
    user_id: str
    revoked_at: datetime
    expires_at: datetime


class TokenBlacklistService:
    """
    Service to manage token blacklist for logout/revoke functionality.

    Production: Uses Redis with token expiry as TTL.
    Fallback: Uses in-memory set (not suitable for multi-worker).
    """

    def __init__(self, redis_url: Optional[str] = None):
        self.redis_url = redis_url
        self._redis_client = None
        self._memory_set: set = set()

    async def _get_redis(self) -> Optional["redis.Redis"]:
        """Get Redis client with connection pooling."""
        if not REDIS_AVAILABLE or not self.redis_url:
            return None

        if self._redis_client is None:
            pool = redis.ConnectionPool.from_url(
                self.redis_url,
                max_connections=20,
                decode_responses=True
            )
            self._redis_client = redis.Redis(connection_pool=pool)
        return self._redis_client

    async def close(self):
        """Close Redis connection."""
        if self._redis_client:
            await self._redis_client.close()

    def _token_key(self, token_id: str) -> str:
        """Generate Redis key for token."""
        return f"blacklist:token:{token_id}"

    async def revoke_token(
        self,
        token_id: str,
        user_id: str,
        expires_at: datetime
    ) -> bool:
        """
        Add token to blacklist.

        Args:
            token_id: Unique token identifier (jti or hash)
            user_id: User who owns the token
            expires_at: When token expires (used as Redis TTL)

        Returns:
            True if successfully blacklisted
        """
        ttl_seconds = int((expires_at - datetime.utcnow()).total_seconds())

        if ttl_seconds <= 0:
            # Token already expired, no need to blacklist
            return True

        client = await self._get_redis()

        if client:
            try:
                await client.setex(
                    self._token_key(token_id),
                    ttl_seconds,
                    user_id
                )
                logger.info(f"Token blacklisted: {token_id[:20]}...")
                return True
            except Exception as e:
                logger.error(f"Failed to blacklist token in Redis: {e}")
                # Fall through to memory blacklist
                pass

        # Fallback to memory (will be lost on restart)
        self._memory_set.add(token_id)
        logger.warning(f"Token blacklisted in memory only: {token_id[:20]}...")
        return True

    async def is_blacklisted(self, token_id: str) -> bool:
        """
        Check if token is blacklisted.

        Args:
            token_id: Unique token identifier

        Returns:
            True if token is blacklisted (should be rejected)
        """
        client = await self._get_redis()

        if client:
            try:
                exists = await client.exists(self._token_key(token_id))
                return exists > 0
            except Exception as e:
                logger.error(f"Failed to check blacklist in Redis: {e}")
                # Fall through to memory check
                pass

        # Check memory fallback
        return token_id in self._memory_set

    async def revoke_all_user_tokens(
        self,
        user_id: str,
        exclude_token_id: Optional[str] = None
    ) -> int:
        """
        Revoke all tokens for a user (password change, logout all devices).

        Note: In production with stateless JWT, you need to track active tokens
        in Redis and check against them. This is a simplified version.

        Args:
            user_id: User to revoke all tokens for
            exclude_token_id: Optional token to keep valid (e.g., current session)

        Returns:
            Number of tokens revoked
        """
        # For stateless JWT, we'd need to track active tokens per user
        # This is a placeholder - implement with user session tracking
        logger.info(f"Revoke all tokens requested for user: {user_id}")
        return 0


# Global blacklist service
_blacklist_service: Optional[TokenBlacklistService] = None


def get_blacklist_service() -> TokenBlacklistService:
    """Get or create global blacklist service."""
    global _blacklist_service
    if _blacklist_service is None:
        from app.core.config import get_settings
        settings = get_settings()
        _blacklist_service = TokenBlacklistService(
            redis_url=settings.redis_url
        )
    return _blacklist_service


async def close_blacklist_service():
    """Close blacklist service."""
    global _blacklist_service
    if _blacklist_service:
        await _blacklist_service.close()
        _blacklist_service = None


def hash_token(token: str) -> str:
    """
    Create a hash of the token for storage.
    Doesn't expose the actual token.
    """
    import hashlib
    return hashlib.sha256(token.encode()).hexdigest()[:32]
