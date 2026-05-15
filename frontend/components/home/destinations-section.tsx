"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { DESTINATIONS } from "@/data/home-data";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import { Globe, Star, Heart } from "lucide-react";

export default function DestinationsSection() {
  const [activeFilter, setActiveFilter] = useState(0);

  const filters = ["Tất cả", "Miền Bắc", "Miền Trung", "Miền Nam"];

  const filtered =
    activeFilter === 0
      ? DESTINATIONS
      : DESTINATIONS.filter((d) => d.region === filters[activeFilter]);

  return (
    <section className="py-16" style={{ backgroundColor: "#FFFFFF" }}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "#0046C1" }}
            >
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span
              className="px-4 py-1.5 text-sm font-semibold"
              style={{
                backgroundColor: "#D9EEFF",
                color: "#0046C1",
                borderRadius: "50px",
              }}
            >
              Khám phá
            </span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold" style={{ color: "#000E1A" }}>
                Điểm đến phổ biến
              </h2>
              <p className="mt-2" style={{ color: "#636363" }}>
                Hơn{" "}
                <span className="font-bold" style={{ color: "#0046C1" }}>
                  500+
                </span>{" "}
                tour đến các điểm đến tuyệt vời
              </p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
          {filters.map((filter, idx) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(idx)}
              className={cn(
                "px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200",
                idx === activeFilter ? "text-white" : "hover:opacity-80"
              )}
              style={{
                backgroundColor: idx === activeFilter ? "#0046C1" : "#F1F1F1",
                color: idx === activeFilter ? "#FFFFFF" : "#4D4D4D",
              }}
            >
              {filter}
            </button>
          ))}
          <Link
            href="/tours"
            className="ml-auto flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 hover:opacity-80"
            style={{ backgroundColor: "#F1F1F1", color: "#4D4D4D" }}
          >
            Bộ lọc
            <span>⚙</span>
          </Link>
        </div>

        {/* Destinations Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((dest) => (
            <Link
              key={dest.name}
              href={`/tours?destination=${encodeURIComponent(dest.name)}`}
              className="group block"
            >
              <div
                className="h-full overflow-hidden cursor-pointer"
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "16px",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.12)";
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={dest.image}
                    alt={dest.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <button
                    className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-all hover:scale-110"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <Heart className="w-4 h-4" style={{ color: "#FF385C", fill: "#FF385C" }} />
                  </button>
                  <div
                    className="absolute top-3 left-3 px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.95)",
                      backdropFilter: "blur(8px)",
                      color: "#0046C1",
                      borderRadius: "8px",
                    }}
                  >
                    <span>{dest.tag}</span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="text-base font-bold leading-tight" style={{ color: "#000E1A" }}>
                        {dest.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span>📍</span>
                        <span className="text-xs" style={{ color: "#767676" }}>
                          {dest.region}
                        </span>
                      </div>
                    </div>
                    <div
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold"
                      style={{ backgroundColor: "#003580", color: "#FFFFFF" }}
                    >
                    <Star className="w-3.5 h-3.5 text-[#F8C700] fill-[#F8C700]" />
                      <span>{dest.rating}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-semibold" style={{ color: "#0046C1" }}>
                      {dest.tours} tours
                    </span>
                    <span className="text-xs" style={{ color: "#767676" }}>
                      có sẵn
                    </span>
                  </div>

                  <div className="pt-3 border-t" style={{ borderColor: "#EBEBEB" }}>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs" style={{ color: "#717171" }}>
                        Từ
                      </span>
                      <span className="text-lg font-bold" style={{ color: "#000E1A" }}>
                        {formatPrice(1500000)}
                      </span>
                      <span className="text-xs" style={{ color: "#717171" }}>
                        /người
                      </span>
                    </div>
                  </div>

                  <button
                    className="w-full mt-3 py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:opacity-90"
                    style={{ backgroundColor: "#FF695C" }}
                  >
                    Đặt ngay
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
