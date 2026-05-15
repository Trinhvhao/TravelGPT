"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Bot, User, Sparkles, ThumbsUp, ThumbsDown, Copy, Check, Bookmark, BookmarkCheck, MoreHorizontal, Edit2 } from "lucide-react";
import { useChatStore, CHAT_PRIMARY, CHAT_ACCENT, CHAT_SURFACE_LIGHT, CHAT_GRAY } from "@/stores/chat-store";
import toast from "react-hot-toast";

// ─── Render content with **bold** markdown ─────────────────────────────────────
function renderContent(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <span key={i} className="font-bold" style={{ color: CHAT_PRIMARY }}>
          {part.slice(2, -2)}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

// ─── ChatMessageItem ─────────────────────────────────────────────────────────────
interface ChatMessageItemProps {
  message: ChatMessage;
  onRetry?: () => void;
  isFailed?: boolean;
  isLast?: boolean;
}

export function ChatMessageItem({ message, onRetry, isFailed = false, isLast }: ChatMessageItemProps) {
  const isUser = message.role === "user";
  const [showActions, setShowActions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const { messageReactions, bookmarkedMessages, toggleBookmark, addReaction, removeReaction, isBookmarked } = useChatStore();

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
    setShowReactionPicker(false);
  };

  return (
    <div
      className={cn("flex gap-3 animate-[slide-up_0.3s_ease-out group", isUser && "flex-row-reverse")}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowReactionPicker(false);
      }}
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg transition-transform",
          showActions && "scale-110"
        )}
        style={
          isUser
            ? { backgroundColor: "#FFFFFF", border: `2px solid ${CHAT_SURFACE_LIGHT}` }
            : { background: `linear-gradient(135deg, ${CHAT_PRIMARY}, ${CHAT_ACCENT})` }
        }
      >
        {isUser ? (
          <User className="w-5 h-5" style={{ color: CHAT_PRIMARY }} />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>

      {/* Content */}
      <div className={cn("flex-1 inline-flex flex-col", isUser ? "items-end" : "items-start")}>
        {/* Action buttons (appear on hover) */}
        {showActions && !isUser && (
          <div
            className="flex items-center gap-1 mb-2 animate-[fade-in_0.2s_ease-out]"
            style={{ animationDelay: "0ms" }}
          >
            {/* Helpful */}
            <button
              onClick={() => handleReaction("helpful")}
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer",
              )}
              style={{
                backgroundColor: reaction === "helpful" ? "#22C55E" : CHAT_SURFACE_LIGHT,
              }}
              title="Hữu ích"
            >
              <ThumbsUp className="w-3.5 h-3.5" style={{ color: reaction === "helpful" ? "#FFFFFF" : CHAT_GRAY }} />
            </button>

            {/* Not helpful */}
            <button
              onClick={() => handleReaction("not_helpful")}
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer",
              )}
              style={{
                backgroundColor: reaction === "not_helpful" ? "#EF4444" : CHAT_SURFACE_LIGHT,
              }}
              title="Không hữu ích"
            >
              <ThumbsDown className="w-3.5 h-3.5" style={{ color: reaction === "not_helpful" ? "#FFFFFF" : CHAT_GRAY }} />
            </button>

            {/* Bookmark */}
            <button
              onClick={handleBookmark}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer"
              style={{
                backgroundColor: isMsgBookmarked ? CHAT_PRIMARY : CHAT_SURFACE_LIGHT,
              }}
              title={isMsgBookmarked ? "Bỏ đánh dấu" : "Đánh dấu"}
            >
              {isMsgBookmarked ? (
                <BookmarkCheck className="w-3.5 h-3.5 text-white" />
              ) : (
                <Bookmark className="w-3.5 h-3.5" style={{ color: CHAT_GRAY }} />
              )}
            </button>

            {/* Copy */}
            <button
              onClick={handleCopy}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer"
              style={{ backgroundColor: CHAT_SURFACE_LIGHT }}
              title="Sao chép"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" style={{ color: CHAT_GRAY }} />
              )}
            </button>

            {/* Retry (if failed) */}
            {isFailed && onRetry && (
              <button
                onClick={onRetry}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer"
                style={{ backgroundColor: "rgba(237,29,36,0.1)" }}
                title="Thử lại"
              >
                <Edit2 className="w-3.5 h-3.5" style={{ color: "#ED1D24" }} />
              </button>
            )}
          </div>
        )}

        {/* Bubble + Timestamp wrapped for shrink-to-fit */}
        <div className="inline-flex flex-col">
          <div
            className={cn(
              "px-5 py-3.5 text-[15px] leading-relaxed whitespace-pre-wrap break-normal w-fit max-w-full relative",
            )}
            style={
              isUser
                ? {
                    background: `linear-gradient(135deg, ${CHAT_ACCENT} 0%, ${CHAT_PRIMARY} 100%)`,
                    borderRadius: "20px 20px 4px 20px",
                    boxShadow: "0 4px 15px rgba(0,70,193,0.3)",
                    color: "#FFFFFF",
                    maxWidth: "85%",
                  }
                : {
                    backgroundColor: "#FFFFFF",
                    borderRadius: "20px 20px 20px 4px",
                    boxShadow: "0 4px 20px rgba(0,70,193,0.1)",
                    color: "#000E1A",
                    maxWidth: "85%",
                  }
            }
          >
            {isFailed && (
              <div
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ backgroundColor: "#ED1D24" }}
                title="Tin nhắn gửi thất bại"
              >
                !
              </div>
            )}

            {/* Intent badge */}
            {!isUser && message.metadata && typeof message.metadata.intent === "string" ? (
              <div
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold mb-2"
                style={{
                  backgroundColor: CHAT_SURFACE_LIGHT,
                  color: CHAT_PRIMARY,
                  borderRadius: "20px",
                }}
              >
                <Sparkles className="w-3 w-3" />
                {String(message.metadata.intent).replace(/_/g, " ")}
              </div>
            ) : null}

            {/* Content */}
            {renderContent(message.content)}

            {/* Reaction indicator */}
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

          {/* Timestamp */}
          {message.created_at && (
            <p
              className={cn("text-[11px] mt-1 px-1", isUser ? "text-right" : "text-left")}
              style={{ color: CHAT_GRAY }}
            >
              {format(new Date(message.created_at), "HH:mm", { locale: vi })}
            </p>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
