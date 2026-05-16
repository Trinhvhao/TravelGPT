"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import { tourApi } from "@/lib/tour-api";
import type { Tour } from "@/types";
import { Clock, TrendingDown } from "lucide-react";

const PRIMARY = "#0046C1";
const ACCENT = "#0391FF";
const RED = "#ED1D24";

// ─── Fake countdown ───────────────────────────────────────────────────────────────
function useCountdown() {
  const [hours, setHours] = useState(2);
  const [mins, setMins] = useState(37);

  useEffect(() => {
    const interval = setInterval(() => {
      setMins((m) => {
        if (m <= 0) {
          setHours((h) => (h > 0 ? h - 1 : 0));
          return 59;
        }
        return m - 1;
      });
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  return { hours, mins };
}

// ─── Deal Card ──────────────────────────────────────────────────────────────────
function DealCard({ tour }: { tour: Tour }) {
  const images = Array.isArray(tour.images) ? tour.images : [];
  const img = images[0] && typeof images[0] === "string"
    ? images[0] as string
    : "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=600";

  const displayPrice = tour.discount_price ?? tour.price;
  const originalPrice = Number(tour.price);
  const discount = originalPrice > 0 && displayPrice < originalPrice
    ? Math.round((1 - Number(displayPrice) / originalPrice) * 100)
    : 0;

  return (
    <Link href={`/tours/${tour.slug}`} className="group block flex-shrink-0 w-[240px]">
      <div className="bg-white rounded-2xl border border-[#EEEEEE] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        {/* Image */}
        <div className="relative h-36 overflow-hidden">
          <img
            src={img}
            alt={tour.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

          {/* Flash badge */}
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full text-white text-[11px] font-bold"
            style={{ backgroundColor: RED }}>
            <Clock className="w-3 h-3" />
            FLASH SALE
          </div>

          {/* Discount */}
          {discount > 0 && (
            <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-[#FF6B00] text-white text-[11px] font-bold">
              -{discount}%
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 space-y-2">
          <p className="text-[12px] text-[#636363] truncate">{tour.destination} · {tour.duration}</p>
          <h3 className="font-bold text-[13px] text-[#000E1A] line-clamp-2 leading-snug">
            {tour.name}
          </h3>

          {/* Prices */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-[16px] font-extrabold" style={{ color: PRIMARY }}>
              {formatPrice(displayPrice)}
            </span>
            <span className="text-[11px] text-[#636363]">/người</span>
          </div>
          {originalPrice > displayPrice && (
            <p className="text-[11px] text-[#636363] line-through">
              {formatPrice(originalPrice)}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────────
export function DealsSection() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const { hours, mins } = useCountdown();

  useEffect(() => {
    tourApi.listTours({ page_size: 20, sort_by: "rating", sort_order: "desc" })
      .then((res) => {
        // Filter tours that have discount
        const deals = (res.tours as Tour[]).filter(
          (t) => t.discount_price && Number(t.discount_price) < Number(t.price)
        );
        setTours(deals.slice(0, 6));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || tours.length === 0) return null;

  return (
    <section
      className="py-12"
      style={{ background: "linear-gradient(135deg, #000E1A 0%, #001B3D 100%)" }}
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-[#FF6B00]" />
              <span className="text-[13px] font-bold text-[#FF6B00]">Giảm giá</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white">Tour Flash Sale</h2>
          </div>

          {/* Countdown */}
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-white/60">Kết thúc sau</span>
            <div className="flex items-center gap-1">
              {[
                { v: hours, label: "giờ" },
                { v: mins, label: "phút" },
              ].map(({ v, label }) => (
                <div key={label} className="flex items-center gap-1">
                  <span
                    className="px-2 py-1 rounded-lg font-bold text-white text-sm"
                    style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                  >
                    {String(v).padStart(2, "0")}
                  </span>
                  <span className="text-white/60 text-sm">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable row */}
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {tours.map((tour) => (
            <DealCard key={tour.id} tour={tour} />
          ))}
        </div>
      </div>
    </section>
  );
}
