"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { TourCardData } from "@/types/chat";
import {
  type ContentBlockTourCard,
} from "@/types/chat";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Star,
  MapPin,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PRIMARY = "#0046C1";
const ACCENT = "#0391FF";
const GRAY = "#636363";
const NAVY = "#000E1A";

// ─── Star Rating ─────────────────────────────────────────────────────────────
function StarRating({ rating, count }: { rating: number; count?: number }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg
            key={i}
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill={i < fullStars ? "#F59E0B" : i === fullStars && hasHalf ? "url(#half)" : "#E5E7EB"}
          >
            {i === fullStars && hasHalf && (
              <defs>
                <linearGradient id="half">
                  <stop offset="50%" stopColor="#F59E0B" />
                  <stop offset="50%" stopColor="#E5E7EB" />
                </linearGradient>
              </defs>
            )}
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </div>
      <span className="text-[12px] font-semibold" style={{ color: NAVY }}>
        {rating > 0 ? rating.toFixed(1) : "Mới"}
      </span>
      {count !== undefined && count > 0 && (
        <span className="text-[11px]" style={{ color: GRAY }}>
          ({count.toLocaleString()} đánh giá)
        </span>
      )}
    </div>
  );
}

// ─── Price Display ──────────────────────────────────────────────────────────
function PriceDisplay({ price, discount }: { price: number; discount?: number }) {
  const fmt = (n: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(n);

  if (discount && discount < price) {
    return (
      <div className="flex items-end gap-2">
        <div>
          <p className="text-[11px]" style={{ color: GRAY }}>
            <s>{fmt(price)}</s>
          </p>
          <p className="text-[18px] font-bold leading-none" style={{ color: PRIMARY }}>
            {fmt(discount)}
          </p>
        </div>
        <Badge
          className="text-[11px] px-1.5 py-0.5 font-bold"
          style={{ backgroundColor: "#FF3B30", color: "#fff" }}
        >
          -{Math.round((1 - discount / price) * 100)}%
        </Badge>
      </div>
    );
  }

  return (
    <p className="text-[18px] font-bold leading-none" style={{ color: PRIMARY }}>
      {fmt(price)}
    </p>
  );
}

// ─── Tour Card (single) ─────────────────────────────────────────────────────
export function TourCardBlock({ block }: { block: ContentBlockTourCard }) {
  const { data } = block;
  const router = useRouter();
  const [imgError, setImgError] = useState(false);

  const image = data.image || (data.images && data.images[0]);
  const hasDiscount = data.discount_price && data.discount_price < data.price;

  const handleBook = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (data.ctas) {
      const bookCta = data.ctas.find((c) => c.action === "booking_flow");
      if (bookCta?.tourId) {
        router.push(`/chat?book=${bookCta.tourId}`);
      }
    } else {
      // Default: start booking flow
      router.push(`/chat?message=Đặt tour ${data.name}`);
    }
  };

  const handleViewDetail = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("TourCardBlock click:", { slug: data.slug, name: data.name });
    if (data.slug) {
      router.push(`/tours/${data.slug}`);
    } else {
      // Fallback: try to build slug from name
      const slug = data.name?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      if (slug) {
        router.push(`/tours/${slug}`);
      } else {
        console.error("No slug or name for tour:", data);
      }
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Only navigate if clicking on card itself, not buttons
    const target = e.target as HTMLElement;
    if (target.tagName === "BUTTON" || target.closest("button")) {
      return;
    }
    handleViewDetail(e);
  };

  return (
    <div 
      className="w-full max-w-[320px] sm:max-w-[400px] cursor-pointer" 
      onClick={handleCardClick}
    >
      <Card
        className="overflow-hidden border-0 transition-all duration-300 group"
        style={{
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0,70,193,0.1)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(0,70,193,0.15)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 20px rgba(0,70,193,0.1)";
        }}
      >
        {/* Image */}
        <div className="relative h-36 sm:h-40 overflow-hidden">
          {image && !imgError ? (
            <img
              src={image}
              alt={data.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImgError(true)}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${PRIMARY}20, ${ACCENT}20)` }}
            >
              <MapPin className="w-10 h-10 opacity-30" style={{ color: PRIMARY }} />
            </div>
          )}

          {/* Category badge */}
          {data.category && (
            <span
              className="absolute top-2 left-2 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-white z-10"
              style={{
                background: `linear-gradient(135deg, ${PRIMARY}, ${ACCENT})`,
                borderRadius: "12px",
              }}
            >
              {data.category}
            </span>
          )}

          {/* Featured badge */}
          {data.is_featured && (
            <span
              className="absolute top-2 right-2 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-white z-10 flex items-center gap-0.5"
              style={{ backgroundColor: "#F59E0B", borderRadius: "4px" }}
            >
              <Star className="w-2.5 h-2.5 fill-white" />
              Nổi bật
            </span>
          )}

          {/* Discount badge */}
          {hasDiscount && (
            <span
              className="absolute bottom-2 right-2 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-white z-10"
              style={{ backgroundColor: "#FF3B30", borderRadius: "6px" }}
            >
              -{Math.round((1 - (data.discount_price || 0) / data.price) * 100)}%
            </span>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
          {/* Name */}
          <h4 className="font-bold text-[13px] sm:text-[14px] line-clamp-2 leading-tight" style={{ color: NAVY }}>
            {data.name}
          </h4>

          {/* Meta row */}
          <div className="flex items-center flex-wrap gap-2 sm:gap-3 text-[11px] sm:text-[12px]" style={{ color: GRAY }}>
            {data.destination && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: ACCENT }} />
                <span className="truncate max-w-[80px] sm:max-w-[100px]">{data.destination}</span>
              </span>
            )}
            {data.duration && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 flex-shrink-0" style={{ color: ACCENT }} />
                {data.duration}
              </span>
            )}
          </div>

          {/* Rating */}
          {(data.rating !== undefined || data.review_count !== undefined) && (
            <StarRating rating={data.rating || 0} count={data.review_count} />
          )}

          {/* Price + Actions */}
          <div className="flex items-end justify-between pt-1 border-t border-[#EEEEEE]">
            <div>
              <p className="text-[10px] sm:text-[11px]" style={{ color: GRAY }}>
                Từ
              </p>
              <PriceDisplay price={data.price} discount={data.discount_price} />
            </div>

            <div className="flex gap-1.5 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 sm:h-9 px-2 sm:px-3 text-[11px] sm:text-[12px] font-semibold"
                style={{
                  borderRadius: "10px",
                  border: `1px solid ${PRIMARY}30`,
                  color: PRIMARY,
                }}
                onClick={handleViewDetail}
              >
                Chi tiết
              </Button>
              <Button
                size="sm"
                className="h-8 sm:h-9 px-3 sm:px-4 text-[11px] sm:text-[12px] font-semibold text-white shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${ACCENT}, ${PRIMARY})`,
                  borderRadius: "10px",
                  border: "none",
                }}
                onClick={handleBook}
              >
                Đặt
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
