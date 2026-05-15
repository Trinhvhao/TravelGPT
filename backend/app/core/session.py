"""
Session Management - Production Ready
Uses Redis for distributed session storage with TTL.
Fallback to in-memory with size limit for development.
"""
import json
import logging
from typing import Optional, Any, Dict
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from threading import Lock
import time

logger = logging.getLogger(__name__)

# Try to import Redis
try:
    import redis.asyncio as redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False


@dataclass
class SessionConfig:
    """Session configuration."""
    default_ttl: int = 3600  # 1 hour
    max_memory_sessions: int = 1000  # Max sessions in memory fallback
    cleanup_interval: int = 300  # Cleanup every 5 minutes


class RedisSessionStore:
    """
    Redis-backed session store.
    Production-ready with proper connection pooling.
    """

    def __init__(
        self,
        redis_url: str,
        ttl: int = 3600,
        key_prefix: str = "travelgpt:session:"
    ):
        if not REDIS_AVAILABLE:
            raise RuntimeError("redis package not installed")

        self.redis_url = redis_url
        self.ttl = ttl
        self.key_prefix = key_prefix

        # Connection pool for production
        self._pool: Optional["redis.ConnectionPool"] = None
        self._client: Optional["redis.Redis"] = None

    async def _get_client(self) -> "redis.Redis":
        """Get Redis client with connection pooling."""
        if self._client is None:
            self._pool = redis.ConnectionPool.from_url(
                self.redis_url,
                max_connections=50,
                decode_responses=True
            )
            self._client = redis.Redis(connection_pool=self._pool)
        return self._client

    async def close(self):
        """Close Redis connection."""
        if self._client:
            await self._client.close()
        if self._pool:
            await self._pool.disconnect()

    def _key(self, session_id: str) -> str:
        return f"{self.key_prefix}{session_id}"

    async def get(self, session_id: str) -> Optional[Dict]:
        """Get session data."""
        client = await self._get_client()
        data = await client.get(self._key(session_id))
        if data:
            return json.loads(data)
        return None

    async def set(self, session_id: str, data: Dict, ttl: Optional[int] = None) -> bool:
        """Set session data with TTL."""
        client = await self._get_client()
        key = self._key(session_id)
        await client.setex(
            key,
            ttl or self.ttl,
            json.dumps(data, default=str)
        )
        return True

    async def delete(self, session_id: str) -> bool:
        """Delete session."""
        client = await self._get_client()
        await client.delete(self._key(session_id))
        return True

    async def exists(self, session_id: str) -> bool:
        """Check if session exists."""
        client = await self._get_client()
        return await client.exists(self._key(session_id)) > 0

    async def touch(self, session_id: str, ttl: Optional[int] = None) -> bool:
        """Refresh session TTL."""
        client = await self._get_client()
        return await client.expire(
            self._key(session_id),
            ttl or self.ttl
        )

    async def keys(self, pattern: str = "*") -> list:
        """Get all session keys matching pattern."""
        client = await self._get_client()
        keys = []
        async for key in client.scan_iter(f"{self.key_prefix}{pattern}"):
            keys.append(key.replace(self.key_prefix, ""))
        return keys


class MemorySessionStore:
    """
    In-memory session store with LRU eviction.
    Fallback for development or when Redis unavailable.
    """

    def __init__(
        self,
        max_sessions: int = 1000,
        default_ttl: int = 3600
    ):
        self.max_sessions = max_sessions
        self.default_ttl = default_ttl
        self._store: Dict[str, Dict] = {}
        self._access_times: Dict[str, float] = {}
        self._lock = Lock()
        self._last_cleanup = time.time()

    def _maybe_cleanup(self):
        """Periodic cleanup of expired sessions."""
        now = time.time()
        if now - self._last_cleanup > 300:  # Every 5 minutes
            self._cleanup_expired()
            self._last_cleanup = now

    def _cleanup_expired(self):
        """Remove expired sessions."""
        now = time.time()
        expired = [
            sid for sid, meta in self._access_times.items()
            if now - meta > self.default_ttl
        ]
        for sid in expired:
            self._store.pop(sid, None)
            self._access_times.pop(sid, None)

    def _evict_if_needed(self):
        """Evict LRU session if at capacity."""
        if len(self._store) >= self.max_sessions:
            # Find LRU session
            lru_sid = min(self._access_times, key=self._access_times.get)
            self._store.pop(lru_sid, None)
            self._access_times.pop(lru_sid, None)

    def get(self, session_id: str) -> Optional[Dict]:
        """Get session data."""
        with self._lock:
            self._maybe_cleanup()
            if session_id in self._store:
                meta = self._access_times.get(session_id, 0)
                if time.time() - meta <= self.default_ttl:
                    self._access_times[session_id] = time.time()
                    return self._store.get(session_id)
                else:
                    # Expired
                    self._store.pop(session_id, None)
                    self._access_times.pop(session_id, None)
            return None

    def set(self, session_id: str, data: Dict, ttl: Optional[int] = None) -> bool:
        """Set session data."""
        with self._lock:
            self._maybe_cleanup()
            self._evict_if_needed()
            self._store[session_id] = data
            self._access_times[session_id] = time.time()
            return True

    def delete(self, session_id: str) -> bool:
        """Delete session."""
        with self._lock:
            self._store.pop(session_id, None)
            self._access_times.pop(session_id, None)
            return True

    def exists(self, session_id: str) -> bool:
        """Check if session exists and not expired."""
        return self.get(session_id) is not None

    def touch(self, session_id: str, ttl: Optional[int] = None) -> bool:
        """Refresh session TTL."""
        with self._lock:
            if session_id in self._store:
                self._access_times[session_id] = time.time()
                return True
            return False

    def keys(self, pattern: str = "*") -> list:
        """Get all session IDs matching pattern."""
        with self._lock:
            self._maybe_cleanup()
            if pattern == "*":
                return list(self._store.keys())
            import fnmatch
            return [sid for sid in self._store.keys() if fnmatch.fnmatch(sid, pattern)]

    @property
    def size(self) -> int:
        """Current number of sessions."""
        return len(self._store)


# Global session store instance
_session_store: Optional[RedisSessionStore | MemorySessionStore] = None


def get_session_store() -> RedisSessionStore | MemorySessionStore:
    """Get or create global session store."""
    global _session_store
    if _session_store is None:
        from app.core.config import get_settings
        settings = get_settings()

        if settings.redis_url and REDIS_AVAILABLE:
            logger.info(f"Using Redis session store: {settings.redis_url}")
            _session_store = RedisSessionStore(
                redis_url=settings.redis_url,
                ttl=settings.session_ttl or 3600
            )
        else:
            logger.warning("Using in-memory session store (not for production)")
            _session_store = MemorySessionStore(
                max_sessions=1000,
                default_ttl=settings.session_ttl or 3600
            )
    return _session_store


async def close_session_store():
    """Close session store connections."""
    global _session_store
    if _session_store and isinstance(_session_store, RedisSessionStore):
        await _session_store.close()
    _session_store = None


class Session:
    """
    Session wrapper for easy access to session data.
    Usage:
        session = await Session.get("session_id")
        await session.set("user_id", "123")
        user_id = await session.get("user_id")
        await session.delete()
    """

    def __init__(self, session_id: str, store: RedisSessionStore | MemorySessionStore):
        self.session_id = session_id
        self.store = store
        self._data: Optional[Dict] = None
        self._loaded = False

    async def load(self) -> Dict:
        """Load session data from store."""
        if not self._loaded:
            self._data = await self.store.get(self.session_id) or {}
            self._loaded = True
        return self._data

    async def get(self, key: str, default: Any = None) -> Any:
        """Get session value."""
        data = await self.load()
        return data.get(key, default)

    async def set(self, key: str, value: Any) -> bool:
        """Set session value."""
        data = await self.load()
        data[key] = value
        return await self.store.set(self.session_id, data)

    async def delete(self) -> bool:
        """Delete session."""
        return await self.store.delete(self.session_id)

    async def exists(self) -> bool:
        """Check if session exists."""
        return await self.store.exists(self.session_id)

    async def touch(self) -> bool:
        """Refresh session TTL."""
        return await self.store.touch(self.session_id)

    @classmethod
    async def get(cls, session_id: str) -> "Session":
        """Get or create session."""
        store = get_session_store()
        return cls(session_id, store)
