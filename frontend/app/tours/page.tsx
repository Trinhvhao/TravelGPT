"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { tourApi, type TourSearchParams } from "@/lib/tour-api";
import type { Region } from "@/types/tour";
import type { Tour } from "@/types";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { TourCardSkeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { DestinationShowcase } from "@/components/tour/destination-showcase";
import { DealsSection } from "@/components/tour/deals-section";
import { TestimonialsSection } from "@/components/tour/testimonials-section";
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  Star,
  Clock,
  MapPin,
  Sliders,
  Filter,
  ArrowRight,
  Zap,
  TrendingUp,
  Map,
  Award,
  Shield,
  Headphones,
  Heart,
  Users,
} from "lucide-react";

// ─── Design Tokens ──────────────────────────────────────────────────────────────
const PRIMARY = "#0046C1";
const ACCENT = "#0391FF";
const NAVY = "#000E1A";
const SURFACE = "#F7F7F7";
const BORDER = "#DDDDDD";

// ─── Region Options ──────────────────────────────────────────────────────────────
const REGIONS: { value: Region; label: string; icon: string }[] = [
  { value: "NORTH", label: "Miền Bắc", icon: "🏔️" },
  { value: "CENTRAL", label: "Miền Trung", icon: "🌊" },
  { value: "SOUTH", label: "Miền Nam", icon: "🏖️" },
  { value: "INTERNATIONAL", label: "Quốc tế", icon: "🌍" },
];

const CATEGORIES = [
  { value: "beach", label: "Biển", color: "#0391FF" },
  { value: "mountain", label: "Núi", color: "#77DD77" },
  { value: "city", label: "Thành phố", color: "#F8C700" },
  { value: "island", label: "Đảo", color: "#0046C1" },
  { value: "heritage", label: "Di sản", color: "#ED1D24" },
  { value: "adventure", label: "Mạo hiểm", color: "#FF6B35" },
  { value: "nature", label: "Thiên nhiên", color: "#2DC653" },
];

// ─── Why Us Section ─────────────────────────────────────────────────────────────
function WhyUsSection() {
  const items = [
    { icon: Map, value: "500+", label: "Tour du lịch", color: "#EDE9FE" },
    { icon: Users, value: "50K+", label: "Khách hàng", color: "#D9EEFF" },
    { icon: Star, value: "4.9/5", label: "Đánh giá TB", color: "#FEF3C7" },
    { icon: Headphones, value: "24/7", label: "Hỗ trợ", color: "#DCFCE7" },
  ];
  return (
    <section className="py-12 bg-white border-t border-b border-[#EEEEEE]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-[#F7F7F7] transition-colors">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                >
                  <Icon className="w-6 h-6" style={{ color: PRIMARY }} />
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-[#000E1A]">{item.value}</p>
                  <p className="text-[13px] text-[#636363]">{item.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Newsletter CTA ─────────────────────────────────────────────────────────────
function NewsletterCTA() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    setTimeout(() => { setEmail(""); setSubmitted(false); }, 3000);
  };

  return (
    <section
      className="py-16"
      style={{
        background: `linear-gradient(135deg, ${PRIMARY} 0%, ${ACCENT} 100%)`,
      }}
    >
      <div className="max-w-[600px] mx-auto px-4 text-center">
        <Heart className="w-10 h-10 text-white/80 mx-auto mb-4" />
        <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3">
          Nhận ưu đãi độc quyền
        </h2>
        <p className="text-white/80 mb-8 text-[15px]">
          Đăng ký email để nhận các deal hot, tour giảm giá và cập nhật điểm đến mới nhất.
        </p>
        {submitted ? (
          <div className="flex items-center justify-center gap-2 text-white font-bold text-lg">
            <Shield className="w-6 h-6" />
            Cảm ơn bạn! Đã đăng ký thành công.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email của bạn"
              className="flex-1 h-12 px-5 rounded-xl text-[15px] text-[#000E1A] placeholder:text-[#999999] focus:outline-none focus:ring-2 focus:ring-white/50"
              required
            />
            <button
              type="submit"
              className="h-12 px-6 rounded-xl bg-white text-[#0046C1] font-bold text-[14px] hover:bg-[#F7F7F7] transition-colors shadow-lg cursor-pointer whitespace-nowrap"
            >
              Đăng ký
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

// ─── Stats Bar ──────────────────────────────────────────────────────────────────
const STATS = [
  { value: "500+", label: "Tour du lịch", icon: Map },
  { value: "50K+", label: "Khách hàng", icon: Award },
  { value: "4.9", label: "Đánh giá TB", icon: Star },
  { value: "24/7", label: "Hỗ trợ", icon: Zap },
];

// ─── Sort Options ────────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: "rating_desc", label: "Đánh giá cao nhất", icon: Star },
  { value: "price_asc", label: "Giá: Thấp → Cao", icon: TrendingUp },
  { value: "price_desc", label: "Giá: Cao → Thấp", icon: TrendingUp },
  { value: "newest", label: "Mới nhất", icon: Zap },
];

// ─── Search Input ────────────────────────────────────────────────────────────────
function SearchInput({
  value,
  onChange,
  placeholder = "Tìm tour, điểm đến...",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#636363]" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full h-14 pl-14 pr-14 text-[16px] text-[#000E1A] placeholder:text-[#999999]",
          "bg-white border-2 border-[#DDDDDD]",
          "focus:outline-none focus:border-[#0046C1] focus:bg-white",
          "transition-all duration-200 rounded-2xl shadow-sm"
        )}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center bg-[#DDDDDD] hover:bg-[#999999] rounded-full transition-colors cursor-pointer"
        >
          <X className="w-3 h-3 text-white" />
        </button>
      )}
    </div>
  );
}

// ─── Sort Dropdown ──────────────────────────────────────────────────────────────
function SortDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = SORT_OPTIONS.find((o) => o.value === value);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-5 py-3 text-[14px] font-semibold rounded-xl border-2 border-[#DDDDDD] bg-white hover:border-[#0046C1] hover:bg-[#F7F7F7] transition-all cursor-pointer"
      >
        <Sliders className="w-4 h-4 text-[#0046C1]" />
        {current?.label}
        <ChevronDown className={cn("w-4 h-4 text-[#636363] transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 z-20 bg-white border border-[#DDDDDD] shadow-elevated rounded-xl py-2 min-w-[200px] animate-fade-in overflow-hidden"
          >
            {SORT_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-5 py-3 text-[14px] font-medium transition-colors cursor-pointer",
                    opt.value === value
                      ? "bg-[#D9EEFF] text-[#0046C1]"
                      : "text-[#636363] hover:bg-[#F7F7F7]"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Filter Chip ────────────────────────────────────────────────────────────────
function FilterChip({
  label,
  onRemove,
  color = "#0046C1",
}: {
  label: string;
  onRemove: () => void;
  color?: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-semibold rounded-full transition-colors"
      style={{ backgroundColor: "#D9EEFF", color, border: `1px solid ${color}` }}
    >
      {label}
      <button
        onClick={onRemove}
        className="w-4 h-4 flex items-center justify-center hover:bg-black/10 rounded-full transition-colors cursor-pointer"
        aria-label={`Remove ${label}`}
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

// ─── Category Filter Pills ──────────────────────────────────────────────────────
function CategoryFilters({
  active,
  onChange,
}: {
  active: string | undefined;
  onChange: (v: string | undefined) => void;
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
      <button
        onClick={() => onChange(undefined)}
        className={cn(
          "flex-shrink-0 px-5 py-2.5 text-[14px] font-semibold rounded-full border-2 transition-all cursor-pointer",
          !active
            ? "text-white border-white"
            : "text-[#636363] border-[#DDDDDD] bg-white hover:border-[#0046C1]"
        )}
        style={active ? {} : { backgroundColor: PRIMARY }}
      >
        Tất cả
      </button>
      {CATEGORIES.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onChange(active === cat.value ? undefined : cat.value)}
          className={cn(
            "flex-shrink-0 px-5 py-2.5 text-[14px] font-semibold rounded-full border-2 transition-all cursor-pointer",
            active === cat.value
              ? "text-white"
              : "text-[#636363] border-[#DDDDDD] bg-white hover:border-[#0046C1]"
          )}
          style={active === cat.value ? { backgroundColor: cat.color, borderColor: cat.color } : {}}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}

// ─── Tour Card ─────────────────────────────────────────────────────────────────
// Fallback images by destination type
const DESTINATION_FALLBACKS: Record<string, string[]> = {
  beach: [
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
    "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800",
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800",
  ],
  island: [
    "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800",
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
  ],
  mountain: [
    "https://images.unsplash.com/photo-1528181304800-259b08848526?w=800",
    "https://images.unsplash.com/photo-1597007064818-11d2395dc5df?w=800",
    "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800",
  ],
  city: [
    "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800",
    "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800",
    "https://images.unsplash.com/photo-1561626423-a51b45aef0a1?w=800",
  ],
  nature: [
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
    "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800",
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800",
  ],
};

function getFallbackImage(destination: string, category?: string): string {
  // Try category-based fallback first
  if (category) {
    const catLower = category.toLowerCase();
    if (catLower.includes("beach") || catLower.includes("biển")) {
      return DESTINATION_FALLBACKS.beach[0];
    }
    if (catLower.includes("island") || catLower.includes("đảo")) {
      return DESTINATION_FALLBACKS.island[0];
    }
    if (catLower.includes("mountain") || catLower.includes("núi")) {
      return DESTINATION_FALLBACKS.mountain[0];
    }
    if (catLower.includes("city") || catLower.includes("thành phố")) {
      return DESTINATION_FALLBACKS.city[0];
    }
    if (catLower.includes("nature") || catLower.includes("thiên nhiên")) {
      return DESTINATION_FALLBACKS.nature[0];
    }
  }

  // Try destination-based fallback
  const destLower = destination.toLowerCase();
  if (destLower.includes("phú quốc") || destLower.includes("côn đảo") || destLower.includes("con dao")) {
    return DESTINATION_FALLBACKS.island[0];
  }
  if (destLower.includes("nha trang") || destLower.includes("phan thiết") || destLower.includes("vũng tàu")) {
    return DESTINATION_FALLBACKS.beach[0];
  }
  if (destLower.includes("sapa") || destLower.includes("đà lạt")) {
    return DESTINATION_FALLBACKS.mountain[0];
  }
  if (destLower.includes("hội an") || destLower.includes("huế") || destLower.includes("đà nẵng")) {
    return DESTINATION_FALLBACKS.city[0];
  }

  // Default fallback
  return "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=600";
}

function TourCard({ tour }: { tour: Tour }) {
  const images = Array.isArray(tour.images) && tour.images.length > 0
    ? tour.images
    : [getFallbackImage(tour.destination, tour.category)];

  const firstImage = typeof images[0] === "string"
    ? images[0]
    : (images[0] as { url: string }).url;

  const displayPrice = tour.discount_price ?? tour.price;
  const hasDiscount = !!tour.discount_price && tour.discount_price < tour.price;
  const discountPct = hasDiscount ? Math.round((1 - tour.discount_price! / tour.price) * 100) : 0;

  return (
    <Link href={`/tours/${tour.slug}`} className="group block">
      <article
        className="h-full bg-white border border-[#EEEEEE] overflow-hidden rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
      >
        {/* Image Container */}
        <div className="relative overflow-hidden" style={{ aspectRatio: "16/10" }}>
          <img
            src={firstImage}
            alt={tour.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {tour.is_featured && (
              <span
                className="text-[11px] font-bold px-3 py-1 text-white rounded-full"
                style={{ backgroundColor: PRIMARY }}
              >
                ★ Nổi bật
              </span>
            )}
            {hasDiscount && (
              <span
                className="text-[11px] font-bold px-3 py-1 text-white rounded-full"
                style={{ backgroundColor: "#ED1D24" }}
              >
                -{discountPct}%
              </span>
            )}
          </div>

          {/* Rating */}
          {tour.rating > 0 && (
            <div
              className="absolute top-3 right-3 px-2.5 py-1 flex items-center gap-1 rounded-full text-[12px] font-bold text-white"
              style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
            >
              <Star className="w-3.5 h-3.5 text-[#F8C700] fill-[#F8C700]" />
              {Number(tour.rating).toFixed(1)}
            </div>
          )}

          {/* Quick actions overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <span
              className="px-6 py-3 text-white text-[14px] font-bold rounded-full shadow-lg translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
              style={{ backgroundColor: PRIMARY }}
            >
              Xem chi tiết
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          {/* Meta row */}
          <div className="flex items-center gap-4 text-[12px] text-[#636363]">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: PRIMARY }} />
              <span className="truncate">{tour.destination}</span>
            </span>
            <span className="flex items-center gap-1.5 flex-shrink-0">
              <Clock className="w-3.5 h-3.5" style={{ color: PRIMARY }} />
              {tour.duration}
            </span>
          </div>

          {/* Title */}
          <h3
            className="font-bold text-[15px] leading-snug text-[#000E1A] line-clamp-2 group-hover:text-[#0046C1] transition-colors duration-200 min-h-[40px]"
          >
            {tour.name}
          </h3>

          {/* Reviews */}
          {tour.review_count > 0 && (
              <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-3 h-3",
                      i < Math.round(Number(tour.rating)) ? "text-[#F8C700] fill-[#F8C700]" : "text-[#DDDDDD]"
                    )}
                  />
                ))}
              </div>
              <span className="text-[12px] text-[#636363]">
                {Number(tour.rating).toFixed(1)} ({tour.review_count.toLocaleString()} đánh giá)
              </span>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-[#EEEEEE]" />

          {/* Price */}
          <div>
            {hasDiscount && (
              <p className="text-[12px] text-[#636363] line-through mb-0.5">
                {formatPrice(tour.price)}
              </p>
            )}
            <div className="flex items-baseline gap-1">
              <span className="text-[20px] font-extrabold" style={{ color: PRIMARY }}>
                {formatPrice(displayPrice)}
              </span>
              <span className="text-[12px] text-[#636363]">/người</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

// ─── Featured Tour Card ────────────────────────────────────────────────────────
function FeaturedTourCard({ tour }: { tour: Tour }) {
  const images = Array.isArray(tour.images) && tour.images.length > 0
    ? tour.images
    : [getFallbackImage(tour.destination, tour.category)];

  const firstImage = typeof images[0] === "string"
    ? images[0]
    : (images[0] as { url: string }).url;

  const displayPrice = tour.discount_price ?? tour.price;
  const hasDiscount = !!tour.discount_price && tour.discount_price < tour.price;

  return (
    <Link href={`/tours/${tour.slug}`} className="group block">
      <div
        className="relative overflow-hidden rounded-2xl h-full min-h-[280px] cursor-pointer"
      >
        <img
          src={firstImage}
          alt={tour.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 absolute inset-0"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Badge */}
        <div className="absolute top-3 left-3">
          <span
            className="text-[11px] font-bold px-3 py-1 text-white rounded-full"
            style={{ backgroundColor: PRIMARY }}
          >
            ★ Nổi bật
          </span>
        </div>

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-center gap-2 text-white/80 text-[12px] mb-2">
            <MapPin className="w-3.5 h-3.5" />
            <span>{tour.destination}</span>
            <span>·</span>
            <Clock className="w-3.5 h-3.5" />
            <span>{tour.duration}</span>
          </div>
          <h3 className="font-bold text-white text-[16px] leading-snug line-clamp-2 mb-2">
            {tour.name}
          </h3>
          <div className="flex items-center justify-between">
            <div>
              {hasDiscount && (
                <p className="text-white/60 text-[12px] line-through">
                  {formatPrice(tour.price)}
                </p>
              )}
              <p className="text-[18px] font-extrabold text-white">
                {formatPrice(displayPrice)}
                <span className="text-[12px] font-normal text-white/70"> /người</span>
              </p>
            </div>
            <Button
              size="sm"
              className="h-9 px-4 text-[13px] font-bold text-white shadow-md"
              style={{ borderRadius: "10px", backgroundColor: ACCENT }}
            >
              Chi tiết
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Mobile Filter Drawer ────────────────────────────────────────────────────
function FilterDrawer({
  open,
  onClose,
  filters,
  onChange,
  onClear,
}: {
  open: boolean;
  onClose: () => void;
  filters: TourSearchParams;
  onChange: (f: Partial<TourSearchParams>) => void;
  onClear: () => void;
}) {
  const [local, setLocal] = useState(filters);
  useEffect(() => { setLocal(filters); }, [filters, open]);

  const apply = () => { onChange(local); onClose(); };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-modal flex flex-col">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative mt-auto bg-white rounded-t-3xl shadow-modal max-h-[85vh] flex flex-col overflow-hidden animate-slide-up"
      >
        <div className="flex items-center justify-between p-5 border-b border-[#EEEEEE]">
          <h3 className="font-bold text-[18px] text-[#000E1A]">Bộ lọc nâng cao</h3>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center bg-[#F7F7F7] hover:bg-[#DDDDDD] rounded-full transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-[#636363]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <div>
            <h4 className="text-[14px] font-bold text-[#000E1A] mb-3">Miền</h4>
            <div className="flex flex-wrap gap-2">
              {REGIONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setLocal((l) => ({ ...l, region: l.region === r.value ? undefined : r.value }))}
                  className={cn(
                    "px-4 py-2.5 text-[14px] font-semibold border-2 rounded-full transition-all cursor-pointer",
                    local.region === r.value
                      ? "text-white border-white"
                      : "text-[#636363] border-[#DDDDDD] bg-white hover:border-[#0046C1]"
                  )}
                  style={local.region === r.value ? { backgroundColor: PRIMARY, borderColor: PRIMARY } : {}}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[14px] font-bold text-[#000E1A] mb-3">Loại tour</h4>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setLocal((l) => ({ ...l, category: l.category === c.value ? undefined : c.value }))}
                  className={cn(
                    "px-4 py-2.5 text-[14px] font-semibold border-2 rounded-full transition-all cursor-pointer",
                    local.category === c.value
                      ? "text-white"
                      : "text-[#636363] border-[#DDDDDD] bg-white hover:border-[#0046C1]"
                  )}
                  style={local.category === c.value ? { backgroundColor: c.color, borderColor: c.color } : {}}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-[#EEEEEE] flex gap-3 bg-white">
          <Button
            variant="outline"
            className="flex-1 h-12 text-[14px] font-semibold"
            style={{ borderRadius: "12px" }}
            onClick={onClear}
          >
            Xóa lọc
          </Button>
          <Button
            className="flex-1 h-12 text-[14px] font-bold text-white"
            style={{ borderRadius: "12px", backgroundColor: PRIMARY }}
            onClick={apply}
          >
            Áp dụng
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
function SearchPageContent() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<TourSearchParams>({
    sort_by: "rating",
    sort_order: "desc",
    page: 1,
    page_size: 12,
  });

  const [sortBy, setSortBy] = useState("rating_desc");
  const [tours, setTours] = useState<Tour[]>([]);
  const [featuredTours, setFeaturedTours] = useState<Tour[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const fetchTours = useCallback(async (params: TourSearchParams) => {
    setLoading(true);
    try {
      const res = await tourApi.listTours(params);
      setTours(res.tours);
      setTotal(res.total);
      setPage(res.page);
      setTotalPages(res.total_pages);
    } catch {
      setTours([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFeatured = useCallback(async () => {
    try {
      const res = await tourApi.listTours({ is_featured: true, page_size: 3, sort_by: "rating", sort_order: "desc" });
      setFeaturedTours(res.tours);
    } catch {
      setFeaturedTours([]);
    }
  }, []);

  useEffect(() => { fetchFeatured(); }, [fetchFeatured]);

  useEffect(() => {
    const [sort_by, sort_order] = sortBy.split("_") as [TourSearchParams["sort_by"], TourSearchParams["sort_order"]];
    fetchTours({ ...filters, search: debouncedSearch || undefined, sort_by, sort_order, page: 1 });
  }, [filters, debouncedSearch, sortBy, fetchTours]);

  const activeFilters = [
    filters.region && REGIONS.find((r) => r.value === filters.region)?.label,
    filters.category && CATEGORIES.find((c) => c.value === filters.category)?.label,
  ].filter(Boolean) as string[];

  const hasActiveFilters = activeFilters.length > 0 || debouncedSearch;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: SURFACE }}>
      <Navbar />

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0046C1 0%, #0391FF 100%)" }}>
          {/* Decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-20" style={{ background: "linear-gradient(135deg, #FFFFFF, transparent)" }} />
            <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] rounded-full opacity-20" style={{ background: "linear-gradient(135deg, #77DD77, transparent)" }} />
            <div className="absolute top-1/4 left-1/4 w-5 h-5 rounded-full bg-white/20" />
            <div className="absolute top-1/3 right-1/3 w-3 h-3 rounded-full bg-white/15" />
            <div className="absolute bottom-1/4 right-1/4 w-4 h-4 rounded-full bg-white/20" />
            <div
              className="absolute inset-0 opacity-[0.05]"
              style={{
                backgroundImage: `linear-gradient(#FFFFFF 1px, transparent 1px), linear-gradient(90deg, #FFFFFF 1px, transparent 1px)`,
                backgroundSize: "60px 60px",
              }}
            />
          </div>

          <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 tracking-tight">
              Khám phá Tour Du lịch
            </h1>
            <p className="text-lg lg:text-xl text-white/80 max-w-xl mx-auto mb-8">
              Hơn 500+ tour du lịch trong và ngoài nước. Tìm kiếm và đặt tour dễ dàng cùng AI.
            </p>

            {/* Search bar */}
            <div className="max-w-2xl mx-auto">
              <SearchInput value={search} onChange={setSearch} placeholder="Tìm tour theo tên, điểm đến..." />
            </div>
          </div>
        </section>

        {/* ── Stats Bar ── */}
        <div className="bg-white border-b border-[#EEEEEE]">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[#EEEEEE]">
              {STATS.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={i} className="flex items-center justify-center gap-3 py-5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#D9EEFF" }}>
                      <Icon className="w-5 h-5" style={{ color: PRIMARY }} />
                    </div>
                    <div className="text-left">
                      <p className="font-extrabold text-[18px] text-[#000E1A]">{stat.value}</p>
                      <p className="text-[12px] text-[#636363]">{stat.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Destination Showcase ── */}
        <DestinationShowcase />

        {/* ── Deals Section ── */}
        <DealsSection />

        {/* ── Featured Tours ── */}
        {!loading && featuredTours.length > 0 && !hasActiveFilters && (
          <section className="py-12">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="w-5 h-5 fill-[#F8C700] text-[#F8C700]" />
                    <span className="text-[14px] font-bold" style={{ color: PRIMARY }}>Tour nổi bật</span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-[#000E1A]">Được yêu thích nhất</h2>
                </div>
                <Link href="/tours?is_featured=true" className="flex items-center gap-1 text-[14px] font-semibold hover:opacity-70 transition-opacity" style={{ color: PRIMARY }}>
                  Xem tất cả <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid md:grid-cols-3 gap-5">
                {featuredTours.map((tour) => (
                  <FeaturedTourCard key={tour.id} tour={tour} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Search Header ── */}
        <div className="bg-white border-b border-[#EEEEEE] sticky top-16 z-40 shadow-sm">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
            {/* Category filters */}
            <CategoryFilters
              active={filters.category}
              onChange={(v) => setFilters((f) => ({ ...f, category: v, page: 1 }))}
            />

            {/* Controls row */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <SortDropdown value={sortBy} onChange={setSortBy} />
                <button
                  onClick={() => setFilterOpen(true)}
                  className="flex items-center gap-2 px-5 py-3 text-[14px] font-semibold rounded-xl border-2 border-[#DDDDDD] bg-white hover:border-[#0046C1] hover:bg-[#F7F7F7] transition-all cursor-pointer md:hidden"
                >
                  <Filter className="w-4 h-4 text-[#636363]" />
                  Bộ lọc
                  {activeFilters.length > 0 && (
                    <span
                      className="w-5 h-5 text-[11px] font-bold text-white rounded-full flex items-center justify-center"
                      style={{ backgroundColor: PRIMARY }}
                    >
                      {activeFilters.length}
                    </span>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-3">
                {/* Desktop region chips */}
                <div className="hidden md:flex items-center gap-2">
                  {REGIONS.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setFilters((f) => ({ ...f, region: f.region === r.value ? undefined : r.value, page: 1 }))}
                      className={cn(
                        "px-4 py-2 text-[13px] font-semibold rounded-full border-2 transition-all cursor-pointer",
                        filters.region === r.value
                          ? "text-white"
                          : "text-[#636363] border-[#DDDDDD] bg-white hover:border-[#0046C1]"
                      )}
                      style={filters.region === r.value ? { backgroundColor: PRIMARY, borderColor: PRIMARY } : {}}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>

                <p className="text-[13px] text-[#636363] font-medium flex-shrink-0">
                  {loading ? "..." : total > 0 ? `${total.toLocaleString()} tour` : ""}
                </p>
              </div>
            </div>

            {/* Active filter chips */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {activeFilters.map((f) => (
                  <FilterChip
                    key={f}
                    label={f}
                    onRemove={() => {
                      if (REGIONS.find((r) => r.label === f)) setFilters((fl) => ({ ...fl, region: undefined, page: 1 }));
                      else setFilters((fl) => ({ ...fl, category: undefined, page: 1 }));
                    }}
                  />
                ))}
                {hasActiveFilters && (
                  <button
                    onClick={() => { setFilters({ sort_by: "rating", sort_order: "desc", page: 1, page_size: 12 }); setSearch(""); }}
                    className="text-[12px] text-[#636363] hover:text-[#ED1D24] transition-colors cursor-pointer underline"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Tour Grid ── */}
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 12 }).map((_, i) => (
                <TourCardSkeleton key={i} />
              ))}
            </div>
          ) : tours.length === 0 ? (
            <div className="py-20">
              <EmptyState
                icon={Search}
                title="Không tìm thấy tour nào"
                description="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                action={
                  <Button
                    variant="outline"
                    onClick={() => { setFilters({ sort_by: "rating", sort_order: "desc", page: 1, page_size: 12 }); setSearch(""); }}
                    style={{ borderRadius: "12px" }}
                  >
                    Xóa bộ lọc
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {tours.map((tour) => (
                  <TourCard key={tour.id} tour={tour} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  <button
                    onClick={() => setFilters((f) => ({ ...f, page: Math.max(1, f.page ? (Number(f.page) as number) - 1 : 1) }))}
                    disabled={page <= 1}
                    className="w-10 h-10 flex items-center justify-center rounded-xl border-2 border-[#DDDDDD] bg-white text-[14px] font-bold text-[#636363] hover:border-[#0046C1] hover:text-[#0046C1] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    ‹
                  </button>

                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    const p = i + 1;
                    const isActive = p === page;
                    return (
                      <button
                        key={p}
                        onClick={() => setFilters((f) => ({ ...f, page: p }))}
                        className="w-10 h-10 flex items-center justify-center rounded-xl text-[14px] font-bold transition-all cursor-pointer"
                        style={isActive
                          ? { backgroundColor: PRIMARY, color: "#FFFFFF", border: `2px solid ${PRIMARY}` }
                          : { backgroundColor: "#FFFFFF", color: "#636363", border: "2px solid #DDDDDD" }}
                      >
                        {p}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setFilters((f) => ({ ...f, page: Math.min(totalPages, f.page ? (Number(f.page) as number) + 1 : 2) }))}
                    disabled={page >= totalPages}
                    className="w-10 h-10 flex items-center justify-center rounded-xl border-2 border-[#DDDDDD] bg-white text-[14px] font-bold text-[#636363] hover:border-[#0046C1] hover:text-[#0046C1] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    ›
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <FilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        onChange={(f) => setFilters((prev) => ({ ...prev, ...f }))}
        onClear={() => { setFilters({ sort_by: "rating", sort_order: "desc", page: 1, page_size: 12 }); setSearch(""); }}
      />

      {/* ── Testimonials ── */}
      <TestimonialsSection />

      {/* ── Why Us ── */}
      <WhyUsSection />

      {/* ── Newsletter CTA ── */}
      <NewsletterCTA />

      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: SURFACE }}>
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-[#636363]">Đang tải tours...</p>
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
