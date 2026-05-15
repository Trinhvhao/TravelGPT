"""
TravelGPT Core Module
"""
from app.core.config import Settings, get_settings
from app.core.cache import AsyncCache, cache, get_cache, CacheConfig
from app.core.rate_limit import (
    RateLimiter, 
    RateLimitTier, 
    rate_limiter, 
    RateLimitDependency,
    rate_limit_middleware
)
from app.core.jobs import (
    BackgroundJobProcessor,
    job_processor,
    send_booking_confirmation_email,
    schedule_booking_reminder
)
from app.core.docs import setup_api_docs

__all__ = [
    # Config
    "Settings",
    "get_settings",
    
    # Cache
    "AsyncCache",
    "cache",
    "get_cache",
    "CacheConfig",
    
    # Rate Limiting
    "RateLimiter",
    "RateLimitTier",
    "rate_limiter",
    "RateLimitDependency",
    "rate_limit_middleware",
    
    # Jobs
    "BackgroundJobProcessor",
    "job_processor",
    "send_booking_confirmation_email",
    "schedule_booking_reminder",
    
    # Docs
    "setup_api_docs",
]