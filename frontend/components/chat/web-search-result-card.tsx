"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Star, MapPin, Plane, Hotel, Ticket } from "lucide-react";
import type { WebSearchResult } from "@/types";

// ─── Site config ───────────────────────────────────────────────────────────────
const SITE_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; color: string; bg: string }
> = {
  traveloka: {
    label: "Traveloka",
    icon: <Plane className="h-3 w-3" />,
    color: "#0F6BBC",
    bg: "#E8F4FD",
  },
  booking: {
    label: "Booking.com",
    icon: <Hotel className="h-3 w-3" />,
    color: "#003580",
    bg: "#E6F0FA",
  },
  viator: {
    label: "Viator",
    icon: <Ticket className="h-3 w-3" />,
    color: "#1A8CFF",
    bg: "#E5F2FF",
  },
};

// ─── Single result card ────────────────────────────────────────────────────────
function WebSearchItem({
  result,
  index,
}: {
  result: WebSearchResult;
  index: number;
}) {
  const site = SITE_CONFIG[result.site] ?? {
    label: result.site,
    icon: <ExternalLink className="h-3 w-3" />,
    color: "#636363",
    bg: "#F5F5F5",
  };

  return (
    <div
      className="group flex flex-col gap-2 p-3 rounded-xl transition-all duration-200 cursor-pointer"
      style={{
        backgroundColor: "#FFFFFF",
        boxShadow: "0 2px 12px rgba(0,70,193,0.08)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 4px 20px rgba(0,70,193,0.15)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 2px 12px rgba(0,70,193,0.08)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
      }}
      role="listitem"
      aria-label={`Kết quả từ ${site.label}: ${result.title}`}
    >
      {/* Header: site badge + external link */}
      <div className="flex items-center justify-between gap-2">
        <Badge
          variant="outline"
          className="flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 border-0"
          style={{
            backgroundColor: site.bg,
            color: site.color,
            borderRadius: "20px",
          }}
        >
          {site.icon}
          {site.label}
        </Badge>
        <a
          href={result.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Mở ${result.title} trên ${site.label}`}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink
            className="h-3.5 w-3.5"
            style={{ color: site.color }}
          />
        </a>
      </div>

      {/* Title */}
      <h4
        className="font-semibold text-[13px] leading-snug line-clamp-2"
        style={{ color: "#000E1A" }}
      >
        {result.title}
      </h4>

      {/* Description */}
      {result.description && (
        <p
          className="text-[11px] leading-relaxed line-clamp-2"
          style={{ color: "#636363" }}
        >
          {result.description}
        </p>
      )}

      {/* Footer: location + rating + price */}
      <div className="flex items-center gap-3 flex-wrap">
        {result.location && (
          <span className="flex items-center gap-1 text-[10px]" style={{ color: "#636363" }}>
            <MapPin className="h-3 w-3 flex-shrink-0" />
            {result.location}
          </span>
        )}
        {result.rating && (
          <span
            className="flex items-center gap-1 text-[10px] font-semibold"
            style={{ color: "#F59E0B" }}
          >
            <Star className="h-3 w-3 fill-current flex-shrink-0" />
            {result.rating.toFixed(1)}
          </span>
        )}
        {result.price && (
          <span
            className="text-[12px] font-bold ml-auto"
            style={{ color: "#0046C1" }}
          >
            {result.price}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────────
interface WebSearchResultCardProps {
  results: WebSearchResult[];
  query?: string;
  maxVisible?: number;
  onOpenExternal?: (url: string) => void;
}

export function WebSearchResultCard({
  results,
  query,
  maxVisible = 3,
  onOpenExternal,
}: WebSearchResultCardProps) {
  if (!results || results.length === 0) return null;

  const displayResults = results.slice(0, maxVisible);
  const hasMore = results.length > maxVisible;

  return (
    <div className="animate-[slide-up_0.3s_ease-out] ml-14 space-y-3" role="list" aria-label="Kết quả tìm kiếm từ web">
      {/* Section label */}
      <div className="flex items-center gap-2">
        <div
          className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full"
          style={{
            backgroundColor: "#FFF7E6",
            color: "#B45309",
          }}
        >
          <ExternalLink className="h-3 w-3" />
          Kết quả tìm kiếm từ web
          {query && (
            <span className="font-normal opacity-75">— "{query}"</span>
          )}
        </div>
        <span
          className="text-[10px]"
          style={{ color: "#636363" }}
        >
          {results.length} kết quả
        </span>
      </div>

      {/* Results grid */}
      <div className="grid gap-2">
        {displayResults.map((result, index) => (
          <WebSearchItem key={`${result.site}-${index}`} result={result} index={index} />
        ))}
      </div>

      {/* Show more */}
      {hasMore && (
        <button
          className="w-full text-center text-[12px] py-2 font-medium rounded-lg transition-all"
          style={{ color: "#0046C1", backgroundColor: "#F0F4FF" }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "#E0EEFF")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "#F0F4FF")
          }
          aria-label={`Xem thêm ${results.length - maxVisible} kết quả khác`}
        >
          Xem thêm {results.length - maxVisible} kết quả từ web
        </button>
      )}

      {/* Disclaimer */}
      <p className="text-[10px] leading-relaxed" style={{ color: "#636363" }}>
        Kết quả được lấy từ{" "}
        <span style={{ color: "#0046C1" }}>Traveloka</span>,{" "}
        <span style={{ color: "#003580" }}>Booking.com</span> và{" "}
        <span style={{ color: "#1A8CFF" }}>Viator</span>. Giá có thể thay đổi.
      </p>
    </div>
  );
}
