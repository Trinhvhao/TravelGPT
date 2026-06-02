"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import { tourApi } from "@/lib/tour-api";
import { bookingApi } from "@/lib/booking-api";
import { wishlistApi } from "@/lib/wishlist-api";
import { useAuthStore } from "@/stores";
import type { Tour } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { showToast } from "@/components/ui/toast";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Star,
  Users,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  Phone,
  Mail,
  Minus,
  Plus,
  Loader2,
  Share2,
  Heart,
  Expand,
  ShieldCheck,
  Award,
  MapPinIcon,
  PlaneTakeoff,
  Utensils,
  Hotel,
  Bus,
  Camera,
  Gift,
  Wifi,
  Ticket,
  ThumbsUp,
  MessageSquare,
  AlertCircle,
  Eye,
  Play,
  ArrowRight,
  Sparkles,
  Headphones,
} from "lucide-react";

// ─── Design Tokens ───────────────────────────────────────────────────────────────
const PRIMARY = "#0EA5E9";
const ACCENT = "#EA580C";
const NAVY = "#0C4A6E";
const SUCCESS = "#10B981";
const WARNING = "#F59E0B";
const DANGER = "#EF4444";

// ─── Gallery Component ─────────────────────────────────────────────────────────
function Gallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const getUrl = (img: unknown) =>
    typeof img === "string" ? img : (img as { url: string }).url;

  const imgs = images.map(getUrl).filter(Boolean);
  if (!imgs.length) imgs.push("https://culturemagazin.com/wp-content/uploads/2023/06/0612-hoi-an-fi-1068x712.jpg");

  const prev = () => setActive((a) => (a - 1 + imgs.length) % imgs.length);
  const next = () => setActive((a) => (a + 1) % imgs.length);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!lightbox) return;
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  // Auto-play slideshow
  useEffect(() => {
    if (!lightbox || !isPlaying) return;
    const interval = setInterval(next, 3000);
    return () => clearInterval(interval);
  }, [lightbox, isPlaying, imgs.length]);

  return (
    <>
      <div className="space-y-3">
        {/* Main image */}
        <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-sky-50 group cursor-zoom-in" onClick={() => setLightbox(true)}>
          <Image
            src={imgs[active]}
            alt={`${name} - ảnh ${active + 1}`}
            fill
            className="object-cover transition-opacity duration-300"
            priority
            sizes="(max-width: 768px) 100vw, 60vw"
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Nav arrows */}
          {imgs.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white shadow-lg cursor-pointer"
                aria-label="Ảnh trước"
              >
                <ChevronLeft className="w-6 h-6 text-slate-800" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white shadow-lg cursor-pointer"
                aria-label="Ảnh tiếp theo"
              >
                <ChevronRight className="w-6 h-6 text-slate-800" />
              </button>
            </>
          )}

          {/* Counter & Actions */}
          <div className="absolute bottom-4 right-4 flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); setLightbox(true); }}
              className="w-10 h-10 rounded-lg bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors cursor-pointer"
              title="Xem tất cả ảnh"
            >
              <Eye className="w-5 h-5 text-white" />
            </button>
            <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1.5 text-white text-sm font-medium">
              {active + 1} / {imgs.length}
            </div>
          </div>

          {/* Quick actions */}
          <div className="absolute top-4 left-4 flex gap-2">
            <button className="w-10 h-10 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors cursor-pointer shadow" title="Lưu vào yêu thích">
              <Heart className="w-5 h-5 text-slate-600 hover:text-red-500 transition-colors" />
            </button>
            <button className="w-10 h-10 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors cursor-pointer shadow" title="Chia sẻ">
              <Share2 className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Thumbnails */}
        {imgs.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {imgs.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActive(idx)}
                className={cn(
                  "relative w-24 h-16 rounded-xl overflow-hidden flex-shrink-0 transition-all ring-2 ring-offset-2",
                  idx === active
                    ? "ring-sky-500 opacity-100 scale-105"
                    : "ring-transparent opacity-60 hover:opacity-100"
                )}
              >
                <Image src={img} alt="" fill className="object-cover" sizes="96px" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center animate-fade-in"
          onClick={() => { setLightbox(false); setIsPlaying(false); }}
        >
          {/* Close button */}
          <button
            className="absolute top-6 right-6 z-10 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/40 transition-colors cursor-pointer"
            onClick={() => { setLightbox(false); setIsPlaying(false); }}
          >
            ✕
          </button>

          {/* Navigation */}
          {imgs.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-6 top-1/2 -translate-y-1/2 z-10 w-14 h-14 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/40 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-8 h-8 text-white" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-6 top-1/2 -translate-y-1/2 z-10 w-14 h-14 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/40 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-8 h-8 text-white" />
              </button>
            </>
          )}

          {/* Main image */}
          <div className="relative w-full max-w-5xl mx-8 aspect-video" onClick={(e) => e.stopPropagation()}>
            <Image
              src={imgs[active]}
              alt=""
              fill
              className="object-contain rounded-lg"
              sizes="100vw"
              priority
            />
          </div>

          {/* Controls */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex items-center gap-4">
            {/* Play/Pause slideshow */}
            {imgs.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }}
                className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/40 transition-colors cursor-pointer"
              >
                {isPlaying ? (
                  <div className="w-5 h-5 flex gap-1">
                    <div className="w-2 h-5 bg-white rounded-sm" />
                    <div className="w-2 h-5 bg-white rounded-sm" />
                  </div>
                ) : (
                  <Play className="w-5 h-5 text-white ml-0.5" />
                )}
              </button>
            )}

            {/* Dots */}
            <div className="flex gap-2">
              {imgs.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); setActive(idx); }}
                  className={cn(
                    "h-2 rounded-full transition-all cursor-pointer",
                    idx === active ? "w-8 bg-white" : "w-2 bg-white/50 hover:bg-white/70"
                  )}
                />
              ))}
            </div>

            {/* Counter */}
            <span className="text-white/70 text-sm ml-2">
              {active + 1} / {imgs.length}
            </span>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Schedule Accordion ──────────────────────────────────────────────────────────
function ScheduleAccordion({ days }: { days: Tour["schedule"] }) {
  const [open, setOpen] = useState<number | null>(0);
  const [allOpen, setAllOpen] = useState(false);

  if (!days || days.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-sky-500" />
          Lịch trình tour
        </h3>
        <button
          onClick={() => setAllOpen(!allOpen)}
          className="text-sm text-sky-600 hover:text-sky-700 font-medium flex items-center gap-1 transition-colors cursor-pointer"
        >
          {allOpen ? (
            <><ChevronUp className="w-4 h-4" /> Thu gọn</>
          ) : (
            <><ChevronDown className="w-4 h-4" /> Xem tất cả</>
          )}
        </button>
      </div>
      {days.map((day, idx) => (
        <div key={idx} className={cn(
          "rounded-2xl border overflow-hidden transition-all",
          open === idx || allOpen ? "border-sky-200 shadow-sm" : "border-slate-200"
        )}>
          <button
            onClick={() => setOpen(open === idx ? null : idx)}
            className={cn(
              "w-full flex items-center gap-4 p-4 text-left transition-colors cursor-pointer",
              open === idx ? "bg-sky-50" : "bg-white hover:bg-slate-50"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0",
              open === idx ? "bg-sky-500 text-white" : "bg-sky-100 text-sky-600"
            )}>
              {day.day}
            </div>
            <div className="flex-1">
              <p className={cn("font-semibold text-slate-800", open === idx && "text-sky-600")}>
                {day.title}
              </p>
              {day.meals && day.meals.length > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  {day.meals.map((meal, mi) => (
                    <span key={mi} className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      <Utensils className="w-3 h-3" />
                      {meal}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <ChevronRight className={cn("w-5 h-5 text-slate-400 transition-transform flex-shrink-0", open === idx && "rotate-90 text-sky-500")} />
          </button>
          {open === idx && !allOpen && (
            <div className="px-4 pb-5 pl-[4.5rem] space-y-3 bg-white">
              {day.activities.map((act, ai) => (
                <div key={ai} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm text-slate-600 leading-relaxed">{act}</span>
                </div>
              ))}
              {day.notes && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100 mt-2">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-amber-700">{day.notes}</span>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Include/Exclude Grid ───────────────────────────────────────────────────────
function IncludeExcludeGrid({ includes, excludes }: { includes?: string[]; excludes?: string[] }) {
  const incArr = Array.isArray(includes) ? includes : [];
  const excArr = Array.isArray(excludes) ? excludes : [];

  if (incArr.length === 0 && excArr.length === 0) return null;

  const icons: Record<string, React.ElementType> = {
    "xe": Bus,
    "bus": Bus,
    "vé": Ticket,
    "ticket": Ticket,
    "ăn": Utensils,
    "meal": Utensils,
    "khách sạn": Hotel,
    "hotel": Hotel,
    "máy bay": PlaneTakeoff,
    "flight": PlaneTakeoff,
    "camera": Camera,
    "hướng dẫn": Users,
    "guide": Users,
    "wifi": Wifi,
    "internet": Wifi,
    "quà": Gift,
    "gift": Gift,
  };

  const getIcon = (text: string) => {
    const lower = text.toLowerCase();
    for (const [key, Icon] of Object.entries(icons)) {
      if (lower.includes(key)) return Icon;
    }
    return CheckCircle2;
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {incArr.length > 0 && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-5">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              Bao gồm
            </h3>
            <div className="space-y-2">
              {incArr.map((item, i) => {
                const Icon = getIcon(item);
                return (
                  <div key={i} className="flex items-center gap-3 text-sm text-slate-600">
                    <Icon className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
      {excArr.length > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-5">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center">
                <XCircle className="w-4 h-4 text-white" />
              </div>
              Không bao gồm
            </h3>
            <div className="space-y-2">
              {excArr.map((item, i) => {
                const Icon = getIcon(item);
                return (
                  <div key={i} className="flex items-center gap-3 text-sm text-slate-600">
                    <Icon className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Review Section ─────────────────────────────────────────────────────────────
function ReviewSection({ tour }: { tour: Tour }) {
  const reviews = (tour as any).reviews || [];
  const hasReviews = reviews.length > 0;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            Đánh giá từ khách hàng
          </h3>
          {hasReviews && (
            <Button variant="outline" size="sm" className="text-sky-600 border-sky-200 hover:bg-sky-50">
              Xem tất cả {tour.review_count} đánh giá
            </Button>
          )}
        </div>

        {!hasReviews ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-slate-100 mx-auto mb-3 flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500">Chưa có đánh giá nào</p>
            <p className="text-sm text-slate-400 mt-1">Hãy là người đầu tiên đánh giá tour này!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.slice(0, 3).map((review: any, idx: number) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-sky-600">
                      {review.user?.full_name?.[0]?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{review.user?.full_name || "Khách hàng"}</p>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "w-3 h-3",
                            i < review.rating ? "text-amber-400 fill-amber-400" : "text-slate-300"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="ml-auto text-xs text-slate-400">
                    {new Date(review.created_at).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-sm text-slate-600 leading-relaxed">{review.comment}</p>
                )}
                {review.is_verified && (
                  <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-2">
                    <CheckCircle2 className="w-3 h-3" />
                    Đã xác nhận đặt tour
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Trust Badges ──────────────────────────────────────────────────────────────
function TrustBadges() {
  const badges = [
    { icon: ShieldCheck, label: "Thanh toán an toàn", sub: "Bảo mật 100%", color: "#10B981" },
    { icon: Award, label: "Đảm bảo chất lượng", sub: "Tour đã kiểm duyệt", color: "#F59E0B" },
    { icon: Headphones, label: "Hỗ trợ 24/7", sub: "Luôn sẵn sàng", color: "#0EA5E9" },
    { icon: ThumbsUp, label: "Đánh giá thực", sub: "50,000+ khách hàng", color: "#8B5CF6" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {badges.map((badge, i) => {
        const Icon = badge.icon;
        return (
          <div key={i} className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${badge.color}15` }}>
              <Icon className="w-6 h-6" style={{ color: badge.color }} />
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">{badge.label}</p>
              <p className="text-xs text-slate-500">{badge.sub}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── FAQ Section ───────────────────────────────────────────────────────────────
function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  const faqs = [
    { q: "Tôi có thể hủy tour không?", a: "Bạn có thể hủy tour theo chính sách hoàn tiền. Hoàn 90% nếu hủy trước 14 ngày, 70% nếu hủy trước 7 ngày, 50% nếu hủy trước 3 ngày." },
    { q: "Tôi có thể đổi ngày khởi hành không?", a: "Có, bạn có thể đổi ngày khởi hành miễn phí nếu thông báo trước 7 ngày và có slot trống cho ngày mới." },
    { q: "Trẻ em có được giảm giá không?", a: "Trẻ em dưới 12 tuổi được giảm 50% giá tour. Trẻ em dưới 5 tuổi được miễn phí nếu ngồi cùng bố mẹ." },
    { q: "Tour có bảo hiểm không?", a: "Tất cả các tour đều được bao gồm bảo hiểm du lịch cơ bản. Bạn có thể nâng cấp gói bảo hiểm cao cấp khi đặt tour." },
    { q: "Tôi có thể thanh toán bằng cách nào?", a: "Chúng tôi chấp nhận thanh toán qua thẻ Visa/Mastercard, chuyển khoản ngân hàng, hoặc ví điện tử (VNPay, MoMo)." },
  ];

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-sky-500" />
          Câu hỏi thường gặp
        </h3>
        <div className="space-y-2">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpen(open === idx ? null : idx)}
                className="w-full flex items-center justify-between p-4 text-left bg-white hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <span className="font-medium text-slate-800 text-sm pr-4">{faq.q}</span>
                {open === idx ? (
                  <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                )}
              </button>
              {open === idx && (
                <div className="px-4 pb-4 pt-0 text-sm text-slate-600 leading-relaxed bg-white">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Booking Sidebar ───────────────────────────────────────────────────────────
function BookingSidebar({
  tour,
  onBook,
  submitting,
  spotsLeft,
  displayPrice,
  childPrice,
  serviceFee,
  totalPrice,
  numAdults,
  numChildren,
  setNumAdults,
  setNumChildren,
  contact,
  setContact,
  hasToken,
  bookingSuccess,
  router,
  params
}: {
  tour: Tour;
  onBook: () => void;
  submitting: boolean;
  spotsLeft: number;
  displayPrice: number;
  childPrice: number;
  serviceFee: number;
  totalPrice: number;
  numAdults: number;
  numChildren: number;
  setNumAdults: (n: number) => void;
  setNumChildren: (n: number) => void;
  contact: { name: string; email: string; phone: string; date: string; requests: string };
  setContact: (c: any) => void;
  hasToken: boolean;
  bookingSuccess: string | null;
  router: any;
  params: any;
}) {
  const handleOpenBooking = () => {
    if (!hasToken) {
      router.push(`/login?redirect=/tours/${params.slug}`);
      return;
    }
  };

  return (
    <Card className="sticky top-20 shadow-[0_8px_30px_rgba(14,165,233,0.15)] border-sky-100 overflow-hidden">
      {/* Price header */}
      <div className="bg-gradient-to-r from-sky-500 to-sky-600 p-5">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white">{formatPrice(displayPrice)}</span>
          <span className="text-white/80 text-sm">/người</span>
        </div>
        {tour.discount_price && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-white/60 line-through text-sm">{formatPrice(tour.price)}</span>
            <span className="bg-white text-sky-600 text-xs font-bold px-2 py-0.5 rounded-full">
              GIẢM {Math.round((1 - tour.discount_price / tour.price) * 100)}%
            </span>
          </div>
        )}
      </div>

      <CardContent className="p-5 space-y-5">
        {!hasToken ? (
          /* Auth gate */
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ backgroundColor: `${PRIMARY}15` }}>
              <PlaneTakeoff className="w-8 h-8" style={{ color: PRIMARY }} />
            </div>
            <div>
              <p className="font-bold text-slate-800">Đăng nhập để đặt tour</p>
              <p className="text-sm text-slate-500 mt-1">Đăng nhập hoặc đăng ký để đặt tour này</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                className="w-full rounded-xl h-12 font-bold text-sm"
                style={{ backgroundColor: PRIMARY }}
                onClick={() => router.push(`/login?redirect=/tours/${params.slug}`)}
              >
                Đăng nhập ngay
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-xl h-11 font-semibold text-sm"
                onClick={() => router.push(`/register?redirect=/tours/${params.slug}`)}
              >
                Tạo tài khoản mới
              </Button>
            </div>
          </div>
        ) : !bookingSuccess ? (
          /* Booking form */
          <div className="space-y-5">
            {/* Travelers */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-600 text-sm font-medium">
                  Người lớn <span className="text-sky-500">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setNumAdults(Math.max(1, numAdults - 1))}
                    className="w-10 h-10 rounded-xl border-2 border-slate-200 flex items-center justify-center hover:border-sky-400 hover:bg-sky-50 transition-all cursor-pointer"
                  >
                    <Minus className="w-4 h-4 text-slate-600" />
                  </button>
                  <span className="flex-1 text-center font-bold text-xl text-slate-800">{numAdults}</span>
                  <button
                    onClick={() => setNumAdults(Math.min(tour.max_participants, numAdults + 1))}
                    className="w-10 h-10 rounded-xl border-2 border-slate-200 flex items-center justify-center hover:border-sky-400 hover:bg-sky-50 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
                <p className="text-xs text-slate-500">{formatPrice(displayPrice)}/người</p>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-600 text-sm font-medium">Trẻ em (-50%)</Label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setNumChildren(Math.max(0, numChildren - 1))}
                    className="w-10 h-10 rounded-xl border-2 border-slate-200 flex items-center justify-center hover:border-sky-400 hover:bg-sky-50 transition-all cursor-pointer"
                  >
                    <Minus className="w-4 h-4 text-slate-600" />
                  </button>
                  <span className="flex-1 text-center font-bold text-xl text-slate-800">{numChildren}</span>
                  <button
                    onClick={() => setNumChildren(Math.min(tour.max_participants - numAdults, numChildren + 1))}
                    className="w-10 h-10 rounded-xl border-2 border-slate-200 flex items-center justify-center hover:border-sky-400 hover:bg-sky-50 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
                <p className="text-xs text-slate-500">{formatPrice(childPrice)}/trẻ</p>
              </div>
            </div>

            {/* Contact fields */}
            <div className="space-y-3">
              {[
                { key: "name" as const, label: "Họ tên", type: "text", placeholder: "Nguyễn Văn A", required: true },
                { key: "email" as const, label: "Email", type: "email", placeholder: "email@example.com", required: true },
                { key: "phone" as const, label: "Điện thoại", type: "tel", placeholder: "0912 345 678", required: true },
                { key: "date" as const, label: "Ngày khởi hành", type: "date", required: false },
              ].map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <Label className="text-slate-600 text-sm font-medium">
                    {field.label}
                    {field.required && <span className="text-sky-500 ml-0.5">*</span>}
                  </Label>
                  <Input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={contact[field.key]}
                    onChange={(e) => setContact((c: any) => ({ ...c, [field.key]: e.target.value }))}
                    className="rounded-xl border-slate-200 focus:border-sky-400"
                    min={field.type === "date" ? new Date().toISOString().split("T")[0] : undefined}
                  />
                </div>
              ))}
              <div className="space-y-1.5">
                <Label className="text-slate-600 text-sm font-medium">Yêu cầu đặc biệt</Label>
                <Textarea
                  placeholder="VD: ăn chay, cần xe lăn, dị ứng thực phẩm..."
                  value={contact.requests}
                  onChange={(e) => setContact((c: any) => ({ ...c, requests: e.target.value }))}
                  rows={3}
                  className="rounded-xl resize-none border-slate-200 focus:border-sky-400"
                />
              </div>
            </div>

            {/* Price breakdown */}
            <div className="rounded-xl bg-sky-50 p-4 space-y-2 border border-sky-100">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Người lớn × {numAdults}</span>
                <span className="font-medium text-slate-800">{formatPrice(displayPrice * numAdults)}</span>
              </div>
              {numChildren > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Trẻ em × {numChildren}</span>
                  <span className="font-medium text-slate-800">{formatPrice(childPrice * numChildren)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-slate-500">
                <span>Phí dịch vụ (5%)</span>
                <span>{formatPrice(serviceFee)}</span>
              </div>
              <div className="pt-2 border-t border-sky-200 flex justify-between font-bold">
                <span className="text-slate-800">Tổng cộng</span>
                <span className="text-sky-600 text-lg">{formatPrice(totalPrice)}</span>
              </div>
            </div>

            {/* Spots left warning */}
            {spotsLeft <= 5 && spotsLeft > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <p className="text-sm text-amber-700">
                  Chỉ còn <span className="font-bold">{spotsLeft}</span> chỗ trống!
                </p>
              </div>
            )}

            {/* Submit button */}
            <Button
              className="w-full rounded-xl h-14 font-bold text-base shadow-lg"
              style={{ backgroundColor: spotsLeft === 0 ? "#9CA3AF" : PRIMARY }}
              disabled={submitting || spotsLeft === 0}
              onClick={onBook}
            >
              {submitting ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Đang xử lý...</>
              ) : spotsLeft === 0 ? (
                "Hết chỗ"
              ) : !hasToken ? (
                <>
                  <Ticket className="w-5 h-5 mr-2" />
                  Đặt tour (Thanh toán sau)
                </>
              ) : (
                <>
                  <Ticket className="w-5 h-5 mr-2" />
                  Xác nhận đặt tour
                </>
              )}
            </Button>

            {/* Trust indicators */}
            <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                Thanh toán an toàn
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Xác nhận nhanh
              </span>
            </div>
          </div>
        ) : (
          /* Success state */
          <div className="text-center space-y-4 py-6">
            <div className="w-20 h-20 rounded-full bg-green-100 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <div>
              <h3 className="font-bold text-xl text-slate-800">Đặt tour thành công!</h3>
              <p className="text-sm text-slate-500 mt-1">Mã booking của bạn</p>
              <p className="text-2xl font-extrabold text-sky-600 tracking-widest mt-1">{bookingSuccess}</p>
            </div>
            <p className="text-sm text-slate-500">
              Vui lòng thanh toán trong 24h để xác nhận chỗ.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" className="rounded-xl" onClick={() => router.push("/bookings")}>
                Xem booking
              </Button>
              <Button className="rounded-xl" style={{ backgroundColor: ACCENT }}>
                Thanh toán
              </Button>
            </div>
          </div>
        )}

        {/* Contact info */}
        <div className="flex items-center justify-center gap-4 pt-4 border-t border-slate-100 text-sm text-slate-500">
          <span className="flex items-center gap-1">
            <Phone className="w-4 h-4" />
            1900 1234
          </span>
          <span className="flex items-center gap-1">
            <Mail className="w-4 h-4" />
            support@travelgpt.vn
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TourDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Booking form
  const [showBooking, setShowBooking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [numAdults, setNumAdults] = useState(1);
  const [numChildren, setNumChildren] = useState(0);
  const [contact, setContact] = useState({ name: "", email: "", phone: "", date: "", requests: "" });
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setHasToken(!!localStorage.getItem("tgpt_access"));
  }, []);

  const fetchTour = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const slug = params.slug as string;
      const t = await tourApi.getBySlug(slug);
      setTour(t);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [params.slug]);

  useEffect(() => { fetchTour(); }, [fetchTour]);

  // Check wishlist status
  useEffect(() => {
    if (!tour || !hasToken) return;
    const token = localStorage.getItem("tgpt_access");
    if (!token) return;

    wishlistApi.checkWishlist(tour.id, token).then((data) => {
      setWishlisted(data.isInWishlist);
    }).catch(() => {});
  }, [tour, hasToken]);

  const handleToggleWishlist = async () => {
    if (!tour) return;

    if (!hasToken) {
      router.push(`/login?redirect=/tours/${params.slug}`);
      return;
    }

    const token = localStorage.getItem("tgpt_access");
    if (!token) return;

    setWishlistLoading(true);
    try {
      const data = await wishlistApi.toggleWishlist(tour.id, token);
      setWishlisted(data.isInWishlist);
    } catch (error) {
      console.error("Failed to toggle wishlist:", error);
    } finally {
      setWishlistLoading(false);
    }
  };

  // Pre-fill contact from user
  useEffect(() => {
    if (user && !contact.name) {
      setContact((c) => ({
        ...c,
        name: user.full_name || "",
        email: user.email || "",
        phone: user.phone || "",
      }));
    }
  }, [user, contact.name]);

  const handleBook = async () => {
    // Validate contact info
    if (!contact.name || !contact.email || !contact.phone) {
      showToast.error("Thiếu thông tin", "Vui lòng nhập đầy đủ họ tên, email và số điện thoại.");
      return;
    }

    const bookingData = {
      tour_id: tour!.id,
      num_adults: numAdults,
      num_children: numChildren,
      contact_name: contact.name,
      contact_email: contact.email,
      contact_phone: contact.phone,
      departure_date: contact.date || undefined,
      special_requests: contact.requests || undefined,
    };

    setSubmitting(true);
    try {
      let booking;

      if (hasToken) {
        // Authenticated user - create booking with payment
        booking = await bookingApi.create(bookingData);
      } else {
        // Guest user - create booking with pay later option
        booking = await bookingApi.createGuest({
          ...bookingData,
          pay_later: true,
        });
      }

      setBookingSuccess(booking.booking_code);
      showToast.success("Đặt tour thành công!", `Mã: ${booking.booking_code}`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      const msg = error.response?.data?.detail || String(err);
      if (msg.toLowerCase().includes("overbook") || msg.toLowerCase().includes("full")) {
        showToast.error("Hết chỗ", "Tour này đã hết slot cho ngày bạn chọn.");
      } else {
        showToast.error("Lỗi", msg || "Không thể đặt tour. Vui lòng thử lại.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-blue-50">
        <div className="text-center space-y-4">
          <Spinner size="lg" className="mx-auto" />
          <p className="text-slate-500">Đang tải thông tin tour...</p>
        </div>
      </div>
    );
  }

  if (notFound || !tour) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-sky-50 to-blue-50 space-y-4">
        <div className="w-24 h-24 rounded-full bg-sky-100 flex items-center justify-center">
          <XCircle className="w-12 h-12 text-sky-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Không tìm thấy tour</h2>
        <Button style={{ backgroundColor: PRIMARY }} onClick={() => router.push("/tours")}>
          Quay lại danh sách tour
        </Button>
      </div>
    );
  }

  const images = Array.isArray(tour.images) ? tour.images.map((img) =>
    typeof img === "string" ? img : (img as { url: string }).url
  ) : [];

  const displayPrice = tour.discount_price ?? tour.price;
  const childPrice = displayPrice * 0.5;
  const hasDiscount = !!tour.discount_price && tour.discount_price < tour.price;
  const spotsLeft = tour.max_participants - tour.current_participants;
  const totalPrice = displayPrice * numAdults + childPrice * numChildren;
  const serviceFee = Math.round(totalPrice * 0.05);

  const includes = Array.isArray(tour.includes) ? tour.includes : [];
  const excludes = Array.isArray(tour.excludes) ? tour.excludes : [];
  const highlights = Array.isArray(tour.highlights) ? tour.highlights : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">
      {/* Mobile sticky booking bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-sky-100 z-50 p-4" style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-sky-600">{formatPrice(displayPrice)}</span>
              <span className="text-sm text-slate-500">/người</span>
            </div>
            {spotsLeft <= 5 && spotsLeft > 0 && (
              <p className="text-xs text-amber-600 font-medium">Còn {spotsLeft} chỗ!</p>
            )}
          </div>
          <Button
            className="rounded-xl px-6 h-12 font-bold shadow-lg"
            style={{ backgroundColor: PRIMARY }}
            onClick={() => {
              if (!hasToken) {
                router.push(`/login?redirect=/tours/${params.slug}`);
              } else {
                setShowBooking(true);
              }
            }}
          >
            {hasToken ? "Đặt tour" : "Đăng nhập"}
          </Button>
        </div>
      </div>

      <main className="lg:pb-8">
        <div className="container mx-auto max-w-6xl px-4 py-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
            <Link href="/" className="hover:text-sky-600 transition-colors cursor-pointer">Trang chủ</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/tours" className="hover:text-sky-600 transition-colors cursor-pointer">Tours</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-800 font-medium truncate max-w-[200px]">{tour.name}</span>
          </nav>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left: Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Gallery */}
              <Gallery images={images} name={tour.name} />

              {/* Header Card */}
              <Card className="border-sky-100">
                <CardContent className="p-6">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mb-4">
                    <span className="flex items-center gap-1.5 bg-sky-50 px-3 py-1.5 rounded-full">
                      <MapPinIcon className="w-4 h-4 text-sky-500" />
                      {tour.destination}
                    </span>
                    <span className="flex items-center gap-1.5 bg-sky-50 px-3 py-1.5 rounded-full">
                      <Clock className="w-4 h-4 text-sky-500" />
                      {tour.duration}
                    </span>
                    {tour.category && (
                      <Badge className="bg-sky-100 text-sky-700 border-0">{tour.category}</Badge>
                    )}
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 leading-tight">{tour.name}</h1>
                      {tour.short_description && (
                        <p className="mt-2 text-slate-600 leading-relaxed">{tour.short_description}</p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={handleToggleWishlist}
                        disabled={wishlistLoading}
                        className={cn(
                          "w-11 h-11 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer",
                          wishlisted
                            ? "border-red-400 bg-red-50 hover:bg-red-100"
                            : "border-slate-200 bg-white hover:border-sky-400 hover:bg-sky-50"
                        )}
                        title={wishlisted ? "Xóa khỏi yêu thích" : "Lưu yêu thích"}
                      >
                        {wishlistLoading ? (
                          <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                        ) : (
                          <Heart className={cn(
                            "w-5 h-5 transition-colors",
                            wishlisted ? "text-red-500 fill-red-500" : "text-slate-500"
                          )} />
                        )}
                      </button>
                      <button className="w-11 h-11 rounded-xl border-2 border-slate-200 bg-white flex items-center justify-center hover:border-sky-400 hover:bg-sky-50 transition-all cursor-pointer" title="Chia sẻ">
                        <Share2 className="w-5 h-5 text-slate-500" />
                      </button>
                    </div>
                  </div>

                  {/* Rating & Spots */}
                  <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-100">
                    {tour.rating > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "w-4 h-4",
                                i < Math.round(tour.rating) ? "text-amber-400 fill-amber-400" : "text-slate-300"
                              )}
                            />
                          ))}
                        </div>
                        <span className="font-bold text-slate-800">{Number(tour.rating).toFixed(1)}</span>
                        <span className="text-slate-500">({tour.review_count} đánh giá)</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span className={cn(
                        "text-sm font-medium",
                        spotsLeft > 5 ? "text-green-600" :
                        spotsLeft > 0 ? "text-amber-600" : "text-red-600"
                      )}>
                        {spotsLeft > 0 ? `Còn ${spotsLeft} chỗ` : "Hết chỗ"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              {tour.description && (
                <Card className="border-sky-100">
                  <CardContent className="p-6">
                    <h2 className="text-lg font-bold text-slate-800 mb-3">Mô tả tour</h2>
                    <p className="text-slate-600 leading-relaxed whitespace-pre-line">{tour.description}</p>
                  </CardContent>
                </Card>
              )}

              {/* Highlights */}
              {highlights.length > 0 && (
                <Card className="border-sky-100 bg-gradient-to-br from-amber-50 to-orange-50">
                  <CardContent className="p-6">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                      <Award className="w-5 h-5 text-amber-500" />
                      Điểm nổi bật
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {highlights.map((h, i) => {
                        const text = typeof h === "string" ? h : (h as { text: string }).text;
                        return (
                          <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/80 border border-amber-100">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                              <Sparkles className="w-4 h-4 text-amber-600" />
                            </div>
                            <span className="text-sm text-slate-700">{text}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Includes/Excludes */}
              <IncludeExcludeGrid includes={includes} excludes={excludes} />

              {/* Schedule */}
              {tour.schedule && <ScheduleAccordion days={tour.schedule} />}

              {/* Reviews */}
              <ReviewSection tour={tour} />

              {/* FAQ */}
              <FAQSection />

              {/* Trust Badges */}
              <TrustBadges />
            </div>

            {/* Right: Booking Sidebar */}
            <div className="lg:col-span-2 hidden lg:block">
              <BookingSidebar
                tour={tour}
                onBook={handleBook}
                submitting={submitting}
                spotsLeft={spotsLeft}
                displayPrice={displayPrice}
                childPrice={childPrice}
                serviceFee={serviceFee}
                totalPrice={totalPrice}
                numAdults={numAdults}
                numChildren={numChildren}
                setNumAdults={setNumAdults}
                setNumChildren={setNumChildren}
                contact={contact}
                setContact={setContact}
                hasToken={hasToken}
                bookingSuccess={bookingSuccess}
                router={router}
                params={params}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Booking Modal */}
      {showBooking && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowBooking(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-white p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800">Đặt tour</h3>
              <button
                onClick={() => setShowBooking(false)}
                className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <BookingSidebar
                tour={tour}
                onBook={handleBook}
                submitting={submitting}
                spotsLeft={spotsLeft}
                displayPrice={displayPrice}
                childPrice={childPrice}
                serviceFee={serviceFee}
                totalPrice={totalPrice}
                numAdults={numAdults}
                numChildren={numChildren}
                setNumAdults={setNumAdults}
                setNumChildren={setNumChildren}
                contact={contact}
                setContact={setContact}
                hasToken={hasToken}
                bookingSuccess={bookingSuccess}
                router={router}
                params={params}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
