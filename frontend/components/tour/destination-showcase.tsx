"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { tourApi } from "@/lib/tour-api";
import type { Tour } from "@/types";
import { MapPin, ArrowRight } from "lucide-react";

// ─── Destination data ──────────────────────────────────────────────────────────────
const DESTINATIONS = [
  { name: "Đà Nẵng", slug: "da-nang", emoji: "🏖️", image: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600", tourCount: 4 },
  { name: "Phú Quốc", slug: "phu-quoc", emoji: "🏝️", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600", tourCount: 2 },
  { name: "Hội An", slug: "hoi-an", emoji: "🏮", image: "https://images.unsplash.com/photo-1557794008-66bf5d6f6e97?w=600", tourCount: 2 },
  { name: "Hạ Long", slug: "ha-long", emoji: "⛵", image: "https://images.unsplash.com/photo-1528127269322-539801943592?w=600", tourCount: 1 },
  { name: "Sapa", slug: "sapa", emoji: "🏔️", image: "https://images.unsplash.com/photo-1597007064818-11d2395dc5df?w=600", tourCount: 1 },
  { name: "Nha Trang", slug: "nha-trang", emoji: "🌊", image: "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600", tourCount: 1 },
  { name: "Bangkok", slug: "bangkok", emoji: "🛕", image: "https://images.unsplash.com/photo-1508009603885-50cf7c579dd5?w=600", tourCount: 1 },
  { name: "Bali", slug: "bali", emoji: "🌺", image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600", tourCount: 1 },
];

const PRIMARY = "#0046C1";
const ACCENT = "#0391FF";

// ─── Destination Card ──────────────────────────────────────────────────────────────
function DestinationCard({
  dest,
  onHover,
  isHovered,
}: {
  dest: (typeof DESTINATIONS)[0];
  onHover: (v: boolean) => void;
  isHovered: boolean;
}) {
  return (
    <Link
      href={`/tours?search=${encodeURIComponent(dest.name)}`}
      className="group relative flex-shrink-0 w-[140px] h-[180px] overflow-hidden rounded-2xl cursor-pointer"
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      <Image
        src={dest.image}
        alt={dest.name}
        fill
        className={cn(
          "object-cover transition-transform duration-500",
          isHovered && "scale-110"
        )}
        sizes="140px"
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-2xl mb-0.5">{dest.emoji}</p>
        <p className="text-white font-bold text-[14px] leading-tight">{dest.name}</p>
        <p className="text-white/70 text-[11px]">
          {dest.tourCount} tour
        </p>
      </div>

      {/* Hover arrow */}
      <div
        className={cn(
          "absolute top-3 right-3 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center transition-all duration-300",
          isHovered ? "opacity-100 scale-100" : "opacity-0 scale-75"
        )}
      >
        <ArrowRight className="w-3.5 h-3.5 text-[#0046C1]" />
      </div>
    </Link>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────────
export function DestinationShowcase() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    el?.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);
    return () => {
      el?.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" });
  };

  return (
    <section className="py-8 bg-white border-b border-[#EEEEEE]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4" style={{ color: PRIMARY }} />
              <span className="text-[13px] font-bold" style={{ color: PRIMARY }}>
                Khám phá
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-[#000E1A]">Điểm đến phổ biến</h2>
          </div>
          <Link
            href="/tours"
            className="flex items-center gap-1 text-[13px] font-semibold hover:opacity-70 transition-opacity"
            style={{ color: ACCENT }}
          >
            Xem tất cả <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Scroll controls + cards */}
        <div className="relative">
          {/* Scroll buttons */}
          {canScrollLeft && (
            <button
              onClick={() => scroll("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-lg border border-[#DDDDDD] flex items-center justify-center hover:bg-[#F7F7F7] transition-colors cursor-pointer"
              aria-label="Cuộn trái"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L6 8L10 4" stroke="#0046C1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          {canScrollRight && (
            <button
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-lg border border-[#DDDDDD] flex items-center justify-center hover:bg-[#F7F7F7] transition-colors cursor-pointer"
              aria-label="Cuộn phải"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 4L10 8L6 12" stroke="#0046C1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}

          {/* Cards */}
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide scroll-smooth"
          >
            {DESTINATIONS.map((dest, idx) => (
              <DestinationCard
                key={dest.slug}
                dest={dest}
                isHovered={hoveredIdx === idx}
                onHover={(v) => setHoveredIdx(v ? idx : null)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
