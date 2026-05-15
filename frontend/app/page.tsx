"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import {
  Bot,
  MessageSquare,
  Search,
  Map,
  Users,
  Star,
  Mail,
  ArrowRight,
  Zap,
} from "lucide-react";

// Lazy-load all below-fold sections
const StatsSection = dynamic(() => import("@/components/home/stats-section"), {
  loading: () => <div className="py-16" />,
});
const HowItWorksSection = dynamic(() => import("@/components/home/how-it-works-section"), {
  loading: () => <div className="py-20" />,
});
const FeaturesSection = dynamic(() => import("@/components/home/features-section"), {
  loading: () => <div className="py-24" />,
});
const DestinationsSection = dynamic(() => import("@/components/home/destinations-section"), {
  loading: () => <div className="py-16" />,
});
const TestimonialsSection = dynamic(() => import("@/components/home/testimonials-section"), {
  loading: () => <div className="py-20" />,
});

// Design tokens
const COLORS = {
  primary: "#0046C1",
  accent: "#0391FF",
  navy: "#000E1A",
  surface: "#F7F7F7",
  surfaceLight: "#D9EEFF",
};

// ─── Typing Indicator ──────────────────────────────────────────────────────────
function TypingIndicator({ texts }: { texts: string[] }) {
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState("");

  useEffect(() => {
    let idx = 0;
    let timeout: ReturnType<typeof setTimeout>;
    const type = () => {
      if (idx <= texts[current].length) {
        setVisible(texts[current].slice(0, idx++));
        timeout = setTimeout(type, 40);
      } else {
        timeout = setTimeout(() => {
          setCurrent((c) => (c + 1) % texts.length);
          idx = 0;
        }, 2000);
      }
    };
    timeout = setTimeout(type, 500);
    return () => clearTimeout(timeout);
  }, [current, texts]);

  return (
    <span className="inline">
      {visible}
      <span className="animate-blink" style={{ color: "#0391FF" }}>
        |
      </span>
    </span>
  );
}

// ─── Main Landing Page ─────────────────────────────────────────────────────────
export default function HomePage() {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    setLoaded(true);
  }, []);

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      alert(`Cảm ơn bạn! Chúng tôi sẽ gửi tin tức đến ${email}`);
      setEmail("");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="flex-1">
        {/* ── HERO (above fold — loads immediately) ── */}
        <section
          className="relative min-h-[100vh] flex items-center overflow-hidden"
          style={{ backgroundColor: "#FFFFFF" }}
        >
          {/* Background */}
          <div className="absolute inset-0 overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(135deg, #F0F7FF 0%, #E8F4FF 50%, #FFFFFF 100%)",
              }}
            />
            <div
              className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-40"
              style={{ background: "linear-gradient(135deg, #D9EEFF 0%, #0046C1 100%)" }}
            />
            <div
              className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full opacity-30"
              style={{ background: "linear-gradient(135deg, #0391FF 0%, #77DD77 100%)" }}
            />
            <div className="absolute top-1/4 left-1/4 w-4 h-4 rounded-full" style={{ backgroundColor: "#0046C1" }} />
            <div className="absolute top-1/3 right-1/3 w-3 h-3 rounded-full" style={{ backgroundColor: "#0391FF" }} />
            <div className="absolute bottom-1/4 right-1/4 w-5 h-5 rounded-full" style={{ backgroundColor: "#77DD77" }} />
            <div className="absolute top-1/2 left-1/6 w-2 h-2 rounded-full" style={{ backgroundColor: "#F8C700" }} />
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `linear-gradient(#0046C1 1px, transparent 1px), linear-gradient(90deg, #0046C1 1px, transparent 1px)`,
                backgroundSize: "60px 60px",
              }}
            />
          </div>

          <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left: Content */}
              <div className="space-y-10">
                {/* Animated Badge */}
                <div
                  className={cn(
                    "inline-flex items-center gap-3 px-5 py-2.5 animate-fade-in-up",
                    loaded && "opacity-100"
                  )}
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "2px solid #0046C1",
                    borderRadius: "50px",
                    boxShadow: "0 4px 20px rgba(0,70,193,0.15)",
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: "#0046C1" }}
                  >
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold text-sm" style={{ color: "#0046C1" }}>
                    AI Travel Agent — Powered by Claude
                  </span>
                </div>

                {/* Headline */}
                <h1
                  className={cn(
                    "text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight animate-fade-in-up",
                    loaded && "opacity-100"
                  )}
                  style={{ animationDelay: "100ms" }}
                >
                  <span style={{ color: "#000E1A" }}>Du lịch thông minh</span>
                  <br />
                  <span
                    className="bg-clip-text text-transparent"
                    style={{
                      backgroundImage: "linear-gradient(135deg, #0046C1 0%, #0391FF 50%, #0046C1 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    cùng AI
                  </span>
                </h1>

                {/* Sub headline */}
                <p
                  className={cn(
                    "text-xl md:text-2xl leading-relaxed max-w-xl animate-fade-in-up",
                    loaded && "opacity-100"
                  )}
                  style={{ color: "#636363", animationDelay: "200ms" }}
                >
                  Chỉ cần trò chuyện — AI sẽ tìm tour hoàn hảo, đặt ngay trong chat.
                  Không cần lướt hàng trăm trang web.
                </p>

                {/* CTAs */}
                <div
                  className={cn(
                    "flex flex-col sm:flex-row gap-5 animate-fade-in-up",
                    loaded && "opacity-100"
                  )}
                  style={{ animationDelay: "300ms" }}
                >
                  <button
                    className="group flex items-center justify-center gap-3 h-16 px-10 text-lg font-bold transition-all duration-300 cursor-pointer"
                    style={{
                      backgroundColor: "#0046C1",
                      color: "#FFFFFF",
                      borderRadius: "16px",
                      border: "none",
                      boxShadow: "0 8px 32px rgba(0,70,193,0.35)",
                    }}
                    onClick={() => router.push("/chat")}
                  >
                    <MessageSquare className="w-5 h-5" />
                    Bắt đầu trò chuyện
                    <span className="transition-transform group-hover:translate-x-2">→</span>
                  </button>

                  <button
                    className="group flex items-center justify-center gap-3 h-16 px-10 text-lg font-bold transition-all duration-300 cursor-pointer"
                    style={{
                      backgroundColor: "#FFFFFF",
                      color: "#0046C1",
                      borderRadius: "16px",
                      border: "2px solid #0046C1",
                    }}
                    onClick={() => router.push("/tours")}
                  >
                    <Search className="w-5 h-5" />
                    Khám phá tour
                  </button>
                </div>

                {/* Social proof */}
                <div
                  className={cn(
                    "flex items-center gap-8 animate-fade-in-up",
                    loaded && "opacity-100"
                  )}
                  style={{ animationDelay: "400ms" }}
                >
                  <div className="flex items-center -space-x-4">
                    {[
                      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=40&q=80",
                      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&q=80",
                      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&q=80",
                    ].map((src, i) => (
                      <div
                        key={i}
                        className="w-14 h-14 rounded-full border-4 overflow-hidden"
                        style={{ borderColor: "#FFFFFF", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
                      >
                        <Image src={src} alt="" width={56} height={56} className="object-cover" />
                      </div>
                    ))}
                    <div
                      className="w-14 h-14 rounded-full border-4 flex items-center justify-center text-sm font-bold"
                      style={{
                        borderColor: "#FFFFFF",
                        backgroundColor: "#0046C1",
                        color: "#FFFFFF",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      }}
                    >
                      50K+
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-[#F8C700] text-[#F8C700]" />
                      ))}
                    </div>
                    <p style={{ color: "#636363" }}>
                      <span className="font-bold" style={{ color: "#000E1A" }}>
                        50,000+
                      </span>{" "}
                      khách hàng tin tưởng
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: Bento Grid Cards */}
              <div
                className={cn(
                  "hidden lg:grid grid-cols-3 gap-4 animate-fade-in-up",
                  loaded && "opacity-100"
                )}
                style={{ animationDelay: "200ms" }}
              >
                {/* Large AI Chat Card */}
                <div
                  className="col-span-2 overflow-hidden"
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "24px",
                    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)",
                    border: "1px solid #E8F4FF",
                  }}
                >
                  <div
                    className="px-6 py-5 flex items-center gap-4"
                    style={{ backgroundColor: "#0046C1" }}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: "#FFFFFF" }}
                    >
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-lg">TravelGPT</p>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-white/80 text-sm">Đang trực tuyến</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <div
                      className="px-5 py-4 text-sm leading-relaxed"
                      style={{
                        backgroundColor: "#F7F7F7",
                        color: "#000E1A",
                        borderRadius: "16px 16px 16px 4px",
                      }}
                    >
                      <TypingIndicator
                        texts={[
                          "Tôi gợi ý tour Đà Nẵng 4N3Đ với giá chỉ từ 2.5 triệu/người. Bạn muốn tìm hiểu thêm không?",
                          "Tour Phú Quốc đang có khuyến mãi giảm 15%. Tôi đặt cho bạn nhé?",
                          "Tôi nhớ bạn thích tour nghỉ dưỡng biển. Đây là 3 gợi ý hàng đầu hôm nay!",
                        ]}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {["Đà Nẵng", "Phú Quốc", "Nha Trang"].map((place) => (
                        <button
                          key={place}
                          className="px-4 py-2 text-sm font-semibold transition-all duration-200 cursor-pointer"
                          style={{
                            backgroundColor: "#D9EEFF",
                            color: "#0046C1",
                            borderRadius: "12px",
                            border: "none",
                          }}
                        >
                          {place}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right column — stacked cards */}
                <div className="space-y-4">
                  <div
                    className="p-5 text-center"
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: "20px",
                      boxShadow: "0 10px 30px -5px rgba(0,0,0,0.1)",
                      border: "1px solid #E8F4FF",
                    }}
                  >
                    <div
                      className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: "#D9EEFF" }}
                    >
                      <Map className="w-6 h-6" style={{ color: "#0046C1" }} />
                    </div>
                    <p className="text-3xl font-bold" style={{ color: "#000E1A" }}>
                      500+
                    </p>
                    <p className="text-sm" style={{ color: "#636363" }}>
                      Tour du lịch
                    </p>
                  </div>

                  <div
                    className="p-5 text-center"
                    style={{
                      backgroundColor: "#0046C1",
                      borderRadius: "20px",
                      boxShadow: "0 10px 30px -5px rgba(0,70,193,0.3)",
                    }}
                  >
                    <div
                      className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                    >
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-3xl font-bold text-white">50K+</p>
                    <p className="text-sm text-white/80">Khách hàng</p>
                  </div>
                </div>

                {/* Bottom featured card */}
                <div
                  className="col-span-3 p-5 flex items-center justify-between"
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "20px",
                    boxShadow: "0 10px 30px -5px rgba(0,0,0,0.1)",
                    border: "1px solid #E8F4FF",
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden">
                      <Image
                        src="https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=100&q=80"
                        alt="Đà Nẵng"
                        width={56}
                        height={56}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div>
                      <p className="font-bold" style={{ color: "#000E1A" }}>
                        Tour nổi bật
                      </p>
                      <p style={{ color: "#636363" }}>Đà Nẵng - Hội An 4N3Đ</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold" style={{ color: "#0046C1" }}>
                        {formatPrice(2500000)}
                      </p>
                      <p className="text-sm" style={{ color: "#636363" }}>
                        /người
                      </p>
                    </div>
                    <button
                      className="px-5 py-3 text-sm font-semibold text-white transition-all cursor-pointer"
                      style={{
                        backgroundColor: "#0391FF",
                        borderRadius: "12px",
                        border: "none",
                      }}
                    >
                      Đặt ngay
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <div
              className="w-10 h-16 rounded-full flex items-start justify-center p-2"
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "20px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                border: "1px solid #E8F4FF",
              }}
            >
              <div className="w-2 h-3 rounded-full animate-pulse" style={{ backgroundColor: "#0046C1" }} />
            </div>
          </div>
        </section>

        {/* ── STATS (lazy) ── */}
        <StatsSection />

        {/* ── HOW IT WORKS (lazy) ── */}
        <HowItWorksSection />

        {/* ── FEATURES (lazy) ── */}
        <FeaturesSection />

        {/* ── DESTINATIONS (lazy) ── */}
        <DestinationsSection />

        {/* ── AI CHAT PREVIEW ── */}
        <section
          className="py-16 lg:py-20 overflow-hidden relative"
          style={{ backgroundColor: "#0046C1" }}
        >
          <div className="absolute inset-0 overflow-hidden">
            <div
              className="absolute top-0 left-0 w-[400px] h-[400px] rounded-full -translate-x-1/2 -translate-y-1/2"
              style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
            />
            <div
              className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full translate-x-1/2 translate-y-1/2"
              style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
            />
          </div>

          <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Left: Content */}
              <div className="text-white space-y-6">
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.15)",
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  <Bot className="w-4 h-4" />
                  <span>AI Chat Interface</span>
                </div>

                <div className="space-y-3">
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                    Trò chuyện với AI —
                    <br />
                    <span style={{ color: "#D9EEFF" }}>ĐẶT tour trong vài phút</span>
                  </h2>
                  <p className="text-base md:text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.8)" }}>
                    Chỉ cần nói những gì bạn muốn. AI sẽ hiểu, tìm kiếm, và đặt tour phù hợp — không cần rời
                    khỏi cuộc trò chuyện.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    className="group flex items-center justify-center gap-2 h-12 px-6 text-sm font-bold transition-all duration-300 cursor-pointer"
                    style={{
                      backgroundColor: "#FFFFFF",
                      color: "#0046C1",
                      borderRadius: "12px",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                    }}
                    onClick={() => router.push("/chat")}
                  >
                    <MessageSquare className="w-4 h-4" />
                    Bắt đầu trò chuyện ngay
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                  <button
                    className="group flex items-center justify-center gap-2 h-12 px-6 text-sm font-semibold transition-all duration-300 cursor-pointer"
                    style={{
                      backgroundColor: "transparent",
                      color: "#FFFFFF",
                      borderRadius: "12px",
                      border: "1px solid rgba(255,255,255,0.4)",
                    }}
                    onClick={() => router.push("/tours")}
                  >
                    <Search className="w-4 h-4" />
                    Tự tìm kiếm tour
                  </button>
                </div>
              </div>

              {/* Right: Chat Interface Preview */}
              <div className="relative">
                <div
                  className="relative overflow-hidden"
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "20px",
                    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
                  }}
                >
                  <div
                    className="flex items-center justify-between px-5 py-4"
                    style={{ background: "linear-gradient(135deg, #0046C1, #0391FF)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                        >
                          <Bot className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div>
                        <p className="font-bold text-white">TravelGPT</p>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
                          Đang trực tuyến
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#77DD77" }} />
                      <span className="text-xs text-white/80">Online</span>
                    </div>
                  </div>

                  <div className="p-5 space-y-4" style={{ backgroundColor: "#F7F7F7" }}>
                    <div className="flex gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: "#0046C1" }}
                      >
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <div
                          className="px-4 py-3 text-sm leading-relaxed"
                          style={{
                            backgroundColor: "#FFFFFF",
                            color: "#000E1A",
                            borderRadius: "16px 16px 16px 4px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                          }}
                        >
                          Xin chào! Tôi là TravelGPT. Bạn muốn đi du lịch ở đâu?
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 justify-end">
                      <div className="flex-1 space-y-1.5 text-right">
                        <div
                          className="inline-block px-4 py-3 text-sm text-left"
                          style={{
                            background: "linear-gradient(135deg, #0391FF, #0046C1)",
                            color: "#FFFFFF",
                            borderRadius: "16px 16px 4px 16px",
                          }}
                        >
                          Mình muốn đi Đà Nẵng 4N3Đ, ngân sách 3 triệu. Có tour nào?
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: "#0046C1" }}
                      >
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <div
                          className="px-4 py-3 text-sm"
                          style={{
                            backgroundColor: "#FFFFFF",
                            color: "#000E1A",
                            borderRadius: "16px 16px 16px 4px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                          }}
                        >
                          <p className="mb-2">Đà Nẵng 4N3Đ - Hotel 4 sao</p>
                          <p className="text-xs mb-1" style={{ color: "#636363" }}>
                            Xe đưa đón · Ăn sáng · Hướng dẫn
                          </p>
                          <p className="font-bold" style={{ color: "#0046C1" }}>
                            {formatPrice(2500000)}/người
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS (lazy) ── */}
        <TestimonialsSection />

        {/* ── FINAL CTA ── */}
        <section
          className="py-24 relative overflow-hidden"
          style={{ backgroundColor: "#FFFFFF" }}
        >
          <div className="absolute inset-0 overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600&q=80"
              alt="Travel adventure"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0" style={{ backgroundColor: "rgba(255,255,255,0.92)" }} />
          </div>

          <div className="relative max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
            <div
              className="w-20 h-20 mx-auto flex items-center justify-center text-4xl"
              style={{ backgroundColor: "#0391FF", borderRadius: "16px" }}
            >
              <Zap className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold" style={{ color: "#000E1A" }}>
              Sẵn sàng cho chuyến đi tiếp theo?
            </h2>
            <p className="text-lg md:text-xl max-w-xl mx-auto" style={{ color: "#4D4D4D" }}>
              Để AI của chúng tôi giúp bạn tìm và đặt tour du lịch hoàn hảo.
              Chỉ cần trò chuyện — chúng tôi lo tất cả!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="gap-2.5 h-14 px-8 text-base font-semibold"
                style={{ backgroundColor: "#0046C1", color: "#FFFFFF", borderRadius: "12px" }}
                onClick={() => router.push("/chat")}
              >
                <MessageSquare className="w-5 h-5" /> Trò chuyện với AI
              </Button>
              <Button
                size="lg"
                className="gap-2.5 h-14 px-8 text-base font-semibold"
                style={{ backgroundColor: "#FFFFFF", color: "#0391FF", borderRadius: "12px", border: "1px solid #0391FF" }}
                onClick={() => router.push("/tours")}
              >
                <Map className="w-5 h-5" /> Khám phá ngay
              </Button>
            </div>
          </div>
        </section>

        {/* ── NEWSLETTER ── */}
        <section
          className="py-16 relative overflow-hidden"
          style={{ background: "linear-gradient(to right, #0046C1, #000E1A)" }}
        >
          <div className="absolute inset-0 overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1600&q=80"
              alt="Airplane travel"
              fill
              className="object-cover opacity-20"
            />
          </div>

          <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <Mail className="w-8 h-8 mb-4" style={{ color: "#FFFFFF" }} />
                <h3 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: "#FFFFFF" }}>
                  Nhận ưu đãi đặc biệt
                </h3>
                <p style={{ color: "rgba(255,255,255,0.8)" }}>
                  Đăng ký nhận tin và cập nhật tour mới nhất
                </p>
              </div>
              <form
                onSubmit={handleNewsletter}
                className="flex flex-col sm:flex-row gap-3 w-full md:w-auto"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập email của bạn"
                  className="px-5 py-3 text-white placeholder:text-white/60 focus:outline-none w-full md:w-72"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.3)",
                    borderRadius: "12px",
                  }}
                  required
                />
                <Button
                  type="submit"
                  size="lg"
                  className="gap-2 font-semibold px-6"
                  style={{
                    backgroundColor: "#FFFFFF",
                    color: "#0046C1",
                    borderRadius: "12px",
                    border: "none",
                  }}
                >
                  ✈ Đăng ký
                </Button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
