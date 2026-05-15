"""
Rate Limiting Module - API Protection cho TravelGPT
- Token bucket algorithm
- Per-user rate limiting
- Endpoint-specific limits
- DDoS protection
"""
from typing import Optional, Dict, Tuple
from datetime import datetime, timedelta
from fastapi import Request, HTTPException, Depends
from fastapi.responses import JSONResponse
from dataclasses import dataclass
import time

try:
    import redis.asyncio as redis
    from app.core.cache import cache
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False


@dataclass
class RateLimitConfig:
    """Rate limit configuration"""
    requests: int  # Max requests
    window: int    # Time window in seconds
    burst: int     # Max burst allowed
    refill_rate: float = None  # tokens per second (optional, calculated if not provided)
    
    def __post_init__(self):
        if self.refill_rate is None:
            self.refill_rate = self.requests / self.window if self.window > 0 else 1.0


class RateLimitTier:
    """Rate limit tiers"""
    # Default tier
    DEFAULT = RateLimitConfig(requests=60, window=60, burst=10)
    
    # Strict tier (for unauthenticated)
    ANONYMOUS = RateLimitConfig(requests=30, window=60, burst=5)
    
    # Authenticated users
    USER = RateLimitConfig(requests=120, window=60, burst=20)
    
    # Premium users
    PREMIUM = RateLimitConfig(requests=300, window=60, burst=50)
    
    # Admin endpoints
    ADMIN = RateLimitConfig(requests=1000, window=60, burst=100)
    
    # Chat endpoint (higher for AI conversations)
    CHAT = RateLimitConfig(requests=60, window=60, burst=10)
    
    # Search endpoint
    SEARCH = RateLimitConfig(requests=100, window=60, burst=20)
    
    # Auth endpoints (strict)
    AUTH = RateLimitConfig(requests=10, window=60, burst=3)


class TokenBucket:
    """
    Token Bucket Algorithm for rate limiting
    """
    
    def __init__(self, capacity: int, refill_rate: float):
        self.capacity = capacity
        self.tokens = capacity
        self.refill_rate = refill_rate  # tokens per second
        self.last_refill = time.time()
    
    def consume(self, tokens: int = 1) -> bool:
        """Try to consume tokens"""
        self._refill()
        
        if self.tokens >= tokens:
            self.tokens -= tokens
            return True
        return False
    
    def _refill(self):
        """Refill tokens based on elapsed time"""
        now = time.time()
        elapsed = now - self.last_refill
        
        tokens_to_add = elapsed * self.refill_rate
        self.tokens = min(self.capacity, self.tokens + tokens_to_add)
        self.last_refill = now
    
    def get_wait_time(self) -> float:
        """Get time to wait before next token available"""
        if self.tokens >= 1:
            return 0
        
        tokens_needed = 1 - self.tokens
        return tokens_needed / self.refill_rate


class RateLimiter:
    """
    Rate Limiter với Redis backend
    """
    
    def __init__(self):
        self.buckets: Dict[str, TokenBucket] = {}
    
    async def check_rate_limit(
        self,
        identifier: str,
        config: RateLimitConfig
    ) -> Tuple[bool, Dict[str, any]]:
        """
        Check if request is allowed.

        Returns:
            (is_allowed, headers)
        """
        key = f"ratelimit:{identifier}"

        if REDIS_AVAILABLE and cache.use_redis:
            try:
                return await self._check_redis(key, config)
            except Exception as e:
                # Fail CLOSE for Redis errors - block request if Redis is down
                # This prevents bypassing rate limits when Redis fails
                print(f"Rate limit Redis error: {e}")
                return False, {
                    "X-RateLimit-Limit": config.requests,
                    "X-RateLimit-Remaining": 0,
                    "X-RateLimit-Reset": int(time.time() + config.window),
                    "Retry-After": config.window
                }
        else:
            return self._check_memory(key, config)
    
    async def _check_redis(
        self,
        key: str,
        config: RateLimitConfig
    ) -> Tuple[bool, Dict[str, any]]:
        """Check rate limit using Redis"""
        try:
            current = await cache.redis_client.get(key)
            
            if current is None:
                # First request
                await cache.redis_client.setex(key, config.window, "1")
                remaining = config.requests - 1
            else:
                count = int(current)
                remaining = max(0, config.requests - count - 1)
                
                if count >= config.requests:
                    # Rate limited
                    ttl = await cache.redis_client.ttl(key)
                    return False, {
                        "X-RateLimit-Limit": config.requests,
                        "X-RateLimit-Remaining": 0,
                        "X-RateLimit-Reset": int(time.time() + ttl),
                        "Retry-After": ttl
                    }
                
                await cache.redis_client.incr(key)
            
            return True, {
                "X-RateLimit-Limit": config.requests,
                "X-RateLimit-Remaining": remaining,
                "X-RateLimit-Reset": int(time.time() + config.window)
            }
        except Exception as e:
            print(f"Rate limit check error: {e}")
            # FAIL CLOSE: Block request if Redis fails
            # This prevents bypass when Redis is down
            return False, {
                "X-RateLimit-Limit": config.requests,
                "X-RateLimit-Remaining": 0,
                "X-RateLimit-Reset": int(time.time() + config.window),
                "Retry-After": config.window
            }
    
    def _check_memory(
        self,
        key: str,
        config: RateLimitConfig
    ) -> Tuple[bool, Dict[str, any]]:
        """Check rate limit using memory (fallback)"""
        now = time.time()
        
        if key not in self.buckets:
            self.buckets[key] = {
                "count": 0,
                "window_start": now,
                "bucket": TokenBucket(config.burst, config.refill_rate)
            }
        
        bucket_data = self.buckets[key]
        
        # Reset window if expired
        if now - bucket_data["window_start"] >= config.window:
            bucket_data["count"] = 0
            bucket_data["window_start"] = now
            bucket_data["bucket"] = TokenBucket(config.burst, config.refill_rate)
        
        # Check limit
        if bucket_data["count"] >= config.requests:
            wait_time = config.window - (now - bucket_data["window_start"])
            return False, {
                "X-RateLimit-Limit": config.requests,
                "X-RateLimit-Remaining": 0,
                "X-RateLimit-Reset": int(now + wait_time),
                "Retry-After": int(wait_time)
            }
        
        # Consume
        bucket_data["count"] += 1
        
        return True, {
            "X-RateLimit-Limit": config.requests,
            "X-RateLimit-Remaining": config.requests - bucket_data["count"],
            "X-RateLimit-Reset": int(bucket_data["window_start"] + config.window)
        }
    
    def clear_bucket(self, identifier: str):
        """Clear rate limit for identifier"""
        key = f"ratelimit:{identifier}"
        if key in self.buckets:
            del self.buckets[key]


# Global rate limiter
rate_limiter = RateLimiter()


class RateLimitDependency:
    """
    FastAPI Dependency for rate limiting
    """
    
    def __init__(self, tier: str = "DEFAULT"):
        self.tier = tier
    
    async def __call__(self, request: Request) -> Dict[str, any]:
        """Check rate limit for request"""
        # Get identifier
        if request.headers.get("X-User-ID"):
            identifier = f"user:{request.headers['X-User-ID']}"
        elif request.headers.get("X-Session-ID"):
            identifier = f"session:{request.headers['X-Session-ID']}"
        else:
            # Fall back to IP
            identifier = f"ip:{request.client.host}"
        
        # Get config
        tier_configs = {
            "DEFAULT": RateLimitTier.DEFAULT,
            "ANONYMOUS": RateLimitTier.ANONYMOUS,
            "USER": RateLimitTier.USER,
            "PREMIUM": RateLimitTier.PREMIUM,
            "ADMIN": RateLimitTier.ADMIN,
            "CHAT": RateLimitTier.CHAT,
            "SEARCH": RateLimitTier.SEARCH,
            "AUTH": RateLimitTier.AUTH,
        }
        
        config = tier_configs.get(self.tier, RateLimitTier.DEFAULT)
        
        # Check rate limit
        allowed, headers = await rate_limiter.check_rate_limit(identifier, config)
        
        # Add headers to response
        if not allowed:
            raise HTTPException(
                status_code=429,
                detail={
                    "message": "Too many requests. Please slow down.",
                    "retry_after": headers.get("Retry-After", 60)
                },
                headers={
                    "X-RateLimit-Limit": str(headers["X-RateLimit-Limit"]),
                    "X-RateLimit-Remaining": str(headers["X-RateLimit-Remaining"]),
                    "X-RateLimit-Reset": str(headers["X-RateLimit-Reset"]),
                    "Retry-After": str(headers.get("Retry-After", 60))
                }
            )
        
        return headers


def get_client_ip(request: Request) -> str:
    """Get client IP address"""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host


async def rate_limit_middleware(request: Request, call_next):
    """Middleware for global rate limiting"""
    # Skip rate limiting for health checks
    if request.url.path in ["/health", "/", "/docs", "/openapi.json"]:
        return await call_next(request)
    
    # Get identifier
    ip = get_client_ip(request)
    identifier = f"ip:{ip}"
    
    # Apply default rate limit
    config = RateLimitTier.DEFAULT
    
    allowed, headers = await rate_limiter.check_rate_limit(identifier, config)
    
    if not allowed:
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many requests"},
            headers={
                "X-RateLimit-Limit": str(headers["X-RateLimit-Limit"]),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(headers["X-RateLimit-Reset"]),
                "Retry-After": str(headers.get("Retry-After", 60))
            }
        )
    
    response = await call_next(request)
    
    # Add rate limit headers
    response.headers["X-RateLimit-Limit"] = str(headers["X-RateLimit-Limit"])
    response.headers["X-RateLimit-Remaining"] = str(headers["X-RateLimit-Remaining"])
    response.headers["X-RateLimit-Reset"] = str(headers["X-RateLimit-Reset"])
    
    return response
