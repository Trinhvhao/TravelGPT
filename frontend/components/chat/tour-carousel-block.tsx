"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ContentBlockTourCarousel, TourCarouselData, TourCardData } from "@/types/chat";
import {
  Star,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";

const PRIMARY = "#0046C1";
const ACCENT = "#0391FF";
const GRAY = "#636363";
const NAVY = "#000E1A";

// ─── Star Rating ─────────────────────────────────────────────────────────────
function MiniStarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className="w-3 h-3"
          style={{ fill: i < Math.round(rating) ? "#F59E0B" : "#E5E7EB", color: i < Math.round(rating) ? "#F59E0B" : "#E5E7EB" }}
        />
      ))}
      {rating > 0 && (
        <span className="text-[11px] font-semibold ml-1" style={{ color: NAVY }}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

// ─── Mini Tour Card (carousel item) ───────────────────────────────────────
function MiniTourCard({
  tour,
  onBook,
  onDetail,
}: {
  tour: TourCardData;
  onBook: (t: TourCardData) => void;
  onDetail: (t: TourCardData) => void;
}) {
  const [imgError, setImgError] = useState(false);

  const image = tour.image || (tour.images && tour.images[0]);
  const fmt = (n: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(n);

  const price = tour.discount_price || tour.price;

  const handleClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking buttons
    const target = e.target as HTMLElement;
    if (target.tagName === "BUTTON" || target.closest("button")) {
      return;
    }
    onDetail(tour);
  };

  return (
    <div
      className="overflow-hidden border-0 transition-all duration-300 cursor-pointer group"
      style={{
        width: "260px",
        borderRadius: "14px",
        boxShadow: "0 4px 16px rgba(0,70,193,0.1)",
        backgroundColor: "#fff",
      }}
      onClick={handleClick}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(0,70,193,0.15)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(0,70,193,0.1)";
      }}
    >
      {/* Image */}
      <div className="relative h-32 overflow-hidden">
        {image && !imgError ? (
          <img
            src={image}
            alt={tour.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${PRIMARY}20, ${ACCENT}20)` }}
          >
            <MapPin className="w-8 h-8 opacity-30" style={{ color: PRIMARY }} />
          </div>
        )}

        {tour.is_featured && (
          <span
            className="absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[9px] font-bold text-white flex items-center gap-0.5 z-10"
            style={{ backgroundColor: "#F59E0B", borderRadius: "4px" }}
          >
            <Sparkles className="w-2.5 h-2.5" />
            Nổi bật
          </span>
        )}

        {tour.discount_price && tour.discount_price < tour.price && (
          <span
            className="absolute top-1.5 right-1.5 px-1.5 py-0.5 text-[9px] font-bold text-white z-10"
            style={{ backgroundColor: "#FF3B30", borderRadius: "4px" }}
          >
            -{Math.round((1 - tour.discount_price / tour.price) * 100)}%
          </span>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* Content */}
      <div className="p-2.5 space-y-1.5">
        <h4 className="font-bold text-[12px] line-clamp-2 leading-tight" style={{ color: NAVY }}>
          {tour.name}
        </h4>

        <div className="flex items-center gap-2 text-[10px]" style={{ color: GRAY }}>
          {tour.destination && (
            <span className="flex items-center gap-0.5">
              <MapPin className="w-2.5 h-2.5" style={{ color: ACCENT }} />
              <span className="truncate max-w-[60px]">{tour.destination}</span>
            </span>
          )}
          {tour.duration && (
            <span className="flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" style={{ color: ACCENT }} />
              {tour.duration}
            </span>
          )}
        </div>

        {tour.rating !== undefined && (
          <MiniStarRating rating={tour.rating} />
        )}

        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="text-[9px]" style={{ color: GRAY }}>
              Từ
            </p>
            <p className="text-[13px] font-bold leading-none" style={{ color: PRIMARY }}>
              {fmt(price)}
            </p>
          </div>
          <button
            className="px-3 py-1.5 text-[10px] font-semibold text-white transition-all"
            style={{
              background: `linear-gradient(135deg, ${ACCENT}, ${PRIMARY})`,
              borderRadius: "8px",
              border: "none",
            }}
            onClick={(e) => { e.stopPropagation(); onBook(tour); }}
          >
            Đặt
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tour Carousel Block ─────────────────────────────────────────────────────
export function TourCarouselBlock({ block }: { block: ContentBlockTourCarousel }) {
  const { data } = block;
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const { tours, title, subtitle } = data;

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 300;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
    setTimeout(checkScroll, 300);
  };

  const handleBook = (tour: TourCardData) => {
    router.push(`/chat?message=Đặt tour ${tour.name}`);
  };

  const handleDetail = (tour: TourCardData) => {
    console.log("Tour carousel detail click:", { slug: tour.slug, name: tour.name });
    if (tour.slug) {
      router.push(`/tours/${tour.slug}`);
    } else {
      // Fallback: build slug from name
      const slug = tour.name?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      if (slug) {
        router.push(`/tours/${slug}`);
      } else {
        console.error("No slug or name:", tour);
      }
    }
  };

  if (!tours || tours.length === 0) return null;

  return (
    <div
      className="animate-[slide-up_0.3s_ease-out] w-full"
    >
      {/* Header */}
      {(data.title || data.subtitle) && (
        <div className="mb-3">
          {data.title && (
            <h3 className="font-bold text-[15px]" style={{ color: NAVY }}>
              {data.title}
            </h3>
          )}
          {data.subtitle && (
            <p className="text-[12px] mt-0.5" style={{ color: GRAY }}>
              {data.subtitle}
            </p>
          )}
        </div>
      )}

      {/* Carousel - responsive */}
      <div className="relative">
        {/* Left scroll button */}
        {canScrollLeft && (
          <button
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shadow-lg transition-all"
            style={{
              backgroundColor: "#fff",
              border: `1px solid ${PRIMARY}30`,
              transform: "translateY(-50%) translateX(-4px)",
            }}
            onClick={() => scroll("left")}
            aria-label="Cuộn sang trái"
          >
            <ChevronLeft className="w-4 h-4" style={{ color: PRIMARY }} />
          </button>
        )}

        {/* Scrollable container */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
          style={{ 
            scrollbarWidth: "none", 
            msOverflowStyle: "none",
            scrollSnapType: "x mandatory"
          }}
          onScroll={checkScroll}
        >
          {tours.map((tour) => (
            <div 
              key={tour.id} 
              className="flex-shrink-0"
              style={{ scrollSnapAlign: "start" }}
            >
              <MiniTourCard
                tour={tour}
                onBook={handleBook}
                onDetail={handleDetail}
              />
            </div>
          ))}
        </div>

        {/* Right scroll button */}
        {canScrollRight && (
          <button
            className="absolute right-0 top-1/2 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shadow-lg transition-all"
            style={{
              backgroundColor: "#fff",
              border: `1px solid ${PRIMARY}30`,
              transform: "translateY(-50%) translateX(4px)",
            }}
            onClick={() => scroll("right")}
            aria-label="Cuộn sang phải"
          >
            <ChevronRight className="w-4 h-4" style={{ color: PRIMARY }} />
          </button>
        )}
      </div>

      {/* Results count */}
      <p className="text-[11px] mt-2" style={{ color: GRAY }}>
        Hiển thị {tours.length} tour phù hợp
      </p>
    </div>
  );
}
