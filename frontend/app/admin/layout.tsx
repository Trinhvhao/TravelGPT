"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Globe,
  LayoutDashboard,
  Map,
  Calendar,
  Users,
  LogOut,
  Menu,
  X,
  ChevronLeft,
} from "lucide-react";

const adminNav = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Quản lý Tours", href: "/admin/tours", icon: Map },
  { name: "Quản lý Bookings", href: "/admin/bookings", icon: Calendar },
  { name: "Quản lý Users", href: "/admin/users", icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auth guard
  if (isAuthenticated && user?.role !== "ADMIN") {
    router.push("/");
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className="min-h-screen flex bg-[#FAFAFA]">
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-[#DDDDDD] flex flex-col",
          "transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#DDDDDD]">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0046C1] flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-base font-extrabold text-[#000E1A]">TravelGPT</span>
              <p className="text-[10px] text-[#636363] -mt-0.5">Admin Panel</p>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-[#D9EEFF] transition-colors cursor-pointer"
            aria-label="Đóng sidebar"
          >
            <X className="w-5 h-5 text-[#636363]" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {adminNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
                <button
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer",
                    isActive
                      ? "bg-[#D9EEFF] text-[#0046C1] font-semibold shadow-sm"
                      : "text-[#636363] hover:bg-[#D9EEFF]/50 hover:text-[#000E1A]"
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {item.name}
                </button>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 space-y-1 border-t border-[#DDDDDD]">
          <Link href="/" onClick={() => setSidebarOpen(false)}>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[#636363] hover:bg-[#D9EEFF]/50 hover:text-[#000E1A] transition-all duration-200 cursor-pointer">
              <ChevronLeft className="w-5 h-5" />
              Quay về website
            </button>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[#EF4444] hover:bg-[#FEE2E2] transition-all duration-200 cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* ── Mobile overlay ──────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Main Content ────────────────────────────────────────── */}
      <div className="flex-1 lg:ml-64 flex flex-col">
        {/* Top bar (mobile) */}
        <div className="lg:hidden flex items-center gap-3 p-4 bg-white border-b border-[#DDDDDD]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-[#D9EEFF] transition-colors cursor-pointer"
            aria-label="Mở menu"
          >
            <Menu className="w-5 h-5 text-[#000E1A]" />
          </button>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0046C1] flex items-center justify-center">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-[#000E1A]">TravelGPT</span>
          </Link>
        </div>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
