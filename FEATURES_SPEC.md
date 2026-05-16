# TravelGPT — Comprehensive Enhancement SPEC
**Version**: 1.0 — 2026-05-15
**Status**: Implementation Plan

---

## 1. Tours Page Enhancement

### 1.1 Current State
- ✅ Search bar + category filters + region chips
- ✅ Featured tours section
- ✅ Sort dropdown + pagination
- ✅ Tour cards with image, rating, price, discount badge
- ✅ Mobile filter drawer
- ✅ Empty state

### 1.2 Missing Sections (Traveloka-style)

#### A. Destination Showcase (`DESTINATIONS section`)
A horizontal scrollable "chip" row at the top — clickable destination cards with hero images.

```tsx
// Design: horizontal scroll, each card 140x180px, image fill, rounded-xl
// 8 destinations: Đà Nẵng, Phú Quốc, Hội An, Sapa, Nha Trang, Hạ Long, Bali, Bangkok
// Each card: image bg + gradient overlay + name + tour count
// Below: "Xem tất cả điểm đến" link
```

#### B. "Khám phá theo chủ đề" (Theme/Browse by category)
Grid of large illustrated category cards replacing current pill filters.

```tsx
// 6 cards in 3x2 grid: Biển, Núi, Di sản, Ẩm thực, Mạo hiểm, Nghỉ dưỡng
// Each: 200px height, bg image, gradient overlay, icon, name, tour count
```

#### C. "Tour giảm giá" (Deals Section)
Flash-sale style row for tours with `discount_price < price`.

```tsx
// Horizontal scrollable row
// Each deal card: countdown timer badge (fake 2h), discount badge,
// original price strikethrough, sale price, progress bar (% sold)
// Dark themed section background
```

#### D. "Cảm nhận khách hàng" (Testimonials)
Auto-scrolling testimonial cards with avatar, rating, comment.

```tsx
// 4-5 static testimonials from seed data (reviews with isVerified: true)
// Each card: avatar, name, tour taken, 5-star rating, comment text
// Auto-scroll carousel with dots
```

#### E. "Tại sao chọn TravelGPT?" (Why Us)
Icon + stat cards — social proof strip.

```tsx
// 4 stats: 50K+ khách, 500+ tour, 4.9 sao, 24/7 hỗ trợ
// Dark/navy background strip
```

#### F. Newsletter CTA
Simple email capture strip before footer.

#### G. Tour Detail Page — Additional Sections
- **Review section**: Show top 3 reviews with avatar, rating, comment, verified badge
- **Related tours**: "Tour liên quan" horizontal scroll (same region/category)
- **Share/compare**: Add to compare functionality, copy link

### 1.3 Implementation Files
| File | Change |
|---|---|
| `frontend/app/tours/page.tsx` | Add new sections A–F after hero |
| `frontend/app/tours/[slug]/page.tsx` | Add reviews + related tours sections |
| `frontend/components/tour/tour-card-deal.tsx` | New: Deal card component |
| `frontend/components/tour/destination-showcase.tsx` | New: Destination carousel |
| `frontend/components/tour/testimonials.tsx` | New: Testimonials carousel |

---

## 2. AI Chat — Rich Content & Multi-Format Support

### 2.1 Current State
- ✅ Text streaming with SSE
- ✅ Tool status indicator (spinner + label)
- ✅ Tour result cards (inline)
- ✅ Web search result cards
- ✅ Booking flow inline card
- ✅ Cancellation flow inline card
- ✅ Suggestion chips (bottom)
- ✅ RenderContent utility for markdown-like text (bold, italic, lists, links, code)

### 2.2 Missing Features

#### A. Image Attachments (User → AI)
Users can attach images in the chat input.

```tsx
// Input: attach button → file picker (image/*)
// Preview: thumbnail in input area, click to remove
// Multiple images: up to 3
// Format: base64 or URL → send as part of message payload
// Storage: optional — upload to backend, return URL
// BE change: update chat schema + message endpoint
```

**UI**: Small attach icon (📎) next to send button. When image attached: show image preview below input, "×" to remove.

#### B. Rich Content Types (AI → User)

The AI should be able to respond with structured content blocks, not just markdown text:

| Block Type | Description | Example |
|---|---|---|
| `image` | Single image with caption | "Here's a photo of Ha Long Bay" |
| `gallery` | Horizontal image carousel | 3-5 images from tour |
| `table` | Structured tabular data | Tour comparison, pricing table |
| `card_grid` | 2-3 side-by-side info cards | Feature highlights |
| `timeline` | Vertical timeline | Day-by-day itinerary |
| `stats` | Number stat row | "⭐ 4.9 rating • 128 reviews" |
| `alert` | Info/warning/success banner | Policy info, reminders |
| `code` | Code block | JSON, booking reference |

#### C. Backend Schema Changes

```python
# New message content structure (JSON blocks)
# Frontend parses blocks array:

content_blocks: [
  {"type": "text", "content": "..."},
  {"type": "image", "url": "...", "caption": "..."},
  {"type": "gallery", "images": [{"url": "...", "caption": "..."}]},
  {"type": "table", "headers": [...], "rows": [[...]]},
  {"type": "card_grid", "cards": [{"title": "...", "body": "..."}]},
  {"type": "timeline", "items": [{"day": "...", "title": "...", "desc": "..."}]},
  {"type": "stats", "items": [{"icon": "...", "label": "...", "value": "..."}]},
  {"type": "alert", "variant": "info|warning|success", "content": "..."},
]
```

#### D. Chat Input — File Preview & Attach UI
```tsx
// Attach button: Paperclip icon
// On click: hidden <input type="file" accept="image/*" multiple />
// Preview: horizontal scroll of image thumbnails below input
// Each thumbnail: 60x60 rounded, × overlay
// Max 3 images
// On send: attach images[] to message payload
```

### 2.3 Implementation Files
| File | Change |
|---|---|
| `frontend/stores/chat-store.ts` | Add `attachments: Attachment[]` state |
| `frontend/components/chat/chat-input.tsx` | Rewrite: file attach, image preview |
| `frontend/components/chat/rich-content-blocks.tsx` | New: table, gallery, timeline, stats, alert blocks |
| `frontend/components/chat/chat-message-item.tsx` | Render content_blocks array |
| `frontend/lib/render-content.tsx` | Support content_blocks parsing |
| `frontend/types/chat.ts` | Add `ContentBlock`, `Attachment` types |
| `backend/app/schemas/chat.py` | Add `content_blocks: Optional[List[Dict]]` |
| `backend/app/services/chat_service.py` | Build structured blocks in response |

---

## 3. Admin Dashboard — Full Upgrade

### 3.1 Current State
- ✅ Basic 4-stat grid
- ✅ Recent bookings list (last 5)
- ✅ Quick link cards
- **Missing**: Revenue chart, activity feed, system stats, notifications

### 3.2 Admin Dashboard (`/admin`)

#### A. Header Bar
- Greeting: "Chào buổi sáng, Admin"
- Quick stats pills: today's bookings, today's revenue, pending count

#### B. Revenue Chart
```tsx
// Simple bar chart: last 7 days bookings + revenue
// Use: simple div-based chart (no heavy library)
// X-axis: days, Y-axis: revenue (VND)
// Tooltip on hover: date + revenue + count
```

#### C. Activity Feed
```tsx
// Real-time-ish log of recent actions:
// "Tran Thị Trâm đặt tour Đà Nẵng 3N2Đ"
// "Thanh toán Stripe cho TGPT-2026-001 thành công"
// "Admin xác nhận booking TGPT-2026-002"
// Each: avatar, action text, time ago, status dot
```

#### D. Top Tours
```tsx
// Table: top 5 tours by booking count
// Tour name, bookings, revenue, occupancy rate
```

#### E. System Health
```tsx
// Small cards: DB status (green dot), API latency, active sessions
```

### 3.3 Admin Tour Management (`/admin/tours`)

#### A. Table with Actions
| Column | Content |
|---|---|
| Image | 48x48 thumbnail |
| Name | + destination tag |
| Region | NORTH/CENTRAL/SOUTH/INTL |
| Price | discounted price |
| Featured | toggle switch |
| Status | Active/Inactive |
| Bookings | count |
| Actions | Edit, Feature, Disable |

#### B. Add/Edit Tour Modal
Full form to create or edit tour:
```tsx
// Fields: name, slug (auto-generate), destination, region,
// duration, description, shortDescription, price, discountPrice,
// maxParticipants, category, tags, images (URL list),
// highlights (list), includes (list), excludes (list),
// departureDates (date picker), schedule (JSON builder),
// isFeatured toggle, isActive toggle
```

### 3.4 Admin Booking Management (`/admin/bookings`)

#### A. Enhanced Filters
```tsx
// Search: by booking code, customer name, email, phone
// Status: PENDING, CONFIRMED, CANCELLED, COMPLETED
// Payment: UNPAID, PAID, REFUNDED
// Date range: from/to date pickers
// Region/Destination: dropdown
```

#### B. Bulk Actions
```tsx
// Checkbox on each row
// Actions: Confirm selected, Cancel selected, Export CSV
```

#### C. Booking Detail Modal
```tsx
// Slide-over panel with full booking info
// Tour image, customer info, payment info, timeline
// Actions: Confirm booking, Confirm payment, Cancel, Send email reminder
```

#### D. Export CSV
```tsx
// Download bookings as CSV with: code, customer, tour, date, amount, status, payment
```

### 3.5 Admin User Management (`/admin/users`)

#### A. Table
| Column | Content |
|---|---|
| Avatar | initials circle |
| Name + Email | |
| Phone | |
| Role | Badge (USER/ADMIN) |
| Bookings | count |
| Joined | date |
| Status | Active/Disabled |
| Actions | Edit role, Disable/Enable |

#### B. Edit User Modal
```tsx
// Change role (USER ↔ ADMIN)
// Disable/Enable account
// View booking history
```

### 3.6 Implementation Files
| File | Change |
|---|---|
| `frontend/app/admin/page.tsx` | Full rewrite: chart, activity feed, top tours |
| `frontend/app/admin/tours/page.tsx` | Add table CRUD, Add/Edit modal, Feature toggle |
| `frontend/app/admin/bookings/page.tsx` | Search, bulk actions, detail modal, CSV export |
| `frontend/app/admin/users/page.tsx` | Table, role edit, disable/enable |
| `frontend/components/admin/revenue-chart.tsx` | New: bar chart component |
| `frontend/components/admin/activity-feed.tsx` | New: activity feed |
| `frontend/components/admin/tour-form-modal.tsx` | New: tour create/edit form |
| `frontend/components/admin/booking-detail-panel.tsx` | New: slide-over booking detail |
| `frontend/lib/admin-api.ts` | New: admin-specific API helpers |

---

## 4. Implementation Priority

| Priority | Task | Effort |
|---|---|---|
| P0 | Tours page: destination showcase + deals + testimonials | Medium |
| P1 | Admin bookings: search + export + detail modal | Medium |
| P2 | Admin dashboard: revenue chart + activity feed | Medium |
| P3 | AI Chat: content_blocks + image attachments | High |
| P4 | Admin tours: full CRUD modal + feature toggle | Medium |
| P5 | Admin users: role management | Small |
| P6 | Tour detail: reviews + related tours | Small |

---

## 5. Design System (Consistency)

All new components must follow:

```
Colors:
  Primary:     #0046C1 (Cobalt Blue)
  Accent:      #0391FF (Azure)
  Navy:         #000E1A (Deep Navy)
  Surface:      #F7F7F7 (Light Gray)
  Surface Light: #D9EEFF (Light Blue)
  Border:      #DDDDDD
  Gray Text:    #636363
  Success:      #059669 / #22C55E
  Warning:      #D97706
  Destructive:  #DC2626 / #ED1D24

Typography: Mulish (400, 500, 600, 700, 800)
Border Radius: 12-20px (cards), 50px (pills/chips), 8px (inputs)
Shadows: subtle (0 2px 8px), elevated (0 8px 30px)
Icons: lucide-react (consistent stroke weight)
```

---

## 6. Backend API Additions

| Endpoint | Method | Description |
|---|---|---|
| `/admin/stats/overview` | GET | Dashboard overview stats (total revenue, bookings today, etc.) |
| `/admin/stats/revenue?days=7` | GET | Revenue by day for chart |
| `/admin/activity` | GET | Recent activity feed |
| `/tours/{id}` | PUT | Admin update tour |
| `/tours/{id}` | DELETE | Admin soft-delete tour |
| `/uploads/image` | POST | Upload image, return URL |
| `/bookings/export` | GET | Export bookings as CSV |
| `/chat/message` | POST | Updated: support `attachments: string[]` |

---

## 7. Data Model Additions

```prisma
// ChatMessage: add content_blocks JSON field
content_blocks  Json     @default("[]")

// Booking: add indexed fields for filtering
// Already has status, paymentStatus, createdAt

// New: ActivityLog (optional, can use existing Booking+ChatMessage)
model ActivityLog {
  id        String   @id @default(uuid())
  type     String   // "booking_created", "payment", "tour_booked", "user_registered"
  message  String
  metadata Json     @default("{}")
  createdAt DateTime @default(now())
}
```

---

## 8. Testing Checklist

- [ ] Tours page loads with all new sections
- [ ] Destination cards navigate to filtered tours
- [ ] Deal countdown timer displays correctly
- [ ] Testimonials auto-scroll
- [ ] Admin dashboard chart renders with data
- [ ] Admin bookings search returns correct results
- [ ] Admin bookings export generates valid CSV
- [ ] Admin tour CRUD works end-to-end
- [ ] Admin user role toggle works
- [ ] AI chat renders content_blocks (table, gallery)
- [ ] AI chat accepts image attachments
- [ ] All new components follow design system
- [ ] FE build passes with 0 errors
