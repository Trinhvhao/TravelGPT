"use client";
import { useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import { AttachmentPreviews } from "./chat-attachments";
import type { ImageAttachment } from "@/types/chat";

// ─── Design Tokens (Airbnb Style) ──────────────────────────────────────────────
const PRIMARY = "#0046C1";
const ACCENT = "#0391FF";
const SURFACE = "#F7F7F7";
const NAVY = "#000E1A";
const GRAY = "#636363";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  attachments?: ImageAttachment[];
  onRemoveAttachment?: (id: string) => void;
  onAddAttachments?: (files: FileList | null) => void;
  attachDisabled?: boolean;
  attachInputRef?: React.RefObject<HTMLInputElement | null>;
}

export function ChatInput({
  onSend,
  disabled,
  placeholder = "Nhắn tin...",
  className,
  attachments = [],
  onRemoveAttachment,
  onAddAttachments,
  attachDisabled,
  attachInputRef,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const localInputRef = useRef<HTMLInputElement>(null);
  const inputRef = attachInputRef ?? localInputRef;

  const submit = useCallback(
    (textValue: string) => {
      const text = textValue.trim();
      if (!text && attachments.length === 0) return;
      if (disabled) return;
      onSend(text);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.value = "";
      }
    },
    [disabled, onSend, attachments.length]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit(e.currentTarget.value);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  return (
    <div
      className={cn("flex flex-col gap-3", className)}
      style={{
        padding: "16px",
        backgroundColor: "#FFFFFF",
        borderRadius: "20px",
        boxShadow: "0 -4px 20px rgba(0,70,193,0.08)",
      }}
    >
      {/* Attachment previews */}
      {attachments.length > 0 && onRemoveAttachment && (
        <div className="px-1">
          <AttachmentPreviews
            attachments={attachments}
            onRemove={onRemoveAttachment}
          />
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-3">
        {/* Attach button */}
        {onAddAttachments && (
          <label
            className={cn(
              "flex items-center justify-center w-11 h-11 rounded-xl flex-shrink-0 cursor-pointer transition-all",
              attachDisabled || disabled
                ? "opacity-40 cursor-not-allowed"
                : "hover:bg-[#D9EEFF]"
            )}
            title="Đính kèm ảnh (tối đa 3)"
          >
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={attachDisabled || disabled}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  onAddAttachments(e.target.files);
                }
                e.target.value = "";
              }}
            />
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#636363" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
            </svg>
          </label>
        )}

        {/* Textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={cn(
              "w-full min-h-[48px] max-h-[120px] px-5 py-3",
              "text-[15px] resize-none transition-all outline-none"
            )}
            style={{
              height: "auto",
              backgroundColor: SURFACE,
              border: `1px solid transparent`,
              borderRadius: "24px",
              color: NAVY,
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

        {/* Send button */}
        <Button
          size="icon"
          className="w-12 h-12 flex-shrink-0 shadow-lg transition-all"
          onClick={() => {
            const text = textareaRef.current?.value ?? "";
            submit(text);
          }}
          disabled={disabled}
          aria-label="Gửi tin nhắn"
          style={{
            background: !disabled
              ? `linear-gradient(135deg, ${ACCENT}, ${PRIMARY})`
              : SURFACE,
            borderRadius: "50%",
            border: "none",
          }}
        >
          {disabled ? (
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: GRAY }} />
          ) : (
            <Send
              className="w-5 h-5 text-white"
              style={{ fill: "none" }}
            />
          )}
        </Button>
      </div>
    </div>
  );
}
