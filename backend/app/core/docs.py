"""
API Documentation - Swagger/OpenAPI Enhancement
"""
from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi


def custom_openapi(app: FastAPI):
    """
    Custom OpenAPI schema with enhanced documentation
    """
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title="TravelGPT API",
        version="1.0.0",
        description="""
## TravelGPT - AI Travel Agent API

API cho ứng dụng TravelGPT - Chatbot AI tư vấn và đặt tour du lịch tự động.

### Tính năng chính

- 🔍 **Tìm kiếm Tour** - Tìm kiếm tour theo điểm đến, ngân sách, thời gian
- 💬 **AI Chatbot** - Chatbot AI hỗ trợ tiếng Việt, hiểu ngữ cảnh
- 📋 **Đặt Tour** - Đặt tour tự động với xác nhận email
- 🎫 **Quản lý Booking** - Xem, hủy, đổi lịch booking
- 👤 **User Management** - Đăng ký, đăng nhập, quản lý tài khoản
- 🤖 **AI Recommendations** - Gợi ý tour cá nhân hóa dựa trên sở thích

### Authentication

API sử dụng JWT Bearer Token authentication.

```
Authorization: Bearer <your_token>
```

### Rate Limiting

| Tier | Requests/minute |
|------|----------------|
| Anonymous | 30 |
| User | 120 |
| Premium | 300 |
| Admin | 1000 |

### Errors

| Code | Mô tả |
|------|-------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid/missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 429 | Too Many Requests - Rate limited |
| 500 | Internal Server Error |

### Example Usage

```bash
# Get tours
curl -X GET "https://api.travelgpt.vn/api/v1/tours" \\
  -H "Authorization: Bearer <token>"

# Create booking
curl -X POST "https://api.travelgpt.vn/api/v1/bookings" \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{"tour_id": "xxx", "num_adults": 2}'
```
        """,
        routes=app.routes,
    )
    
    # Add security scheme
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "JWT Bearer token authentication"
        }
    }
    
    # Add tags metadata
    openapi_schema["tags"] = [
        {
            "name": "Auth",
            "description": "Authentication & User registration",
            "externalDocs": {
                "description": "JWT Authentication Guide",
                "url": "https://jwt.io"
            }
        },
        {
            "name": "Tours",
            "description": "Tour management & search"
        },
        {
            "name": "Bookings",
            "description": "Booking management - create, view, cancel, reschedule"
        },
        {
            "name": "Chat",
            "description": "AI Chatbot API - Natural language tour booking"
        },
        {
            "name": "Users",
            "description": "User profile & preferences"
        }
    ]
    
    # Enhance paths with detailed descriptions
    if "/api/v1/auth" in str(openapi_schema.get("paths", {})):
        # Add auth endpoint docs
        pass
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema


# API Documentation Models
API_DOCS = {
    "overview": """
# TravelGPT API Documentation

## Quick Start

### 1. Get an Access Token

```bash
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

Response:
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

### 2. Use the Token

```bash
GET /api/v1/tours
Headers:
  Authorization: Bearer eyJ...
```

## Common Use Cases

### Search Tours
```bash
GET /api/v1/tours?destination=Đà+Nẵng&min_price=3000000&max_price=10000000
```

### Book a Tour
```bash
POST /api/v1/bookings
{
  "tour_id": "tour_abc123",
  "num_adults": 2,
  "num_children": 1,
  "departure_date": "2026-06-15",
  "contact_name": "Nguyễn Văn A",
  "contact_email": "user@example.com",
  "contact_phone": "0909123456"
}
```

### Chat with AI
```bash
POST /api/v1/chat
{
  "message": "Tôi muốn tìm tour biển ở Nha Trang, ngân sách 5 triệu",
  "session_id": "user_session_123"
}
```
    """,
    
    "rate_limits": """
## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/v1/auth/*` | 10 | 1 min |
| `/api/v1/chat` | 60 | 1 min |
| `/api/v1/tours/search` | 100 | 1 min |
| Other endpoints | 60 | 1 min |

### Rate Limit Headers

Response headers:
- `X-RateLimit-Limit`: Max requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp when limit resets

### Handling 429 Errors

```python
import time
import requests

while True:
    response = requests.get(url, headers=headers)
    if response.status_code == 429:
        retry_after = int(response.headers.get("Retry-After", 60))
        print(f"Rate limited. Waiting {retry_after}s...")
        time.sleep(retry_after)
    else:
        break
```
    """,
    
    "error_handling": """
## Error Handling

### Error Response Format

```json
{
  "detail": "Error message here",
  "code": "ERROR_CODE",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Common Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `TOKEN_EXPIRED` | 401 | JWT token has expired |
| `TOUR_NOT_FOUND` | 404 | Tour ID does not exist |
| `BOOKING_NOT_FOUND` | 404 | Booking code not found |
| `TOUR_FULL` | 400 | No available slots |
| `INVALID_DATE` | 400 | Departure date is in the past |
| `RATE_LIMITED` | 429 | Too many requests |
    """
}


def setup_api_docs(app: FastAPI):
    """Setup API documentation"""
    custom_openapi(app)
