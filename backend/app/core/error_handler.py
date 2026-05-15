"""
Global Exception Handler Middleware
Provides consistent error responses and logging.
"""
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import traceback
import sys
import logging

from app.core.logging_config import get_logger

logger = get_logger("middleware.error_handler")


class AppException(Exception):
    """Base application exception."""

    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: dict = None
    ):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(message)


class NotFoundException(AppException):
    """Resource not found."""

    def __init__(self, message: str = "Resource not found", details: dict = None):
        super().__init__(message, status.HTTP_404_NOT_FOUND, details)


class UnauthorizedException(AppException):
    """Unauthorized access."""

    def __init__(self, message: str = "Unauthorized", details: dict = None):
        super().__init__(message, status.HTTP_401_UNAUTHORIZED, details)


class ForbiddenException(AppException):
    """Forbidden access."""

    def __init__(self, message: str = "Forbidden", details: dict = None):
        super().__init__(message, status.HTTP_403_FORBIDDEN, details)


class ValidationException(AppException):
    """Validation error."""

    def __init__(self, message: str = "Validation error", details: dict = None):
        super().__init__(message, status.HTTP_400_BAD_REQUEST, details)


class RateLimitException(AppException):
    """Rate limit exceeded."""

    def __init__(self, message: str = "Too many requests", details: dict = None):
        super().__init__(message, status.HTTP_429_TOO_MANY_REQUESTS, details)


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """Handle application exceptions."""
    logger.warning(
        f"App exception: {exc.message}",
        extra={"status_code": exc.status_code, "details": exc.details}
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.status_code,
                "message": exc.message,
                "details": exc.details
            }
        }
    )


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Handle Pydantic validation errors."""
    errors = []
    for error in exc.errors():
        errors.append({
            "field": ".".join(str(loc) for loc in error["loc"]),
            "message": error["msg"],
            "type": error["type"]
        })

    logger.warning(f"Validation error: {len(errors)} errors")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": 422,
                "message": "Validation error",
                "details": {"errors": errors}
            }
        }
    )


async def http_exception_handler(
    request: Request, exc: StarletteHTTPException
) -> JSONResponse:
    """Handle Starlette HTTP exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.status_code,
                "message": exc.detail,
                "details": {}
            }
        }
    )


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Handle all unhandled exceptions.
    Logs full traceback for debugging.
    """
    # Log full traceback
    import traceback, os
    tb = "".join(traceback.format_exception(*sys.exc_info()))
    log_path = "/tmp/travelgpt-error.log"
    with open(log_path, "a") as f:
        f.write(f"[ERROR at {os.linesep}{tb}{os.linesep}")
    exc_info = sys.exc_info()
    logger.error(
        f"Unhandled exception: {str(exc)}",
        exc_info=exc_info
    )

    # Return generic error to client (don't leak internal details)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": 500,
                "message": "Internal server error",
                "details": {}
            }
        }
    )


def register_exception_handlers(app):
    """Register all exception handlers to the FastAPI app."""
    from fastapi import FastAPI

    app.add_exception_handler(AppException, app_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(Exception, general_exception_handler)
