"use client";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Bot, User } from "lucide-react";
import { renderContent } from "@/lib/render-content";
import { renderContentBlocks } from "@/components/chat/rich-content-blocks";

// ─── Design Tokens (Airbnb Style) ──────────────────────────────────────────────
const PRIMARY = "#0046C1";
const ACCENT = "#0391FF";
const SURFACE_LIGHT = "#D9EEFF";
const NAVY = "#000E1A";
const GRAY = "#636363";

/** Check if content_blocks contains tour cards */
function hasTourCards(blocks?: Array<{ type: string }>): boolean {
  if (!blocks) return false;
  return blocks.some((b) => b.type === "tour_card" || b.type === "tour_carousel");
}

/** Filter out tour list items from markdown text */
function filterTourListFromText(text: string): string {
  const lines = text.split("\n");
  const filtered = lines.filter((line) => {
    const trimmed = line.trim();
    if (/^\d+\.\s+Tour\s+/i.test(trimmed)) return false;
    if (/^[*_\-]{3,}$/.test(trimmed)) return false;
    if (/^\s+[📍⏱💰🎉✅✈️🏨]/.test(trimmed)) return false;
    if (/^\d+[\.\)]$/.test(trimmed)) return false;
    if (/tìm thấy\s+\d+\s+tour/i.test(trimmed)) return false;
    if (/đặt ngay|xem chi tiết|chi tiết/i.test(trimmed)) return false;
    // Skip lines that are just category names (cultural, beach, nature, etc.)
    if (/^(cultural|beach|nature|adventure|city|mountain|heritage|island)$/i.test(trimmed)) return false;
    // Skip lines starting with Tour and ending with category-like words
    if (/^Tour\s+.+(cultural|beach|nature|adventure|city|mountain|heritage|island)$/i.test(trimmed)) return false;
    return true;
  });
  return filtered.join("\n");
}

interface ChatMessageProps {
  message: ChatMessage;
  className?: string;
}

export function ChatMessage({ message, className }: ChatMessageProps) {
  const isUser = message.role === "user";
  const showCards = !isUser && hasTourCards(message.content_blocks);

  return (
    <div className={cn(
      "flex w-full gap-3",
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
        "flex flex-col flex-1 min-w-0",
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
          {/* Render text - filter tour list if cards present */}
          {showCards ? (
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
              {filterTourListFromText(message.content)}
            </p>
          ) : (
            renderContent(message.content)
          )}
        </div>

        {/* Rich content blocks (tour cards) */}
        {!isUser && message.content_blocks && message.content_blocks.length > 0 && (
          <div className="mt-3">
            {renderContentBlocks(message.content_blocks)}
          </div>
        )}

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
