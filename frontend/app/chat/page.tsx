"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useChatStore } from "@/stores/chat-store";
import { chatApi } from "@/lib/chat-api";
import type { ChatMessage as ChatMessageResponse } from "@/types/chat";
import type {
  ChatMessage,
  ChatSuggestion,
  Tour,
  BookingFlowStep,
  BookingFlowData,
  WebSearchResult,
  ImageAttachment,
} from "@/types";
import type { ContentBlock as AIContentBlock } from "@/types";
import {
  ChatInput,
  SuggestionChips,
  ChatHeader,
  ChatEmptyState,
  ChatMessageItem,
} from "@/components/chat";
import { WebSearchResultCard } from "@/components/chat/web-search-result-card";
import { CancellationCard } from "@/components/chat/cancellation-card";
import { RescheduleCard } from "@/components/chat/reschedule-card";
import { useImageAttachments } from "@/components/chat/chat-attachments";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/layout/navbar";
import { renderContentBlocks } from "@/components/chat/rich-content-blocks";
import type { ContentBlock } from "@/types/chat";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bot,
  Sparkles,
  MapPin,
  CalendarDays,
  Users,
  ArrowRight,
  CheckCircle2,
  X,
  Loader2,
  Search,
  Globe,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import { renderContent } from "@/lib/render-content";

// ─── Design Tokens (Airbnb/Traveloka Style) ─────────────────────────────────────
const PRIMARY = "#0046C1";
const ACCENT = "#0391FF";
const SURFACE = "#F7F7F7";
const SURFACE_LIGHT = "#D9EEFF";
const NAVY = "#000E1A";
const GRAY = "#636363";
const BORDER = "#E8F4FF";

// ─── Welcome Message ───────────────────────────────────────────────────────────
const WELCOME_MSG: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Xin chào! Tôi là **AI Travel Agent** của TravelGPT.\n\nTôi có thể giúp bạn:\n• Tìm tour du lịch phù hợp với ngân sách\n• Đặt tour trực tiếp qua hội thoại\n• Hỗ trợ thay đổi hoặc hủy booking\n• Lên kế hoạch chuyến đi\n\nBạn muốn đi đâu?",
  metadata: { intent: "greeting" },
};

// ─── Intent → Tool Status label ─────────────────────────────────────────────────
const INTENT_TOOL_LABELS: Record<string, { status: string; label: string }> = {
  search_tour: { status: "searching_tours", label: "Đang tìm kiếm tour..." },
  get_tour_detail: { status: "fetching_tour_details", label: "Đang lấy chi tiết tour..." },
  list_all_tours: { status: "searching_tours", label: "Đang tải danh sách tour..." },
  get_user_bookings: { status: "checking_bookings", label: "Đang kiểm tra booking..." },
  cancel_booking: { status: "cancelling_booking", label: "Đang hủy booking..." },
  web_search: { status: "searching_web", label: "Đang tra cứu trên web..." },
};

function getToolStatus(intent?: string): { status: string; label: string } | null {
  if (!intent) return null;
  return INTENT_TOOL_LABELS[intent] ?? { status: "synthesizing", label: "Đang xử lý..." };
}

// ─── Assistant Bubble ──────────────────────────────────────────────────────────
function AssistantBubble({
  content,
  intent,
  suggestions,
  toolStatus,
  toolLabel,
  onSuggestionClick,
  isError,
}: {
  content: string;
  intent?: string;
  suggestions?: ChatSuggestion[];
  toolStatus?: string;
  toolLabel?: string;
  onSuggestionClick?: (text: string) => void;
  isError?: boolean;
}) {
  return (
    <div className="flex gap-3 animate-[slide-up_0.3s_ease-out]">
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg"
        style={{ background: isError ? "#DC2626" : `linear-gradient(135deg, ${PRIMARY}, ${ACCENT})` }}
      >
        {isError ? (
          <AlertCircle className="h-5 w-5 text-white" />
        ) : (
          <Bot className="h-5 w-5 text-white" />
        )}
      </div>
      <div className="flex-1 space-y-3 max-w-[85%]">
        <Card
          className="border-0 shadow-lg p-5"
          style={{
            backgroundColor: isError ? "#FEF2F2" : "#FFFFFF",
            borderRadius: "20px 20px 20px 4px",
            boxShadow: isError
              ? "0 4px 20px rgba(220,38,38,0.15)"
              : "0 4px 20px rgba(0,70,193,0.12)",
            border: isError ? "1px solid #FECACA" : "none",
          }}
        >
          {/* Tool status indicator */}
          {toolStatus && toolLabel && toolStatus !== "idle" && (
            <div
              className="flex items-center gap-2 mb-3 text-xs font-medium px-3 py-1.5 rounded-full"
              style={{ backgroundColor: "#EEF6FF", color: "#0046C1" }}
              role="status"
              aria-label={toolLabel}
            >
              <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" />
              <span>{toolLabel}</span>
              <Globe className="h-3 w-3 ml-1 flex-shrink-0" aria-hidden="true" />
            </div>
          )}

          {/* Error indicator */}
          {isError && (
            <div
              className="flex items-center gap-2 mb-3 text-xs font-medium px-3 py-1.5 rounded-full"
              style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}
            >
              <AlertCircle className="h-3 w-3 flex-shrink-0" />
              <span>Có lỗi xảy ra</span>
            </div>
          )}

          <div className="whitespace-pre-wrap text-[15px] leading-relaxed" style={{ color: isError ? "#7F1D1D" : NAVY }}>
            {renderContent(content)}
          </div>
        </Card>
        {suggestions && suggestions.length > 0 && onSuggestionClick && (
          <div className="flex flex-wrap gap-2 pl-1">
            {suggestions.slice(0, 3).map((s, i) => (
              <button
                key={i}
                onClick={() => onSuggestionClick(s.text)}
                className="text-[13px] px-4 py-2 font-medium shadow-sm transition-all duration-200 flex items-center gap-2 cursor-pointer"
                style={{
                  backgroundColor: "#FFFFFF",
                  color: PRIMARY,
                  border: `1px solid ${SURFACE_LIGHT}`,
                  borderRadius: "50px",
                  boxShadow: "0 2px 8px rgba(0,70,193,0.1)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = SURFACE_LIGHT;
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#FFFFFF";
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                }}
              >
                <Sparkles className="h-3.5 w-3.5" style={{ color: ACCENT }} />
                {s.text}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── User Bubble ───────────────────────────────────────────────────────────────
function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex gap-3 justify-end animate-[slide-up_0.3s_ease-out]">
      <Card
        className="p-4 max-w-[80%] shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${ACCENT} 0%, ${PRIMARY} 100%)`,
          borderRadius: "20px 20px 4px 20px",
          border: "none",
        }}
      >
        <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-white">
          {content}
        </div>
      </Card>
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md"
        style={{
          backgroundColor: "#FFFFFF",
          border: `2px solid ${SURFACE_LIGHT}`,
        }}
      >
        <Bot className="h-5 w-5" style={{ color: PRIMARY }} />
      </div>
    </div>
  );
}

// ─── Streaming Bubble ──────────────────────────────────────────────────────────
function StreamingBubble() {
  return (
    <div className="flex gap-3 animate-[slide-up_0.3s_ease-out]">
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg"
        style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${ACCENT})` }}
      >
        <Bot className="h-5 w-5 text-white" />
      </div>
      <Card
        className="border-0 shadow-lg p-5"
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "20px 20px 20px 4px",
          boxShadow: "0 4px 20px rgba(0,70,193,0.12)",
        }}
      >
        <div className="flex items-center gap-3" style={{ color: GRAY }}>
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: ACCENT,
                  animation: `bounce 1.2s ease-in-out infinite`,
                  animationDelay: `${i * 150}ms`,
                }}
              />
            ))}
          </div>
          <span className="text-sm font-medium">Đang suy nghĩ...</span>
        </div>
      </Card>
    </div>
  );
}

// ─── Tour Result Inline ────────────────────────────────────────────────────────
function TourResultInline({
  tours,
  onBook,
  router,
}: {
  tours: Tour[];
  onBook: (tour: Tour) => void;
  router: ReturnType<typeof useRouter> | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const display = expanded ? tours : tours.slice(0, 2);

  return (
    <div className="space-y-3 animate-[slide-up_0.3s_ease-out] ml-14">
      {display.map((tour) => (
        <Card
          key={tour.id}
          className="overflow-hidden border-0 cursor-pointer transition-all duration-300"
          style={{
            borderRadius: "16px",
            boxShadow: "0 4px 20px rgba(0,70,193,0.1)",
          }}
          onClick={() => router?.push(`/tours/${tour.slug}`)}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
            (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 30px rgba(0,70,193,0.18)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 20px rgba(0,70,193,0.1)";
          }}
        >
          {(tour.images && tour.images.length > 0) && (
            <div className="relative h-40 overflow-hidden">
              <img
                src={
                  typeof tour.images[0] === "string"
                    ? tour.images[0]
                    : tour.images[0].url
                }
                alt={tour.name}
                className="w-full h-full object-cover"
              />
              {tour.category && (
                <span
                  className="absolute top-3 left-3 px-3 py-1 text-[11px] font-bold text-white"
                  style={{
                    backgroundColor: PRIMARY,
                    borderRadius: "20px",
                  }}
                >
                  {tour.category}
                </span>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>
          )}
          <div className="p-4 space-y-3">
            <h4 className="font-bold text-[15px] line-clamp-1" style={{ color: NAVY }}>
              {tour.name}
            </h4>
            <div className="flex items-center gap-4 text-[12px]" style={{ color: GRAY }}>
              {tour.duration && (
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" style={{ color: ACCENT }} />
                  {tour.duration}
                </span>
              )}
              {tour.departure_dates && tour.departure_dates.length > 0 && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" style={{ color: ACCENT }} />
                  {tour.departure_dates[0]}
                </span>
              )}
            </div>
            {tour.price && (
              <div className="flex items-end justify-between pt-1">
                <div>
                  <p className="text-[11px]" style={{ color: GRAY }}>Từ</p>
                  <p className="text-[18px] font-bold" style={{ color: PRIMARY }}>
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                      maximumFractionDigits: 0,
                    }).format(tour.price)}
                    <span className="text-[12px] font-normal" style={{ color: GRAY }}>
                      /người
                    </span>
                  </p>
                </div>
                <Button
                  size="sm"
                  className="h-9 px-5 text-[13px] font-semibold text-white shadow-md transition-all"
                  style={{
                    background: `linear-gradient(135deg, ${ACCENT}, ${PRIMARY})`,
                    borderRadius: "12px",
                    border: "none",
                  }}
                  onClick={() => onBook(tour)}
                >
                  Đặt ngay
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            )}
          </div>
        </Card>
      ))}
      {tours.length > 2 && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full text-center text-[13px] py-2.5 font-semibold transition-all"
          style={{ color: ACCENT }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.textDecoration = "underline";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.textDecoration = "none";
          }}
        >
          Xem thêm {tours.length - 2} tour khác
        </button>
      )}
    </div>
  );
}

// ─── Booking Flow Inline ──────────────────────────────────────────────────────
function BookingFlowInline({
  step,
  data,
  onNext,
  onCancel,
}: {
  step: BookingFlowStep;
  data?: Partial<BookingFlowData>;
  onNext: (payload: Record<string, unknown>) => void;
  onCancel: () => void;
}) {
  const STEPS: BookingFlowStep[] = [
    "COLLECT_TOUR",
    "COLLECT_DATE",
    "COLLECT_PARTICIPANTS",
    "COLLECT_EMAIL",
    "CONFIRM_BOOKING",
  ];
  const currentIdx = STEPS.indexOf(step);

  const labels: Record<string, string> = {
    GREETING: "Chào hỏi",
    COLLECT_NAME: "Tên",
    COLLECT_EMAIL: "Email",
    COLLECT_PHONE: "Số điện thoại",
    COLLECT_TOUR: "Chọn tour",
    COLLECT_DATE: "Ngày khởi hành",
    COLLECT_PARTICIPANTS: "Số người",
    COLLECT_SPECIAL_REQUESTS: "Yêu cầu đặc biệt",
    CONFIRM_BOOKING: "Xác nhận",
    PROCESSING: "Đang xử lý",
  };

  if (currentIdx === -1) return null;

  return (
    <div className="animate-[slide-up_0.3s_ease-out] ml-14">
      <Card
        className="border-0 overflow-hidden"
        style={{
          borderRadius: "20px",
          boxShadow: "0 8px 30px rgba(0,70,193,0.15)",
        }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{
            background: `linear-gradient(135deg, ${PRIMARY}, ${ACCENT})`,
          }}
        >
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-white" />
            <span className="text-white font-bold text-[15px]">
              Đang đặt tour qua AI
            </span>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer"
            style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.3)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.2)";
            }}
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>

        {/* Step indicators */}
        <div className="px-5 py-4 flex items-center gap-1">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 text-xs font-bold flex-shrink-0",
                  i <= currentIdx ? "text-white" : ""
                )}
                style={
                  i <= currentIdx
                    ? { background: `linear-gradient(135deg, ${PRIMARY}, ${ACCENT})`, borderRadius: "50%" }
                    : { backgroundColor: SURFACE, borderRadius: "50%", color: GRAY }
                }
              >
                {i < currentIdx ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  i + 1
                )}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn("flex-1 h-1 mx-1.5 rounded-full")}
                  style={
                    i < currentIdx
                      ? { background: `linear-gradient(90deg, ${PRIMARY}, ${ACCENT})` }
                      : { backgroundColor: SURFACE }
                  }
                />
              )}
            </div>
          ))}
        </div>

        {/* Step label */}
        <div className="px-5 pb-2">
          <p className="text-[12px]" style={{ color: GRAY }}>
            Bước {currentIdx + 1}/{STEPS.length} —{" "}
            <span className="font-bold" style={{ color: PRIMARY }}>
              {labels[step] ?? step}
            </span>
          </p>
        </div>

        {/* Tour info */}
        {data?.tour_name && (
          <div className="px-5 pb-3">
            <div
              className="px-4 py-3 flex items-center gap-3"
              style={{ backgroundColor: SURFACE_LIGHT, borderRadius: "12px" }}
            >
              <MapPin className="h-4 w-4 flex-shrink-0" style={{ color: PRIMARY }} />
              <span className="text-[13px] font-medium" style={{ color: NAVY }}>
                {data.tour_name}
              </span>
            </div>
          </div>
        )}

        {/* Date/participants */}
        {(data?.departure_date || data?.num_adults || data?.num_children) && (
          <div className="px-5 pb-3 flex gap-4 text-[12px]" style={{ color: GRAY }}>
            {data.departure_date && (
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" style={{ color: ACCENT }} />
                {new Date(data.departure_date).toLocaleDateString("vi-VN")}
              </span>
            )}
            {(data.num_adults || data.num_children) && (
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" style={{ color: ACCENT }} />
                {data.num_adults ?? 0} lớn
                {data.num_children ? `, ${data.num_children} trẻ em` : ""}
              </span>
            )}
          </div>
        )}

        {/* Price */}
        {data?.total_price && (
          <div className="px-5 pb-3">
            <div
              className="flex justify-between items-center px-4 py-3 font-semibold"
              style={{ backgroundColor: SURFACE_LIGHT, borderRadius: "12px" }}
            >
              <span className="text-[13px]" style={{ color: GRAY }}>Tổng tiền</span>
              <span className="text-[15px] font-bold" style={{ color: PRIMARY }}>
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                  maximumFractionDigits: 0,
                }).format(data.total_price)}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-5 pb-5 flex gap-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-10 text-[13px] font-semibold"
            style={{ borderRadius: "12px", border: `1px solid ${BORDER}`, color: GRAY }}
            onClick={onCancel}
          >
            Hủy
          </Button>
          <Button
            size="sm"
            className="flex-1 h-10 text-[13px] font-semibold text-white shadow-md"
            style={{
              background: `linear-gradient(135deg, ${ACCENT}, ${PRIMARY})`,
              borderRadius: "12px",
              border: "none",
            }}
            onClick={() => onNext({})}
          >
            Tiếp tục
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [pendingSuggestions, setPendingSuggestions] = useState<ChatSuggestion[]>([]);

  // Image attachments
  const { attachments, addAttachments, removeAttachment, clearAttachments, hasAttachments } =
    useImageAttachments();
  const router = useRouter();

  const {
    messages,
    isLoading,
    isStreaming,
    bookingFlowActive,
    bookingStep,
    bookingData,
    sessionId,
    conversations,
    addMessage,
    setMessages: _setMessages,
    setLoading,
    setStreaming,
    setSuggestions,
    setSessionId,
    setBookingFlow,
    updateBookingData,
    clearMessages,
    resetFlows,
    setCancellationFlow,
    failedMessages,
    removeFailedMessage,
    retryMessage,
    toolStatus,
    toolLabel,
    setToolStatus,
    clearToolStatus,
    webSearchResults,
    webSearchQuery,
    setWebSearchResults,
    clearWebSearchResults,
    cancellationFlowActive,
    rescheduleFlowActive,
    setRescheduleFlow,
  } = useChatStore();
  const { isAuthenticated } = useAuth();
  const initializedRef = useRef(false);

  // Initialize session - only once on mount
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Clear persisted messages on reload → always start fresh
    _setMessages([]);

    if (!sessionId) {
      setSessionId(uuidv4());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // NOTE: Chat history is NOT loaded on reload by design.
  // Each page reload = fresh conversation. History can be accessed
  // via the conversation history sidebar or explicit user action.

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading, isStreaming]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, []);

  // Extract tours from message metadata
  const extractTours = (metadata?: Record<string, unknown>): Tour[] => {
    if (!metadata?.tours) return [];
    const tours = metadata.tours;
    if (Array.isArray(tours)) {
      return tours as Tour[];
    }
    return [];
  };

  // Handle suggestion click
  const handleSuggestionClick = (text: string) => {
    setPendingSuggestions([]);
    handleSubmit(text);
  };

  // Core submit logic
  const handleSubmit = async (text?: string) => {
    if (isLoading || isStreaming) return;

    const messageText = text?.trim();
    if (!messageText) return;

    setPendingSuggestions([]);

    // Add welcome message only if this is the first message in the conversation
    if (messages.length === 0) {
      addMessage({ ...WELCOME_MSG, id: `welcome_${Date.now()}` });
    }

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: messageText,
      created_at: new Date().toISOString(),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    };
    addMessage(userMsg);
    setLoading(true);
    setStreaming(false);

    const streamingId = `assistant_${Date.now()}`;
    addMessage({
      id: streamingId,
      role: "assistant",
      content: "",
      metadata: {},
      created_at: new Date().toISOString(),
    });

    // Use ref to track first content (persists across renders)
    const hasFirstContent = { current: false };

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3008/api/v1";
      const token = typeof window !== "undefined" ? localStorage.getItem("tgpt_access") : null;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20_000);

      const response = await fetch(`${baseUrl}/chat/message/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: messageText, session_id: sessionId }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => null);
        const errorMessage =
          data?.message || data?.response || "Xin lỗi, có lỗi xảy ra. Bạn có thể thử lại không?";
        useChatStore.setState((state) => ({
          messages: state.messages.map((m) =>
            m.id === streamingId
              ? { ...m, content: errorMessage, metadata: { ...m.metadata, isError: true } }
              : m
          ),
        }));
        setLoading(false);
        setStreaming(false);
        toast.error("Dịch vụ tạm thời gián đoạn. Vui lòng thử lại.");
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw || raw === "[DONE]") continue;

          try {
            const event = JSON.parse(raw);

            if (event.type === "content") {
              // Only start streaming animation when first content arrives
              if (!hasFirstContent.current) {
                hasFirstContent.current = true;
                setStreaming(true);
              }
              // Show tool status while streaming
              if (event.intent) {
                const ts = getToolStatus(event.intent);
                if (ts) setToolStatus(ts.status as never, ts.label);
              }
              useChatStore.setState((state) => ({
                messages: state.messages.map((m) =>
                  m.id === streamingId ? { ...m, content: m.content + event.content } : m
                ),
              }));
            } else if (event.type === "complete") {
              useChatStore.setState((state) => ({
                messages: state.messages.map((m) =>
                  m.id === streamingId
                    ? {
                        ...m,
                        content_blocks: event.content_blocks || [],
                        metadata: {
                          intent: event.intent,
                          suggestions: event.suggestions,
                          booking_flow_active: event.booking_flow_active,
                          booking_step: event.booking_step,
                          booking_data: event.booking_data,
                          booking_code: event.booking_code,
                          cancellation_flow_active: event.cancellation_flow_active,
                          cancellation_step: event.cancellation_step,
                          cancellation_data: event.cancellation_data,
                          tours: event.tours,
                          content_blocks: event.content_blocks,
                        },
                      }
                    : m
                ),
              }));

              // Clear tool status when done
              clearToolStatus();
              clearWebSearchResults();

              // Activate cancellation flow if backend returns it
              if (event.cancellation_flow_active) {
                setCancellationFlow(true);
              }
              if (event.reschedule_flow_active) {
                setRescheduleFlow(true);
              }
              if (event.booking_flow_active && event.booking_step) {
                setBookingFlow(true, event.booking_step, event.booking_data ?? {});
              }
              if (event.suggestions && Array.isArray(event.suggestions) && event.suggestions.length > 0) {
                const chatSuggestions: ChatSuggestion[] = event.suggestions.map((text: string | ChatSuggestion) => {
                  if (typeof text === 'string') {
                    return { text, intent: event.intent, type: "suggestion" as const };
                  }
                  return text as ChatSuggestion;
                });
                setPendingSuggestions(chatSuggestions);
                setSuggestions(chatSuggestions);
              } else {
                setPendingSuggestions([]);
                setSuggestions([]);
              }
            } else if (event.type === "error") {
              clearToolStatus();
              throw new Error(event.error);
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }

      scrollToBottom();
    } catch (error: unknown) {
      const isAbort = error instanceof DOMException && error.name === "AbortError";
      let errorMessage = "Xin lỗi, có lỗi xảy ra. Bạn có thể thử lại không?";

      if (isAbort) {
        errorMessage = "Phản hồi từ AI quá chậm. Bạn có thể thử lại không?";
      }

      // Update the streaming message to show error content
      useChatStore.setState((state) => ({
        messages: state.messages.map((m) =>
          m.id === streamingId
            ? { ...m, content: errorMessage, metadata: { ...m.metadata, isError: true } }
            : m
        ),
      }));

      // Also show toast for additional notification
      if (isAbort) {
        toast.error("Phản hồi từ AI quá chậm. Vui lòng thử lại.");
      } else {
        toast.error("Có lỗi xảy ra khi xử lý tin nhắn.");
      }

      console.error("Chat error:", error);
      clearToolStatus();
      clearWebSearchResults();
    } finally {
      clearAttachments();
      setLoading(false);
      setStreaming(false);
    }
  };

  // Handle booking tour inline
  const handleBookFromTour = (tour: Tour) => {
    setBookingFlow(true, "COLLECT_DATE", {
      tour_id: tour.id,
      tour_name: tour.name,
      tour_price: tour.price,
    });
    handleSubmit(`Đặt tour ${tour.name}`);
  };

  // Booking flow navigation
  const handleBookingNext = (payload: Record<string, unknown>) => {
    updateBookingData(payload);
    if (!bookingStep) return;
    const FLOW: BookingFlowStep[] = [
      "COLLECT_TOUR",
      "COLLECT_DATE",
      "COLLECT_PARTICIPANTS",
      "COLLECT_EMAIL",
      "CONFIRM_BOOKING",
    ];
    const idx = FLOW.indexOf(bookingStep);
    if (idx < FLOW.length - 1) {
      const nextStep = FLOW[idx + 1];
      setBookingFlow(true, nextStep, { ...bookingData, ...payload });
      handleSubmit("Tiếp tục đặt tour");
    }
  };

  // Reset conversation
  const handleReset = () => {
    clearMessages();
    resetFlows();
    setPendingSuggestions([]);
    setSessionId(uuidv4());
  };

  // Load conversation from history
  const handleLoadConversation = async (targetSessionId: string) => {
    const conversation = conversations.find((c) => c.sessionId === targetSessionId);
    if (!conversation) {
      toast.error("Không tìm thấy cuộc trò chuyện");
      return;
    }

    // Show loading toast
    const loadingToast = toast.loading(`Đang tải: ${conversation.title}...`);

    try {
      // Fetch messages from backend
      const conversationData = await chatApi.getConversationMessages(targetSessionId);

      if (conversationData && conversationData.messages && conversationData.messages.length > 0) {
        // Convert API messages to ChatMessage format
        const loadedMessages: ChatMessage[] = conversationData.messages.map((msg: ChatMessageResponse) => ({
          id: msg.id || `msg_${Date.now()}`,
          role: msg.role,
          content: msg.content,
          created_at: msg.created_at || new Date().toISOString(),
          metadata: msg.metadata,
        }));

        // Set session and load messages
        setSessionId(targetSessionId);
        _setMessages(loadedMessages);
        toast.success(`Đã tải ${loadedMessages.length} tin nhắn`, { id: loadingToast });
      } else {
        // Backend doesn't have messages - show info to user
        setSessionId(targetSessionId);
        _setMessages([]);
        toast(
          "Cuộc trò chuyện này chưa được lưu server. Vui lòng đăng nhập để đồng bộ.",
          { id: loadingToast, duration: 4000 }
        );
      }
    } catch (error) {
      console.error("Failed to load conversation:", error);
      // On error, still switch to the conversation (local)
      setSessionId(targetSessionId);
      _setMessages([]);
      toast.error("Lỗi kết nối. Hiển thị chat mới.", { id: loadingToast });
    }
  };

  // Retry failed message
  const handleRetry = (messageId: string, content: string) => {
    removeFailedMessage(messageId);
    retryMessage(messageId);
    handleSubmit(content);
  };

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: "#FFFFFF" }}>
      <Navbar />

      {/* Chat Header with new features */}
      <ChatHeader onReset={handleReset} onLoadConversation={handleLoadConversation} />

      {/* Messages Area */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
        style={{ backgroundColor: SURFACE }}
      >
        {messages.length === 0 && (
          <ChatEmptyState onSuggestionClick={handleSuggestionClick} />
        )}

        {messages.map((message, idx) => {
          const isUser = message.role === "user";
          const isLast = idx === messages.length - 1;
          const isFailed = failedMessages.includes(message.id);
          const meta = message.metadata as Record<string, unknown> | undefined;
          const tours = extractTours(meta);
          const isBookingFlow = !isUser && meta?.booking_flow_active === true;
          const bStep = meta?.booking_step as BookingFlowStep | undefined;
          const bData = meta?.booking_data as Partial<BookingFlowData> | undefined;

          return (
            <div key={message.id} className="w-full">
              {isUser ? (
                // User message with actions
                <ChatMessageItem
                  message={message}
                  isFailed={isFailed}
                  onRetry={() => handleRetry(message.id, message.content)}
                />
              ) : (
                <div className="space-y-4">
                  {/* Assistant message — show tool status for last streaming message */}
                  <ChatMessageItem
                    message={message}
                    isLast={isLast}
                    toolStatus={isLast && isStreaming ? toolStatus : undefined}
                    toolLabel={isLast && isStreaming ? toolLabel : undefined}
                    isError={meta?.isError === true}
                  />

                  {/* Tour results - only show if NO content_blocks with tours */}
                  {tours.length > 0 && !message.content_blocks?.some((b: ContentBlock) => b.type === "tour_carousel" || b.type === "tour_card") && (
                    <TourResultInline tours={tours} onBook={handleBookFromTour} router={router} />
                  )}

                  {/* Web search results */}
                  {webSearchResults.length > 0 && isLast && (
                    <WebSearchResultCard
                      results={webSearchResults}
                      query={webSearchQuery ?? undefined}
                    />
                  )}

                  {/* Cancellation flow */}
                  {cancellationFlowActive && (
                    <CancellationCard
                      step={cancellationFlowActive ? "VERIFY_BOOKING" : undefined}
                      data={meta?.cancellation_data as never}
                      onConfirm={(reason) =>
                        handleSubmit(`Xác nhận hủy booking, lý do: ${reason ?? ""}`)
                      }
                      onCancel={() => {
                        resetFlows();
                        handleSubmit("Không hủy nữa");
                      }}
                      onReschedule={() => {
                        resetFlows();
                        handleSubmit("Tôi muốn đổi lịch thay vì hủy");
                      }}
                    />
                  )}

                  {/* Reschedule flow */}
                  {rescheduleFlowActive && (
                    <RescheduleCard
                      step={meta?.reschedule_step as never}
                      data={meta?.reschedule_data as never}
                      onConfirm={() => handleSubmit("Xác nhận đổi lịch")}
                      onCancel={() => {
                        resetFlows();
                        handleSubmit("Không đổi lịch nữa");
                      }}
                    />
                  )}

                  {/* Booking flow */}
                  {isBookingFlow && bStep && (
                    <BookingFlowInline
                      step={bStep}
                      data={bData}
                      onNext={handleBookingNext}
                      onCancel={resetFlows}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Streaming indicator - CHỈ hiện khi isLoading VÀ KHÔNG isStreaming
            (tức là đang prepare request, chưa bắt đầu stream)
            Khi đang streaming, content được update trực tiếp vào message */}
        {isLoading && !isStreaming && (
          <StreamingBubble />
        )}

        {/* Bottom suggestions */}
        {pendingSuggestions.length > 0 && !isLoading && !isStreaming && (
          <div className="animate-[slide-up_0.3s_ease-out]">
            <p className="text-[12px] mb-2 font-semibold" style={{ color: GRAY }}>Gợi ý:</p>
            <SuggestionChips
              suggestions={pendingSuggestions}
              onSelect={handleSuggestionClick}
            />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div
        className="flex-shrink-0 p-4"
        style={{
          backgroundColor: "#FFFFFF",
          borderTop: `1px solid ${BORDER}`,
        }}
      >
        <ChatInput
          onSend={(text) => handleSubmit(text)}
          disabled={isLoading || isStreaming}
          placeholder="Hỏi về tour, đặt tour, hoặc nhận gợi ý du lịch..."
          attachments={attachments}
          onRemoveAttachment={removeAttachment}
          onAddAttachments={addAttachments}
          attachDisabled={attachments.length >= 3}
        />
        <div className="flex items-center justify-between mt-3 px-1">
          <p className="text-[11px]" style={{ color: GRAY }}>
            AI có thể mắc lỗi — hãy xác minh thông tin quan trọng
          </p>
          <Link
            href="/tours"
            className="text-[11px] font-semibold transition-all flex items-center gap-1"
            style={{ color: ACCENT }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.textDecoration = "underline";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.textDecoration = "none";
            }}
          >
            Tìm kiếm tour
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
