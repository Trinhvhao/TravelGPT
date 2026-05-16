"use client";
import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { ImageAttachment } from "@/types/chat";
import { Paperclip, X, Image as ImageIcon } from "lucide-react";

const MAX_ATTACHMENTS = 3;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface UseImageAttachmentsReturn {
  attachments: ImageAttachment[];
  addAttachments: (files: FileList | null) => void;
  removeAttachment: (id: string) => void;
  clearAttachments: () => void;
  hasAttachments: boolean;
}

// ─── Hook ──────────────────────────────────────────────────────────────────────
export function useImageAttachments(): UseImageAttachmentsReturn {
  const [attachments, setAttachments] = useState<ImageAttachment[]>([]);

  const addAttachments = useCallback((files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .filter((f) => f.size <= MAX_FILE_SIZE)
      .slice(0, MAX_ATTACHMENTS - attachments.length);

    const newAttachments: ImageAttachment[] = newFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      url: URL.createObjectURL(file),
      filename: file.name,
      size: file.size,
      mimeType: file.type,
    }));

    setAttachments((prev) => [...prev, ...newAttachments].slice(0, MAX_ATTACHMENTS));
  }, [attachments.length]);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const toRemove = prev.find((a) => a.id === id);
      if (toRemove) URL.revokeObjectURL(toRemove.url);
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  const clearAttachments = useCallback(() => {
    attachments.forEach((a) => URL.revokeObjectURL(a.url));
    setAttachments([]);
  }, [attachments]);

  return {
    attachments,
    addAttachments,
    removeAttachment,
    clearAttachments,
    hasAttachments: attachments.length > 0,
  };
}

// ─── Attachment Preview ──────────────────────────────────────────────────────────
interface AttachmentPreviewsProps {
  attachments: ImageAttachment[];
  onRemove: (id: string) => void;
}

export function AttachmentPreviews({ attachments, onRemove }: AttachmentPreviewsProps) {
  if (attachments.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {attachments.map((att) => (
        <div key={att.id} className="relative flex-shrink-0 group">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-[#DDDDDD]">
            <img
              src={att.url}
              alt={att.filename ?? "Attachment"}
              className="w-full h-full object-cover"
            />
          </div>
          {/* Remove button */}
          <button
            onClick={() => onRemove(att.id)}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#ED1D24] text-white flex items-center justify-center shadow-md hover:bg-[#DC2626] transition-colors cursor-pointer"
            aria-label="Xóa ảnh"
          >
            <X className="w-3 h-3" />
          </button>
          {/* File size badge */}
          {att.size && (
            <div className="absolute bottom-1 left-1 px-1 py-0.5 rounded text-[9px] font-semibold text-white bg-black/50">
              {(att.size / 1024 / 1024).toFixed(1)}MB
            </div>
          )}
        </div>
      ))}
      {attachments.length < MAX_ATTACHMENTS && (
        <label className="relative flex-shrink-0 w-16 h-16 rounded-xl border-2 border-dashed border-[#DDDDDD] flex items-center justify-center cursor-pointer hover:border-[#0046C1] hover:bg-[#D9EEFF]/30 transition-colors">
          <input
            type="file"
            accept="image/*"
            multiple
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={(e) => {
              const input = e.currentTarget;
              const remaining = MAX_ATTACHMENTS - attachments.length;
              if (remaining > 0 && input.files) {
                const slice = Array.from(input.files).slice(0, remaining);
                const dt = new DataTransfer();
                slice.forEach((f) => dt.items.add(f));
                input.value = "";
                // Dispatch a synthetic event to parent
              }
            }}
          />
          <Paperclip className="w-4 h-4 text-[#999999]" />
        </label>
      )}
    </div>
  );
}

// ─── Attach Button ──────────────────────────────────────────────────────────────
interface AttachButtonProps {
  onFiles: (files: FileList | null) => void;
  disabled?: boolean;
  currentCount: number;
}

export function AttachButton({ onFiles, disabled, currentCount }: AttachButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        disabled={disabled || currentCount >= MAX_ATTACHMENTS}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onFiles(e.target.files);
          }
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={disabled || currentCount >= MAX_ATTACHMENTS}
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-xl transition-all cursor-pointer",
          disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-[#D9EEFF]"
        )}
        title={currentCount >= MAX_ATTACHMENTS ? "Tối đa 3 ảnh" : "Đính kèm ảnh"}
      >
        <Paperclip className="w-5 h-5" style={{ color: "#636363" }} />
        {currentCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
            style={{ backgroundColor: "#0046C1" }}>
            {currentCount}
          </span>
        )}
      </button>
    </div>
  );
}

// ─── Preview Modal ──────────────────────────────────────────────────────────────
interface ImagePreviewModalProps {
  attachment: ImageAttachment;
  onClose: () => void;
}

export function ImagePreviewModal({ attachment, onClose }: ImagePreviewModalProps) {
  return (
    <div
      className="fixed inset-0 z-modal bg-black/80 flex items-center justify-center p-8"
      onClick={onClose}
    >
      <div className="relative max-w-3xl max-h-full" onClick={(e) => e.stopPropagation()}>
        <img
          src={attachment.url}
          alt={attachment.filename ?? "Preview"}
          className="max-w-full max-h-[80vh] object-contain rounded-xl"
        />
        {attachment.filename && (
          <p className="text-white text-center mt-3 text-sm">
            {attachment.filename}
          </p>
        )}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
