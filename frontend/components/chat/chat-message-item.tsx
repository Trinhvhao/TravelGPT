"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Bot,
  User,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  Bookmark,
  BookmarkCheck,
  Edit2,
  Loader2,
  Globe,
} from "lucide-react";
import { useChatStore, CHAT_PRIMARY, CHAT_ACCENT, CHAT_SURFACE_LIGHT, CHAT_GRAY } from "@/stores/chat-store";
import toast from "react-hot-toast";
import { renderContent } from "@/lib/render-content";
import { renderContentBlocks } from "@/components/chat/rich-content-blocks";

/** Check if content_blocks contains tour cards (to avoid duplicate display) */
function hasTourCards(blocks?: Array<{ type: string }>): boolean {
  if (!blocks) return false;
  return blocks.some((b) => b.type === "tour_card" || b.type === "tour_carousel");
}

/** Filter out tour list items from markdown text (when cards are present) */
function filterTourListFromText(text: string): string {
  // Remove lines that look like tour list items (numbered list with price/tour name pattern)
  // Pattern: "1. Tour Name\n   📍 Location | ... | 💰 Price"
  const lines = text.split("\n");
  const filtered = lines.filter((line) => {
    const trimmed = line.trim();
    // Skip numbered tour items (e.g., "1. Tour Đà Nẵng...")
    if (/^\d+\.\s+Tour\s+/i.test(trimmed)) return false;
    // Skip lines that are just separators
    if (/^[*_\-]{3,}$/.test(trimmed)) return false;
    // Skip tour detail continuation lines (start with spaces + emoji)
    if (/^\s+[📍⏱💰🎉✅✈️🏨]/.test(trimmed)) return false;
    // Skip lines with just a number and punctuation (e.g., "1." or "2.")
    if (/^\d+[\.\)]$/.test(trimmed)) return false;
    // Skip "Tìm thấy X tour" or similar summary lines
    if (/tìm thấy\s+\d+\s+tour/i.test(trimmed)) return false;
    // Skip "Đặt ngay" or similar action lines
    if (/đặt ngay|xem chi tiết|chi tiết/i.test(trimmed)) return false;
    // Skip lines that are just category names (cultural, beach, nature, etc.)
    if (/^(cultural|beach|nature|adventure|city|mountain|heritage|island)$/i.test(trimmed)) return false;
    // Skip lines starting with Tour and ending with category-like words
    if (/^Tour\s+.+(cultural|beach|nature|adventure|city|mountain|heritage|island)$/i.test(trimmed)) return false;
    return true;
  });
  return filtered.join("\n");
}

interface ChatMessageItemProps {
  message: ChatMessage;
  onRetry?: () => void;
  isFailed?: boolean;
  isLast?: boolean;
  toolStatus?: string;
  toolLabel?: string;
}

export function ChatMessageItem({
  message,
  onRetry,
  isFailed = false,
  isLast,
  toolStatus,
  toolLabel,
}: ChatMessageItemProps) {
  const isUser = message.role === "user";
  const [showActions, setShowActions] = useState(false);
  const [copied, setCopied] = useState(false);

  const { messageReactions, toggleBookmark, addReaction, removeReaction, isBookmarked } = useChatStore();

  const reaction = messageReactions[message.id];
  const isMsgBookmarked = isBookmarked(message.id);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      toast.success("Đã sao chép");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Không thể sao chép");
    }
  };

  const handleBookmark = () => {
    toggleBookmark(message);
    toast.success(isMsgBookmarked ? "Đã bỏ đánh dấu" : "Đã đánh dấu");
  };

  const handleReaction = (type: "helpful" | "not_helpful") => {
    if (reaction === type) {
      removeReaction(message.id);
      toast.success("Đã bỏ đánh giá");
    } else {
      addReaction(message.id, type);
      toast.success(type === "helpful" ? "Bạn thấy hữu ích 👍" : "Bạn thấy không hữu ích 👎");
    }
  };

  return (
    <div
      className="flex gap-3"
      style={{ justifyContent: isUser ? "flex-end" : "flex-start" }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar — always visible, stays on its side */}
      {!isUser && (
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md self-start"
          style={{ background: `linear-gradient(135deg, ${CHAT_PRIMARY}, ${CHAT_ACCENT})` }}
        >
          <Bot className="w-5 h-5 text-white" />
        </div>
      )}

      {/* Bubble + timestamp column */}
      <div
        className="flex flex-col"
        style={{ alignItems: isUser ? "flex-end" : "flex-start", maxWidth: "75%" }}
      >
        {/* Action buttons above bubble (AI only) */}
        {showActions && !isUser && (
          <div className="flex items-center gap-1 mb-1.5">
            <button
              onClick={() => handleReaction("helpful")}
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ backgroundColor: reaction === "helpful" ? "#22C55E" : CHAT_SURFACE_LIGHT }}
              title="Hữu ích"
            >
              <ThumbsUp className="w-3.5 h-3.5" style={{ color: reaction === "helpful" ? "#FFFFFF" : CHAT_GRAY }} />
            </button>
            <button
              onClick={() => handleReaction("not_helpful")}
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ backgroundColor: reaction === "not_helpful" ? "#EF4444" : CHAT_SURFACE_LIGHT }}
              title="Không hữu ích"
            >
              <ThumbsDown className="w-3.5 h-3.5" style={{ color: reaction === "not_helpful" ? "#FFFFFF" : CHAT_GRAY }} />
            </button>
            <button
              onClick={handleBookmark}
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ backgroundColor: isMsgBookmarked ? CHAT_PRIMARY : CHAT_SURFACE_LIGHT }}
              title={isMsgBookmarked ? "Bỏ đánh dấu" : "Đánh dấu"}
            >
              {isMsgBookmarked ? (
                <BookmarkCheck className="w-3.5 h-3.5 text-white" />
              ) : (
                <Bookmark className="w-3.5 h-3.5" style={{ color: CHAT_GRAY }} />
              )}
            </button>
            <button
              onClick={handleCopy}
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ backgroundColor: CHAT_SURFACE_LIGHT }}
              title="Sao chép"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" style={{ color: CHAT_GRAY }} />
              )}
            </button>
            {isFailed && onRetry && (
              <button
                onClick={onRetry}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(237,29,36,0.1)" }}
                title="Thử lại"
              >
                <Edit2 className="w-3.5 h-3.5" style={{ color: "#ED1D24" }} />
              </button>
            )}
          </div>
        )}

        {/* Bubble */}
        <div className="relative">
          {isFailed && (
            <div
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white z-10"
              style={{ backgroundColor: "#ED1D24" }}
              title="Tin nhắn gửi thất bại"
            >
              !
            </div>
          )}

          <div
            className="px-5 py-3.5 text-[15px] leading-relaxed whitespace-pre-wrap break-words"
            style={
              isUser
                ? {
                    background: `linear-gradient(135deg, ${CHAT_ACCENT} 0%, ${CHAT_PRIMARY} 100%)`,
                    borderRadius: "20px 20px 4px 20px",
                    boxShadow: "0 4px 15px rgba(0,70,193,0.3)",
                    color: "#FFFFFF",
                    alignSelf: "flex-end",
                  }
                : {
                    backgroundColor: "#FFFFFF",
                    borderRadius: "20px 20px 20px 4px",
                    boxShadow: "0 4px 20px rgba(0,70,193,0.1)",
                    color: "#000E1A",
                    alignSelf: "flex-start",
                  }
            }
          >
            {/* Tool status */}
            {toolStatus && toolStatus !== "idle" && toolLabel && (
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full mb-2"
                style={{ backgroundColor: "#EEF6FF", color: CHAT_PRIMARY }}
                role="status"
                aria-label={toolLabel}
              >
                <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />
                <span>{toolLabel}</span>
                <Globe className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
              </div>
            )}

            {/* Render text content - filter out tour list if cards are present */}
            {!isUser && hasTourCards(message.content_blocks) ? (
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                {filterTourListFromText(message.content)}
              </p>
            ) : (
              renderContent(message.content)
            )}

            {/* Rich content blocks - tour cards with responsive layout */}
            {!isUser && message.content_blocks && message.content_blocks.length > 0 && (
              <div className="mt-3 space-y-2 [&_.tour-carousel-container]:w-full [&_.tour-carousel-container>div]:!flex-wrap">
                {renderContentBlocks(message.content_blocks)}
              </div>
            )}

            {/* User image attachments */}
            {isUser && message.attachments && message.attachments.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {message.attachments.map((att) => (
                  <div key={att.id} className="relative rounded-xl overflow-hidden" style={{ width: 120, height: 90 }}>
                    <img
                      src={att.url}
                      alt={att.filename ?? "Attachment"}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Reaction */}
            {reaction && !isUser && (
              <div
                className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 text-[11px] rounded-full"
                style={{
                  backgroundColor: reaction === "helpful" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                  color: reaction === "helpful" ? "#22C55E" : "#EF4444",
                }}
              >
                {reaction === "helpful" ? (
                  <ThumbsUp className="w-3 h-3" />
                ) : (
                  <ThumbsDown className="w-3 h-3" />
                )}
                {reaction === "helpful" ? "Hữu ích" : "Không hữu ích"}
              </div>
            )}
          </div>
        </div>

        {/* Timestamp */}
        {message.created_at && (
          <p
            className="text-[11px] mt-1 px-1"
            style={{ color: CHAT_GRAY, alignSelf: isUser ? "flex-end" : "flex-start" }}
          >
            {format(new Date(message.created_at), "HH:mm", { locale: vi })}
          </p>
        )}
      </div>

      {/* User avatar — on the right */}
      {isUser && (
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md self-start"
          style={{ backgroundColor: "#FFFFFF", border: `2px solid ${CHAT_SURFACE_LIGHT}` }}
        >
          <User className="w-5 h-5" style={{ color: CHAT_PRIMARY }} />
        </div>
      )}
    </div>
  );
}
