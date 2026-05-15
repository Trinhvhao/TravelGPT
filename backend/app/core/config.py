from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


def parse_bool(value) -> bool:
    """Parse boolean from string"""
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() not in ('false', '0', 'no', 'off', '')
    return bool(value)


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://localhost:5432/travelgpt"

    # Redis
    redis_url: str = "redis://localhost:6379"

    # JWT
    jwt_secret_key: str = "supersecretkey123"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # AI / LLM
    aiclien2api_key: str = ""
    llm_base_url: str = "http://localhost:20128/v1"
    llm_api_key: str = "sk-a3492a525d6285c9-pswy99-54bde49b"
    llm_model: str = "kr/claude-sonnet-4.5"

    # Mem0 Memory (optional - uses fallback if not set)
    # Maps from MEM0_API_KEY env var
    mem0_api_key: Optional[str] = None
    mem0_host: Optional[str] = None  # Self-hosted Mem0 server

    # Session
    session_ttl: int = 3600  # 1 hour default session TTL

    # Logging
    log_level: str = "INFO"
    log_file: Optional[str] = None

    # App
    app_name: str = "TravelGPT API"
    app_debug: bool = True

    @property
    def debug(self) -> bool:
        """Alias for app_debug"""
        return self.app_debug

    @property
    def use_redis(self) -> bool:
        """Check if Redis is configured and should be used."""
        return bool(self.redis_url and self.redis_url != "redis://localhost:6379")

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
