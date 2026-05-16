"use client";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";

const PRIMARY = "#0046C1";
const ACCENT = "#0391FF";

// ─── Testimonial data ─────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    id: 1,
    name: "Trần Thị Lan",
    avatar: "TTL",
    tour: "Tour Đà Nẵng 3N2Đ",
    rating: 5,
    comment: "Tôi đã đi tour Đà Nẵng cùng gia đình, mọi thứ đều tuyệt vời! Đặc biệt là Bà Nà Hills, cảnh đẹp không tưởng. HDV rất nhiệt tình và chu đáo. Sẽ quay lại với TravelGPT!",
    location: "TP. Hồ Chí Minh",
    color: "from-[#0046C1] to-[#0391FF]",
  },
  {
    id: 2,
    name: "Nguyễn Hoàng Dũng",
    avatar: "NHD",
    tour: "Tour Phú Quốc 4N3Đ",
    rating: 5,
    comment: "Tour Phú Quốc vừa rồi là trải nghiệm tuyệt vời nhất của tôi năm nay. Bãi Sao đẹp quá, nước trong veo. Đặt qua TravelGPT rất tiện lợi, AI hỗ trợ nhanh chóng.",
    location: "Hà Nội",
    color: "from-[#0391FF] to-[#00B4D8]",
  },
  {
    id: 3,
    name: "Lê Minh Thư",
    avatar: "LMT",
    tour: "Tour Bangkok - Pattaya 4N3Đ",
    rating: 5,
    comment: "AI của TravelGPT giúp tôi chọn được tour phù hợp với ngân sách. Cung điện Hoàng gia Thái Lan đẹp mê hồn! Đội ngũ hỗ trợ 24/7 luôn sẵn sàng giúp đỡ khi cần.",
    location: "Đà Nẵng",
    color: "from-[#F59E0B] to-[#F97316]",
  },
  {
    id: 4,
    name: "Phạm Thu Hà",
    avatar: "PTH",
    tour: "Tour Hạ Long 2N1Đ",
    rating: 4,
    comment: "Vịnh Hạ Long đẹp từng centimet. Du thuyền sang trọng, thức ăn ngon. Đặt tour online lần đầu và rất hài lòng. TravelGPT xứng đáng 5 sao!",
    location: "Hải Phòng",
    color: "from-[#22C55E] to-[#16A34A]",
  },
  {
    id: 5,
    name: "Hoàng Đức Anh",
    avatar: "HĐA",
    tour: "Tour Bali 4N3Đ",
    rating: 5,
    comment: "Bali trong mơ! Đền tháp, bãi biển, ẩm thực — tất cả đều hoàn hảo. AI chat thật sự thông minh, gợi ý chính xác những gì tôi cần.",
    location: "TP. Hồ Chí Minh",
    color: "from-[#8B5CF6] to-[#7C3AED]",
  },
];

// ─── Testimonial Card ────────────────────────────────────────────────────────
function TestimonialCard({ t }: { t: (typeof TESTIMONIALS)[0] }) {
  return (
    <div className="flex-shrink-0 w-[320px]">
      <div className="bg-white rounded-2xl border border-[#EEEEEE] p-6 shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col">
        {/* Stars */}
        <div className="flex gap-1 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                "w-4 h-4",
                i < t.rating ? "text-[#F59E0B] fill-[#F59E0B]" : "text-[#DDDDDD]"
              )}
            />
          ))}
        </div>

        {/* Quote */}
        <div className="flex-1">
          <Quote className="w-6 h-6 mb-3 opacity-20" style={{ color: PRIMARY }} />
          <p className="text-[14px] text-[#4B5563] leading-relaxed line-clamp-4">
            "{t.comment}"
          </p>
        </div>

        {/* Author */}
        <div className="flex items-center gap-3 mt-5 pt-4 border-t border-[#F3F4F6]">
          <div
            className={cn(
              "w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0",
              t.color
            )}
          >
            {t.avatar}
          </div>
          <div>
            <p className="font-bold text-[14px] text-[#000E1A]">{t.name}</p>
            <p className="text-[12px] text-[#636363]">{t.tour} · {t.location}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function TestimonialsSection() {
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAutoplay = () => {
    autoplayRef.current = setInterval(() => {
      setActiveIdx((i) => (i + 1) % TESTIMONIALS.length);
    }, 4000);
  };

  const stopAutoplay = () => {
    if (autoplayRef.current) clearInterval(autoplayRef.current);
  };

  useEffect(() => {
    startAutoplay();
    return () => stopAutoplay();
  }, []);

  const scrollTo = (idx: number) => {
    setActiveIdx(idx);
    stopAutoplay();
    startAutoplay();
  };

  const prev = () => scrollTo((activeIdx - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  const next = () => scrollTo((activeIdx + 1) % TESTIMONIALS.length);

  return (
    <section className="py-14 bg-[#F7F7F7]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-2">
            <Star className="w-5 h-5 text-[#F59E0B] fill-[#F59E0B]" />
            <span className="text-[13px] font-bold text-[#F59E0B]">Cảm nhận</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#000E1A]">
            Khách hàng nói gì về chúng tôi
          </h2>
          <p className="text-[#636363] mt-2 max-w-lg mx-auto">
            Hơn 50,000+ khách hàng đã tin tưởng TravelGPT cho chuyến đi của mình
          </p>
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* Nav buttons */}
          <button
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg border border-[#DDDDDD] flex items-center justify-center hover:bg-[#F7F7F7] transition-colors cursor-pointer"
            aria-label="Trước"
          >
            <ChevronLeft className="w-5 h-5 text-[#636363]" />
          </button>
          <button
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg border border-[#DDDDDD] flex items-center justify-center hover:bg-[#F7F7F7] transition-colors cursor-pointer"
            aria-label="Sau"
          >
            <ChevronRight className="w-5 h-5 text-[#636363]" />
          </button>

          {/* Cards */}
          <div
            ref={scrollRef}
            className="overflow-hidden mx-12"
          >
            <div
              className="flex gap-5 transition-transform duration-500"
              style={{ transform: `translateX(0)` }}
            >
              {/* Show 3 cards centered: active + prev + next */}
              {TESTIMONIALS.map((t, idx) => (
                <div
                  key={t.id}
                  className={cn(
                    "transition-all duration-500",
                    idx === activeIdx ? "opacity-100 scale-100" : "opacity-40 scale-95"
                  )}
                  onClick={() => scrollTo(idx)}
                  style={{ cursor: "pointer" }}
                >
                  <TestimonialCard t={t} />
                </div>
              ))}
            </div>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {TESTIMONIALS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => scrollTo(idx)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  idx === activeIdx
                    ? "w-8 bg-[#0046C1]"
                    : "w-2 bg-[#DDDDDD] hover:bg-[#999999]"
                )}
                aria-label={`Đánh giá ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
