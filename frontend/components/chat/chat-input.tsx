"use client";
import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";

// ─── Design Tokens (Airbnb Style) ──────────────────────────────────────────────
const PRIMARY = "#0046C1";
const ACCENT = "#0391FF";
const SURFACE = "#F7F7F7";
const SURFACE_LIGHT = "#D9EEFF";
const NAVY = "#000E1A";
const GRAY = "#636363";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function ChatInput({ onSend, disabled, placeholder = "Nhắn tin...", className }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submit = useCallback(() => {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  return (
    <div
      className={cn("flex items-end gap-3", className)}
      style={{
        padding: "16px",
        backgroundColor: "#FFFFFF",
        borderRadius: "20px",
        boxShadow: "0 -4px 20px rgba(0,70,193,0.08)",
      }}
    >
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={cn(
            "w-full min-h-[48px] max-h-[120px] px-5 py-3",
            "text-[15px] resize-none transition-all"
          )}
          style={{
            height: "auto",
            backgroundColor: SURFACE,
            border: `1px solid transparent`,
            borderRadius: "24px",
            color: NAVY,
            outline: "none",
          }}
          onFocus={(e) => {
            e.target.style.backgroundColor = "#FFFFFF";
            e.target.style.borderColor = PRIMARY;
            e.target.style.boxShadow = "0 0 0 3px rgba(0,70,193,0.1)";
          }}
          onBlur={(e) => {
            e.target.style.backgroundColor = SURFACE;
            e.target.style.borderColor = "transparent";
            e.target.style.boxShadow = "none";
          }}
        />
      </div>

      <Button
        size="icon"
        className="w-12 h-12 flex-shrink-0 shadow-lg transition-all"
        onClick={submit}
        disabled={disabled || !value.trim()}
        aria-label="Gửi tin nhắn"
        style={{
          background: value.trim() && !disabled
            ? `linear-gradient(135deg, ${ACCENT}, ${PRIMARY})`
            : SURFACE,
          borderRadius: "50%",
          border: "none",
        }}
        onMouseEnter={(e) => {
          if (value.trim() && !disabled) {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.05)";
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
        }}
      >
        {disabled ? (
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: GRAY }} />
        ) : (
          <Send
            className="w-5 h-5"
            style={{ color: value.trim() && !disabled ? "#FFFFFF" : GRAY }}
          />
        )}
      </Button>
    </div>
  );
}
