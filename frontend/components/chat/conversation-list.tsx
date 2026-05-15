"use client";
import { useState } from "react";
import { useChatStore, CHAT_PRIMARY, CHAT_ACCENT, CHAT_GRAY, CHAT_SURFACE_LIGHT } from "@/stores/chat-store";
import { X, MessageSquare, Trash2, Clock, Tag, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface ConversationListProps {
  open: boolean;
  onClose: () => void;
  onSelectConversation: (sessionId: string) => void;
}

export function ConversationList({ open, onClose, onSelectConversation }: ConversationListProps) {
  const { conversations, deleteConversation, clearAllConversations, sessionId } = useChatStore();
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  if (!open) return null;

  const handleSelect = (convSessionId: string) => {
    if (convSessionId === sessionId) return;
    onSelectConversation(convSessionId);
    onClose();
  };

  const handleDelete = (e: React.MouseEvent, sessionIdToDelete: string) => {
    e.stopPropagation();
    deleteConversation(sessionIdToDelete);
    toast.success("Đã xóa cuộc trò chuyện");
  };

  const handleClearAll = () => {
    if (confirmClearAll) {
      clearAllConversations();
      setConfirmClearAll(false);
      onClose();
      toast.success("Đã xóa tất cả lịch sử");
    } else {
      setConfirmClearAll(true);
      setTimeout(() => setConfirmClearAll(false), 3000);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed top-0 right-0 h-full w-full max-w-md z-50 flex flex-col animate-[slide-in-right_0.3s_ease-out]"
        style={{
          backgroundColor: "#FFFFFF",
          boxShadow: "-4px 0 30px rgba(0,0,0,0.15)",
        }}
      >
        {/* Header */}
        <div
          className="px-5 py-5 flex items-center justify-between"
          style={{ borderBottom: `1px solid ${CHAT_SURFACE_LIGHT}` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${CHAT_PRIMARY}, ${CHAT_ACCENT})` }}
            >
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg" style={{ color: "#000E1A" }}>
                Lịch sử trò chuyện
              </h2>
              <p className="text-[12px]" style={{ color: CHAT_GRAY }}>
                {conversations.length} cuộc trò chuyện
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer"
            style={{ backgroundColor: CHAT_SURFACE_LIGHT }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#E8F4FF";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = CHAT_SURFACE_LIGHT;
            }}
          >
            <X className="w-5 h-5" style={{ color: CHAT_GRAY }} />
          </button>
        </div>

        {/* Clear All */}
        {conversations.length > 0 && (
          <div className="px-5 py-3" style={{ borderBottom: `1px solid ${CHAT_SURFACE_LIGHT}` }}>
            <button
              onClick={handleClearAll}
              className="w-full text-[13px] font-medium py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              style={{
                color: confirmClearAll ? "#FFFFFF" : "#ED1D24",
                backgroundColor: confirmClearAll ? "#ED1D24" : "rgba(237,29,36,0.08)",
              }}
            >
              <Trash2 className="w-4 h-4" />
              {confirmClearAll ? "Nhấn lại để xác nhận xóa tất cả" : "Xóa tất cả lịch sử"}
            </button>
          </div>
        )}

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: CHAT_SURFACE_LIGHT }}
              >
                <MessageSquare className="w-8 h-8" style={{ color: CHAT_PRIMARY }} />
              </div>
              <h3 className="font-bold text-[16px] mb-2" style={{ color: "#000E1A" }}>
                Chưa có cuộc trò chuyện nào
              </h3>
              <p className="text-[13px]" style={{ color: CHAT_GRAY }}>
                Các cuộc trò chuyện của bạn sẽ được lưu lại tại đây
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: CHAT_SURFACE_LIGHT }}>
              {conversations.map((conv) => (
                <div
                  key={conv.sessionId}
                  className={cn(
                    "px-5 py-4 cursor-pointer transition-all group relative",
                    conv.sessionId === sessionId && "bg-[#F0F7FF]"
                  )}
                  onClick={() => handleSelect(conv.sessionId)}
                  onMouseEnter={(e) => {
                    if (conv.sessionId !== sessionId) {
                      (e.currentTarget as HTMLDivElement).style.backgroundColor = "#F8FAFF";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (conv.sessionId !== sessionId) {
                      (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent";
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: CHAT_SURFACE_LIGHT }}
                    >
                      <MessageSquare className="w-5 h-5" style={{ color: CHAT_PRIMARY }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3
                          className="font-semibold text-[14px] truncate"
                          style={{ color: "#000E1A" }}
                        >
                          {conv.title}
                        </h3>
                        <span
                          className="text-[11px] flex items-center gap-1 flex-shrink-0 ml-2"
                          style={{ color: CHAT_GRAY }}
                        >
                          <Clock className="w-3 h-3" />
                          {formatTime(conv.updatedAt)}
                        </span>
                      </div>
                      <p className="text-[12px] line-clamp-1 mb-2" style={{ color: CHAT_GRAY }}>
                        {conv.preview}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {conv.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-2 py-0.5 font-medium"
                            style={{
                              backgroundColor: CHAT_SURFACE_LIGHT,
                              color: CHAT_PRIMARY,
                              borderRadius: "20px",
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                        <span className="text-[10px]" style={{ color: CHAT_GRAY }}>
                          {conv.messageCount} tin nhắn
                        </span>
                      </div>
                    </div>
                    <ChevronRight
                      className="w-5 h-5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: CHAT_PRIMARY }}
                    />
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDelete(e, conv.sessionId)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    style={{ backgroundColor: "rgba(237,29,36,0.1)" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(237,29,36,0.2)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(237,29,36,0.1)";
                    }}
                  >
                    <Trash2 className="w-4 h-4" style={{ color: "#ED1D24" }} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}
