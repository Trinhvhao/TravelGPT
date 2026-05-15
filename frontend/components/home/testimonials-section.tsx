"use client";

import Image from "next/image";
import { TESTIMONIALS } from "@/data/home-data";
import { Star } from "lucide-react";

export default function TestimonialsSection() {
  return (
    <section className="py-24" style={{ backgroundColor: "#FFFFFF" }}>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span
            className="inline-block px-4 py-1.5 text-sm font-semibold mb-4"
            style={{
              backgroundColor: "#D9EEFF",
              color: "#0046C1",
              borderRadius: "12px",
            }}
          >
            Đánh giá
          </span>
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
            style={{ color: "#000E1A" }}
          >
            Khách hàng nói gì về chúng tôi
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "#4D4D4D" }}>
            Hơn 50,000+ khách hàng đã tin tưởng và trải nghiệm dịch vụ
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className="p-8 rounded-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-lg"
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #EBEBEB",
                boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                borderRadius: "24px",
              }}
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(t.rating)].map((_, j) => (
                  <Star key={j} className="w-5 h-5 fill-[#F8C700] text-[#F8C700]" />
                ))}
              </div>

              {/* Quote */}
              <div className="mb-6">
                <span className="text-5xl font-serif leading-none" style={{ color: "#0046C1", opacity: 0.2 }}>
                  "
                </span>
                <p className="text-base leading-relaxed italic" style={{ color: "#4D4D4D" }}>
                  {t.text}
                </p>
              </div>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    src={t.avatar}
                    alt={t.name}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: "#000E1A" }}>
                    {t.name}
                  </p>
                  <p className="text-xs" style={{ color: "#636363" }}>
                    {t.tour}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
