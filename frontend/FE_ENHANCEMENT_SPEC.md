# TravelGPT Frontend Enhancement Spec

## Mục tiêu
Cải thiện UX cho AI streaming chat — đặc biệt khi backend gọi tool calling, web search, cancel/reschedule.

---

## 1. Tool-Use Status Indicator

**Vấn đề**: Khi AI đang gọi tool (search_tours, web_search_travel, v.v.), user chỉ thấy "Đang suy nghĩ..." mà không biết AI đang làm gì.

**Giải pháp**: Thêm streaming status trong `AssistantBubble` khi AI đang xử lý tool.

```tsx
// Hiển thị khi đang streaming + đã detect intent
{isStreaming && (
  <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full"
       style={{ background: "#F0F4FF", color: "#0046C1" }}>
    <Loader2 className="h-3 w-3 animate-spin" />
    <span>Đang tìm kiếm tour...</span>
  </div>
)}
```

**Mapping intent → label:**
- `search_tour` → "Đang tìm kiếm tour..."
- `cancel_booking` → "Đang kiểm tra booking..."
- `web_search` → "Đang tra cứu thông tin..."
- `general_question` → "Đang xử lý..."
- fallback → "Đang trả lời..."

---

## 2. Web Search Results Component

**Vấn đề**: Khi AI gọi `web_search_travel`, kết quả từ Traveloka/Booking/Viator chưa được hiển thị đẹp.

**Giải pháp**: Component `WebSearchResultCard` hiển thị kết quả tìm kiếm web.

```tsx
interface WebSearchResult {
  site: "traveloka" | "booking" | "viator";
  title: string;
  description: string;
  url: string;
  price?: string;
  rating?: number;
  location?: string;
}
```

**UI**:
- Card nhỏ gọn trong chat (width 100%, max 2-3 results hiển thị)
- Site badge (Traveloka màu cam, Booking màu xanh dương, Viator màu xanh lá)
- Title + description
- Price + rating (nếu có)
- Nút "Xem chi tiết" → mở URL trong tab mới

---

## 3. Improved Markdown Renderer

**Vấn đề**: `renderContent()` chỉ xử lý `**bold**`, không có italic, links, lists.

**Giải pháp**: Nâng cấp `renderContent()` hỗ trợ:
- `**bold**` → `<strong>`
- `*italic*` → `<em>`
- `[text](url)` → `<a href>` với external link indicator
- `•` hoặc `- ` → `<ul><li>`
- `\n` → line breaks

---

## 4. Cancellation / Reschedule Inline Card

**Vấn đề**: Cancellation và reschedule flow hiện chỉ là text trong chat message.

**Giải pháp**: Component `CancellationCard` và `RescheduleCard` hiển thị inline trong chat.

```tsx
// CancellationCard
- Header: "Yêu cầu hủy booking" (màu đỏ)
- Booking code badge
- Refund policy table (số ngày → % hoàn tiền)
- Nút "Xác nhận hủy" / "Không hủy nữa"
```

---

## 5. Tour Detail Expandable

**Vấn đề**: `TourResultInline` chỉ hiển thị 2 trường cơ bản.

**Giải pháp**: Thêm expand → hiện highlights, includes, schedule.

```tsx
// Trong TourResultInline card
{tour.highlights && tour.highlights.length > 0 && expanded && (
  <ul className="mt-2 space-y-1">
    {tour.highlights.map((h, i) => (
      <li key={i} className="flex items-start gap-2 text-xs" style={{ color: GRAY }}>
        <CheckCircle2 className="h-3 w-3 mt-0.5 flex-shrink-0" style={{ color: "#22C55E" }} />
        {h}
      </li>
    ))}
  </ul>
)}
```

---

## 6. Accessibility Improvements

- Thêm `aria-label` cho tất cả buttons
- Thêm `role="status"` cho streaming indicator
- Thêm `aria-live="polite"` cho suggestions
- Focus management sau khi message được thêm
- `prefers-reduced-motion` respect cho animations

---

## 7. Better Error States

- Inline error trong message bubble (không chỉ toast)
- Retry button trong error bubble
- "Kết nối lại" cho network errors

---

## Implementation Files

1. `frontend/components/chat/web-search-result-card.tsx` — NEW
2. `frontend/components/chat/cancellation-card.tsx` — NEW  
3. `frontend/components/chat/reschedule-card.tsx` — NEW
4. `frontend/components/chat/markdown-renderer.tsx` — NEW
5. `frontend/lib/render-content.ts` — NEW (shared markdown utility)
6. `frontend/types/chat.ts` — ADD: WebSearchResult, CancellationFlowData types
7. `frontend/app/chat/page.tsx` — ENHANCE: integrate all components
8. `frontend/stores/chat-store.ts` — ADD: webSearchResults, toolStatus state
9. `frontend/stores/chat-store.ts` — ENHANCE: addTourResults action

---

## Design System

- Style: AI-Native UI (dark mode support)
- Colors: PRIMARY `#0046C1`, ACCENT `#0391FF`, SURFACE `#F7F7F7`
- Font: Plus Jakarta Sans
- Icons: Lucide React
- Spacing: 4/8dp rhythm
- Touch targets: ≥44×44pt
