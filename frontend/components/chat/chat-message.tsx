"use client";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Bot, User } from "lucide-react";

// ─── Design Tokens (Airbnb Style) ──────────────────────────────────────────────
const PRIMARY = "#0046C1";
const ACCENT = "#0391FF";
const SURFACE_LIGHT = "#D9EEFF";
const NAVY = "#000E1A";
const GRAY = "#636363";

interface ChatMessageProps {
  message: ChatMessage;
  className?: string;
}

export function ChatMessage({ message, className }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn(
      "flex gap-3",
      isUser ? "flex-row-reverse" : "flex-row",
      className
    )}>
      {/* Avatar (Airbnb Style) */}
      <div className={cn(
        "w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg",
        isUser
          ? "bg-white border-2"
          : "bg-gradient-to-br from-[#0046C1] to-[#0391FF]"
      )}
      style={isUser ? { borderColor: SURFACE_LIGHT } : {}}
      >
        {isUser ? (
          <User className="w-5 h-5" style={{ color: PRIMARY }} />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>

      {/* Bubble (Airbnb Style) */}
      <div className={cn(
        "max-w-[75%] min-w-0",
        isUser ? "items-end" : "items-start"
      )}>
        <div className={cn(
          "px-5 py-4 text-[15px] leading-relaxed whitespace-pre-wrap break-words",
          isUser
            ? "text-white rounded-[20px] rounded-tr-[4px]"
            : "text-[#000E1A] rounded-[20px] rounded-tl-[4px]"
        )}
        style={
          isUser
            ? {
                background: "linear-gradient(135deg, #0391FF 0%, #0046C1 100%)",
                boxShadow: "0 4px 15px rgba(0,70,193,0.3)",
              }
            : {
                backgroundColor: "#FFFFFF",
                boxShadow: "0 4px 20px rgba(0,70,193,0.1)",
              }
        }
        >
          {message.content}
        </div>
        {message.created_at && (
          <p
            className="text-[11px] mt-1 px-1"
            style={{ color: GRAY }}
          >
            {format(new Date(message.created_at), "HH:mm", { locale: vi })}
          </p>
        )}
      </div>
    </div>
  );
}
