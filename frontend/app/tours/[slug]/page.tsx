"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import { tourApi } from "@/lib/tour-api";
import { bookingApi } from "@/lib/booking-api";
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
} from "lucide-react";

// ─── Design System Colors ───────────────────────────────────────────────────────
const PRIMARY = "#0046C1";
const ACCENT = "#0391FF";

// ─── Gallery Component ─────────────────────────────────────────────────────────
function Gallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const getUrl = (img: unknown) =>
    typeof img === "string" ? img : (img as { url: string }).url;

  const imgs = images.map(getUrl).filter(Boolean);
  if (!imgs.length) imgs.push("https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1200");

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

  return (
    <>
      <div className="space-y-3">
        {/* Main image */}
        <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-[#F7F7F7] group cursor-zoom-in" onClick={() => setLightbox(true)}>
          <Image
            src={imgs[active]}
            alt={`${name} - ảnh ${active + 1}`}
            fill
            className="object-cover transition-opacity duration-300"
            priority
            sizes="(max-width: 768px) 100vw, 60vw"
          />

          {/* Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Nav arrows */}
          {imgs.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white shadow-lg cursor-pointer"
                aria-label="Ảnh trước"
              >
                <ChevronLeft className="w-5 h-5 text-[#000E1A]" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white shadow-lg cursor-pointer"
                aria-label="Ảnh tiếp theo"
              >
                <ChevronRight className="w-5 h-5 text-[#000E1A]" />
              </button>
            </>
          )}

          {/* Counter */}
          <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1 text-white text-metadata font-medium">
            {active + 1} / {imgs.length}
          </div>

          {/* Expand icon */}
          <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
            <Expand className="w-4 h-4 text-[#000E1A]" />
          </div>
        </div>

        {/* Thumbnails */}
        {imgs.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {imgs.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActive(idx)}
                className={cn(
                  "relative w-20 h-14 rounded-xl overflow-hidden flex-shrink-0 transition-all",
                  idx === active
                    ? "ring-2 ring-[#0046C1] ring-offset-2 opacity-100"
                    : "opacity-60 hover:opacity-100"
                )}
              >
                <Image src={img} alt="" fill className="object-cover" sizes="80px" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-modal bg-black/95 flex items-center justify-center"
          onClick={() => setLightbox(false)}
        >
          <button
            className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/40 transition-colors cursor-pointer"
            onClick={() => setLightbox(false)}
          >
            ✕
          </button>
          {imgs.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/40 cursor-pointer"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/40 cursor-pointer"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            </>
          )}
          <div className="relative w-full max-w-4xl aspect-video" onClick={(e) => e.stopPropagation()}>
            <Image src={imgs[active]} alt="" fill className="object-contain" sizes="100vw" />
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {imgs.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); setActive(idx); }}
                className={cn("w-2 h-2 rounded-full transition-all cursor-pointer", idx === active ? "bg-white w-6" : "bg-white/50")}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Schedule Accordion ──────────────────────────────────────────────────────────
function ScheduleAccordion({ days }: { days: Tour["schedule"] }) {
  const [open, setOpen] = useState<number | null>(0);
  if (!days || days.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-xl font-bold text-[#000E1A] flex items-center gap-2">
        <Calendar className="w-5 h-5 text-[#0046C1]" />
        Lịch trình tour
      </h3>
      {days.map((day, idx) => (
        <div key={idx} className="rounded-2xl border border-[#DDDDDD] overflow-hidden">
          <button
            onClick={() => setOpen(open === idx ? null : idx)}
            className={cn(
              "w-full flex items-center gap-4 p-4 text-left transition-colors cursor-pointer",
              open === idx ? "bg-[#0046C1]/5" : "bg-white hover:bg-[#F7F7F7]"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0",
              open === idx ? "bg-[#0046C1] text-white" : "bg-[#0046C1]/10 text-[#0046C1]"
            )}>
              {day.day}
            </div>
            <div className="flex-1">
              <p className={cn("font-semibold text-[#000E1A]", open === idx && "text-[#0046C1]")}>
                {day.title}
              </p>
              {day.meals && day.meals.length > 0 && (
                <p className="text-metadata text-[#636363] mt-0.5">{day.meals.join(" • ")}</p>
              )}
            </div>
            <ChevronRight className={cn("w-4 h-4 text-[#636363] transition-transform flex-shrink-0", open === idx && "rotate-90")} />
          </button>
          {open === idx && (
            <div className="px-4 pb-4 pl-[4.5rem] space-y-2 bg-white">
              {day.activities.map((act, ai) => (
                <div key={ai} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#059669] flex-shrink-0 mt-0.5" />
                  <span className="text-body-sm text-[#636363]">{act}</span>
                </div>
              ))}
              {day.notes && (
                <p className="text-metadata text-[#636363] italic pt-2 border-t border-[#DDDDDD] mt-2">
                  💡 {day.notes}
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
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

  // Booking form
  const [showBooking, setShowBooking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [numAdults, setNumAdults] = useState(1);
  const [numChildren, setNumChildren] = useState(0);
  const [contact, setContact] = useState({ name: "", email: "", phone: "", date: "", requests: "" });

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
    if (!isAuthenticated) {
      router.push(`/login?redirect=/tours/${params.slug}`);
      return;
    }
    if (!contact.name || !contact.email || !contact.phone) {
      showToast.error("Lỗi", "Vui lòng nhập đầy đủ thông tin liên hệ");
      return;
    }
    setSubmitting(true);
    try {
      const price = tour!.discount_price ?? tour!.price;
      const childPrice = price * 0.5;
      const total = price * numAdults + childPrice * numChildren;
      const serviceFee = Math.round(total * 0.05);

      const booking = await bookingApi.create({
        tour_id: tour!.id,
        num_adults: numAdults,
        num_children: numChildren,
        contact_name: contact.name,
        contact_email: contact.email,
        contact_phone: contact.phone,
        departure_date: contact.date || undefined,
        special_requests: contact.requests || undefined,
      });

      setBookingSuccess(booking.booking_code);
      showToast.success("Đặt tour thành công!", `Mã: ${booking.booking_code}`);
    } catch (err: unknown) {
      const msg = String(err);
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
      <div className="min-h-screen flex items-center justify-center bg-[#FAF5FF]">
        <div className="text-center space-y-4">
          <Spinner size="lg" className="mx-auto" />
          <p className="text-body text-[#636363]">Đang tải thông tin tour...</p>
        </div>
      </div>
    );
  }

  if (notFound || !tour) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF5FF] space-y-4">
        <div className="w-20 h-20 rounded-full bg-[#0046C1]/10 flex items-center justify-center">
          <XCircle className="w-10 h-10 text-[#0046C1]" />
        </div>
        <h2 className="text-2xl font-bold text-[#000E1A]">Không tìm thấy tour</h2>
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
  const hasDiscount = !!tour.discount_price && tour.discount_price < tour.price;
  const spotsLeft = tour.max_participants - tour.current_participants;
  const totalPrice = (() => {
    const adult = displayPrice * numAdults;
    const child = displayPrice * 0.5 * numChildren;
    const sub = adult + child;
    const svcFee = Math.round(sub * 0.05);
    return sub + svcFee;
  })();
  const childSub = displayPrice * 0.5 * numChildren;
  const serviceFee = Math.round((displayPrice * (numAdults + numChildren * 0.5)) * 0.05);

  const includes = Array.isArray(tour.includes) ? tour.includes : [];
  const excludes = Array.isArray(tour.excludes) ? tour.excludes : [];
  const highlights = Array.isArray(tour.highlights) ? tour.highlights : [];

  return (
    <div className="min-h-screen bg-[#FAF5FF]">
      {/* Sticky booking bar on mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#DDDDDD] z-raised p-3 flex gap-3">
        <div className="flex-1">
          <p className="text-sm font-bold text-[#0046C1]">{formatPrice(displayPrice)}</p>
          <p className="text-metadata text-[#636363]">/người</p>
        </div>
        <Button
          className="rounded-xl flex-1"
          style={{ backgroundColor: PRIMARY }}
          onClick={() => {
            if (!isAuthenticated) router.push(`/login?redirect=/tours/${params.slug}`);
            else setShowBooking(true);
          }}
        >
          Đặt tour
        </Button>
      </div>

      <main className="lg:pb-24">
        <div className="container mx-auto max-w-6xl px-4 py-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-metadata text-[#636363] mb-6">
            <Link href="/" className="hover:text-[#0046C1] transition-colors cursor-pointer">Trang chủ</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/tours" className="hover:text-[#0046C1] transition-colors cursor-pointer">Tours</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#000E1A] font-medium truncate">{tour.name}</span>
          </nav>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* ── Left: Content (3 cols) ── */}
            <div className="lg:col-span-3 space-y-8">
              {/* Gallery */}
              <Gallery images={images} name={tour.name} />

              {/* Header */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3 text-metadata text-[#636363]">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-[#0046C1]" />
                    {tour.destination}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {tour.duration}
                  </span>
                  {tour.category && (
                    <>
                      <span>•</span>
                      <Badge className="bg-[#0046C1]/10 text-[#0046C1] border-0">{tour.category}</Badge>
                    </>
                  )}
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-[#000E1A] leading-tight">{tour.name}</h1>
                    {tour.short_description && (
                      <p className="mt-2 text-body text-[#636363]">{tour.short_description}</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button className="w-10 h-10 rounded-xl border border-[#DDDDDD] bg-white flex items-center justify-center hover:bg-[#F7F7F7] transition-colors cursor-pointer" title="Lưu">
                      <Heart className="w-5 h-5 text-[#636363]" />
                    </button>
                    <button className="w-10 h-10 rounded-xl border border-[#DDDDDD] bg-white flex items-center justify-center hover:bg-[#F7F7F7] transition-colors cursor-pointer" title="Chia sẻ">
                      <Share2 className="w-5 h-5 text-[#636363]" />
                    </button>
                  </div>
                </div>

                {/* Rating & reviews */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-5 h-5 text-[#F59E0B] fill-[#F59E0B]" />
                    <span className="font-bold text-[#000E1A]">{Number(tour.rating).toFixed(1)}</span>
                    <span className="text-[#636363]">({tour.review_count.toLocaleString()} đánh giá)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#636363]" />
                    <span className={cn("text-sm font-medium", spotsLeft > 5 ? "text-[#059669]" : spotsLeft > 0 ? "text-[#D97706]" : "text-[#DC2626]")}>
                      {spotsLeft > 0 ? `Còn ${spotsLeft} chỗ` : "Hết chỗ"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {tour.description && (
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold text-[#000E1A] mb-3">Mô tả</h2>
                    <p className="text-body text-[#636363] leading-relaxed whitespace-pre-line">{tour.description}</p>
                  </CardContent>
                </Card>
              )}

              {/* Highlights */}
              {highlights.length > 0 && (
                <Card>
                  <CardContent className="p-6 space-y-3">
                    <h2 className="text-xl font-bold text-[#000E1A] flex items-center gap-2">
                      <Award className="w-5 h-5 text-[#F59E0B]" />
                      Điểm nổi bật
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {highlights.map((h, i) => {
                        const text = typeof h === "string" ? h : (h as { text: string }).text;
                        return (
                          <div key={i} className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-[#059669] flex-shrink-0 mt-0.5" />
                            <span className="text-body-sm text-[#636363]">{text}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Includes / Excludes */}
              {(includes.length > 0 || excludes.length > 0) && (
                <div className="grid sm:grid-cols-2 gap-6">
                  {includes.length > 0 && (
                    <Card className="border-[#059669]/20">
                      <CardContent className="p-6 space-y-3">
                        <h2 className="text-lg font-bold text-[#000E1A] flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-[#059669]" />
                          Bao gồm
                        </h2>
                        {includes.map((item, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-[#059669] flex-shrink-0 mt-0.5" />
                            <span className="text-body-sm text-[#636363]">{item}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                  {excludes.length > 0 && (
                    <Card className="border-[#DC2626]/20">
                      <CardContent className="p-6 space-y-3">
                        <h2 className="text-lg font-bold text-[#000E1A] flex items-center gap-2">
                          <XCircle className="w-5 h-5 text-[#DC2626]" />
                          Không bao gồm
                        </h2>
                        {excludes.map((item, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <XCircle className="w-4 h-4 text-[#DC2626] flex-shrink-0 mt-0.5" />
                            <span className="text-body-sm text-[#636363]">{item}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Schedule */}
              {tour.schedule && <ScheduleAccordion days={tour.schedule} />}

              {/* Trust badges */}
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { icon: ShieldCheck, label: "Thanh toán an toàn", sub: "Bảo mật tuyệt đối" },
                  { icon: Award, label: "Hỗ trợ 24/7", sub: "Luôn sẵn sàng giúp đỡ" },
                  { icon: Star, label: "Đánh giá thực", sub: `${tour.review_count}+ khách hàng` },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-[#DDDDDD]">
                      <div className="w-10 h-10 rounded-xl bg-[#0046C1]/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-[#0046C1]" />
                      </div>
                      <div>
                        <p className="font-bold text-[#000E1A] text-body-sm">{item.label}</p>
                        <p className="text-metadata text-[#636363]">{item.sub}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Right: Booking Sidebar (2 cols) ── */}
            <div className="lg:col-span-2 hidden lg:block">
              <Card className="sticky top-20 shadow-[0_8px_30px_rgba(124,58,237,0.12)] border-[#DDDDDD]">
                <CardContent className="p-6 space-y-5">
                  {/* Price */}
                  <div>
                    {hasDiscount && (
                      <span className="text-body text-[#636363] line-through mr-2">
                        {formatPrice(tour.price)}
                      </span>
                    )}
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-[#0046C1]">{formatPrice(displayPrice)}</span>
                      <span className="text-body text-[#636363]">/người</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-metadata text-[#636363]">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      Tối đa {tour.max_participants} người
                    </span>
                    {tour.rating > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
                        {Number(tour.rating).toFixed(1)}
                      </span>
                    )}
                  </div>

                  {/* Booking form */}
                  {!bookingSuccess ? (
                    <div className="space-y-4">
                      {/* Travelers */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-[#636363]">Người lớn <span className="text-[#0046C1]">*</span></Label>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setNumAdults((n) => Math.max(1, n - 1))}
                              className="w-9 h-9 rounded-xl border border-[#DDDDDD] flex items-center justify-center hover:bg-[#F7F7F7] cursor-pointer"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="flex-1 text-center font-bold text-lg">{numAdults}</span>
                            <button
                              onClick={() => setNumAdults((n) => Math.min(tour.max_participants, n + 1))}
                              className="w-9 h-9 rounded-xl border border-[#DDDDDD] flex items-center justify-center hover:bg-[#F7F7F7] cursor-pointer"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-metadata text-[#636363]">{formatPrice(displayPrice)}/người</p>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[#636363]">Trẻ em (50%)</Label>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setNumChildren((n) => Math.max(0, n - 1))}
                              className="w-9 h-9 rounded-xl border border-[#DDDDDD] flex items-center justify-center hover:bg-[#F7F7F7] cursor-pointer"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="flex-1 text-center font-bold text-lg">{numChildren}</span>
                            <button
                              onClick={() => setNumChildren((n) => Math.min(tour.max_participants - numAdults, n + 1))}
                              className="w-9 h-9 rounded-xl border border-[#DDDDDD] flex items-center justify-center hover:bg-[#F7F7F7] cursor-pointer"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-metadata text-[#636363]">{formatPrice(displayPrice * 0.5)}/trẻ</p>
                        </div>
                      </div>

                      {/* Contact fields */}
                      <div className="space-y-3">
                        {[
                          { key: "name" as const, label: "Họ tên", type: "text", placeholder: "Nguyễn Văn A", required: true },
                          { key: "email" as const, label: "Email", type: "email", placeholder: "email@example.com", required: true },
                          { key: "phone" as const, label: "Điện thoại", type: "tel", placeholder: "0912 345 678", required: true },
                          { key: "date" as const, label: "Ngày khởi hành", type: "date", placeholder: "", required: false },
                        ].map((field) => (
                          <div key={field.key} className="space-y-1.5">
                            <Label className="text-[#636363]">
                              {field.label}
                              {field.required && <span className="text-[#0046C1] ml-0.5">*</span>}
                            </Label>
                            <Input
                              type={field.type}
                              placeholder={field.placeholder}
                              value={contact[field.key]}
                              onChange={(e) => setContact((c) => ({ ...c, [field.key]: e.target.value }))}
                              className="rounded-xl"
                              min={field.type === "date" ? new Date().toISOString().split("T")[0] : undefined}
                            />
                          </div>
                        ))}
                        <div className="space-y-1.5">
                          <Label className="text-[#636363]">Yêu cầu đặc biệt</Label>
                          <Textarea
                            placeholder="VD: ăn chay, cần xe lăn..."
                            value={contact.requests}
                            onChange={(e) => setContact((c) => ({ ...c, requests: e.target.value }))}
                            rows={3}
                            className="rounded-xl resize-none"
                          />
                        </div>
                      </div>

                      {/* Price breakdown */}
                      <div className="rounded-xl bg-[#F7F7F7] p-4 space-y-2">
                        <div className="flex justify-between text-body-sm text-[#636363]">
                          <span>Người lớn × {numAdults}</span>
                          <span>{formatPrice(displayPrice * numAdults)}</span>
                        </div>
                        {numChildren > 0 && (
                          <div className="flex justify-between text-body-sm text-[#636363]">
                            <span>Trẻ em × {numChildren}</span>
                            <span>{formatPrice(childSub)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-body-sm text-[#636363]">
                          <span>Phí dịch vụ (5%)</span>
                          <span>{formatPrice(serviceFee)}</span>
                        </div>
                        <div className="pt-2 border-t border-[#DDDDDD] flex justify-between font-bold text-[#000E1A]">
                          <span>Tổng cộng</span>
                          <span className="text-[#0046C1]">{formatPrice(totalPrice)}</span>
                        </div>
                      </div>

                      <Button
                        className="w-full rounded-xl h-12 font-bold text-base"
                        style={{ backgroundColor: PRIMARY }}
                        disabled={submitting || spotsLeft === 0}
                        onClick={handleBook}
                      >
                        {submitting ? (
                          <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Đang xử lý...</>
                        ) : spotsLeft === 0 ? (
                          "Hết chỗ"
                        ) : (
                          "Xác nhận đặt tour"
                        )}
                      </Button>

                      <div className="flex items-center gap-4 text-metadata text-[#636363] justify-center">
                        <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> 1900 1234</span>
                        <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> support@travelgpt.vn</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-4 py-6">
                      <div className="w-16 h-16 rounded-full bg-[#059669]/10 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-8 h-8 text-[#059669]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xl text-[#000E1A]">Đặt tour thành công!</h3>
                        <p className="text-metadata text-[#636363] mt-1">Mã booking của bạn</p>
                        <p className="text-2xl font-extrabold text-[#0046C1] tracking-widest mt-1">{bookingSuccess}</p>
                      </div>
                      <p className="text-body-sm text-[#636363]">
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
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
