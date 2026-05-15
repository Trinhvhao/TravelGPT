from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.core.prisma import connect_db, disconnect_db
from app.core.cache import cache
from app.core.rate_limit import rate_limit_middleware
from app.core.jobs import job_processor
from app.core.docs import setup_api_docs
from app.core.logging_config import setup_logging
from app.core.error_handler import register_exception_handlers
from app.core.session import close_session_store
from app.core.token_blacklist import close_blacklist_service
from app.core.llm_client import close_llm_client
from app.api.v1 import auth, tours, bookings, users, chat

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    setup_logging(level=settings.log_level or "INFO", json_format=True)
    await connect_db()
    await cache.connect()
    await job_processor.start()

    # Setup API docs
    setup_api_docs(app)

    yield

    # Shutdown - close connections gracefully
    await close_llm_client()
    await close_session_store()
    await close_blacklist_service()
    await cache.disconnect()
    await job_processor.stop()
    await disconnect_db()


app = FastAPI(
    title="TravelGPT API",
    description="AI Travel Agent - Chatbot tư vấn và đặt tour du lịch tự động",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Register exception handlers
register_exception_handlers(app)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate Limiting Middleware
app.middleware("http")(rate_limit_middleware)

# Include routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(tours.router, prefix="/api/v1")
app.include_router(bookings.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")


@app.get("/")
async def root():
    return {
        "message": "Welcome to TravelGPT API",
        "docs": "/docs",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    cache_stats = await cache.get_cache_stats()
    return {
        "status": "healthy",
        "cache": cache_stats
    }


@app.get("/stats")
async def get_stats():
    """Get system statistics"""
    return {
        "cache": await cache.get_cache_stats()
    }
