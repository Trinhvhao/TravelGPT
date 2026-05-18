"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores";
import { useAuth } from "@/hooks";
import { bookingApi } from "@/lib/booking-api";
import type { Booking } from "@/types";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice, formatDate } from "@/lib/utils";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  MessageSquare,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  PlaneTakeoff,
  Search,
  SlidersHorizontal,
  X,
  ChevronRight,
  Star,
  Ticket,
  Filter,
  TrendingUp,
  Wallet,
  CreditCard,
  Download,
  Share2,
  Phone,
  Mail,
  CalendarCheck,
  MapPinIcon,
  User,
  Plane,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Design Tokens ──────────────────────────────────────────────────────────────
const PRIMARY = "#0EA5E9";
const ACCENT = "#EA580C";
const NAVY = "#0C4A6E";
const SURFACE = "#F0F9FF";
const BG_CARD = "#FFFFFF";
const BORDER = "#BAE6FD";
const SUCCESS = "#10B981";
const WARNING = "#F59E0B";
const DANGER = "#EF4444";

// ─── Status Config ─────────────────────────────────────────────────────────────
function getUnifiedStatus(booking: Booking) {
  if (booking.status === "CANCELLED") return "cancelled";
  if (booking.status === "COMPLETED") return "completed";
  if (booking.status === "CONFIRMED") return "confirmed";
  return "pending";
}

function getRefundInfo(booking: Booking): { pct: number; label: string; amount: number } | null {
  if (booking.status !== "CANCELLED") return null;
  if (booking.payment_status === "UNPAID") return null;
  if (booking.payment_status === "REFUNDED") {
    return { pct: 100, label: "Đã hoàn tiền", amount: Number(booking.total_price) };
  }
  if (booking.departure_date) {
    const departure = new Date(booking.departure_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    departure.setHours(0, 0, 0, 0);
    const days = Math.ceil((departure.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    let pct = 0;
    if (days >= 14) pct = 90;
    else if (days >= 7) pct = 70;
    else if (days >= 3) pct = 50;
    else if (days >= 1) pct = 20;
    if (pct === 0) return null;
    const refundAmount = Math.round(Number(booking.total_price) * pct / 100 * 0.95);
    return { pct, label: `Hoàn ${pct}%`, amount: refundAmount };
  }
  return null;
}

const STATUS_CONFIG: Record<string, {
  label: string;
  dotColor: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  Icon: React.ElementType;
}> = {
  pending:    { label: "Chờ xác nhận", dotColor: WARNING, bgColor: "#FEF3C7", textColor: "#92400E", borderColor: "#FDE68A", Icon: Clock },
  confirmed:  { label: "Đã xác nhận",  dotColor: SUCCESS, textColor: "#065F46", bgColor: "#D1FAE5", borderColor: "#A7F3D0", Icon: CheckCircle2 },
  cancelled:  { label: "Đã hủy",        dotColor: "#9CA3AF", textColor: "#374151", bgColor: "#F3F4F6", borderColor: "#E5E7EB", Icon: XCircle },
  completed:   { label: "Hoàn thành",    dotColor: PRIMARY, textColor: "#0369A1", bgColor: "#E0F2FE", borderColor: "#BAE6FD", Icon: PlaneTakeoff },
};

// ─── Status Pill ──────────────────────────────────────────────────────────────
function StatusPill({ booking }: { booking: Booking }) {
  const s = getUnifiedStatus(booking);
  const config = STATUS_CONFIG[s];
  const refund = getRefundInfo(booking);
  const Icon = config.Icon;

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border"
        style={{
          backgroundColor: config.bgColor,
          borderColor: config.borderColor,
          color: config.textColor,
        }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color: config.dotColor }} />
        {config.label}
      </div>
      {refund && (
        <div
          className="inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-md w-fit"
          style={{ backgroundColor: "#D1FAE5", color: "#065F46", border: "1px solid #A7F3D0" }}
        >
          <RotateCcw className="w-3 h-3" />
          {refund.label} - {formatPrice(refund.amount)}
        </div>
      )}
    </div>
  );
}

// ─── Payment Pill ──────────────────────────────────────────────────────────────
function PaymentPill({ status }: { status: string }) {
  const configs: Record<string, { label: string; bg: string; color: string }> = {
    UNPAID:    { label: "Chưa thanh toán", bg: "#FEF3C7", color: "#92400E" },
    PAID:      { label: "Đã thanh toán", bg: "#D1FAE5", color: "#065F46" },
    REFUNDED:  { label: "Đã hoàn tiền", bg: "#E0F2FE", color: "#0369A1" },
    FAILED:    { label: "Thanh toán thất bại", bg: "#FEE2E2", color: "#991B1B" },
  };
  const c = configs[status] || { label: status, bg: "#F3F4F6", color: "#374151" };
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium"
      style={{ backgroundColor: c.bg, color: c.color }}
    >
      <CreditCard className="w-3 h-3" />
      {c.label}
    </span>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, value, label, color }: { icon: React.ElementType; value: string | number; label: string; color: string }) {
  return (
    <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-4 text-center border border-white/20 hover:bg-white/20 transition-all duration-200">
      <div className="w-12 h-12 rounded-2xl mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: `${color}30` }}>
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-white/60 font-medium mt-0.5 uppercase tracking-wide">{label}</p>
    </div>
  );
}

// ─── Quick Actions ─────────────────────────────────────────────────────────────
function QuickActions({ booking }: { booking: Booking }) {
  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `Booking ${booking.booking_code}`,
        text: `Tour: ${booking.tour?.name}`,
        url: window.location.href,
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={(e) => { e.stopPropagation(); handleShare(); }}
        className="w-9 h-9 rounded-xl border border-white/30 bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all cursor-pointer"
        title="Chia sẻ"
      >
        <Share2 className="w-4 h-4 text-white" />
      </button>
      <Link href={`/chat?booking=${booking.booking_code}`} onClick={e => e.stopPropagation()}>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/30 bg-white/10 hover:bg-white/20 transition-all text-white text-xs font-medium">
          <MessageSquare className="w-4 h-4" />
          Hỗ trợ
        </button>
      </Link>
    </div>
  );
}

// ─── Booking Card (Timeline Style) ─────────────────────────────────────────────
function BookingTimelineCard({ booking }: { booking: Booking }) {
  const router = useRouter();
  const tourImage = booking.tour?.images?.[0];
  const unifiedStatus = getUnifiedStatus(booking);
  const isCompleted = unifiedStatus === "completed";
  const isCancelled = unifiedStatus === "cancelled";

  return (
    <div
      onClick={() => router.push(`/bookings/${booking.booking_code}`)}
      className={cn(
        "group relative bg-white rounded-3xl overflow-hidden border cursor-pointer transition-all duration-300",
        "hover:shadow-[0_8px_30px_rgba(14,165,233,0.15)] hover:-translate-y-1",
        isCompleted ? "border-slate-200 shadow-sm" :
        isCancelled ? "border-slate-200 opacity-80" :
        "border-sky-100 shadow-sm hover:border-sky-300"
      )}
    >
      {/* Status accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{
          background: unifiedStatus === "pending" ? `linear-gradient(90deg, ${WARNING}, ${WARNING}80)` :
                     unifiedStatus === "confirmed" ? `linear-gradient(90deg, ${SUCCESS}, ${SUCCESS}80)` :
                     unifiedStatus === "completed" ? `linear-gradient(90deg, ${PRIMARY}, ${PRIMARY}80)` :
                     `linear-gradient(90deg, #9CA3AF, #9CA3AF80)`
        }}
      />

      <div className="flex flex-col sm:flex-row">
        {/* Tour Image */}
        <div className="w-full sm:w-48 h-48 sm:h-auto flex-shrink-0 overflow-hidden bg-gradient-to-br from-sky-50 to-sky-100 relative">
          {tourImage ? (
            <img
              src={tourImage}
              alt={booking.tour?.name ?? "Tour"}
              className={cn(
                "w-full h-full object-cover transition-transform duration-500 group-hover:scale-105",
                isCompleted && "grayscale-[30%]",
                isCancelled && "grayscale"
              )}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-sky-50 to-blue-50">
              <div className="w-16 h-16 rounded-2xl bg-white/80 flex items-center justify-center shadow-sm">
                <PlaneTakeoff className="w-8 h-8 text-sky-400" />
              </div>
              <span className="text-xs text-sky-400 font-medium">Không có ảnh</span>
            </div>
          )}

          {/* Status overlay */}
          <div className="absolute bottom-3 left-3">
            <StatusPill booking={booking} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Ticket className="w-4 h-4 text-sky-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Mã booking
                </span>
              </div>
              <p className="text-sm font-bold text-sky-600 font-mono tracking-wide">
                {booking.booking_code}
              </p>
            </div>
            <div className="flex-shrink-0">
              <PaymentPill status={booking.payment_status} />
            </div>
          </div>

          {/* Tour Name */}
          <h3 className={cn(
            "font-bold text-[16px] leading-snug line-clamp-2 mb-3 transition-colors",
            isCancelled ? "text-slate-400" : "text-slate-800 group-hover:text-sky-600"
          )}>
            {booking.tour?.name || "Tour đã xóa"}
          </h3>

          {/* Meta Grid */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {booking.tour?.destination && (
              <div className="flex items-center gap-2 text-[12px] text-slate-500 bg-slate-50 px-3 py-2 rounded-xl">
                <MapPinIcon className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                <span className="truncate">{booking.tour.destination}</span>
              </div>
            )}
            {booking.departure_date && (
              <div className="flex items-center gap-2 text-[12px] text-slate-500 bg-slate-50 px-3 py-2 rounded-xl">
                <CalendarCheck className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                <span>{formatDate(booking.departure_date)}</span>
              </div>
            )}
            {booking.tour?.duration && (
              <div className="flex items-center gap-2 text-[12px] text-slate-500 bg-slate-50 px-3 py-2 rounded-xl">
                <Clock className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                <span>{booking.tour.duration}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-[12px] text-slate-500 bg-slate-50 px-3 py-2 rounded-xl">
              <Users className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
              <span>
                {booking.num_adults} NL{booking.num_children > 0 && ` + ${booking.num_children} TE`}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto flex items-end justify-between gap-3 pt-3 border-t border-slate-100">
            <div>
              <p className="text-[10px] text-slate-400 mb-0.5 font-medium">Tổng tiền</p>
              <p className={cn(
                "text-2xl font-bold leading-none",
                isCancelled ? "text-slate-400 line-through" :
                isCompleted ? "text-slate-600" : "text-slate-800"
              )}>
                {formatPrice(Number(booking.total_price))}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <QuickActions booking={booking} />
              <button
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all",
                  isCompleted
                    ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    : isCancelled
                    ? "bg-slate-100 text-slate-400"
                    : "bg-sky-500 text-white hover:bg-sky-600 shadow-sm"
                )}
              >
                <span>Chi tiết</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Booking Card Skeleton ─────────────────────────────────────────────────────
function BookingCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-sky-100 shadow-sm">
      <div className="flex flex-col sm:flex-row">
        <Skeleton className="w-full sm:w-48 h-48 flex-shrink-0" />
        <div className="flex-1 p-5 flex flex-col space-y-3">
          <div className="space-y-1.5">
            <Skeleton width={80} height={10} />
            <Skeleton width={120} height={14} />
            <Skeleton width={220} height={18} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Skeleton width={100} height={32} className="rounded-xl" />
            <Skeleton width={100} height={32} className="rounded-xl" />
          </div>
          <div className="flex justify-between items-end pt-3 border-t border-slate-100">
            <Skeleton width={90} height={28} />
            <div className="flex gap-2">
              <Skeleton width={70} height={36} className="rounded-xl" />
              <Skeleton width={90} height={36} className="rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Filter Tabs ──────────────────────────────────────────────────────────────
type FilterTab = "all" | "active" | "past";

const FILTER_TABS: { key: FilterTab; label: string; icon: React.ElementType }[] = [
  { key: "all", label: "Tất cả", icon: Ticket },
  { key: "active", label: "Đang hoạt động", icon: Clock },
  { key: "past", label: "Đã kết thúc", icon: CheckCircle2 },
];

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function BookingsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated) {
      fetchBookings();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isLoading]);

  const fetchBookings = async () => {
    try {
      const data = await bookingApi.listMyBookings();
      setBookings(data.bookings ?? []);
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const activeBookings = bookings.filter(
    (b) => b.status === "PENDING" || b.status === "CONFIRMED"
  );
  const pastBookings = bookings.filter(
    (b) => b.status === "CANCELLED" || b.status === "COMPLETED"
  );

  const filteredBookings = bookings.filter((b) => {
    // Status filter
    if (filter === "active" && b.status !== "PENDING" && b.status !== "CONFIRMED") return false;
    if (filter === "past" && b.status !== "CANCELLED" && b.status !== "COMPLETED") return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesCode = b.booking_code.toLowerCase().includes(query);
      const matchesTour = b.tour?.name?.toLowerCase().includes(query);
      const matchesDestination = b.tour?.destination?.toLowerCase().includes(query);
      if (!matchesCode && !matchesTour && !matchesDestination) return false;
    }
    return true;
  });

  // Stats
  const totalSpent = bookings
    .filter((b) => b.payment_status === "PAID")
    .reduce((sum, b) => sum + Number(b.total_price), 0);

  const upcomingCount = bookings.filter((b) => {
    if (b.status !== "CONFIRMED") return false;
    if (!b.departure_date) return false;
    return new Date(b.departure_date) > new Date();
  }).length;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(180deg, ${SURFACE} 0%, #E0F2FE 100%)` }}>
      <Navbar />

      <main className="flex-1">
        {/* Hero Header */}
        <div
          className="relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${PRIMARY} 0%, #0284C7 50%, ${NAVY} 100%)`,
          }}
        >
          {/* Decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-20" style={{ background: "linear-gradient(135deg, #FFFFFF, transparent)" }} />
            <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full opacity-10" style={{ background: `linear-gradient(135deg, ${ACCENT}, transparent)` }} />
            <div className="absolute top-20 left-1/4 w-4 h-4 rounded-full bg-white/20 animate-pulse" />
            <div className="absolute top-40 right-1/3 w-3 h-3 rounded-full bg-white/15" />
            <div className="absolute bottom-1/3 left-1/3 w-5 h-5 rounded-full bg-white/10" />
          </div>

          <div className="relative container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Ticket className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white/60 text-sm font-medium">TravelGPT</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
                  Đơn đặt tour của bạn
                </h1>
                <p className="text-white/70 text-sm">
                  Theo dõi và quản lý các chuyến đi của bạn một cách dễ dàng
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link href="/tours">
                  <Button
                    size="sm"
                    className="gap-2 bg-white text-sky-600 hover:bg-white/90 font-semibold shadow-lg transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    Khám phá tour
                  </Button>
                </Link>
                <Link href="/chat">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 border-white/30 text-white hover:bg-white/10 font-medium backdrop-blur-sm transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    AI hỗ trợ
                  </Button>
                </Link>
              </div>
            </div>

            {/* Stats Grid */}
            {!loading && bookings.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl">
                <StatCard icon={Ticket} value={bookings.length} label="Tổng đơn" color="#FFFFFF" />
                <StatCard icon={Clock} value={activeBookings.length} label="Đang hoạt động" color={WARNING} />
                <StatCard icon={CalendarCheck} value={upcomingCount} label="Sắp tới" color={SUCCESS} />
                <StatCard icon={Wallet} value={formatPrice(totalSpent)} label="Đã chi" color="#A78BFA" />
              </div>
            )}
          </div>

          {/* Filter Tabs */}
          {!loading && bookings.length > 0 && (
            <div className="relative border-t border-white/10">
              <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-1">
                  {FILTER_TABS.map((tab) => {
                    const Icon = tab.icon;
                    const count = tab.key === "all" ? bookings.length :
                                 tab.key === "active" ? activeBookings.length :
                                 pastBookings.length;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key)}
                        className={cn(
                          "relative flex items-center gap-2 px-5 py-4 text-sm font-semibold transition-all duration-200 cursor-pointer",
                          filter === tab.key
                            ? "text-white"
                            : "text-white/50 hover:text-white/80"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                        {count > 0 && (
                          <span
                            className={cn(
                              "text-[11px] font-bold px-2 py-0.5 rounded-full",
                              filter === tab.key
                                ? "bg-white/25 text-white"
                                : "bg-white/10 text-white/60"
                            )}
                          >
                            {count}
                          </span>
                        )}
                        {filter === tab.key && (
                          <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-white rounded-full" />
                        )}
                      </button>
                    );
                  })}

                  {/* Search toggle */}
                  <button
                    onClick={() => setShowSearch(!showSearch)}
                    className={cn(
                      "ml-auto p-3 rounded-xl transition-all cursor-pointer",
                      showSearch ? "bg-white/20 text-white" : "text-white/60 hover:text-white/80"
                    )}
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Search Bar */}
        {showSearch && !loading && bookings.length > 0 && (
          <div className="bg-white border-b border-sky-100 py-4 animate-slide-down">
            <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm theo mã booking, tên tour..."
                  className="w-full h-12 pl-12 pr-12 text-sm rounded-xl border-2 border-sky-200 focus:border-sky-400 focus:ring-4 focus:ring-sky-100 outline-none transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3 text-slate-500" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Loading */}
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <BookingCardSkeleton key={i} />)}
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredBookings.length === 0 && (
            <div className="mt-8">
              <EmptyState
                icon={Ticket}
                title={searchQuery ? "Không tìm thấy kết quả" :
                       filter === "all" ? "Chưa có đơn đặt tour nào" :
                       filter === "active" ? "Không có đơn đang hoạt động" :
                       "Không có đơn đã kết thúc"}
                description={
                  searchQuery ? `Không tìm thấy đơn nào phù hợp với "${searchQuery}"` :
                  filter === "all"
                    ? "Bắt đầu tìm kiếm tour và đặt ngay để có những chuyến đi tuyệt vời!"
                    : "Thử chọn bộ lọc khác để xem các đơn đặt tour khác."
                }
                action={
                  searchQuery ? (
                    <Button
                      variant="secondary"
                      onClick={() => setSearchQuery("")}
                      className="border-sky-300 text-sky-600 hover:bg-sky-50"
                    >
                      Xóa tìm kiếm
                    </Button>
                  ) : filter === "all" ? (
                    <Link href="/tours">
                      <Button className="gap-2 bg-sky-500 hover:bg-sky-600 font-semibold shadow-sm">
                        <Sparkles className="w-4 h-4" />
                        Khám phá tour
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      variant="secondary"
                      onClick={() => setFilter("all")}
                      className="border-sky-300 text-sky-600 hover:bg-sky-50"
                    >
                      Xem tất cả
                    </Button>
                  )
                }
              />
            </div>
          )}

          {/* Bookings List */}
          {!loading && filteredBookings.length > 0 && (
            <div className="space-y-4 mt-2">
              {/* Results count */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Hiển thị <span className="font-semibold text-slate-700">{filteredBookings.length}</span>
                  {searchQuery && <> kết quả cho "<span className="font-semibold text-slate-700">{searchQuery}</span>"</>}
                  {filter !== "all" && <> trong <span className="font-semibold text-slate-700">{FILTER_TABS.find(t => t.key === filter)?.label}</span></>}
                </p>
              </div>

              {/* Timeline Cards */}
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-sky-200 via-sky-300 to-slate-200 hidden sm:block" />

                <div className="space-y-4">
                  {filteredBookings.map((booking) => (
                    <div key={booking.id} className="relative sm:pl-16">
                      {/* Timeline dot */}
                      <div className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-4 border-sky-300 z-10 items-center justify-center">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          booking.status === "CONFIRMED" ? "bg-green-500" :
                          booking.status === "PENDING" ? "bg-yellow-500" :
                          booking.status === "COMPLETED" ? "bg-sky-500" : "bg-slate-400"
                        )} />
                      </div>
                      <BookingTimelineCard booking={booking} />
                    </div>
                  ))}
                </div>
              </div>

              {/* End of list */}
              <p className="text-center text-xs text-slate-400 py-6">
                Bạn đã xem hết các đơn đặt tour
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
