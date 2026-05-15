# Backend Test Plan - TravelGPT

## 1. Tổng Quan Hệ Thống

**Framework:** FastAPI + Prisma (PostgreSQL) + Redis Cache  
**Architecture:** Layered (API → Service → Database)  
**Key Features:** AI Chatbot, Booking, Tours, Auth, Rate Limiting

### Database Models
- **User**: auth, profile
- **Tour**: tour catalog, pricing
- **Booking**: reservation, payment
- **ChatConversation / ChatMessage**: chat history
- **Review**: tour reviews

---

## 2. Danh Sách Modules & Test Plan

---

### MODULE 1: Authentication (`/api/v1/auth`)

**Chức năng:** Register, Login, Refresh Token, Change Password, Get/Update Profile

#### Unit Tests
| ID | Test Case | Priority | Edge Case |
|----|-----------|----------|-----------|
| AUTH-UT-01 | Hash password correctly | HIGH | Empty password, Unicode password |
| AUTH-UT-02 | Verify correct password | HIGH | Case sensitivity, special chars |
| AUTH-UT-03 | Create access token with correct claims | HIGH | Expired token simulation |
| AUTH-UT-04 | Create refresh token with correct claims | HIGH | Token type = "refresh" |
| AUTH-UT-05 | Decode valid token | HIGH | Valid JWT payload |
| AUTH-UT-06 | Decode invalid token returns None | HIGH | Tampered token, wrong signature |
| AUTH-UT-07 | Register with duplicate email raises ValueError | HIGH | Race condition check |

#### Integration Tests
| ID | Test Case | Priority | Edge Case |
|----|-----------|----------|-----------|
| AUTH-IT-01 | Register new user → 201 + tokens | HIGH | - |
| AUTH-IT-02 | Login with valid credentials → 200 + tokens | HIGH | - |
| AUTH-IT-03 | Login with wrong password → 401 | HIGH | Timing attack check |
| AUTH-IT-04 | Login with non-existent email → 401 | HIGH | Same error msg as wrong password |
| AUTH-IT-05 | Refresh token → new tokens | HIGH | - |
| AUTH-IT-06 | Refresh with invalid token → 401 | HIGH | Expired refresh token |
| AUTH-IT-07 | Get `/auth/me` with valid token → 200 | HIGH | - |
| AUTH-IT-08 | Get `/auth/me` without token → 401 | HIGH | Missing Authorization header |
| AUTH-IT-09 | Change password with wrong old password → 400 | HIGH | - |
| AUTH-IT-10 | Change password success → 200 | HIGH | - |
| AUTH-IT-11 | Update profile → updated fields | MEDIUM | Partial update (only phone) |
| AUTH-IT-12 | Register with invalid email format → 422 | HIGH | SQL injection in email |

#### Validation Tests
| ID | Test Case | Priority |
|----|-----------|----------|
| AUTH-VAL-01 | Email format validation | HIGH |
| AUTH-VAL-02 | Password min length (6 chars) | HIGH |
| AUTH-VAL-03 | Full name required, not empty | HIGH |

---

### MODULE 2: Tours (`/api/v1/tours`)

**Chức năng:** List tours, Search, Featured, CRUD (admin)

#### Unit Tests
| ID | Test Case | Priority | Edge Case |
|----|-----------|----------|-----------|
| TOUR-UT-01 | Filter by destination returns matching tours | HIGH | Case-insensitive search |
| TOUR-UT-02 | Filter by price range works correctly | HIGH | min > max edge case |
| TOUR-UT-03 | Pagination returns correct slice | HIGH | Last page, single page |
| TOUR-UT-04 | Tour slug is unique constraint | HIGH | Duplicate slug prevention |
| TOUR-UT-05 | Price calculation with discount applied | HIGH | No discount, null discount |

#### API Tests
| ID | Test Case | Priority | Edge Case |
|----|-----------|----------|-----------|
| TOUR-API-01 | `GET /tours` returns paginated list | HIGH | - |
| TOUR-API-02 | `GET /tours?destination=Đà Nẵng` filtered | HIGH | Unicode destination |
| TOUR-API-03 | `GET /tours?min_price=1000&max_price=5000` | HIGH | Price filter |
| TOUR-API-04 | `GET /tours?search=tour biển` full-text | HIGH | Empty search results |
| TOUR-API-05 | `GET /tours/featured` returns featured tours | HIGH | No featured tours |
| TOUR-API-06 | `GET /tours/{id}` returns tour detail | HIGH | Non-existent ID → 404 |
| TOUR-API-07 | `GET /tours/slug/{slug}` returns by slug | HIGH | Non-existent slug → 404 |
| TOUR-API-08 | `POST /tours` (admin) creates tour | HIGH | - |
| TOUR-API-09 | `PUT /tours/{id}` (admin) updates tour | HIGH | Partial update |
| TOUR-API-10 | `DELETE /tours/{id}` (admin) soft delete | HIGH | - |
| TOUR-API-11 | `GET /tours` without auth (public) | HIGH | - |
| TOUR-API-12 | `POST /tours` without admin → 403 | HIGH | Regular user access |
| TOUR-API-13 | `GET /tours?page_size=100` max limit enforced | MEDIUM | page_size > 50 capped |

#### Error Handling Tests
| ID | Test Case | Priority |
|----|-----------|----------|
| TOUR-ERR-01 | Invalid tour_id → 422 validation error | HIGH |
| TOUR-ERR-02 | Tour not found → 404 | HIGH |
| TOUR-ERR-03 | Database error during list → 500 | HIGH |

---

### MODULE 3: Bookings (`/api/v1/bookings`)

**Chức năng:** Create, List, Get, Cancel, Admin update, Payment confirmation

#### Unit Tests
| ID | Test Case | Priority | Edge Case |
|----|-----------|----------|-----------|
| BOOK-UT-01 | Generate unique booking code format | HIGH | Collision check (BK prefix, 8 hex) |
| BOOK-UT-02 | Price calculation: adults + children | HIGH | 0 children, max participants |
| BOOK-UT-03 | Total price = adult_price × adults + child_price × children | HIGH | No tour (manual booking) |
| BOOK-UT-04 | Cancel booking: status transition validation | HIGH | Already cancelled, completed |
| BOOK-UT-05 | Cancel booking: restore tour participants | HIGH | Tour doesn't exist |
| BOOK-UT-06 | Cannot cancel completed booking | HIGH | - |
| BOOK-UT-07 | Admin can cancel any booking | HIGH | - |

#### API Tests
| ID | Test Case | Priority | Edge Case |
|----|-----------|----------|-----------|
| BOOK-API-01 | Create booking with valid data → 201 | HIGH | - |
| BOOK-API-02 | Create booking without tour_id | HIGH | Manual booking |
| BOOK-API-03 | `GET /bookings` → user's bookings only | HIGH | Other user's booking hidden |
| BOOK-API-04 | `GET /bookings?page=2` pagination works | MEDIUM | - |
| BOOK-API-05 | `GET /bookings/{id}` → 200 + detail | HIGH | Own booking |
| BOOK-API-06 | `GET /bookings/{id}` other user → 403 | HIGH | - |
| BOOK-API-07 | `GET /bookings/code/{code}` public lookup | HIGH | Invalid code → 404 |
| BOOK-API-08 | Cancel own booking → 200 | HIGH | - |
| BOOK-API-09 | Cancel already cancelled → 400 | HIGH | - |
| BOOK-API-10 | Cancel completed → 400 | HIGH | - |
| BOOK-API-11 | Admin `GET /bookings/admin/all` → all bookings | HIGH | Status filter |
| BOOK-API-12 | Admin `PUT /bookings/admin/{id}` update | HIGH | - |
| BOOK-API-13 | Admin `PUT /bookings/{id}/confirm-payment` | HIGH | Already paid |
| BOOK-API-14 | Create booking without auth → 403 | HIGH | - |

#### Validation Tests
| ID | Test Case | Priority |
|----|-----------|----------|
| BOOK-VAL-01 | num_adults ≥ 1 enforced | HIGH |
| BOOK-VAL-02 | num_children ≥ 0 enforced | HIGH |
| BOOK-VAL-03 | contact_email valid email format | HIGH |
| BOOK-VAL-04 | contact_phone format (Vietnamese) | MEDIUM |
| BOOK-VAL-05 | Invalid BookingStatus value → 422 | HIGH |

#### Database Transaction Tests
| ID | Test Case | Priority | Edge Case |
|----|-----------|----------|-----------|
| BOOK-DB-01 | Create booking + update tour participants atomic | HIGH | DB failure rollback |
| BOOK-DB-02 | Cancel booking + restore participants atomic | HIGH | - |
| BOOK-DB-03 | Duplicate booking_code prevented by unique constraint | HIGH | Race condition on code gen |
| BOOK-DB-04 | Concurrent booking creation race condition | HIGH | Same tour, same slot |
| BOOK-DB-05 | max_participants exceeded → booking rejected | HIGH | Boundary check |

---

### MODULE 4: Chat / AI Agent (`/api/v1/chat`)

**Chức năng:** Send message, Multi-turn conversation, Streaming, History

#### Unit Tests
| ID | Test Case | Priority | Edge Case |
|----|-----------|----------|-----------|
| CHAT-UT-01 | Intent detection: booking intent | HIGH | Ambiguous message |
| CHAT-UT-02 | Intent detection: cancel intent | HIGH | - |
| CHAT-UT-03 | Intent detection: reschedule intent | HIGH | - |
| CHAT-UT-04 | Booking flow state transitions | HIGH | Skip step, go back |
| CHAT-UT-05 | Cancellation flow: verify booking | HIGH | Non-existent booking code |
| CHAT-UT-06 | Cancellation flow: calculate refund | HIGH | 0 days before, 14+ days |
| CHAT-UT-07 | Reschedule flow: eligibility check | HIGH | Past departure date |
| CHAT-UT-08 | Pre-trip checklist generation | MEDIUM | Different trip types |
| CHAT-UT-09 | Post-trip loyalty calculation | MEDIUM | First booking bonus |
| CHAT-UT-10 | Multi-turn conversation state tracking | HIGH | Session timeout |

#### API Tests
| ID | Test Case | Priority | Edge Case |
|----|-----------|----------|-----------|
| CHAT-API-01 | `POST /chat/message` anonymous → 200 | HIGH | No auth required |
| CHAT-API-02 | `POST /chat/message` authenticated → saves history | HIGH | - |
| CHAT-API-03 | `POST /chat/message-v2` with memory → personalized | MEDIUM | No Mem0 API key fallback |
| CHAT-API-04 | `POST /chat/message/stream` SSE response | MEDIUM | Stream interruption |
| CHAT-API-05 | `GET /chat/history` returns user conversations | HIGH | Empty history |
| CHAT-API-06 | `DELETE /chat/history` clears history | HIGH | Specific session_id |
| CHAT-API-07 | `GET /chat/suggestions?intent=greeting` | MEDIUM | Invalid intent |
| CHAT-API-08 | `POST /chat/cancellation/start` with booking code | HIGH | - |
| CHAT-API-09 | `POST /chat/cancellation/action` confirm cancel | HIGH | - |
| CHAT-API-10 | `GET /chat/cancellation/refund-policy` | MEDIUM | - |
| CHAT-API-11 | `POST /chat/reschedule/start` eligibility | HIGH | Ineligible booking |
| CHAT-API-12 | `POST /chat/pre-trip/checklist` | MEDIUM | - |
| CHAT-API-13 | `POST /post-trip/loyalty` calculation | MEDIUM | - |
| CHAT-API-14 | `GET /conversation/{session_id}` state | MEDIUM | - |

#### Error Handling Tests
| ID | Test Case | Priority |
|----|-----------|----------|
| CHAT-ERR-01 | LLM API timeout → fallback response | HIGH |
| CHAT-ERR-02 | LLM API error → graceful error message | HIGH |
| CHAT-ERR-03 | Empty message → validation error | HIGH |
| CHAT-ERR-04 | Very long message (> 4000 chars) → truncation or error | MEDIUM |

---

### MODULE 5: Rate Limiting

**Chức năng:** Token bucket rate limiting, per-user limits, endpoint-specific tiers

#### Unit Tests
| ID | Test Case | Priority | Edge Case |
|----|-----------|----------|-----------|
| RATE-UT-01 | Token bucket: consume within limit | HIGH | Exact limit boundary |
| RATE-UT-02 | Token bucket: reject when exhausted | HIGH | Burst handling |
| RATE-UT-03 | Token bucket: refill rate correct | HIGH | Partial refill |
| RATE-UT-04 | get_wait_time calculation | MEDIUM | - |
| RATE-UT-05 | Redis backend rate limit check | HIGH | - |
| RATE-UT-06 | Memory fallback rate limit | HIGH | Redis unavailable |

#### Integration Tests
| ID | Test Case | Priority | Edge Case |
|----|-----------|----------|-----------|
| RATE-IT-01 | Auth endpoint: 10 req/min enforced | HIGH | Anonymous user |
| RATE-IT-02 | Chat endpoint: 60 req/min enforced | HIGH | Authenticated user |
| RATE-IT-03 | Exceed limit → 429 with Retry-After header | HIGH | - |
| RATE-IT-04 | Health endpoint → no rate limit | HIGH | - |
| RATE-IT-05 | Rate limit headers present in response | MEDIUM | X-RateLimit-* headers |
| RATE-IT-06 | Rate limit resets after window | HIGH | Window expiration |

---

### MODULE 6: Caching (Redis/In-Memory)

**Chức năng:** Tour caching, Session caching, Search caching

#### Unit Tests
| ID | Test Case | Priority | Edge Case |
|----|-----------|----------|-----------|
| CACHE-UT-01 | Set and get tour cache | HIGH | TTL expiration |
| CACHE-UT-02 | Invalidate tour cache on update | HIGH | - |
| CACHE-UT-03 | Invalidate all tour lists | HIGH | Pattern matching |
| CACHE-UT-04 | Memory fallback works when Redis down | HIGH | - |
| CACHE-UT-05 | Search result caching | MEDIUM | Different query strings |
| CACHE-UT-06 | Cache hit returns correct data | HIGH | Serialization/deserialization |
| CACHE-UT-07 | Cache miss returns None | HIGH | - |
| CACHE-UT-08 | Featured tours cache TTL (5 min) | MEDIUM | - |

---

### MODULE 7: Security & Authorization

#### Auth/Permission Tests
| ID | Test Case | Priority | Edge Case |
|----|-----------|----------|-----------|
| SEC-UT-01 | User cannot access other user's booking | HIGH | UUID guessing |
| SEC-UT-02 | Admin can access any booking | HIGH | - |
| SEC-UT-03 | User cannot access admin endpoints | HIGH | - |
| SEC-UT-04 | Expired token → 401 | HIGH | - |
| SEC-UT-05 | Invalid token signature → 401 | HIGH | - |
| SEC-UT-06 | Token type mismatch (access vs refresh) → 401 | HIGH | - |
| SEC-UT-07 | Inactive user account → 403 | HIGH | - |
| SEC-UT-08 | Missing Bearer token → 401 | HIGH | - |
| SEC-UT-09 | SQL injection in search parameter | HIGH | Parameterized queries |
| SEC-UT-10 | XSS in chat message → sanitized/stored safely | MEDIUM | Stored XSS |
| SEC-UT-11 | CORS configuration correct | MEDIUM | Allow origins |

---

### MODULE 8: Health & Monitoring

#### System Tests
| ID | Test Case | Priority |
|----|-----------|----------|
| HEALTH-01 | `GET /health` → 200 + cache stats | HIGH |
| HEALTH-02 | `GET /` → 200 + API info | MEDIUM |
| HEALTH-03 | `GET /stats` → cache statistics | MEDIUM |
| HEALTH-04 | Database connection failure → health check degraded | HIGH |
| HEALTH-05 | Redis connection failure → health check still healthy | HIGH |

---

## 3. Rủi Ro Tiềm Ẩn (Risk Assessment)

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Race condition: concurrent booking same tour slot | HIGH | MEDIUM | DB unique constraint + atomic transaction |
| Rate limit bypass via token reuse | MEDIUM | LOW | Proper Redis/memory state isolation |
| Duplicate booking code generation | MEDIUM | LOW | UUID + collision check |
| JWT token blacklist missing (logout not enforced) | MEDIUM | LOW | Short token expiry (30 min) |
| LLM API down → chat completely broken | HIGH | MEDIUM | Fallback response + circuit breaker |
| Cache inconsistency after booking update | MEDIUM | MEDIUM | Cache invalidation on write |
| Overbooking (max_participants exceeded) | HIGH | MEDIUM | DB-level constraint + service check |
| SQL injection in Prisma queries | LOW | LOW | Prisma ORM parameterized queries |
| Sensitive data in JWT payload | LOW | LOW | Only user_id stored, no PII |

---

## 4. Thứ Tự Ưu Tiên Triển Khai Tests

### Phase 1 - Critical Path (Đầu tiên)
1. **AUTH** - Login, Register, Token validation (HIGH)
2. **BOOKINGS** - Create, Cancel, Participant count (HIGH)
3. **TOURS** - List, Filter, Create (HIGH)
4. **SECURITY** - Authorization, Token validation (HIGH)

### Phase 2 - Core Flow (Tiếp theo)
5. **BOOKINGS** - Database transactions, Race conditions (HIGH)
6. **CHAT** - Message send/receive, Booking flow (HIGH)
7. **RATE LIMIT** - Auth endpoints strict limit (HIGH)

### Phase 3 - Enhancement (Sau đó)
8. **CACHE** - Cache hit/miss, Invalidation (MEDIUM)
9. **CHAT** - Cancellation, Reschedule flows (MEDIUM)
10. **HEALTH** - System monitoring (MEDIUM)

### Phase 4 - Edge Cases (Cuối cùng)
11. LLM fallback responses
12. Streaming chat edge cases
13. Multi-turn conversation state
14. Loyalty/Post-trip features

---

## 5. Test Framework & Setup

### Recommended Stack
```
pytest + pytest-asyncio    # Test runner
pytest-cov                  # Coverage report
httpx                       # Async HTTP client
fakeredis[lua]             # Fake Redis for unit tests
prisma-testing              # DB fixtures
```

### Test Structure
```
tests/
├── conftest.py            # Fixtures (db, client, auth token)
├── test_auth.py
├── test_tours.py
├── test_bookings.py
├── test_chat.py
├── test_rate_limit.py
├── test_cache.py
├── test_security.py
└── test_health.py
```

### Environment
- **Unit tests**: In-memory SQLite + fake Redis
- **Integration tests**: PostgreSQL + real Redis
- **CI/CD**: Docker compose with services

---

## 6. Summary

| Category | Count | High Priority |
|----------|-------|---------------|
| Unit Tests | ~40 | 25 |
| Integration/API Tests | ~70 | 40 |
| Validation Tests | ~10 | 8 |
| Security Tests | ~11 | 8 |
| Error Handling | ~10 | 6 |
| **Total** | **~140** | **~87** |

**Focus vào:** Booking flow (concurrency, pricing), Auth (token security), Chat (LLM fallback), Rate limiting.
