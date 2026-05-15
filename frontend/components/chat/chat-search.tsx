"use client";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Search, X, ArrowUp, ArrowDown } from "lucide-react";
import { useChatStore, CHAT_PRIMARY, CHAT_ACCENT, CHAT_SURFACE_LIGHT, CHAT_GRAY } from "@/stores/chat-store";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import toast from "react-hot-toast";

interface ChatSearchProps {
  onClose: () => void;
}

export function ChatSearch({ onClose }: ChatSearchProps) {
  const { searchQuery, searchResults, setSearchQuery, clearSearch, messages } = useChatStore();
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localQuery.trim()) {
        setSearchQuery(localQuery);
        setCurrentResultIndex(0);
      } else {
        clearSearch();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localQuery, setSearchQuery, clearSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setCurrentResultIndex((i) => Math.min(i + 1, searchResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCurrentResultIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && searchResults.length > 0) {
      e.preventDefault();
      scrollToResult(currentResultIndex);
    }
  };

  const scrollToResult = (index: number) => {
    const messageId = searchResults[index]?.id;
    if (messageId) {
      const element = document.querySelector(`[data-message-id="${messageId}"]`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        // Highlight effect
        element.classList.add("ring-2", "ring-offset-2");
        setTimeout(() => {
          element.classList.remove("ring-2", "ring-offset-2");
        }, 1500);
        toast.success(`Đến tin nhắn ${index + 1}/${searchResults.length}`);
      }
    }
  };

  const handleClear = () => {
    setLocalQuery("");
    clearSearch();
    inputRef.current?.focus();
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark
          key={i}
          className="px-0.5 rounded"
          style={{ backgroundColor: "rgba(3,145,255,0.2)", color: CHAT_PRIMARY }}
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div
      className="animate-[slide-down_0.2s_ease-out]"
      style={{
        backgroundColor: "#FFFFFF",
        borderBottom: `1px solid ${CHAT_SURFACE_LIGHT}`,
        boxShadow: "0 4px 20px rgba(0,70,193,0.1)",
      }}
    >
      {/* Search Input */}
      <div className="px-4 py-3">
        <div
          className="flex items-center gap-3 px-4 py-2.5 rounded-2xl"
          style={{
            backgroundColor: "#F7F7F7",
            border: `2px solid ${localQuery ? CHAT_PRIMARY : "transparent"}`,
            boxShadow: localQuery ? "0 0 0 3px rgba(0,70,193,0.1)" : "none",
            transition: "all 0.2s ease",
          }}
        >
          <Search className="w-5 h-5 flex-shrink-0" style={{ color: CHAT_GRAY }} />
          <input
            ref={inputRef}
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tìm kiếm trong cuộc trò chuyện..."
            className="flex-1 text-[15px] bg-transparent outline-none"
            style={{ color: "#000E1A" }}
          />
          {localQuery && (
            <span className="text-[12px] px-2 py-0.5 rounded-full" style={{ backgroundColor: CHAT_SURFACE_LIGHT, color: CHAT_PRIMARY }}>
              {searchResults.length} kết quả
            </span>
          )}
          {localQuery && (
            <button
              onClick={handleClear}
              className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-all"
              style={{ backgroundColor: "rgba(0,0,0,0.08)" }}
            >
              <X className="w-4 h-4" style={{ color: CHAT_GRAY }} />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-[12px] font-medium cursor-pointer"
            style={{ color: CHAT_GRAY }}
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Results */}
      {localQuery && searchResults.length > 0 && (
        <div ref={resultsRef} className="max-h-80 overflow-y-auto">
          {searchResults.map((msg, idx) => (
            <div
              key={msg.id}
              data-message-id={msg.id}
              className={cn(
                "px-4 py-3 cursor-pointer transition-all border-l-4",
                idx === currentResultIndex
                  ? "bg-[#F0F7FF] border-l-[#0046C1]"
                  : "border-l-transparent hover:bg-gray-50"
              )}
              onClick={() => {
                setCurrentResultIndex(idx);
                scrollToResult(idx);
              }}
              onMouseEnter={() => setCurrentResultIndex(idx)}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                  style={{
                    backgroundColor: msg.role === "user" ? CHAT_PRIMARY : CHAT_ACCENT,
                    color: "#FFFFFF",
                  }}
                >
                  {msg.role === "user" ? "Bạn" : "AI"}
                </span>
                {msg.created_at && (
                  <span className="text-[11px]" style={{ color: CHAT_GRAY }}>
                    {format(new Date(msg.created_at), "HH:mm, dd/MM", { locale: vi })}
                  </span>
                )}
              </div>
              <p className="text-[13px] line-clamp-2" style={{ color: "#000E1A" }}>
                {highlightMatch(msg.content, localQuery)}
              </p>
            </div>
          ))}

          {/* Navigation */}
          <div
            className="px-4 py-2 flex items-center justify-between sticky bottom-0"
            style={{ backgroundColor: "#FFFFFF", borderTop: `1px solid ${CHAT_SURFACE_LIGHT}` }}
          >
            <span className="text-[11px]" style={{ color: CHAT_GRAY }}>
              {currentResultIndex + 1} / {searchResults.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCurrentResultIndex((i) => Math.max(i - 1, 0));
                  scrollToResult(Math.max(currentResultIndex - 1, 0));
                }}
                disabled={currentResultIndex <= 0}
                className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer disabled:opacity-30"
                style={{ backgroundColor: CHAT_SURFACE_LIGHT }}
              >
                <ArrowUp className="w-4 h-4" style={{ color: CHAT_PRIMARY }} />
              </button>
              <button
                onClick={() => {
                  setCurrentResultIndex((i) => Math.min(i + 1, searchResults.length - 1));
                  scrollToResult(Math.min(currentResultIndex + 1, searchResults.length - 1));
                }}
                disabled={currentResultIndex >= searchResults.length - 1}
                className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer disabled:opacity-30"
                style={{ backgroundColor: CHAT_SURFACE_LIGHT }}
              >
                <ArrowDown className="w-4 h-4" style={{ color: CHAT_PRIMARY }} />
              </button>
            </div>
          </div>
        </div>
      )}

      {localQuery && searchResults.length === 0 && (
        <div className="px-4 py-8 text-center">
          <p className="text-[14px]" style={{ color: CHAT_GRAY }}>
            Không tìm thấy kết quả nào cho "{localQuery}"
          </p>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
