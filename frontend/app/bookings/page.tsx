"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores";
import { bookingApi } from "@/lib/booking-api";
import type { Booking } from "@/types";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { BookingCardSkeleton } from "@/components/ui/skeleton";
import { formatPrice, formatDate } from "@/lib/utils";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  MessageSquare,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Status Badge ────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: "success" | "warning" | "destructive" | "neutral" | "secondary"; label: string }> = {
    PENDING:    { variant: "warning", label: "Đang chờ" },
    CONFIRMED:  { variant: "success", label: "Đã xác nhận" },
    CANCELLED:  { variant: "destructive", label: "Đã hủy" },
    COMPLETED:  { variant: "secondary", label: "Hoàn thành" },
    PROCESSING: { variant: "warning", label: "Đang xử lý" },
  };
  const s = map[status] ?? { variant: "neutral" as const, label: status };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

function PaymentBadge({ status }: { status: string }) {
  const map: Record<string, { variant: "warning" | "success" | "neutral"; label: string }> = {
    UNPAID:   { variant: "warning", label: "Chưa thanh toán" },
    PAID:     { variant: "success", label: "Đã thanh toán" },
    REFUNDED: { variant: "neutral", label: "Đã hoàn tiền" },
  };
  const s = map[status] ?? { variant: "neutral" as const, label: status || status };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

// ─── Booking Card ───────────────────────────────────────────────────────────────
function BookingCard({ booking }: { booking: Booking }) {
  const tourImage = booking.tour?.images?.[0];

  return (
    <Card className="overflow-hidden border border-[#DDDDDD] hover:shadow-elevated transition-all duration-200 group">
      <div className="flex flex-col sm:flex-row">
        {/* Tour image */}
        {tourImage && (
          <div className="w-full sm:w-48 h-40 sm:h-auto flex-shrink-0 overflow-hidden">
            <img
              src={tourImage}
              alt={booking.tour?.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 p-5 flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono text-[#636363] mb-1">
                Mã booking:{" "}
                <span className="font-semibold text-[#0046C1]">
                  {booking.booking_code}
                </span>
              </p>
              <h3 className="font-bold text-[#000E1A] text-base truncate group-hover:text-[#0046C1] transition-colors">
                {booking.tour?.name || "Tour đã xóa"}
              </h3>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <StatusBadge status={booking.status} />
              <PaymentBadge status={booking.payment_status} />
            </div>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-4 mb-4">
            {booking.departure_date && (
              <span className="flex items-center gap-1.5 text-xs text-[#636363]">
                <Calendar className="w-3.5 h-3.5 text-[#0046C1] flex-shrink-0" />
                {formatDate(booking.departure_date)}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-xs text-[#636363]">
              <Users className="w-3.5 h-3.5 text-[#0046C1] flex-shrink-0" />
              {booking.num_adults ?? 0} người lớn
              {(booking.num_children ?? 0) > 0 && `, ${booking.num_children} trẻ em`}
            </span>
            {booking.tour?.duration && (
              <span className="flex items-center gap-1.5 text-xs text-[#636363]">
                <Clock className="w-3.5 h-3.5 text-[#0046C1] flex-shrink-0" />
                {booking.tour.duration}
              </span>
            )}
            {booking.tour?.region && (
              <span className="flex items-center gap-1.5 text-xs text-[#636363]">
                <MapPin className="w-3.5 h-3.5 text-[#0046C1] flex-shrink-0" />
                {booking.tour.region}
              </span>
            )}
          </div>

          {/* Footer */}
          <div className="mt-auto flex items-end justify-between gap-3 pt-4 border-t border-[#DDDDDD]">
            <div>
              <p className="text-xs text-[#636363]">Tổng tiền</p>
              <p className="text-xl font-bold text-[#0046C1]">
                {formatPrice(Number(booking.total_price))}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/chat?booking=${booking.booking_code}`}>
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Hỗ trợ
                </Button>
              </Link>
              <Link href={`/bookings/${booking.booking_code}`}>
                <Button size="sm" className="gap-1.5">
                  Chi tiết
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function BookingsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchBookings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

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

  const filteredBookings = bookings.filter((b) => {
    if (filter === "active") return b.status === "PENDING" || b.status === "CONFIRMED";
    if (filter === "completed") return b.status === "COMPLETED" || b.status === "CANCELLED";
    return true;
  });

  const activeBookings = bookings.filter(
    (b) => b.status === "PENDING" || b.status === "CONFIRMED"
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7F7]">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <div className="bg-[#0046C1] py-12">
          <div className="container-page">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white">Đơn đặt tour</h1>
                <p className="text-white/70 mt-1">
                  Quản lý tất cả đơn đặt tour của bạn
                </p>
              </div>
              <Link href="/chat">
                <Button
                  size="sm"
                  className="gap-2 bg-white text-[#0046C1] hover:bg-white/90"
                >
                  <Sparkles className="w-4 h-4" />
                  Trò chuyện với AI
                </Button>
              </Link>
            </div>

            {/* Quick stats */}
            {!loading && bookings.length > 0 && (
              <div className="flex gap-6 mt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{bookings.length}</p>
                  <p className="text-xs text-white/60">Tổng đơn</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{activeBookings.length}</p>
                  <p className="text-xs text-white/60">Đang hoạt động</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">
                    {formatPrice(
                      bookings
                        .filter((b) => b.payment_status === "PAID")
                        .reduce((sum, b) => sum + Number(b.total_price), 0)
                    )}
                  </p>
                  <p className="text-xs text-white/60">Đã thanh toán</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="container-page py-8 space-y-6">
          {/* Filters */}
          {bookings.length > 0 && (
            <div className="flex items-center gap-2">
              {(["all", "active", "completed"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-4 py-2 text-sm font-medium transition-all duration-200 cursor-pointer",
                    filter === f
                      ? "bg-[#0046C1] text-white"
                      : "bg-white border border-[#DDDDDD] text-[#636363] hover:border-[#0046C1]"
                  )}
                >
                  {f === "all" ? "Tất cả" : f === "active" ? "Đang hoạt động" : "Đã kết thúc"}
                </button>
              ))}
            </div>
          )}

          {/* Loading skeletons */}
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <BookingCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && filteredBookings.length === 0 && (
            <EmptyState
              icon={Calendar}
              title={filter === "all" ? "Chưa có đơn đặt tour nào" : "Không có đơn phù hợp"}
              description={
                filter === "all"
                  ? "Bắt đầu tìm kiếm tour và đặt ngay để có những chuyến đi tuyệt vời!"
                  : "Thử chọn bộ lọc khác để xem các đơn đặt tour khác."
              }
              action={
                filter === "all" ? (
                  <Link href="/tours">
                    <Button className="gap-2">
                      <Sparkles className="w-4 h-4" />
                      Khám phá tour
                    </Button>
                  </Link>
                ) : (
                  <Button variant="secondary" onClick={() => setFilter("all")}>
                    Xem tất cả
                  </Button>
                )
              }
            />
          )}

          {/* Booking list */}
          {!loading && filteredBookings.length > 0 && (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
