"use client";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import { Star, MapPin, Clock, ArrowRight } from "lucide-react";
import type { Tour } from "@/types";
import { Button } from "@/components/ui/button";

// ─── Design Tokens (Airbnb Style) ──────────────────────────────────────────────
const PRIMARY = "#0046C1";
const ACCENT = "#0391FF";
const SURFACE_LIGHT = "#D9EEFF";
const NAVY = "#000E1A";
const GRAY = "#636363";

// Fallback images by destination
const FALLBACK_IMAGES: Record<string, string[]> = {
  beach: [
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
    "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800",
  ],
  island: [
    "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800",
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800",
  ],
  mountain: [
    "https://images.unsplash.com/photo-1528181304800-259b08848526?w=800",
    "https://images.unsplash.com/photo-1597007064818-11d2395dc5df?w=800",
  ],
  city: [
    "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800",
    "https://images.unsplash.com/photo-1561626423-a51b45aef0a1?w=800",
  ],
  default: [
    "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
  ],
};

function getSmartFallback(destination: string): string {
  const dest = destination.toLowerCase();
  if (dest.includes("phú quốc") || dest.includes("côn đảo") || dest.includes("con dao")) {
    return FALLBACK_IMAGES.island[0];
  }
  if (dest.includes("nha trang") || dest.includes("phan thiết") || dest.includes("vũng tàu")) {
    return FALLBACK_IMAGES.beach[0];
  }
  if (dest.includes("sapa") || dest.includes("đà lạt")) {
    return FALLBACK_IMAGES.mountain[0];
  }
  if (dest.includes("hội an") || dest.includes("huế") || dest.includes("đà nẵng")) {
    return FALLBACK_IMAGES.city[0];
  }
  return FALLBACK_IMAGES.default[0];
}

interface TourResultCardProps {
  tour: Tour;
  onBook?: (tour: Tour) => void;
  className?: string;
}

export function TourResultCard({ tour, onBook, className }: TourResultCardProps) {
  const fallbackImage = getSmartFallback(tour.destination);
  const image = Array.isArray(tour.images) && tour.images.length > 0
    ? (typeof tour.images[0] === "string" ? tour.images[0] : (tour.images[0] as { url: string }).url)
    : fallbackImage;

  const displayPrice = tour.discount_price ?? tour.price;

  return (
    <div className={cn(
      "flex gap-4 p-4 transition-all duration-300 cursor-pointer",
      className
    )}
    style={{
      backgroundColor: "#FFFFFF",
      borderRadius: "16px",
      boxShadow: "0 4px 20px rgba(0,70,193,0.1)",
      border: `1px solid ${SURFACE_LIGHT}`,
    }}
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
      (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 30px rgba(0,70,193,0.18)";
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
      (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 20px rgba(0,70,193,0.1)";
    }}
    >
      {/* Thumbnail */}
      <Link
        href={`/tours/${tour.slug}`}
        className="relative w-24 h-20 rounded-xl overflow-hidden flex-shrink-0"
      >
        <Image
          src={image}
          alt={tour.name}
          fill
          className="object-cover"
          sizes="96px"
        />
        {tour.is_featured && (
          <span
            className="absolute top-1 left-1 px-2 py-0.5 text-[10px] font-bold text-white"
            style={{
              backgroundColor: PRIMARY,
              borderRadius: "8px",
            }}
          >
            Nổi bật
          </span>
        )}
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-2">
        <Link href={`/tours/${tour.slug}`} className="block">
          <p
            className="font-bold text-[15px] line-clamp-1 hover:opacity-80 transition-opacity"
            style={{ color: NAVY }}
          >
            {tour.name}
          </p>
        </Link>
        <p
          className="flex items-center gap-1.5 text-[12px]"
          style={{ color: GRAY }}
        >
          <MapPin className="w-3.5 h-3.5" style={{ color: ACCENT }} />
          {tour.destination}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[12px]" style={{ color: GRAY }}>
            {tour.rating > 0 && (
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-[#F8C700] text-[#F8C700]" />
                <span className="font-semibold" style={{ color: NAVY }}>
                  {tour.rating.toFixed(1)}
                </span>
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" style={{ color: ACCENT }} />
              {tour.duration}
            </span>
          </div>
          <div className="text-right">
            <span
              className="font-bold text-[16px]"
              style={{ color: PRIMARY }}
            >
              {formatPrice(displayPrice)}
            </span>
            <span className="text-[11px] ml-1" style={{ color: GRAY }}>/người</span>
          </div>
        </div>
      </div>

      {/* Quick book */}
      {onBook && (
        <Button
          size="sm"
          className="self-center h-9 px-4 text-[13px] font-semibold text-white shadow-md transition-all"
          style={{
            background: `linear-gradient(135deg, ${ACCENT}, ${PRIMARY})`,
            borderRadius: "12px",
            border: "none",
          }}
          onClick={() => onBook(tour)}
        >
          Đặt ngay
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      )}
    </div>
  );
}
