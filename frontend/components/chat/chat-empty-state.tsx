"use client";
import { useChatStore, CHAT_PRIMARY, CHAT_ACCENT, CHAT_SURFACE_LIGHT, CHAT_GRAY } from "@/stores/chat-store";
import { MessageSquare, Sparkles, MapPin, CalendarCheck, LifeBuoy } from "lucide-react";

const QUICK_START_ITEMS = [
  {
    icon: MapPin,
    title: "Tìm tour du lịch",
    subtitle: "Đà Nẵng, Phú Quốc, Nha Trang...",
    color: "#0046C1",
  },
  {
    icon: CalendarCheck,
    title: "Đặt tour ngay",
    subtitle: "Chỉ cần nói, AI đặt cho bạn",
    color: "#0391FF",
  },
  {
    icon: Sparkles,
    title: "Gợi ý thông minh",
    subtitle: "AI cá nhân hóa theo sở thích",
    color: "#7C3AED",
  },
  {
    icon: LifeBuoy,
    title: "Hỗ trợ 24/7",
    subtitle: "Giải đáp mọi thắc mắc",
    color: "#059669",
  },
];

interface ChatEmptyStateProps {
  onSuggestionClick: (text: string) => void;
}

export function ChatEmptyState({ onSuggestionClick }: ChatEmptyStateProps) {
  const INITIAL_SUGGESTIONS = [
    { text: "Tìm tour miền Bắc ngân sách 5 triệu", intent: "tour_search" },
    { text: "Tour biển cuối tuần này", intent: "tour_search" },
    { text: "Gợi ý điểm du lịch mùa hè", intent: "recommendation" },
    { text: "Hỗ trợ đặt tour", intent: "booking_help" },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12 space-y-8">
      {/* Logo */}
      <div className="relative">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl animate-pulse"
          style={{
            background: `linear-gradient(135deg, ${CHAT_PRIMARY}, ${CHAT_ACCENT})`,
          }}
        >
          <MessageSquare className="h-10 w-10 text-white" />
        </div>
        <div
          className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "#22C55E" }}
        >
          <span className="text-white text-[10px] font-bold">AI</span>
        </div>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold" style={{ color: "#000E1A" }}>
          AI Travel Agent
        </h2>
        <p className="text-[14px] max-w-xs" style={{ color: CHAT_GRAY }}>
          Bắt đầu cuộc trò chuyện để tìm tour hoặc đặt dịch vụ du lịch
        </p>
      </div>

      {/* Quick start cards */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-md">
        {QUICK_START_ITEMS.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onSuggestionClick(INITIAL_SUGGESTIONS[idx].text)}
            className="p-4 text-left transition-all cursor-pointer rounded-2xl"
            style={{
              backgroundColor: "#FFFFFF",
              border: `1px solid ${CHAT_SURFACE_LIGHT}`,
              boxShadow: "0 2px 12px rgba(0,70,193,0.08)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 24px rgba(0,70,193,0.15)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 12px rgba(0,70,193,0.08)";
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ backgroundColor: `${item.color}15` }}
            >
              <item.icon className="w-5 h-5" style={{ color: item.color }} />
            </div>
            <h3 className="font-bold text-[13px] mb-1" style={{ color: "#000E1A" }}>
              {item.title}
            </h3>
            <p className="text-[11px] line-clamp-1" style={{ color: CHAT_GRAY }}>
              {item.subtitle}
            </p>
          </button>
        ))}
      </div>

      {/* Suggestion chips */}
      <div className="flex flex-wrap justify-center gap-2">
        {INITIAL_SUGGESTIONS.map((s, i) => (
          <button
            key={i}
            onClick={() => onSuggestionClick(s.text)}
            className="text-[13px] px-4 py-2.5 font-medium shadow-sm transition-all cursor-pointer"
            style={{
              backgroundColor: "#FFFFFF",
              color: CHAT_PRIMARY,
              border: `1px solid ${CHAT_SURFACE_LIGHT}`,
              borderRadius: "50px",
              boxShadow: "0 2px 8px rgba(0,70,193,0.08)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = CHAT_SURFACE_LIGHT;
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#FFFFFF";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
            }}
          >
            <Sparkles className="w-3.5 h-3.5 inline mr-1" style={{ color: CHAT_ACCENT }} />
            {s.text}
          </button>
        ))}
      </div>

      {/* Features info */}
      <div className="flex items-center gap-6 text-center">
        <div>
          <p className="text-[18px] font-bold" style={{ color: CHAT_PRIMARY }}>500+</p>
          <p className="text-[11px]" style={{ color: CHAT_GRAY }}>Tour du lịch</p>
        </div>
        <div
          className="w-px h-8"
          style={{ backgroundColor: CHAT_SURFACE_LIGHT }}
        />
        <div>
          <p className="text-[18px] font-bold" style={{ color: CHAT_PRIMARY }}>24/7</p>
          <p className="text-[11px]" style={{ color: CHAT_GRAY }}>Hỗ trợ</p>
        </div>
        <div
          className="w-px h-8"
          style={{ backgroundColor: CHAT_SURFACE_LIGHT }}
        />
        <div>
          <p className="text-[18px] font-bold" style={{ color: CHAT_PRIMARY }}>50K+</p>
          <p className="text-[11px]" style={{ color: CHAT_GRAY }}>Khách hàng</p>
        </div>
      </div>
    </div>
  );
}
