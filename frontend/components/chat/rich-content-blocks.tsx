"use client";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import {
  type ContentBlock,
  type ContentBlockTable,
  type ContentBlockGallery,
  type ContentBlockTimeline,
  type ContentBlockStats,
  type ContentBlockAlert,
  type ContentBlockCardGrid,
  ContentBlockImage,
} from "@/types/chat";
import {
  Star,
  MapPin,
  Clock,
  Users,
  CalendarDays,
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

const PRIMARY = "#0046C1";
const ACCENT = "#0391FF";
const GRAY = "#636363";
const NAVY = "#000E1A";

// ─── Text Block ─────────────────────────────────────────────────────────────
function TextBlock({ content }: { content: string }) {
  // Already rendered by renderContent utility, just return as-is
  return <span>{content}</span>;
}

// ─── Image Block ────────────────────────────────────────────────────────────
function ImageBlock({ block }: { block: ContentBlockImage }) {
  return (
    <div className="my-3">
      <div className="relative rounded-xl overflow-hidden max-w-md">
        <img
          src={block.url}
          alt={block.caption ?? "Image"}
          className="w-full object-cover rounded-xl"
          loading="lazy"
        />
      </div>
      {block.caption && (
        <p className="text-[12px] text-center mt-1.5" style={{ color: GRAY }}>
          {block.caption}
        </p>
      )}
    </div>
  );
}

// ─── Gallery Block ───────────────────────────────────────────────────────────
function GalleryBlock({ block }: { block: ContentBlockGallery }) {
  return (
    <div className="my-3">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {block.images.map((img, idx) => (
          <div key={idx} className="flex-shrink-0 relative rounded-xl overflow-hidden"
            style={{ width: 160, height: 120 }}>
            <img
              src={img.url}
              alt={img.caption ?? `Image ${idx + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {img.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <p className="text-white text-[11px] line-clamp-1">{img.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Table Block ─────────────────────────────────────────────────────────────
function TableBlock({ block }: { block: ContentBlockTable }) {
  return (
    <div className="my-3 overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr>
            {block.headers.map((h, i) => (
              <th
                key={i}
                className="px-4 py-2.5 text-left font-bold text-white"
                style={{ backgroundColor: PRIMARY }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, ri) => (
            <tr
              key={ri}
              className="border-b border-[#EEEEEE]"
              style={{ backgroundColor: ri % 2 === 0 ? "#FFFFFF" : "#F7F7F7" }}
            >
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-2.5" style={{ color: NAVY }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Card Grid Block ──────────────────────────────────────────────────────────
function CardGridBlock({ block }: { block: ContentBlockCardGrid }) {
  return (
    <div className="my-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {block.cards.map((card, idx) => (
        <div
          key={idx}
          className="rounded-xl border border-[#EEEEEE] p-4 bg-white hover:shadow-md transition-shadow"
        >
          {card.icon && (
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
              style={{ backgroundColor: "#D9EEFF" }}
            >
              <span className="text-lg">{card.icon}</span>
            </div>
          )}
          <h4 className="font-bold text-[14px] mb-1" style={{ color: NAVY }}>
            {card.title}
          </h4>
          <p className="text-[12px] leading-relaxed" style={{ color: GRAY }}>
            {card.body}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Timeline Block ────────────────────────────────────────────────────────────
function TimelineBlock({ block }: { block: ContentBlockTimeline }) {
  return (
    <div className="my-3 space-y-0">
      {block.items.map((item, idx) => (
        <div key={idx} className="flex gap-4">
          {/* Timeline dot */}
          <div className="flex flex-col items-center flex-shrink-0">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] font-bold"
              style={{ backgroundColor: PRIMARY }}
            >
              {item.day ?? (idx + 1)}
            </div>
            {idx < block.items.length - 1 && (
              <div className="w-0.5 flex-1 min-h-[24px]" style={{ backgroundColor: "#D9EEFF" }} />
            )}
          </div>
          {/* Content */}
          <div className="pb-6 flex-1">
            <h4 className="font-bold text-[14px] mb-1" style={{ color: NAVY }}>
              {item.title}
            </h4>
            {item.description && (
              <p className="text-[13px] leading-relaxed" style={{ color: GRAY }}>
                {item.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Stats Block ──────────────────────────────────────────────────────────────
function StatsBlock({ block }: { block: ContentBlockStats }) {
  const iconMap: Record<string, React.ReactNode> = {
    star: <Star className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />,
    map: <MapPin className="w-4 h-4" style={{ color: PRIMARY }} />,
    clock: <Clock className="w-4 h-4" style={{ color: ACCENT }} />,
    users: <Users className="w-4 h-4" style={{ color: PRIMARY }} />,
    calendar: <CalendarDays className="w-4 h-4" style={{ color: ACCENT }} />,
  };

  return (
    <div className="my-3">
      <div className="flex flex-wrap gap-3">
        {block.items.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#F7F7F7] border border-[#EEEEEE]"
          >
            {item.icon && iconMap[item.icon] ? (
              iconMap[item.icon]
            ) : (
              <Star className="w-4 h-4 text-[#F59E0B]" />
            )}
            <span className="text-[13px] font-medium" style={{ color: GRAY }}>
              {item.label}
            </span>
            <span className="text-[13px] font-bold" style={{ color: NAVY }}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Alert Block ─────────────────────────────────────────────────────────────
function AlertBlock({ block }: { block: ContentBlockAlert }) {
  const styles: Record<string, { bg: string; border: string; icon: React.ReactNode; iconColor: string }> = {
    info: {
      bg: "#EEF6FF",
      border: "#BFDBFE",
      icon: <Info className="w-4 h-4" />,
      iconColor: "#0046C1",
    },
    warning: {
      bg: "#FFFBEB",
      border: "#FDE68A",
      icon: <AlertTriangle className="w-4 h-4" />,
      iconColor: "#D97706",
    },
    success: {
      bg: "#F0FDF4",
      border: "#BBF7D0",
      icon: <CheckCircle2 className="w-4 h-4" />,
      iconColor: "#059669",
    },
    error: {
      bg: "#FEF2F2",
      border: "#FECACA",
      icon: <XCircle className="w-4 h-4" />,
      iconColor: "#DC2626",
    },
  };

  const style = styles[block.variant] ?? styles.info;

  return (
    <div
      className="my-3 rounded-xl p-4 flex gap-3"
      style={{ backgroundColor: style.bg, border: `1px solid ${style.border}` }}
    >
      <div className="flex-shrink-0 mt-0.5" style={{ color: style.iconColor }}>
        {style.icon}
      </div>
      <div className="flex-1 min-w-0">
        {block.title && (
          <p className="font-bold text-[14px] mb-1" style={{ color: style.iconColor }}>
            {block.title}
          </p>
        )}
        <p className="text-[13px] leading-relaxed" style={{ color: NAVY }}>
          {block.content}
        </p>
      </div>
    </div>
  );
}

// ─── Main Renderer ────────────────────────────────────────────────────────────
export function renderContentBlocks(blocks: ContentBlock[]): React.ReactNode {
  return blocks.map((block, idx) => {
    switch (block.type) {
      case "text":
        return <TextBlock key={idx} content={block.content} />;
      case "image":
        return <ImageBlock key={idx} block={block} />;
      case "gallery":
        return <GalleryBlock key={idx} block={block} />;
      case "table":
        return <TableBlock key={idx} block={block} />;
      case "card_grid":
        return <CardGridBlock key={idx} block={block} />;
      case "timeline":
        return <TimelineBlock key={idx} block={block} />;
      case "stats":
        return <StatsBlock key={idx} block={block} />;
      case "alert":
        return <AlertBlock key={idx} block={block} />;
      default:
        return null;
    }
  });
}
