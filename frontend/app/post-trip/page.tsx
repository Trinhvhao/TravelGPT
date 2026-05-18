"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { chatApi } from "@/lib/chat-api";
import { bookingApi } from "@/lib/booking-api";
import { useAuth } from "@/hooks/useAuth";
import type { PostTripResponse, Booking } from "@/types";
import {
  Trophy,
  Star,
  Heart,
  Gift,
  MessageSquare,
  MapPin,
  ArrowRight,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Sparkles,
  LogIn,
  CalendarCheck,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const PRIMARY = "#0046C1";
const ACCENT = "#0391FF";
const NAVY = "#000E1A";
const GRAY = "#636363";

const TIER_CONFIG: Record<string, { bg: string; text: string; border: string; emoji: string }> = {
  Bronze: { bg: "#FEF3C7", text: "#92400E", border: "#FDE68A", emoji: "🥉" },
  Silver: { bg: "#F1F5F9", text: "#475569", border: "#CBD5E1", emoji: "🥈" },
  Gold: { bg: "#FEF9C3", text: "#B45309", border: "#FDE047", emoji: "🥇" },
  Platinum: { bg: "#EEF2FF", text: "#4338CA", border: "#A5B4FC", emoji: "💎" },
};

type ViewState = "loading" | "authenticated" | "login_required" | "no_booking" | "manual";

export default function PostTripPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  const [viewState, setViewState] = useState<ViewState>("loading");
  const [data, setData] = useState<PostTripResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Manual form state
  const [bookingCode, setBookingCode] = useState("");
  const [tourName, setTourName] = useState("");
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [numAdults, setNumAdults] = useState<number>(1);
  const [numChildren, setNumChildren] = useState<number>(0);
  const [totalSpent, setTotalSpent] = useState<number>(0);
  const [isFirstBooking, setIsFirstBooking] = useState<boolean>(false);

  const [loading, setLoading] = useState(false);

  // Auto-fetch on mount for authenticated users
  useEffect(() => {
    if (!isAuthenticated) {
      setViewState("login_required");
      return;
    }

    const fetchWithAuth = async () => {
      try {
        // Call post-trip summary with no params — backend auto-looks up user's latest booking
        const result = await chatApi.postTripSummary({});
        setData(result);
        setViewState("authenticated");
      } catch (err) {
        // If API says no booking, show the no-booking state
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("400") || msg.includes("404") || msg.includes("Không tìm thấy")) {
          setViewState("no_booking");
        } else {
          // Other error — fall back to manual form
          setError(msg);
          setViewState("manual");
        }
      }
    };

    fetchWithAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleManualFetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await chatApi.postTripSummary({
        booking_code: bookingCode || undefined,
        tour_name: tourName || undefined,
        destination: destination || undefined,
        departure_date: departureDate || undefined,
        return_date: returnDate || undefined,
        num_adults: numAdults,
        num_children: numChildren,
        total_spent: totalSpent || undefined,
        is_first_booking: isFirstBooking,
      });
      setData(result);
      setViewState("authenticated");
    } catch {
      setError("Không thể tải thông tin. Vui lòng kiểm tra lại mã booking.");
    } finally {
      setLoading(false);
    }
  };

  const tier = data?.loyalty_tier ?? "Bronze";
  const tierConfig = TIER_CONFIG[tier] ?? TIER_CONFIG.Bronze;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F7F7F7" }}>
      <Navbar />

      {/* Hero */}
      <div
        className="w-full py-12 px-4"
        style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${ACCENT})` }}
      >
        <div className="container mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 text-white text-xs font-semibold mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            Cảm ơn bạn đã đồng hành
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2">
            Chuyến đi tuyệt vời!
          </h1>
          <p className="text-white/80 text-[15px]">
            Nhận điểm tích lũy, chia sẻ trải nghiệm và quay lại với ưu đãi đặc biệt
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-3xl px-4 py-8 flex-1 space-y-6">

        {/* ── Loading ── */}
        {viewState === "loading" && (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        )}

        {/* ── Login required ── */}
        {viewState === "login_required" && (
          <Card
            className="border-0 p-10 text-center"
            style={{ borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,70,193,0.1)" }}
          >
            <div className="text-5xl mb-4">🔐</div>
            <h3 className="font-bold text-[16px] mb-2" style={{ color: NAVY }}>
              Đăng nhập để xem điểm tích lũy
            </h3>
            <p className="text-[13px] mb-6" style={{ color: GRAY }}>
              Hệ thống sẽ tự động lấy thông tin chuyến đi của bạn. Không cần nhập tay!
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/login">
                <Button
                  className="h-11 px-6 text-[14px] font-semibold text-white"
                  style={{
                    background: `linear-gradient(135deg, ${ACCENT}, ${PRIMARY})`,
                    borderRadius: "12px",
                    border: "none",
                  }}
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Đăng nhập
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  variant="outline"
                  className="h-11 px-6 text-[14px] font-semibold"
                  style={{ borderRadius: "12px", border: `1px solid ${PRIMARY}`, color: PRIMARY }}
                >
                  Đăng ký
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* ── No booking found ── */}
        {viewState === "no_booking" && (
          <Card
            className="border-0 p-10 text-center"
            style={{ borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,70,193,0.1)" }}
          >
            <div className="text-5xl mb-4">🎫</div>
            <h3 className="font-bold text-[16px] mb-2" style={{ color: NAVY }}>
              Chưa có chuyến đi nào
            </h3>
            <p className="text-[13px] mb-6" style={{ color: GRAY }}>
              Bạn chưa có booking nào hoàn thành. Hãy đặt một tour và quay lại đây sau chuyến đi để nhận điểm tích lũy!
            </p>
            <Link href="/tours">
              <Button
                className="h-11 px-6 text-[14px] font-semibold text-white"
                style={{
                  background: `linear-gradient(135deg, ${ACCENT}, ${PRIMARY})`,
                  borderRadius: "12px",
                  border: "none",
                }}
              >
                <CalendarCheck className="h-4 w-4 mr-2" />
                Khám phá tour ngay
              </Button>
            </Link>
          </Card>
        )}

        {/* ── Results ── */}
        {data && (
          <div className="space-y-4 animate-[slide-up_0.3s_ease-out]">
            {/* Loyalty Card */}
            {(data.loyalty_points != null || data.loyalty_tier) && (
              <Card
                className="border-0 p-6"
                style={{
                  borderRadius: "20px",
                  backgroundColor: tierConfig.bg,
                  border: `2px solid ${tierConfig.border}`,
                  boxShadow: `0 8px 30px ${tierConfig.border}40`,
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-3xl"
                    style={{ backgroundColor: `${tierConfig.text}20` }}
                  >
                    {tierConfig.emoji}
                  </div>
                  <div>
                    <h3 className="font-bold text-[18px]" style={{ color: tierConfig.text }}>
                      Hạng thành viên
                    </h3>
                    <p className="text-[13px]" style={{ color: tierConfig.text, opacity: 0.8 }}>
                      {data.loyalty_tier ?? "Bronze"} Member
                    </p>
                  </div>
                  {data.loyalty_tier && (
                    <div className="ml-auto">
                      <span
                        className="px-4 py-1.5 rounded-full text-[13px] font-bold text-white"
                        style={{ backgroundColor: tierConfig.text }}
                      >
                        {data.loyalty_tier}
                      </span>
                    </div>
                  )}
                </div>

                {data.loyalty_points != null && (
                  <div className="flex items-end justify-between mb-4">
                    <div>
                      <p className="text-[36px] font-extrabold leading-none" style={{ color: tierConfig.text }}>
                        {data.loyalty_points.toLocaleString("vi-VN")}
                      </p>
                      <p className="text-[13px] mt-1" style={{ color: tierConfig.text, opacity: 0.8 }}>
                        điểm tích lũy
                      </p>
                    </div>
                    {data.points_to_next_tier != null && data.points_to_next_tier > 0 && (
                      <div className="text-right">
                        <p className="text-[12px]" style={{ color: tierConfig.text, opacity: 0.7 }}>
                          Cần thêm
                        </p>
                        <p className="text-[15px] font-bold" style={{ color: tierConfig.text }}>
                          {data.points_to_next_tier.toLocaleString("vi-VN")} điểm
                        </p>
                        <p className="text-[11px]" style={{ color: tierConfig.text, opacity: 0.7 }}>
                          để lên hạng tiếp theo
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {data.loyalty_benefits && data.loyalty_benefits.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[12px] font-bold uppercase tracking-wide" style={{ color: tierConfig.text, opacity: 0.7 }}>
                      Quyền lợi của bạn
                    </p>
                    {data.loyalty_benefits.map((benefit, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Gift className="h-4 w-4 flex-shrink-0" style={{ color: tierConfig.text }} />
                        <span className="text-[13px]" style={{ color: tierConfig.text }}>{benefit}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Feedback survey */}
            {data.feedback_survey && (
              <Card
                className="border-0 p-5"
                style={{ borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,70,193,0.1)" }}
              >
                <h3 className="font-bold text-[15px] mb-3 flex items-center gap-2" style={{ color: NAVY }}>
                  <MessageSquare className="h-5 w-5" style={{ color: PRIMARY }} />
                  Khảo sát trải nghiệm
                </h3>
                <p className="text-[14px] leading-relaxed whitespace-pre-wrap" style={{ color: NAVY }}>
                  {data.feedback_survey}
                </p>
              </Card>
            )}

            {/* Review prompt */}
            {data.review_prompt && (
              <Card
                className="border-0 p-5"
                style={{ borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,70,193,0.1)" }}
              >
                <h3 className="font-bold text-[15px] mb-3 flex items-center gap-2" style={{ color: NAVY }}>
                  <Star className="h-5 w-5" style={{ color: "#F59E0B" }} />
                  Chia sẻ trải nghiệm
                </h3>
                <p className="text-[14px] leading-relaxed mb-4 whitespace-pre-wrap" style={{ color: NAVY }}>
                  {data.review_prompt}
                </p>
                <Button
                  className="h-10 text-[13px] font-semibold"
                  style={{ background: `linear-gradient(135deg, ${ACCENT}, ${PRIMARY})`, borderRadius: "12px", border: "none", color: "white" }}
                >
                  <Star className="h-3.5 w-3.5 mr-2" />
                  Viết review ngay
                </Button>
              </Card>
            )}

            {/* Return reminder */}
            {data.return_reminder && (
              <Card
                className="border-0 p-5 flex items-start gap-3"
                style={{ borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,70,193,0.1)", backgroundColor: "#FEF9C3", border: "1px solid #FDE68A" }}
              >
                <MapPin className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: "#D97706" }} />
                <p className="text-[14px] leading-relaxed whitespace-pre-wrap" style={{ color: NAVY }}>
                  {data.return_reminder}
                </p>
              </Card>
            )}

            {/* CTA */}
            <Card
              className="border-0 p-5"
              style={{ borderRadius: "20px", background: `linear-gradient(135deg, ${PRIMARY}, ${ACCENT})` }}
            >
              <div className="text-center">
                <p className="text-white font-bold text-[15px] mb-2">
                  Lên kế hoạch cho chuyến đi tiếp theo?
                </p>
                <p className="text-white/80 text-[13px] mb-4">
                  Nhận ưu đãi dành riêng cho thành viên {data.loyalty_tier ?? "Bronze"}
                </p>
                <div className="flex gap-3 justify-center">
                  <Link href="/chat">
                    <Button
                      className="h-10 px-5 text-[13px] font-semibold"
                      style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "#FFFFFF", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.3)" }}
                    >
                      Trò chuyện với AI
                    </Button>
                  </Link>
                  <Link href="/tours">
                    <Button
                      className="h-10 px-5 text-[13px] font-semibold text-white"
                      style={{ backgroundColor: "#FFFFFF", color: PRIMARY, borderRadius: "12px", border: "none" }}
                    >
                      <Heart className="h-3.5 w-3.5 mr-1" />
                      Khám phá tour mới
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ── Manual form (fallback) ── */}
        {(viewState === "manual") && (
          <Card
            className="border-0 p-6"
            style={{ borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,70,193,0.1)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-4 w-4" style={{ color: "#D97706" }} />
              <h2 className="font-bold text-[16px]" style={{ color: NAVY }}>
                Nhập thông tin thủ công
              </h2>
            </div>
            <p className="text-[13px] mb-4" style={{ color: GRAY }}>
              {error ? `${error} — ` : ""}Vui lòng nhập thông tin chuyến đi để xem kết quả.
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[13px] font-medium mb-1.5 block" style={{ color: GRAY }}>
                    Mã booking
                  </label>
                  <Input
                    value={bookingCode}
                    onChange={(e) => setBookingCode(e.target.value)}
                    placeholder="VD: BK1A2B3C4"
                  />
                </div>
                <div>
                  <label className="text-[13px] font-medium mb-1.5 block" style={{ color: GRAY }}>
                    Tên tour
                  </label>
                  <Input
                    value={tourName}
                    onChange={(e) => setTourName(e.target.value)}
                    placeholder="VD: Tour Đà Nẵng 3N2Đ"
                  />
                </div>
              </div>

              <div>
                <label className="text-[13px] font-medium mb-1.5 block" style={{ color: GRAY }}>
                  Điểm đến
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: GRAY }} />
                  <Input
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="VD: Đà Nẵng"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[13px] font-medium mb-1.5 block" style={{ color: GRAY }}>
                    Ngày khởi hành
                  </label>
                  <Input type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-[13px] font-medium mb-1.5 block" style={{ color: GRAY }}>
                    Ngày về
                  </label>
                  <Input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[13px] font-medium mb-1.5 block" style={{ color: GRAY }}>
                    Người lớn
                  </label>
                  <Input type="number" min={1} value={numAdults} onChange={(e) => setNumAdults(Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-[13px] font-medium mb-1.5 block" style={{ color: GRAY }}>
                    Trẻ em
                  </label>
                  <Input type="number" min={0} value={numChildren} onChange={(e) => setNumChildren(Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-[13px] font-medium mb-1.5 block" style={{ color: GRAY }}>
                    Tổng chi tiêu (VND)
                  </label>
                  <Input
                    type="number" min={0} value={totalSpent}
                    onChange={(e) => setTotalSpent(Number(e.target.value))}
                    placeholder="VD: 5000000"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFirstBooking}
                  onChange={(e) => setIsFirstBooking(e.target.checked)}
                  style={{ accentColor: PRIMARY }}
                />
                <span className="text-[13px]" style={{ color: GRAY }}>
                  Đây là booking đầu tiên của tôi
                </span>
              </label>

              {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-[13px]"
                  style={{ backgroundColor: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <Button
                onClick={handleManualFetch}
                disabled={loading}
                className="w-full h-11 text-[14px] font-semibold text-white"
                style={{
                  background: `linear-gradient(135deg, ${ACCENT}, ${PRIMARY})`,
                  borderRadius: "12px",
                  border: "none",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang tải...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Xem kết quả
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}
      </div>

      <Footer />
    </div>
  );
}
