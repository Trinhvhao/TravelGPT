"use client";
import { useState } from "react";
import { Bot, RotateCcw, Search, Settings, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore, CHAT_PRIMARY, CHAT_ACCENT, CHAT_SURFACE_LIGHT, CHAT_GRAY } from "@/stores/chat-store";
import { Button } from "@/components/ui/button";
import { ConversationList } from "./conversation-list";
import { ChatSearch } from "./chat-search";
import { ChatSettings } from "./chat-settings";
import { v4 as uuidv4 } from "uuid";

interface ChatHeaderProps {
  onReset: () => void;
  onLoadConversation: (sessionId: string) => void;
}

export function ChatHeader({ onReset, onLoadConversation }: ChatHeaderProps) {
  const { sessionId, conversations, messages } = useChatStore();
  const [showConversationList, setShowConversationList] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const currentConversation = conversations.find((c) => c.sessionId === sessionId);

  const handleNewChat = () => {
    // Create new session
    const newSessionId = uuidv4();
    onReset();
    useChatStore.getState().setSessionId(newSessionId);
  };

  return (
    <>
      {/* Header */}
      <div
        className="px-4 py-4 flex items-center justify-between flex-shrink-0"
        style={{
          backgroundColor: "#FFFFFF",
          borderBottom: `1px solid ${CHAT_SURFACE_LIGHT}`,
        }}
      >
        <div className="flex items-center gap-3">
          {/* Menu button */}
          <button
            onClick={() => setShowConversationList(true)}
            className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all cursor-pointer"
            style={{
              backgroundColor: CHAT_SURFACE_LIGHT,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#E8F4FF";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = CHAT_SURFACE_LIGHT;
            }}
          >
            {conversations.length > 0 ? (
              <Menu className="w-5 h-5" style={{ color: CHAT_PRIMARY }} />
            ) : (
              <span className="text-[14px] font-bold" style={{ color: CHAT_PRIMARY }}>
                {conversations.length}
              </span>
            )}
          </button>

          {/* Avatar + Title */}
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: `linear-gradient(135deg, ${CHAT_PRIMARY}, ${CHAT_ACCENT})` }}
          >
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-[16px]" style={{ color: "#000E1A" }}>
              AI Travel Agent
            </h1>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-[12px]" style={{ color: CHAT_GRAY }}>
                Trực tuyến
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all cursor-pointer"
            style={{
              backgroundColor: showSearch ? CHAT_PRIMARY : CHAT_SURFACE_LIGHT,
            }}
            title="Tìm kiếm"
          >
            <Search
              className="w-5 h-5"
              style={{ color: showSearch ? "#FFFFFF" : CHAT_PRIMARY }}
            />
          </button>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(true)}
            className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all cursor-pointer"
            style={{ backgroundColor: CHAT_SURFACE_LIGHT }}
            title="Cài đặt"
          >
            <Settings className="w-5 h-5" style={{ color: CHAT_PRIMARY }} />
          </button>

          {/* New chat */}
          <Button
            size="sm"
            onClick={handleNewChat}
            className="text-[13px] font-semibold h-10 px-4 gap-2"
            style={{
              background: `linear-gradient(135deg, ${CHAT_PRIMARY}, ${CHAT_ACCENT})`,
              borderRadius: "12px",
              border: "none",
              color: "#FFFFFF",
            }}
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Tạo mới</span>
          </Button>
        </div>
      </div>

      {/* Search bar */}
      {showSearch && <ChatSearch onClose={() => setShowSearch(false)} />}

      {/* Conversation List Panel */}
      <ConversationList
        open={showConversationList}
        onClose={() => setShowConversationList(false)}
        onSelectConversation={(sessId) => {
          onLoadConversation(sessId);
          setShowConversationList(false);
        }}
      />

      {/* Settings Modal */}
      <ChatSettings open={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
}
