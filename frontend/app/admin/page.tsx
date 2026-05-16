"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { ActivityFeed, type ActivityItem } from "@/components/admin/activity-feed";
import { formatPrice, formatDate } from "@/lib/utils";
import {
  Map,
  Calendar,
  Users,
  DollarSign,
  Loader2,
  ArrowRight,
  Bot,
  TrendingUp,
  TrendingDown,
  Eye,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PRIMARY = "#0046C1";
const ACCENT = "#0391FF";

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  bg,
  href,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  bg: string;
  href?: string;
  trend?: { value: number; label: string };
}) {
  const content = (
    <Card className="p-5 border border-[#DDDDDD] hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[13px] font-medium text-[#636363]">{title}</p>
          <p className="text-2xl font-extrabold text-[#000E1A]">{value}</p>
          {subtitle && <p className="text-[11px] text-[#636363]">{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-1">
              {trend.value >= 0 ? (
                <TrendingUp className="w-3 h-3 text-[#059669]" />
              ) : (
                <TrendingDown className="w-3 h-3 text-[#DC2626]" />
              )}
              <span
                className="text-[11px] font-medium"
                style={{ color: trend.value >= 0 ? "#059669" : "#DC2626" }}
              >
                {Math.abs(trend.value)}% {trend.label}
              </span>
            </div>
          )}
        </div>
        <div
          className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", bg)}
          style={{ color: "inherit" }}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: "success" | "warning" | "destructive" | "neutral" | "secondary"; label: string }> = {
    PENDING: { variant: "warning" as const, label: "Đang chờ" },
    CONFIRMED: { variant: "success" as const, label: "Đã xác nhận" },
    CANCELLED: { variant: "destructive" as const, label: "Đã hủy" },
    COMPLETED: { variant: "secondary" as const, label: "Hoàn thành" },
  };
  const s = map[status] ?? { variant: "neutral" as const, label: status };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

// ─── Revenue Bar type ─────────────────────────────────────────────────────────────
interface RevenueBar {
  date: string;
  label: string;
  revenue: number;
  bookings: number;
}

// ─── Activity from bookings ─────────────────────────────────────────────────────
function buildActivityFromBookings(
  bookings: Array<Record<string, unknown>>
): ActivityItem[] {
  return bookings.map((b: Record<string, unknown>) => ({
    id: `act-${b.id as string}`,
    type: (b.payment_status === "PAID" ? "payment" : "booking") as ActivityItem["type"],
    message:
      b.payment_status === "PAID"
        ? `Thanh toán thành công cho booking`
        : `Đơn đặt tour mới`,
    detail: (b.tour as Record<string, unknown>)?.name as string | undefined,
    timestamp: (b.created_at as string) ?? new Date().toISOString(),
    meta: {
      booking_code: b.booking_code as string,
      user_name: b.contact_name as string,
      tour_name: (b.tour as Record<string, unknown>)?.name as string | undefined,
    },
  }));
}

// ─── Main Page ────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [stats, setStats] = useState<{
    totalTours: number;
    totalBookings: number;
    totalUsers: number;
    revenue: number;
    revenueLast7Days: number;
    recentBookings: Array<Record<string, unknown>>;
    revenueByDay: RevenueBar[];
    topTours: Array<Record<string, unknown>>;
  }>({
    totalTours: 0,
    totalBookings: 0,
    totalUsers: 0,
    revenue: 0,
    revenueLast7Days: 0,
    recentBookings: [],
    revenueByDay: [],
    topTours: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const [toursRes, bookingsRes, usersRes] = await Promise.allSettled([
        api.get("/tours?page_size=1"),
        api.get("/bookings/admin/all?page_size=20"),
        api.get("/users"),
      ]);

      const tours = toursRes.status === "fulfilled" ? toursRes.value.data : null;
      const bookings = bookingsRes.status === "fulfilled" ? bookingsRes.value.data : null;
      const users = usersRes.status === "fulfilled" ? usersRes.value.data : null;

      const bookingList: Array<Record<string, unknown>> = bookings?.bookings ?? [];

      // Compute total revenue from PAID bookings
      const revenue = bookingList.reduce(
        (sum: number, b: Record<string, unknown>) =>
          sum + (b.payment_status === "PAID" ? Number(b.total_price) : 0),
        0
      );

      // Compute last 7 days revenue
      const now = new Date();
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const revenueLast7Days = bookingList.reduce(
        (sum: number, b: Record<string, unknown>) => {
          const created = new Date(b.created_at as string);
          return sum + (created >= last7Days && b.payment_status === "PAID" ? Number(b.total_price) : 0);
        },
        0
      );

      // Build revenue by day (last 7 days)
      const revenueByDay: RevenueBar[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = d.toISOString().split("T")[0];
        const dayBookings = bookingList.filter((b: Record<string, unknown>) => {
          const created = (b.created_at as string)?.split("T")[0];
          return created === dateStr;
        });
        const dayRevenue = dayBookings.reduce(
          (sum: number, b: Record<string, unknown>) =>
            sum + (b.payment_status === "PAID" ? Number(b.total_price) : 0),
          0
        );
        revenueByDay.push({
          date: dateStr,
          label: d.toLocaleDateString("vi-VN", { weekday: "short", day: "numeric", month: "short" }),
          revenue: dayRevenue,
          bookings: dayBookings.length,
        });
      }

      // Top 5 tours by booking count (simulated — use recent bookings)
      const tourCountMap: Record<string, { name: string; count: number; revenue: number }> = {};
      for (const b of bookingList) {
        const tour = b.tour as Record<string, unknown>;
        if (tour?.id) {
          const existing = tourCountMap[tour.id as string] ?? {
            name: tour.name as string,
            count: 0,
            revenue: 0,
          };
          existing.count += 1;
          if (b.payment_status === "PAID") existing.revenue += Number(b.total_price) ?? 0;
          tourCountMap[tour.id as string] = existing;
        }
      }
      const topTours = Object.entries(tourCountMap)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Today stats
      const todayStr = now.toISOString().split("T")[0];
      const todayBookings = bookingList.filter(
        (b: Record<string, unknown>) => (b.created_at as string)?.startsWith(todayStr)
      ).length;
      const todayRevenue = bookingList
        .filter(
          (b: Record<string, unknown>) =>
            (b.created_at as string)?.startsWith(todayStr) && b.payment_status === "PAID"
        )
        .reduce((sum: number, b: Record<string, unknown>) => sum + Number(b.total_price), 0);

      setStats({
        totalTours: tours?.total ?? 0,
        totalBookings: bookings?.total ?? 0,
        totalUsers: Array.isArray(users) ? users.length : 0,
        revenue,
        revenueLast7Days,
        recentBookings: bookingList.slice(0, 8),
        revenueByDay,
        topTours,
      });
    } catch (err) {
      console.error("Failed to fetch dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const activityItems = buildActivityFromBookings(stats.recentBookings);

  const statCards = [
    {
      title: "Tổng doanh thu",
      value: formatPrice(stats.revenue),
      subtitle: "Tất cả thời gian",
      icon: DollarSign,
      bg: "bg-[#FEF3C7] text-[#D97706]",
      href: "/admin/bookings",
    },
    {
      title: "Doanh thu 7 ngày",
      value: formatPrice(stats.revenueLast7Days),
      subtitle: "7 ngày gần nhất",
      icon: TrendingUp,
      bg: "bg-[#DCFCE7] text-[#16A34A]",
      href: "/admin/bookings",
    },
    {
      title: "Tổng Tours",
      value: stats.totalTours.toLocaleString(),
      icon: Map,
      bg: "bg-[#EDE9FE] text-[#0046C1]",
      href: "/admin/tours",
    },
    {
      title: "Tổng Users",
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      bg: "bg-[#D9EEFF] text-[#0391FF]",
      href: "/admin/users",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#0046C1]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#000E1A]">Dashboard</h1>
          <p className="text-sm text-[#636363] mt-0.5">
            Tổng quan hệ thống TravelGPT
          </p>
        </div>
        <Link href="/chat">
          <Button size="sm" className="gap-2">
            <Bot className="w-4 h-4" />
            Mở AI Chat
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Revenue Chart + Activity Feed */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 p-6 border border-[#DDDDDD]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-[16px] text-[#000E1A]">Doanh thu 7 ngày gần nhất</h2>
              <p className="text-[12px] text-[#636363] mt-0.5">
                Tổng: {formatPrice(stats.revenueLast7Days)} · {stats.recentBookings.length} đơn
              </p>
            </div>
            <Link href="/admin/bookings">
              <Button variant="ghost" size="sm" className="text-[#0046C1] gap-1">
                Chi tiết <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
          <RevenueChart data={stats.revenueByDay} />
        </Card>

        {/* Activity Feed */}
        <Card className="p-6 border border-[#DDDDDD]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[16px] text-[#000E1A]">Hoạt động gần đây</h2>
          </div>
          <ActivityFeed items={activityItems} className="max-h-[320px] overflow-y-auto" />
        </Card>
      </div>

      {/* Top Tours */}
      {stats.topTours.length > 0 && (
        <Card className="border border-[#DDDDDD]">
          <div className="flex items-center justify-between p-6 border-b border-[#DDDDDD]">
            <h2 className="font-bold text-[16px] text-[#000E1A]">Top Tours được đặt nhiều nhất</h2>
            <Link href="/admin/tours">
              <Button variant="ghost" size="sm" className="text-[#0046C1] gap-1">
                Tất cả <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-[#F3F4F6]">
            {stats.topTours.map((tour: Record<string, unknown>, idx: number) => (
              <div
                key={tour.id as string}
                className="flex items-center justify-between p-4 hover:bg-[#FAFAFA] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-[13px]"
                    style={{
                      background: `linear-gradient(135deg, ${PRIMARY}, ${ACCENT})`,
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-[14px] text-[#000E1A]">{tour.name as string}</p>
                    <p className="text-[12px] text-[#636363]">{tour.count as number} đơn đặt</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[14px] text-[#0046C1]">
                    {formatPrice((tour.revenue as number) ?? 0)}
                  </p>
                  <p className="text-[11px] text-[#636363]">doanh thu</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Bookings */}
      <Card className="border border-[#DDDDDD]">
        <div className="flex items-center justify-between p-6 border-b border-[#DDDDDD]">
          <h2 className="font-bold text-[16px] text-[#000E1A]">Đơn đặt tour gần đây</h2>
          <Link href="/admin/bookings">
            <Button variant="ghost" size="sm" className="text-[#0046C1] gap-1">
              Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        <div className="divide-y divide-[#F3F4F6]">
          {stats.recentBookings.length === 0 ? (
            <div className="p-8 text-center">
              <EmptyState
                icon={Calendar}
                title="Chưa có đơn đặt tour nào"
                description="Các đơn đặt tour sẽ xuất hiện tại đây khi có khách đặt tour."
              />
            </div>
          ) : (
            stats.recentBookings.map((booking: Record<string, unknown>) => (
              <div
                key={booking.id as string}
                className="flex items-center justify-between p-4 hover:bg-[#FAFAFA] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[#000E1A] truncate">
                    {booking.booking_code as string}
                  </p>
                  <p className="text-xs text-[#636363] mt-0.5 truncate">
                    {(booking.tour as Record<string, unknown>)?.name
                      ? `${(booking.tour as Record<string, unknown>).name as string} — `
                      : ""}
                    {(booking.contact_name as string) || "Khách lẻ"}
                  </p>
                  <p className="text-xs text-[#636363]">
                    {booking.created_at ? formatDate(booking.created_at as string) : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <div className="text-right">
                    <p className="font-bold text-sm text-[#000E1A]">
                      {formatPrice(Number(booking.total_price))}
                    </p>
                    <StatusBadge status={booking.status as string} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
