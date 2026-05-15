"""
Redis Cache Module - High-performance caching cho TravelGPT
- Tour data caching
- Session caching
- Recommendation caching
- Rate limiting support
"""
from typing import Any, Optional, List
from datetime import datetime, timedelta
import json
import hashlib

try:
    import redis.asyncio as redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    redis = None


class CacheConfig:
    """Cache configuration"""
    # TTL in seconds
    TOUR_TTL = 3600  # 1 hour
    TOUR_LIST_TTL = 1800  # 30 minutes
    FEATURED_TTL = 300  # 5 minutes
    SEARCH_TTL = 600  # 10 minutes
    RECOMMENDATION_TTL = 900  # 15 minutes
    SESSION_TTL = 86400  # 24 hours
    USER_PREF_TTL = 604800  # 7 days


class AsyncCache:
    """
    Async Redis Cache với fallback to in-memory
    """
    
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis_client = None
        self.redis_url = redis_url
        self.use_redis = False
        
        # Fallback in-memory cache
        self.memory_cache: dict = {}
        self.memory_expiry: dict = {}
    
    async def connect(self):
        """Connect to Redis"""
        if not REDIS_AVAILABLE:
            print("Redis not available, using in-memory cache")
            return
        
        try:
            self.redis_client = redis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True
            )
            await self.redis_client.ping()
            self.use_redis = True
            print("Connected to Redis")
        except Exception as e:
            print(f"Redis connection failed: {e}, using in-memory cache")
            self.use_redis = False
    
    async def disconnect(self):
        """Disconnect from Redis"""
        if self.redis_client:
            await self.redis_client.close()
    
    # ============= Tour Caching =============
    
    async def get_tour(self, tour_id: str) -> Optional[dict]:
        """Get single tour from cache"""
        key = f"tour:{tour_id}"
        return await self._get(key)
    
    async def set_tour(self, tour_id: str, tour_data: dict):
        """Cache single tour"""
        key = f"tour:{tour_id}"
        await self._set(key, tour_data, ttl=CacheConfig.TOUR_TTL)
    
    async def invalidate_tour(self, tour_id: str):
        """Invalidate tour cache"""
        key = f"tour:{tour_id}"
        await self._delete(key)
    
    async def get_tour_list(
        self,
        destination: Optional[str] = None,
        region: Optional[str] = None,
        category: Optional[str] = None,
        page: int = 1,
        page_size: int = 12
    ) -> Optional[dict]:
        """Get paginated tour list from cache"""
        cache_key = self._hash_key(
            f"tours:list:{destination}:{region}:{category}:{page}:{page_size}"
        )
        return await self._get(cache_key)
    
    async def set_tour_list(
        self,
        tours_data: dict,
        destination: Optional[str] = None,
        region: Optional[str] = None,
        category: Optional[str] = None,
        page: int = 1,
        page_size: int = 12
    ):
        """Cache paginated tour list"""
        cache_key = self._hash_key(
            f"tours:list:{destination}:{region}:{category}:{page}:{page_size}"
        )
        await self._set(cache_key, tours_data, ttl=CacheConfig.TOUR_LIST_TTL)
    
    async def invalidate_tour_lists(self):
        """Invalidate all tour lists (call when tour data changes)"""
        if self.use_redis:
            # Use pattern matching to delete all tour list keys
            async for key in self.redis_client.scan_iter("tours:list:*"):
                await self.redis_client.delete(key)
        else:
            # Clear from memory cache
            keys_to_delete = [
                k for k in self.memory_cache.keys()
                if k.startswith("tours:list:")
            ]
            for key in keys_to_delete:
                del self.memory_cache[key]
    
    async def get_featured_tours(self) -> Optional[List[dict]]:
        """Get featured tours from cache"""
        key = "tours:featured"
        return await self._get(key)
    
    async def set_featured_tours(self, tours: List[dict]):
        """Cache featured tours"""
        key = "tours:featured"
        await self._set(key, tours, ttl=CacheConfig.FEATURED_TTL)
    
    # ============= Search Caching =============
    
    async def get_search_results(self, query: str) -> Optional[List[dict]]:
        """Get search results from cache"""
        cache_key = self._hash_key(f"search:{query}")
        return await self._get(cache_key)
    
    async def set_search_results(self, query: str, results: List[dict]):
        """Cache search results"""
        cache_key = self._hash_key(f"search:{query}")
        await self._set(cache_key, results, ttl=CacheConfig.SEARCH_TTL)
    
    # ============= Session Caching =============
    
    async def get_session(self, session_id: str) -> Optional[dict]:
        """Get session data from cache"""
        key = f"session:{session_id}"
        return await self._get(key)
    
    async def set_session(self, session_id: str, session_data: dict):
        """Cache session data"""
        key = f"session:{session_id}"
        await self._set(key, session_data, ttl=CacheConfig.SESSION_TTL)
    
    async def invalidate_session(self, session_id: str):
        """Invalidate session"""
        key = f"session:{session_id}"
        await self._delete(key)
    
    # ============= User Preferences Caching =============
    
    async def get_user_preferences(self, user_id: str) -> Optional[dict]:
        """Get user preferences from cache"""
        key = f"user:prefs:{user_id}"
        return await self._get(key)
    
    async def set_user_preferences(self, user_id: str, preferences: dict):
        """Cache user preferences"""
        key = f"user:prefs:{user_id}"
        await self._set(key, preferences, ttl=CacheConfig.USER_PREF_TTL)
    
    # ============= AI Cache =============
    
    async def get_ai_recommendations(self, cache_key: str) -> Optional[List[dict]]:
        """Get cached AI recommendations"""
        key = f"ai:rec:{self._hash_key(cache_key)}"
        return await self._get(key)
    
    async def set_ai_recommendations(self, cache_key: str, recommendations: List[dict]):
        """Cache AI recommendations"""
        key = f"ai:rec:{self._hash_key(cache_key)}"
        await self._set(key, recommendations, ttl=CacheConfig.RECOMMENDATION_TTL)
    
    async def get_conversation_memory(self, session_id: str) -> Optional[dict]:
        """Get conversation memory from cache"""
        key = f"ai:memory:{session_id}"
        return await self._get(key)
    
    async def set_conversation_memory(self, session_id: str, memory: dict):
        """Cache conversation memory"""
        key = f"ai:memory:{session_id}"
        await self._set(key, memory, ttl=CacheConfig.SESSION_TTL)
    
    # ============= Core Cache Methods =============
    
    async def _get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if self.use_redis:
            try:
                value = await self.redis_client.get(key)
                if value:
                    return json.loads(value)
            except Exception as e:
                print(f"Cache get error: {e}")
        else:
            # Check memory cache
            if key in self.memory_cache:
                # Check expiry
                if key in self.memory_expiry:
                    if datetime.now() > self.memory_expiry[key]:
                        del self.memory_cache[key]
                        del self.memory_expiry[key]
                        return None
                return self.memory_cache[key]
        
        return None
    
    async def _set(self, key: str, value: Any, ttl: int = 3600):
        """Set value in cache"""
        serialized = json.dumps(value, default=str)
        
        if self.use_redis:
            try:
                await self.redis_client.setex(key, ttl, serialized)
            except Exception as e:
                print(f"Cache set error: {e}")
        else:
            # Store in memory
            self.memory_cache[key] = json.loads(serialized)
            self.memory_expiry[key] = datetime.now() + timedelta(seconds=ttl)
    
    async def _delete(self, key: str):
        """Delete key from cache"""
        if self.use_redis:
            try:
                await self.redis_client.delete(key)
            except Exception as e:
                print(f"Cache delete error: {e}")
        else:
            if key in self.memory_cache:
                del self.memory_cache[key]
            if key in self.memory_expiry:
                del self.memory_expiry[key]
    
    def _hash_key(self, key: str) -> str:
        """Create hash for long keys"""
        return hashlib.md5(key.encode()).hexdigest()
    
    async def clear_all(self):
        """Clear all cache"""
        if self.use_redis:
            try:
                await self.redis_client.flushdb()
            except Exception as e:
                print(f"Cache clear error: {e}")
        else:
            self.memory_cache.clear()
            self.memory_expiry.clear()
    
    async def get_cache_stats(self) -> dict:
        """Get cache statistics"""
        if self.use_redis:
            try:
                info = await self.redis_client.info("stats")
                return {
                    "type": "redis",
                    "hits": info.get("keyspace_hits", 0),
                    "misses": info.get("keyspace_misses", 0),
                    "connected": True
                }
            except:
                return {"type": "redis", "connected": False}
        else:
            return {
                "type": "memory",
                "keys": len(self.memory_cache),
                "connected": True
            }


# Global cache instance
cache = AsyncCache()


async def get_cache() -> AsyncCache:
    """Get cache instance"""
    return cache
