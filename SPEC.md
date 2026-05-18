# TravelGPT Enhancement Specification

## Changelog
- **2026-05-16**: Initial comprehensive spec covering Phases 1-2 (33 core features)

---

## PHASE 1: Quick Wins & Chat Core

### [P1-01] Wire Tours Page Sections
**Files:** `frontend/app/tours/page.tsx`

Components đã tồn tại nhưng chưa được wire vào page:
- `DestinationShowcase` → import và render sau search bar
- `DealsSection` → import và render trước footer
- `TestimonialsSection` → import và render trước footer
- Thêm **Newsletter CTA section** (mới)

```tsx
// tours/page.tsx structure
<Navbar />
  <Hero /> {/* existing */}
  <TourFilters /> {/* existing */}
  <DestinationShowcase /> {/* NEW - wire existing component */}
  <TourGrid /> {/* existing */}
  <DealsSection /> {/* NEW - wire existing component */}
  <TestimonialsSection /> {/* NEW - wire existing component */}
  <NewsletterCTA /> {/* NEW */}
<Footer />
```

### [P1-02] Newsletter CTA Component
**Files:** `frontend/components/tour/newsletter-cta.tsx` (NEW)

Form signup email, validate email format, POST to `/api/v1/newsletter/subscribe`.

### [P1-03] Tour Card Blocks in Chat
**Files:** `frontend/components/chat/tour-card-block.tsx` (NEW), `frontend/components/chat/tour-carousel-block.tsx` (NEW), `frontend/components/chat/rich-content-blocks.tsx` (UPDATE)

AI response trả về structured block:

```typescript
// Block types enum
type BlockType = 
  | 'text' 
  | 'tour_card' 
  | 'tour_carousel' 
  | 'weather' 
  | 'suggestion' 
  | 'booking_form'
  | 'image'
  | 'action_button'
  | 'table';

// Example tour_card block from AI:
{
  type: 'tour_card',
  data: {
    id: 'tour-uuid',
    slug: 'ha-noi-2-ngay-1-dem',
    name: 'Tour Hà Nội 2 ngày 1 đêm',
    destination: 'Hà Nội',
    region: 'NORTH',
    duration: '2 ngày 1 đêm',
    price: 2800000,
    discountPrice: 2490000,
    image: 'https://...', // from tour.images[0]
    rating: 4.8,
    reviewCount: 234,
    includesBreakdown: 'Ăn 3 bữa, vé tham quan, vận chuyển',
    ctas: [
      { label: 'Xem chi tiết', action: 'navigate', href: '/tours/ha-noi-2-ngay-1-dem' },
      { label: 'Đặt ngay', action: 'booking_flow', tourId: 'tour-uuid' }
    ]
  }
}

// Example tour_carousel block:
{
  type: 'tour_carousel',
  data: {
    title: 'Top tours Đà Nẵng cho bạn',
    subtitle: '3 tour phù hợp với yêu cầu của bạn',
    tours: [/* array of tour_card data */]
  }
}
```

**Rendering flow:**
1. Backend `agent.py` / `tools_executor.py` → gọi `search_tours` tool → lấy tour data từ DB
2. Backend → build `content_blocks` array (mix of `text` + `tour_card`/`tour_carousel` blocks)
3. Backend → streaming response: text chunks + block JSON
4. Frontend `ChatMessage` → parse `content_blocks` → render each block with appropriate component

### [P1-04] Context-Aware Suggestion Chips
**Files:** `frontend/components/chat/suggestion-chips.tsx` (UPDATE), `frontend/lib/chat-suggestions.ts` (NEW)

AI trả về suggestion block:

```typescript
// Suggestion block
{
  type: 'suggestion',
  data: {
    suggestions: [
      { id: 's1', label: 'Tour này có bao gồm ăn sáng không?', query: 'Tour này có bao gồm ăn sáng không?' },
      { id: 's2', label: 'Cho tôi xem tour khác ở Đà Nẵng', query: 'Tour Đà Nẵng khác' },
      { id: 's3', label: 'Giá nhóm 5 người là bao nhiêu?', query: 'Giá nhóm 5 người' },
      { id: 's4', label: 'Có giảm giá không?', query: 'Có giảm giá không' },
    ]
  }
}
```

**Suggestion logic** (backend):
- Khi AI detect `viewing_tour` context → suggest tour-specific questions
- Khi AI detect `pricing` context → suggest pricing questions
- Khi AI detect `booking` context → suggest booking flow questions
- Khi AI detect `comparison` context → suggest comparison questions

### [P1-05] Quick Reply Buttons
**Files:** `frontend/components/chat/suggestion-chips.tsx` (UPDATE)

Suggestion chips hiển thị dạng buttons với styling đẹp (shadcn Button variant="outline" với icons).

### [P1-06] Enhanced Streaming with Content Blocks
**Files:** `backend/app/ai/agent.py` (UPDATE), `backend/app/ai/tools.py` (UPDATE), `backend/app/api/v1/chat.py` (UPDATE)

**Backend changes:**

1. **`tools.py`** — Thêm tool schemas:
```python
# Tour card tool (for LLM to call)
TOUR_CARDS_TOOL = Tool(
    name="show_tour_cards",
    description="Hiển thị danh sách tour với thông tin chi tiết bao gồm ảnh, giá, CTA buttons",
    parameters={
        "type": "object",
        "properties": {
            "tours": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "id": {"type": "string"},
                        "name": {"type": "string"},
                        "slug": {"type": "string"},
                        "destination": {"type": "string"},
                        "duration": {"type": "string"},
                        "price": {"type": "number"},
                        "discountPrice": {"type": "number"},
                        "image": {"type": "string"},
                        "rating": {"type": "number"},
                        "reviewCount": {"type": "number"},
                    }
                }
            },
            "message": {"type": "string", "description": "Câu giới thiệu ngắn cho danh sách tour"}
        },
        "required": ["tours", "message"]
    }
)
```

2. **`agent.py`** — Update streaming response:
```python
# Response format (SSE)
data: { type: "content", content: "text chunk" }
data: { type: "block", block: { type: "tour_card", data: {...} } }
data: { type: "block", block: { type: "suggestion", data: {...} } }
data: { type: "complete", intent: "...", suggestions: [...] }
```

3. **`tools_executor.py`** — Execute tools và trả về structured results cho LLM synthesis.

### [P1-07] Admin Bookings — Date Range & Destination Filters
**Files:** `frontend/app/admin/bookings/page.tsx` (UPDATE)

```tsx
// Thêm vào filter bar
<DateRangePicker
  value={dateRange}
  onChange={setDateRange}
  placeholder="Lọc theo ngày tạo"
/>

<Select
  value={destinationFilter}
  onValueChange={setDestinationFilter}
>
  <SelectTrigger>
    <SelectValue placeholder="Tất cả điểm đến" />
  </SelectTrigger>
  <SelectContent>
    {allDestinations.map(d => (
      <SelectItem key={d} value={d}>{d}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

Query params: `?date_from=2026-05-01&date_to=2026-05-31&destination=Đà Nẵng&status=PENDING`

### [P1-08] Admin Bookings — Server-Side CSV Export
**Files:** `backend/app/api/v1/bookings.py` (UPDATE)

```python
@router.get("/admin/export-csv")
async def export_bookings_csv(
    date_from: str = None,
    date_to: str = None,
    status: str = None,
    destination: str = None,
):
    """Stream CSV file"""
    # Build query with filters
    # Generate CSV using csv module
    # Return StreamingResponse with text/csv content-type
```

**Frontend:** Button "Export CSV" → fetch `/api/v1/bookings/admin/export-csv?...` → download file.

### [P1-09] Admin Dashboard — Quick Stat Pills
**Files:** `frontend/app/admin/page.tsx` (UPDATE), `backend/app/api/v1/admin/stats.py` (NEW)

**New API endpoint:**
```python
# GET /api/v1/admin/stats/overview
{
  "today_bookings": 12,
  "today_revenue": 45000000,
  "pending_bookings": 8,
  "active_users_24h": 45,
  "week_revenue": 320000000,
  "week_bookings": 87,
  "system_health": {
    "db": "connected",
    "redis": "connected",
    "llm": "operational"
  }
}
```

---

## PHASE 2: Booking + Weather + Images

### [P2-01] Inline Booking Form in Chat
**Files:** `frontend/components/chat/booking-form-block.tsx` (NEW), `frontend/components/chat/rich-content-blocks.tsx` (UPDATE)

**Booking form block:**
```typescript
{
  type: 'booking_form',
  data: {
    tourId: 'tour-uuid',
    tourName: 'Tour Hà Nội 2 ngày 1 đêm',
    availableDates: ['2026-05-20', '2026-05-25', '2026-06-01'],
    basePrice: 2800000,
    basePriceLabel: 'Người lớn',
    childPrice: 2100000,
    childPriceLabel: 'Trẻ em (dưới 12 tuổi)',
    contactFields: ['name', 'email', 'phone', 'special_requests'],
  }
}
```

**UI:** Form hiển thị inline trong chat với:
- Select departure date (from `availableDates`)
- Number input: adults, children
- Live price calculation
- Contact fields (name, email, phone)
- Special requests textarea
- Confirm button → POST `/api/v1/bookings/`

### [P2-02] Booking Preview Card
**Files:** `frontend/components/chat/booking-preview-block.tsx` (NEW)

Sau khi user điền form, trước khi submit → hiện preview card:

```typescript
{
  type: 'booking_preview',
  data: {
    tourName: 'Tour Hà Nội 2 ngày 1 đêm',
    tourImage: 'https://...',
    departureDate: '2026-05-20',
    adults: 2,
    children: 1,
    totalPrice: 7700000,
    contactName: 'Nguyễn Văn A',
    contactEmail: 'user@email.com',
    contactPhone: '0901234567',
    specialRequests: 'Cần xe chở người khuyết tật',
  }
}
```

### [P2-03] Payment Link in Chat
**Files:** `backend/app/api/v1/bookings.py` (UPDATE), `frontend/components/chat/chat-message.tsx` (UPDATE)

Sau khi booking được tạo → AI response chứa:

```typescript
{
  type: 'action_button',
  data: {
    style: 'primary',
    label: 'Thanh toán ngay',
    icon: 'credit-card',
    action: 'payment_link',
    url: 'https://checkout.stripe.com/...', // from Stripe payment intent
    bookingCode: 'TG202605160001'
  }
}
```

### [P2-04] Weather Lookup Tool (Playwright)
**Files:** `backend/app/services/weather_service.py` (NEW), `backend/app/ai/tools.py` (UPDATE), `backend/app/ai/tools_executor.py` (UPDATE), `backend/app/ai/agent.py` (UPDATE)

**New tool:**
```python
# tools.py
WEATHER_TOOL = Tool(
    name="get_weather",
    description="Lấy thông tin thời tiết hiện tại và dự báo cho một điểm đến du lịch cụ thể",
    parameters={
        "type": "object",
        "properties": {
            "destination": {"type": "string", "description": "Tên thành phố hoặc điểm đến"},
            "date": {"type": "string", "description": "Ngày dự kiến (YYYY-MM-DD), optional"}
        },
        "required": ["destination"]
    }
)
```

**weather_service.py:**
```python
class WeatherService:
    def __init__(self):
        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(headless=True)
    
    async def get_weather(self, destination: str, date: str = None) -> dict:
        """Scrape weather từ weather.com hoặc accuweather"""
        # Navigate to weather.com/search?search={destination}
        # Extract: temperature, condition, humidity, wind
        # Return structured data
        return {
            "destination": "Đà Nẵng",
            "current": {
                "temperature": 32,
                "condition": "Nắng nóng",
                "humidity": 75,
                "wind": "20 km/h",
                "icon": "sunny"
            },
            "forecast": [...],  # 7-day forecast if date provided
            "best_time_to_visit": "Tháng 3-5 và Tháng 9-11",
            "travel_advice": "Mang theo kem chống nắng, nón, nước uống. Tránh ra ngoài trưa 11h-14h."
        }
```

**Weather block (frontend):**
```typescript
{
  type: 'weather',
  data: {
    destination: 'Đà Nẵng',
    temperature: 32,
    condition: 'Nắng nóng',
    humidity: 75,
    wind: '20 km/h',
    icon: 'sunny',
    forecast: [...],
    bestTime: 'Tháng 3-5',
    advice: 'Mang theo kem chống nắng, nón, nước uống'
  }
}
```

### [P2-05] User Upload Image in Chat
**Files:** `frontend/components/chat/chat-input.tsx` (UPDATE), `frontend/app/api/upload/route.ts` (NEW), `backend/app/api/v1/chat.py` (UPDATE)

**Upload flow:**
1. User click attach button → select image(s)
2. Frontend upload to `/api/upload` → get URL(s)
3. Message payload:
```typescript
{
  content: "Check xem hình ảnh này có phải Vịnh Hạ Long không?",
  attachments: [
    { url: "https://storage.../uploaded-img.jpg", type: "image" }
  ]
}
```
4. Backend → store attachments in message metadata → pass to AI (Claude vision support)

### [P2-06] AI Response Tour Images from DB
**Files:** `backend/app/ai/tools_executor.py` (UPDATE)

When AI calls `show_tour_cards`, automatically populate `image` field from `tour.images[0]` in DB.

### [P2-07] Online Image URL Support
**Files:** `frontend/components/chat/image-block.tsx` (NEW), `frontend/components/chat/chat-message.tsx` (UPDATE)

AI có thể trả về:
```typescript
{
  type: 'image',
  data: {
    url: 'https://example.com/tour-image.jpg',
    alt: 'Vịnh Hạ Long',
    caption: 'Vịnh Hạ Long - Di sản thiên nhiên thế giới'
  }
}
```

Frontend validate URL format before rendering. If invalid → show error gracefully.

### [P2-08] Image Lightbox Viewer
**Files:** `frontend/components/chat/image-lightbox.tsx` (NEW)

Click vào ảnh bất kỳ trong chat → open lightbox overlay với:
- Full-size image
- Caption
- Navigation arrows (if multiple images)
- Close button (ESC key)
- Click outside to close

### [P2-09] Admin Bookings — Email Reminder Action
**Files:** `backend/app/api/v1/bookings.py` (UPDATE), `backend/app/services/email_service.py` (NEW), `frontend/app/admin/bookings/page.tsx` (UPDATE)

**New endpoint:**
```python
POST /api/v1/bookings/{id}/send-reminder
```
- Check booking.status = CONFIRMED và departure_date - today <= 3 days
- Send email via nodemailer/SMTP
- Log reminder_sent_at timestamp

**Email template:** Booking reminder với:
- Booking code
- Tour name, departure date
- Meeting point
- What to bring
- Contact hotline

**Frontend:** Button "Gửi nhắc" trong booking detail panel.

### [P2-10] Admin Bookings — Full Detail Modal
**Files:** `frontend/app/admin/bookings/page.tsx` (UPDATE)

Nâng cấp booking detail panel thành full modal với:
- Tabbed layout: Thông tin | Thanh toán | Lịch sử
- Thông tin: customer, tour, participants, contact
- Thanh toán: payment method, amount, status, payment date, refund status
- Lịch sử: timeline of all status changes

---

## PHASE 3: Polish & Advanced

### [P3-01] User Preference Learning (Mem0)
**Files:** `backend/app/ai/conversation.py` (UPDATE), `backend/app/ai/recommendation.py` (UPDATE)

Store user preferences in Mem0:
- Budget range (budget_low, budget_high)
- Preferred destinations (destinations: ["Đà Nẵng", "Hà Nội"])
- Travel style (style: "family", "couple", "solo", "group")
- Trip duration preference (duration: "short", "medium", "long")
- Preferred region (region: "NORTH", "CENTRAL", "SOUTH", "INTERNATIONAL")

Update Mem0 when user:
- Completes booking → extract destination, price, duration
- Explicitly says budget → "tôi muốn tour dưới 5 triệu"
- Search filters → infer preferences

### [P3-02] Past Booking Context in Chat
**Files:** `backend/app/ai/tools_executor.py` (UPDATE)

When user starts conversation:
1. Fetch user's recent bookings (last 3)
2. Include booking context in system prompt
3. AI can reference: "Bạn đã đặt tour Hà Nội vào ngày 15/05 rồi. Bạn muốn hủy hay đổi lịch?"

### [P3-03] Personalized Greetings
**Files:** `backend/app/ai/conversation.py` (UPDATE)

Dynamic greeting based on:
- Time of day: "Chào buổi sáng", "Chào buổi chiều", "Chào buổi tối"
- User name: "Chào Minh, hôm nay bạn muốn đi đâu?"
- Upcoming trips: "Bạn có tour Đà Nẵng vào ngày 20/05. Cần tôi hỗ trợ gì thêm không?"
- Weather at user's likely destination

### [P3-04] Admin System Health
**Files:** `frontend/app/admin/page.tsx` (UPDATE), `backend/app/api/v1/admin/health.py` (NEW)

```typescript
// GET /api/v1/admin/health
{
  "status": "healthy",
  "components": {
    "database": { "status": "connected", "latency_ms": 12 },
    "redis": { "status": "connected", "latency_ms": 3 },
    "llm": { "status": "operational", "latency_ms": 850 },
    "email": { "status": "connected" }
  },
  "uptime_seconds": 86400,
  "version": "1.0.0"
}
```

### [P3-05] Admin Tours — Booking Count Column
**Files:** `frontend/app/admin/tours/page.tsx` (UPDATE)

Add column `bookings_count` to tours table. Fetch from aggregation query.

### [P3-06] Admin Review Management
**Files:** `backend/app/api/v1/reviews.py` (NEW), `frontend/app/admin/reviews/page.tsx` (NEW)

**Endpoints:**
- `GET /api/v1/reviews/admin/all` — List all reviews with filters (tour, rating, status)
- `PUT /api/v1/reviews/{id}/approve` — Approve review
- `PUT /api/v1/reviews/{id}/reject` — Reject review
- `POST /api/v1/reviews/{id}/reply` — Admin reply

**Frontend:**
- Table: Review content, tour name, user, rating, status, date
- Filter by: tour, rating (1-5 stars), status (pending/approved/rejected)
- Action buttons: Approve, Reject, View detail, Reply
- Inline reply form in table row

### [P3-07] Multi-Format Response Rendering
**Files:** `frontend/components/chat/rich-content-blocks.tsx` (NEW)

Complete block rendering system:

```typescript
// BlockRenderer component
const BlockRenderer = ({ block }) => {
  switch(block.type) {
    case 'text': return <TextBlock data={block.data} />;
    case 'tour_card': return <TourCardBlock data={block.data} />;
    case 'tour_carousel': return <TourCarouselBlock data={block.data} />;
    case 'weather': return <WeatherBlock data={block.data} />;
    case 'suggestion': return <SuggestionBlock data={block.data} />;
    case 'booking_form': return <BookingFormBlock data={block.data} />;
    case 'booking_preview': return <BookingPreviewBlock data={block.data} />;
    case 'image': return <ImageBlock data={block.data} />;
    case 'action_button': return <ActionButtonBlock data={block.data} />;
    case 'table': return <TableBlock data={block.data} />;
    default: return null;
  }
};
```

### [P3-08] Travel Packing Suggestions
**Files:** `backend/app/ai/agent.py` (UPDATE)

New intent: `packing_suggestions`
- AI calls `get_weather` + analyzes destination + duration
- Returns structured list:
```typescript
{
  type: 'text',
  data: {
    content: "## 🧳 Gợi ý đồ mang theo cho Đà Nẵng 3 ngày\n\n### 👕 Trang phục\n- Áo phông nhẹ, quần short\n- Áo khoác nhẹ (trời mát buổi tối)\n-...",
    }
  }
}
```

### [P3-09] Tour Reviews Section (Frontend)
**Files:** `frontend/app/tours/[slug]/page.tsx` (UPDATE)

Add reviews section to tour detail page:
- List of approved reviews for this tour
- Average rating display
- Filter by rating
- Sort by: newest, highest rating, most helpful

### [P3-10] Related Tours
**Files:** `frontend/app/tours/[slug]/page.tsx` (UPDATE), `backend/app/api/v1/tours.py` (UPDATE)

Add "Tours liên quan" section:
- Same region
- Similar duration (±1 day)
- Similar price range (±30%)
- Not including current tour

---

## IMPLEMENTATION NOTES

### Database Changes
No schema changes required for Phases 1-2. All data comes from existing tables.

For Phase 3:
```prisma
// reviews table needs status field
model Review {
  ...
  status  ReviewStatus @default(PENDING)
}

enum ReviewStatus {
  PENDING
  APPROVED
  REJECTED
}
```

### API Changes Summary
| Endpoint | Method | Purpose |
|---|---|---|
| `/api/v1/admin/stats/overview` | GET | Dashboard quick stats |
| `/api/v1/bookings/admin/export-csv` | GET | Server-side CSV export |
| `/api/v1/bookings/{id}/send-reminder` | POST | Email reminder |
| `/api/v1/bookings/{id}/refund` | POST | Stripe refund |
| `/api/v1/reviews/admin/all` | GET | Admin review list |
| `/api/v1/reviews/{id}/approve` | PUT | Approve review |
| `/api/v1/reviews/{id}/reject` | PUT | Reject review |
| `/api/v1/reviews/{id}/reply` | POST | Admin reply |
| `/api/v1/newsletter/subscribe` | POST | Newsletter signup |
| `/api/v1/admin/health` | GET | System health |

### File Changes Summary

**Backend (New):**
- `backend/app/services/weather_service.py`
- `backend/app/services/email_service.py`
- `backend/app/api/v1/admin/stats.py`
- `backend/app/api/v1/admin/health.py`
- `backend/app/api/v1/reviews.py`

**Backend (Update):**
- `backend/app/ai/tools.py`
- `backend/app/ai/tools_executor.py`
- `backend/app/ai/agent.py`
- `backend/app/ai/intent.py`
- `backend/app/api/v1/chat.py`
- `backend/app/api/v1/bookings.py`

**Frontend (New):**
- `frontend/components/chat/tour-card-block.tsx`
- `frontend/components/chat/tour-carousel-block.tsx`
- `frontend/components/chat/weather-block.tsx`
- `frontend/components/chat/booking-form-block.tsx`
- `frontend/components/chat/booking-preview-block.tsx`
- `frontend/components/chat/image-block.tsx`
- `frontend/components/chat/image-lightbox.tsx`
- `frontend/components/chat/action-button-block.tsx`
- `frontend/components/chat/rich-content-blocks.tsx`
- `frontend/components/tour/newsletter-cta.tsx`
- `frontend/app/admin/reviews/page.tsx`

**Frontend (Update):**
- `frontend/app/tours/page.tsx`
- `frontend/app/admin/page.tsx`
- `frontend/app/admin/bookings/page.tsx`
- `frontend/app/admin/tours/page.tsx`
- `frontend/components/chat/chat-message.tsx`
- `frontend/components/chat/chat-input.tsx`
- `frontend/components/chat/suggestion-chips.tsx`
- `frontend/stores/chat-store.ts`
- `frontend/lib/api.ts`
