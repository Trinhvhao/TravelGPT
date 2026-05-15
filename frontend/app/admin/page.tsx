"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { AdminStats } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatPrice, formatDate } from "@/lib/utils";
import {
  Map,
  Calendar,
  Users,
  TrendingUp,
  DollarSign,
  Loader2,
  ArrowRight,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <Card className="p-6 border border-[#DDDDDD] hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-[#636363]">{title}</p>
          <p className="text-2xl font-extrabold text-[#000E1A]">{value}</p>
          {subtitle && (
            <p className="text-xs text-[#636363]">{subtitle}</p>
          )}
        </div>
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
            color
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: "success" | "warning" | "destructive" | "neutral" | "secondary"; label: string }> = {
    PENDING:    { variant: "warning", label: "Đang chờ" },
    CONFIRMED:  { variant: "success", label: "Đã xác nhận" },
    CANCELLED:  { variant: "destructive", label: "Đã hủy" },
    COMPLETED:  { variant: "secondary", label: "Hoàn thành" },
  };
  const s = map[status] ?? { variant: "neutral" as const, label: status };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<{
    totalTours: number;
    totalBookings: number;
    totalUsers: number;
    revenue: number;
    recentBookings: Array<Record<string, unknown>>;
  }>({
    totalTours: 0,
    totalBookings: 0,
    totalUsers: 0,
    revenue: 0,
    recentBookings: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [toursRes, bookingsRes, usersRes] = await Promise.allSettled([
        api.get("/tours?page_size=1"),
        api.get("/bookings/admin/all?page_size=5"),
        api.get("/users"),
      ]);

      const tours = toursRes.status === "fulfilled" ? toursRes.value.data : null;
      const bookings = bookingsRes.status === "fulfilled" ? bookingsRes.value.data : null;
      const users = usersRes.status === "fulfilled" ? usersRes.value.data : null;

      const bookingList = bookings?.bookings ?? [];
      const revenue = bookingList.reduce(
        (sum: number, b: { payment_status?: string; total_price?: string | number }) =>
          sum + (b.payment_status === "PAID" ? Number(b.total_price) : 0),
        0
      );

      setStats({
        totalTours: tours?.total ?? 0,
        totalBookings: bookings?.total ?? 0,
        totalUsers: Array.isArray(users) ? users.length : 0,
        revenue,
        recentBookings: bookingList.slice(0, 5),
      });
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Tổng số Tours",
      value: stats.totalTours.toLocaleString(),
      icon: Map,
      color: "bg-[#EDE9FE] text-[#0046C1]",
      href: "/admin/tours",
    },
    {
      title: "Tổng Bookings",
      value: stats.totalBookings.toLocaleString(),
      icon: Calendar,
      color: "bg-[#DCFCE7] text-[#16A34A]",
      href: "/admin/bookings",
    },
    {
      title: "Tổng Users",
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: "bg-[#D9EEFF] text-[#0391FF]",
      href: "/admin/users",
    },
    {
      title: "Doanh thu",
      value: formatPrice(stats.revenue),
      subtitle: "Đã thanh toán",
      icon: DollarSign,
      color: "bg-[#FEF3C7] text-[#D97706]",
      href: "/admin/bookings",
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Link key={stat.href} href={stat.href}>
            <StatCard
              title={stat.title}
              value={stat.value}
              subtitle={stat.subtitle}
              icon={stat.icon}
              color={stat.color}
            />
          </Link>
        ))}
      </div>

      {/* Recent Bookings */}
      <Card className="border border-[#DDDDDD]">
        <div className="flex items-center justify-between p-6 border-b border-[#DDDDDD]">
          <h2 className="font-bold text-[#000E1A]">Đơn đặt tour gần đây</h2>
          <Link href="/admin/bookings">
            <Button variant="ghost" size="sm" className="gap-1.5 text-[#0046C1]">
              Xem tất cả
              <ArrowRight className="w-3.5 h-3.5" />
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
                    {booking.created_at
                      ? formatDate(booking.created_at as string)
                      : ""}
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

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            title: "Quản lý Tours",
            description: "Thêm, sửa, xóa tour du lịch",
            href: "/admin/tours",
            icon: Map,
            color: "bg-[#EDE9FE] text-[#0046C1]",
          },
          {
            title: "Quản lý Bookings",
            description: "Xem và xử lý đơn đặt tour",
            href: "/admin/bookings",
            icon: Calendar,
            color: "bg-[#DCFCE7] text-[#16A34A]",
          },
          {
            title: "Quản lý Users",
            description: "Quản lý tài khoản người dùng",
            href: "/admin/users",
            icon: Users,
            color: "bg-[#D9EEFF] text-[#0391FF]",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <Card className="p-5 border border-[#DDDDDD] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", item.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#000E1A] group-hover:text-[#0046C1] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#636363] mt-0.5">{item.description}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#636363] ml-auto group-hover:text-[#0046C1] transition-colors flex-shrink-0 mt-1" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
