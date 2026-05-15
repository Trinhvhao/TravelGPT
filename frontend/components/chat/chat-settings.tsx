"use client";
import { useState } from "react";
import { X, Download, Trash2, Bell, Moon, Shield, HelpCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore, CHAT_PRIMARY, CHAT_ACCENT, CHAT_SURFACE_LIGHT, CHAT_GRAY } from "@/stores/chat-store";
import toast from "react-hot-toast";

interface ChatSettingsProps {
  open: boolean;
  onClose: () => void;
}

interface SettingItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onClick?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
}

function SettingItem({ icon, title, subtitle, onClick, rightElement, danger }: SettingItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-4 py-4 transition-all cursor-pointer text-left",
        danger ? "hover:bg-red-50" : "hover:bg-gray-50"
      )}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          backgroundColor: danger ? "rgba(237,29,36,0.1)" : CHAT_SURFACE_LIGHT,
        }}
      >
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-[14px]" style={{ color: danger ? "#ED1D24" : "#000E1A" }}>
          {title}
        </p>
        {subtitle && (
          <p className="text-[12px] mt-0.5" style={{ color: CHAT_GRAY }}>
            {subtitle}
          </p>
        )}
      </div>
      {rightElement || (
        <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: CHAT_GRAY }} />
      )}
    </button>
  );
}

export function ChatSettings({ open, onClose }: ChatSettingsProps) {
  const { clearAllConversations, messages, bookmarkedMessages } = useChatStore();
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [exportFormat, setExportFormat] = useState<"txt" | "json" | null>(null);

  if (!open) return null;

  const handleExport = (format: "txt" | "json") => {
    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === "json") {
      content = JSON.stringify(
        {
          exported_at: new Date().toISOString(),
          conversation: {
            message_count: messages.length,
            messages: messages.map((m) => ({
              role: m.role,
              content: m.content,
              timestamp: m.created_at,
              intent: m.metadata?.intent,
            })),
            bookmarks: bookmarkedMessages,
          },
        },
        null,
        2
      );
      filename = `travelgpt-chat-${new Date().toISOString().split("T")[0]}.json`;
      mimeType = "application/json";
    } else {
      content = `TravelGPT - Cuộc trò chuyện\n${"=".repeat(40)}\nXuất lúc: ${new Date().toLocaleString("vi-VN")}\nTổng tin nhắn: ${messages.length}\n${"=".repeat(40)}\n\n`;
      messages.forEach((m) => {
        const role = m.role === "user" ? "👤 Bạn" : "🤖 AI";
        const time = m.created_at ? new Date(m.created_at).toLocaleString("vi-VN") : "";
        content += `[${time}] ${role}:\n${m.content}\n\n`;
      });
      if (bookmarkedMessages.length > 0) {
        content += `\n${"=".repeat(40)}\n📌 TIN NHẮN ĐÃ ĐÁNH DẤU:\n${"=".repeat(40)}\n\n`;
        bookmarkedMessages.forEach((b) => {
          content += `[${b.timestamp}] ${b.content}\n\n`;
        });
      }
      filename = `travelgpt-chat-${new Date().toISOString().split("T")[0]}.txt`;
      mimeType = "text/plain";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Đã xuất file ${format.toUpperCase()}`);
    setShowExportOptions(false);
    setExportFormat(null);
  };

  const handleClearAll = () => {
    if (showClearConfirm) {
      clearAllConversations();
      setShowClearConfirm(false);
      onClose();
      toast.success("Đã xóa tất cả lịch sử");
    } else {
      setShowClearConfirm(true);
      setTimeout(() => setShowClearConfirm(false), 5000);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 animate-[scale-in_0.2s_ease-out]"
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "20px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{ borderBottom: `1px solid ${CHAT_SURFACE_LIGHT}` }}
        >
          <h2 className="font-bold text-lg" style={{ color: "#000E1A" }}>
            Cài đặt AI Chat
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-all"
            style={{ backgroundColor: CHAT_SURFACE_LIGHT }}
          >
            <X className="w-5 h-5" style={{ color: CHAT_GRAY }} />
          </button>
        </div>

        {/* Content */}
        <div className="py-2 max-h-[60vh] overflow-y-auto">
          {/* Export */}
          {showExportOptions ? (
            <div className="px-4 py-4 space-y-3">
              <p className="text-[13px] font-medium" style={{ color: CHAT_GRAY }}>
                Chọn định dạng xuất:
              </p>
              <button
                onClick={() => handleExport("txt")}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer"
                style={{
                  backgroundColor: CHAT_SURFACE_LIGHT,
                  border: `1px solid ${CHAT_SURFACE_LIGHT}`,
                }}
              >
                <Download className="w-5 h-5" style={{ color: CHAT_PRIMARY }} />
                <div className="text-left">
                  <p className="font-semibold text-[14px]" style={{ color: "#000E1A" }}>
                    Văn bản (.txt)
                  </p>
                  <p className="text-[11px]" style={{ color: CHAT_GRAY }}>
                    Dễ đọc, phù hợp để lưu trữ
                  </p>
                </div>
              </button>
              <button
                onClick={() => handleExport("json")}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer"
                style={{
                  backgroundColor: CHAT_SURFACE_LIGHT,
                  border: `1px solid ${CHAT_SURFACE_LIGHT}`,
                }}
              >
                <Download className="w-5 h-5" style={{ color: CHAT_PRIMARY }} />
                <div className="text-left">
                  <p className="font-semibold text-[14px]" style={{ color: "#000E1A" }}>
                    JSON (.json)
                  </p>
                  <p className="text-[11px]" style={{ color: CHAT_GRAY }}>
                    Dữ liệu đầy đủ, phù hợp để import
                  </p>
                </div>
              </button>
              <button
                onClick={() => setShowExportOptions(false)}
                className="w-full text-center text-[13px] py-2 cursor-pointer"
                style={{ color: CHAT_GRAY }}
              >
                ← Quay lại
              </button>
            </div>
          ) : (
            <>
              <SettingItem
                icon={<Download className="w-5 h-5" style={{ color: CHAT_PRIMARY }} />}
                title="Xuất cuộc trò chuyện"
                subtitle={`${messages.length} tin nhắn, ${bookmarkedMessages.length} đánh dấu`}
                onClick={() => setShowExportOptions(true)}
              />
              <SettingItem
                icon={<Bell className="w-5 h-5" style={{ color: CHAT_PRIMARY }} />}
                title="Thông báo"
                subtitle="Nhận thông báo khi có phản hồi"
                rightElement={
                  <div
                    className="w-12 h-7 rounded-full relative cursor-pointer transition-all"
                    style={{ backgroundColor: CHAT_PRIMARY }}
                  >
                    <div
                      className="absolute top-0.5 right-0.5 w-6 h-6 rounded-full bg-white transition-all"
                      style={{ transform: "translateX(0)" }}
                    />
                  </div>
                }
              />
              <SettingItem
                icon={<Moon className="w-5 h-5" style={{ color: CHAT_PRIMARY }} />}
                title="Chế độ tối"
                subtitle="Sắp ra mắt"
                rightElement={
                  <span
                    className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: CHAT_SURFACE_LIGHT, color: CHAT_GRAY }}
                  >
                    Sắp có
                  </span>
                }
              />
              <div className="h-px mx-4 my-2" style={{ backgroundColor: CHAT_SURFACE_LIGHT }} />
              <SettingItem
                icon={<Shield className="w-5 h-5" style={{ color: CHAT_PRIMARY }} />}
                title="Quyền riêng tư"
                subtitle="AI có thể mắc lỗi — hãy xác minh thông tin"
              />
              <SettingItem
                icon={<HelpCircle className="w-5 h-5" style={{ color: CHAT_PRIMARY }} />}
                title="Trợ giúp"
                subtitle="Cách sử dụng AI Chat"
              />
              <div className="h-px mx-4 my-2" style={{ backgroundColor: CHAT_SURFACE_LIGHT }} />
              <SettingItem
                icon={<Trash2 className="w-5 h-5" style={{ color: "#ED1D24" }} />}
                title={showClearConfirm ? "Nhấn lại để xác nhận xóa" : "Xóa tất cả lịch sử"}
                subtitle="Hành động này không thể hoàn tác"
                onClick={handleClearAll}
                danger
              />
            </>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3 text-center"
          style={{ borderTop: `1px solid ${CHAT_SURFACE_LIGHT}` }}
        >
          <p className="text-[11px]" style={{ color: CHAT_GRAY }}>
            TravelGPT AI Chat • Phiên bản 1.0
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </>
  );
}
