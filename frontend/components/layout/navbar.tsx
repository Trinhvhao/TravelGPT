"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuthStore } from "@/stores";
import { Button } from "@/components/ui/button";
import {
  Bot,
  Map,
  Calendar,
  MessageSquare,
  User,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Trang chủ", href: "/", icon: Globe },
  { name: "Tours", href: "/tours", icon: Map },
  { name: "AI Chat", href: "/chat", icon: Bot },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* ── Desktop / Mobile Top Bar ─────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 bg-white border-b border-[#DDDDDD]"
      >
        <div className="container-page h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 bg-[#0046C1] flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-extrabold text-[#000E1A] tracking-tight">
              TravelGPT
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <button
                    className={cn(
                      "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 cursor-pointer",
                      isActive
                        ? "text-[#0046C1] border-b-2 border-[#0046C1]"
                        : "text-[#000E1A] hover:text-[#0391FF]"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </button>
                </Link>
              );
            })}
          </nav>

          {/* Auth */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            {isAuthenticated ? (
              <>
                <Link href="/bookings">
                  <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#000E1A] hover:text-[#0391FF] transition-all duration-200 cursor-pointer">
                    <Calendar className="w-4 h-4" />
                    Đặt tour
                  </button>
                </Link>
                {user?.role === "ADMIN" && (
                  <Link href="/admin">
                    <Button variant="outline" size="sm" className="gap-2">
                      <LayoutDashboard className="w-4 h-4" />
                      Admin
                    </Button>
                  </Link>
                )}
                <Link href="/profile">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User className="w-4 h-4" />
                    {user?.full_name || "Tài khoản"}
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Đăng nhập
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">
                    Đăng ký
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            className="lg:hidden inline-flex items-center justify-center bg-transparent hover:bg-[#F7F7F7] active:bg-[#DDDDDD] transition-colors cursor-pointer"
            style={{ width: 44, height: 44, padding: 12 }}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Mở menu"
          >
            {mobileOpen ? (
              <X className="w-5 h-5 text-[#000E1A]" />
            ) : (
              <Menu className="w-5 h-5 text-[#000E1A]" />
            )}
          </button>
        </div>
      </header>

      {/* ── Mobile Drawer ──────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-x-0 top-16 z-50 lg:hidden bg-white border-b border-[#DDDDDD] shadow-modal animate-slide-up">
          <div className="container-page py-4 flex flex-col gap-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href} onClick={() => setMobileOpen(false)}>
                  <button
                    className={cn(
                      "w-full text-left inline-flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 cursor-pointer",
                      isActive
                        ? "text-[#0046C1] border-b-2 border-[#0046C1]"
                        : "text-[#000E1A] hover:text-[#0391FF]"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </button>
                </Link>
              );
            })}

            <Link href="/bookings" onClick={() => setMobileOpen(false)}>
              <button className="w-full text-left inline-flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#000E1A] hover:text-[#0391FF] transition-all duration-200 cursor-pointer">
                <Calendar className="w-5 h-5" />
                Đặt tour
              </button>
            </Link>

            {/* Auth divider */}
            <div className="border-t border-[#DDDDDD] my-2" />
            {isAuthenticated ? (
              <div className="flex flex-col gap-1">
                {user?.role === "ADMIN" && (
                  <Link href="/admin" onClick={() => setMobileOpen(false)}>
                    <button className="w-full text-left inline-flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#000E1A] hover:text-[#0391FF] transition-all duration-200 cursor-pointer">
                      <LayoutDashboard className="w-5 h-5" />
                      Quản trị
                    </button>
                  </Link>
                )}
                <Link href="/profile" onClick={() => setMobileOpen(false)}>
                  <button className="w-full text-left inline-flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#000E1A] hover:text-[#0391FF] transition-all duration-200 cursor-pointer">
                    <User className="w-5 h-5" />
                    {user?.full_name || "Tài khoản"}
                  </button>
                </Link>
                <button
                  className="w-full text-left inline-flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#ED1D24] hover:bg-[#FFE5E3] transition-all duration-200 cursor-pointer"
                  onClick={() => { logout(); setMobileOpen(false); }}
                >
                  <LogOut className="w-5 h-5" />
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  <button className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold border border-[#DDDDDD] text-[#000E1A] hover:border-[#0391FF] hover:text-[#0391FF] transition-all duration-200 cursor-pointer">
                    Đăng nhập
                  </button>
                </Link>
                <Link href="/register" onClick={() => setMobileOpen(false)}>
                  <button className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold bg-[#0046C1] text-white hover:bg-[#002540] transition-all duration-200 cursor-pointer">
                    Đăng ký
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
