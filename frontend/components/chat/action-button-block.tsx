"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ContentBlockActionButton, ContentBlockImage } from "@/types/chat";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  Copy,
  Check,
  Download,
  X,
  ZoomIn,
} from "lucide-react";

const PRIMARY = "#0046C1";
const ACCENT = "#0391FF";
const GRAY = "#636363";
const NAVY = "#000E1A";

// ─── Action Button Block ─────────────────────────────────────────────────
export function ActionButtonBlock({ block }: { block: ContentBlockActionButton }) {
  const { data } = block;
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const style = data.style || "primary";

  const handleClick = () => {
    if (data.action === "navigate" && data.href) {
      router.push(data.href);
    } else if (data.action === "external" && data.url) {
      window.open(data.url, "_blank", "noopener,noreferrer");
    } else if (data.action === "payment_link" && data.url) {
      window.open(data.url, "_blank", "noopener,noreferrer");
    } else if (data.action === "copy" && data.href) {
      navigator.clipboard.writeText(data.href).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } else if (data.action === "download" && data.url) {
      const a = document.createElement("a");
      a.href = data.url;
      a.download = "";
      a.click();
    }
  };

  const iconMap: Record<string, React.ReactNode> = {
    copy: copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />,
    external: <ExternalLink className="w-4 h-4" />,
    download: <Download className="w-4 h-4" />,
    credit_card: <span className="text-lg">💳</span>,
    check: <Check className="w-4 h-4" />,
  };

  const styleMap = {
    primary: {
      background: `linear-gradient(135deg, ${ACCENT}, ${PRIMARY})`,
      color: "#fff",
      border: "none",
    },
    secondary: {
      background: "transparent",
      color: PRIMARY,
      border: `1px solid ${PRIMARY}40`,
    },
    outline: {
      background: "#fff",
      color: PRIMARY,
      border: `1px solid ${PRIMARY}60`,
    },
    ghost: {
      background: "transparent",
      color: GRAY,
      border: "1px solid transparent",
    },
  };

  const s = styleMap[style] || styleMap.primary;

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-3 px-5 py-3 rounded-xl font-semibold text-[13px] transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
      style={{
        background: s.background,
        color: s.color,
        border: s.border !== "none" ? s.border : "none",
        boxShadow: style === "primary" ? "0 4px 12px rgba(0,70,193,0.25)" : "none",
      }}
    >
      {data.icon && iconMap[data.icon] ? iconMap[data.icon] : iconMap.external}
      {data.label}
    </button>
  );
}

// ─── Image Lightbox ─────────────────────────────────────────────────────
export function ImageLightbox({
  images,
  initialIndex = 0,
  onClose,
}: {
  images: Array<{ url: string; caption?: string }>;
  initialIndex?: number;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [loaded, setLoaded] = useState(false);

  const current = images[currentIndex];

  const prev = () => {
    setLoaded(false);
    setCurrentIndex((i) => Math.max(0, i - 1));
  };

  const next = () => {
    setLoaded(false);
    setCurrentIndex((i) => Math.min(images.length - 1, i + 1));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.9)" }}
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Close button */}
      <button
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all"
        style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
        onClick={onClose}
        aria-label="Đóng"
      >
        <X className="w-5 h-5 text-white" />
      </button>

      {/* Counter */}
      {images.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-1 rounded-full text-white text-[13px] font-medium"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* Image */}
      <div
        className="relative max-w-4xl max-h-[85vh] w-full mx-4 flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Prev button */}
        {currentIndex > 0 && (
          <button
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all"
            style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
            onClick={prev}
            aria-label="Ảnh trước"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}

        {/* Image */}
        <div className="relative flex items-center justify-center w-full h-full">
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
          <img
            key={current.url}
            src={current.url}
            alt={current.caption || "Image"}
            className={`max-w-full max-h-[80vh] object-contain rounded-lg transition-opacity ${loaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setLoaded(true)}
          />
        </div>

        {/* Next button */}
        {currentIndex < images.length - 1 && (
          <button
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all"
            style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
            onClick={next}
            aria-label="Ảnh sau"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 18l6-6-6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* Caption */}
      {current.caption && (
        <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-[13px] text-center max-w-lg px-4">
          {current.caption}
        </p>
      )}
    </div>
  );
}

// ─── Image Block with Lightbox ────────────────────────────────────────
export function ImageBlock({ block }: { block: ContentBlockImage }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  const images = [{ url: block.url, caption: block.caption }];

  return (
    <>
      <div className="my-3">
        <div
          className="relative rounded-xl overflow-hidden cursor-zoom-in max-w-md transition-transform hover:scale-[1.01]"
          onClick={() => setLightboxOpen(true)}
        >
          {block.url && !imgError ? (
            <img
              src={block.url}
              alt={block.caption ?? "Image"}
              className="w-full object-cover rounded-xl"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div
              className="w-full h-40 flex items-center justify-center"
              style={{ backgroundColor: "#F7F7F7", borderRadius: "12px" }}
            >
              <ZoomIn className="w-8 h-8 opacity-30" />
            </div>
          )}

          {/* Zoom indicator */}
          <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <ZoomIn className="w-4 h-4 text-white" />
          </div>
        </div>
        {block.caption && (
          <p className="text-[12px] text-center mt-1.5" style={{ color: GRAY }}>
            {block.caption}
          </p>
        )}
      </div>

      {lightboxOpen && (
        <ImageLightbox images={images} onClose={() => setLightboxOpen(false)} />
      )}
    </>
  );
}
