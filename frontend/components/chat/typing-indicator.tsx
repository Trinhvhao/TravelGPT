"use client";
import { cn } from "@/lib/utils";
import { Bot } from "lucide-react";

// ─── Design Tokens (Airbnb Style) ──────────────────────────────────────────────
const PRIMARY = "#0046C1";
const ACCENT = "#0391FF";
const SURFACE = "#F7F7F7";
const GRAY = "#636363";

interface TypingIndicatorProps {
  className?: string;
}

export function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Avatar */}
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${PRIMARY}, ${ACCENT})`,
        }}
      >
        <Bot className="w-5 h-5 text-white" />
      </div>

      {/* Typing Bubble */}
      <div
        className="px-5 py-4 flex items-center gap-1"
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "20px 20px 20px 4px",
          boxShadow: "0 4px 20px rgba(0,70,193,0.12)",
        }}
      >
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
        <span
          className="ml-2 text-[13px] font-medium"
          style={{ color: GRAY }}
        >
          Đang suy nghĩ...
        </span>
      </div>
    </div>
  );
}
