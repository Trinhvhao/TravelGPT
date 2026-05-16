"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useAuthStore, useUIStore } from "@/stores";
import {
  Bot,
  Map,
  Calendar,
  User,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
  Globe,
  ChevronDown,
  Search,
  Heart,
  Bell,
  Sun,
  Moon,
  Ticket,
  Settings,
  AlertCircle,
  Zap,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Trang chủ", href: "/", icon: Globe },
  { name: "Tours", href: "/tours", icon: Map },
  { name: "AI Chat", href: "/chat", icon: Bot },
];

const notifIcons = {
  booking: Ticket,
  promo: Zap,
  system: Info,
};

const notifColors = {
  booking: "text-[#0046C1] bg-[#E6F0FF]",
  promo: "text-[#F8C700] bg-[#FFF3B3]",
  system: "text-[#636363] bg-[#F7F7F7]",
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { theme, toggleTheme, language, toggleLanguage, notifications, unreadCount, markAsRead, markAllAsRead } =
    useUIStore();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Apply dark class on mount & theme change
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/tours?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <>
      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#DDDDDD] shadow-raised transition-colors duration-300 dark:bg-[#0a0a0a]/95 dark:border-[#2a2a2a]">
        <div className="container-page h-16 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 bg-gradient-to-br from-[#0046C1] to-[#0391FF] rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-200 dark:from-[#1a56db] dark:to-[#38bdf8]">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-extrabold text-[#000E1A] tracking-tight dark:text-white">
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
                      "group relative inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer",
                      isActive
                        ? "text-[#0046C1] bg-[#E6F0FF] dark:text-[#60a5fa] dark:bg-[#1e3a5f]"
                        : "text-[#636363] hover:text-[#0046C1] hover:bg-[#F7F7F7] dark:text-[#a1a1aa] dark:hover:text-[#60a5fa] dark:hover:bg-[#1a1a1a]"
                    )}
                  >
                    <Icon className={cn(
                      "w-4 h-4 transition-transform duration-200",
                      isActive ? "text-[#0046C1] dark:text-[#60a5fa]" : "text-[#999999] group-hover:text-[#0046C1] group-hover:scale-110 dark:text-[#71717a] dark:group-hover:text-[#60a5fa]"
                    )} />
                    {item.name}
                    {isActive && (
                      <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#0046C1] rounded-full dark:bg-[#60a5fa]" />
                    )}
                  </button>
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Search */}
            <div className="relative" ref={searchRef}>
              <button
                onClick={() => setSearchOpen((v) => !v)}
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-[#636363] hover:text-[#0046C1] hover:bg-[#F7F7F7] transition-all duration-200 cursor-pointer dark:text-[#a1a1aa] dark:hover:text-[#60a5fa] dark:hover:bg-[#1a1a1a]"
                aria-label="Tìm kiếm"
              >
                <Search className="w-5 h-5" />
              </button>
              {searchOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-elevated border border-[#DDDDDD] p-3 z-50 animate-fade-in dark:bg-[#1a1a1a] dark:border-[#2a2a2a]">
                  <form onSubmit={handleSearch} className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999] dark:text-[#71717a]" />
                      <input
                        autoFocus
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm tour, điểm đến..."
                        className="w-full pl-9 pr-4 py-2.5 text-sm bg-[#F7F7F7] border border-[#DDDDDD] rounded-xl focus:outline-none focus:border-[#0046C1] focus:ring-2 focus:ring-[#0046C1]/10 transition-all dark:bg-[#262626] dark:border-[#3a3a3a] dark:text-white dark:placeholder-[#71717a] dark:focus:border-[#60a5fa] dark:focus:ring-[#60a5fa]/10"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2.5 text-sm font-semibold text-white bg-[#0046C1] rounded-xl hover:bg-[#002540] transition-colors cursor-pointer dark:bg-[#1d4ed8] dark:hover:bg-[#1e40af]"
                    >
                      Tìm
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Wishlist */}
            <Link href="/wishlist">
              <button
                className="relative inline-flex items-center justify-center w-10 h-10 rounded-xl text-[#636363] hover:text-[#ED1D24] hover:bg-[#FFE5E3] transition-all duration-200 cursor-pointer dark:text-[#a1a1aa] dark:hover:text-[#f87171] dark:hover:bg-[#2a1a1a]"
                aria-label="Tour đã lưu"
              >
                <Heart className="w-5 h-5" />
              </button>
            </Link>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className="relative inline-flex items-center justify-center w-10 h-10 rounded-xl text-[#636363] hover:text-[#0046C1] hover:bg-[#F7F7F7] transition-all duration-200 cursor-pointer dark:text-[#a1a1aa] dark:hover:text-[#60a5fa] dark:hover:bg-[#1a1a1a]"
                aria-label="Thông báo"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#ED1D24] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-elevated border border-[#DDDDDD] z-50 animate-fade-in dark:bg-[#1a1a1a] dark:border-[#2a2a2a]">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#DDDDDD] dark:border-[#2a2a2a]">
                    <h3 className="text-sm font-bold text-[#000E1A] dark:text-white">Thông báo</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-[#0046C1] hover:underline cursor-pointer dark:text-[#60a5fa]"
                      >
                        Đánh dấu đã đọc
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-sm text-[#999999] dark:text-[#71717a]">
                        Chưa có thông báo nào
                      </div>
                    ) : (
                      notifications.map((notif) => {
                        const Icon = notifIcons[notif.type] || Bell;
                        const colorClass = notifColors[notif.type];
                        return (
                          <button
                            key={notif.id}
                            onClick={() => markAsRead(notif.id)}
                            className={cn(
                              "w-full text-left px-4 py-3 border-b border-[#F7F7F7] hover:bg-[#F7F7F7] transition-colors cursor-pointer dark:border-[#2a2a2a] dark:hover:bg-[#262626]",
                              !notif.read && "bg-[#E6F0FF]/30 dark:bg-[#1e3a5f]/30"
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", colorClass)}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold text-[#000E1A] dark:text-white truncate">
                                    {notif.title}
                                  </p>
                                  {!notif.read && (
                                    <span className="w-2 h-2 bg-[#ED1D24] rounded-full shrink-0" />
                                  )}
                                </div>
                                <p className="text-xs text-[#636363] mt-0.5 line-clamp-2 dark:text-[#a1a1aa]">
                                  {notif.message}
                                </p>
                                <p className="text-[10px] text-[#999999] mt-1 dark:text-[#71717a]">
                                  {notif.time}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                  <div className="px-4 py-3 border-t border-[#DDDDDD] dark:border-[#2a2a2a]">
                    <Link href="/notifications" onClick={() => setNotifOpen(false)}>
                      <button className="w-full text-center text-sm text-[#0046C1] font-semibold hover:underline cursor-pointer dark:text-[#60a5fa]">
                        Xem tất cả thông báo
                      </button>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-full border border-[#DDDDDD] text-[#636363] hover:border-[#0046C1] hover:text-[#0046C1] transition-all duration-200 cursor-pointer dark:border-[#3a3a3a] dark:text-[#a1a1aa] dark:hover:border-[#60a5fa] dark:hover:text-[#60a5fa]"
              aria-label="Chuyển ngôn ngữ"
            >
              <Globe className="w-3.5 h-3.5" />
              {language === "vi" ? "VI" : "EN"}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-[#636363] hover:text-[#F8C700] hover:bg-[#FFF3B3] transition-all duration-200 cursor-pointer dark:text-[#a1a1aa] dark:hover:text-[#fbbf24] dark:hover:bg-[#2a2410]"
              aria-label={theme === "dark" ? "Chế độ sáng" : "Chế độ tối"}
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {/* Auth Section */}
            <div className="hidden lg:flex items-center gap-2 ml-1">
              {isAuthenticated ? (
                <>
                  <Link href="/bookings">
                    <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#636363] hover:text-[#0046C1] hover:bg-[#F7F7F7] rounded-xl transition-all duration-200 cursor-pointer dark:text-[#a1a1aa] dark:hover:text-[#60a5fa] dark:hover:bg-[#1a1a1a]">
                      <Calendar className="w-4 h-4" />
                      Đặt tour
                    </button>
                  </Link>

                  {/* User Menu */}
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setUserMenuOpen((v) => !v)}
                      className={cn(
                        "inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer",
                        userMenuOpen
                          ? "bg-[#F7F7F7] text-[#0046C1] dark:bg-[#1a1a1a] dark:text-[#60a5fa]"
                          : "text-[#636363] hover:bg-[#F7F7F7] hover:text-[#0046C1] dark:text-[#a1a1aa] dark:hover:bg-[#1a1a1a] dark:hover:text-[#60a5fa]"
                      )}
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0046C1] to-[#0391FF] flex items-center justify-center dark:from-[#1d4ed8] dark:to-[#38bdf8]">
                        <User className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="max-w-[100px] truncate hidden xl:block">
                        {user?.full_name || "Tài khoản"}
                      </span>
                      <ChevronDown className={cn(
                        "w-4 h-4 transition-transform duration-200",
                        userMenuOpen && "rotate-180"
                      )} />
                    </button>

                    {userMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setUserMenuOpen(false)}
                        />
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-elevated border border-[#DDDDDD] py-2 z-50 animate-fade-in dark:bg-[#1a1a1a] dark:border-[#2a2a2a]">
                          <div className="px-4 py-2.5 border-b border-[#DDDDDD] dark:border-[#2a2a2a]">
                            <p className="text-sm font-bold text-[#000E1A] truncate dark:text-white">
                              {user?.full_name || "Tài khoản"}
                            </p>
                            <p className="text-xs text-[#999999] truncate dark:text-[#71717a]">
                              {user?.email}
                            </p>
                          </div>

                          {user?.role === "ADMIN" && (
                            <Link href="/admin" onClick={() => setUserMenuOpen(false)}>
                              <button className="w-full inline-flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#636363] hover:text-[#0046C1] hover:bg-[#F7F7F7] transition-all duration-200 cursor-pointer dark:text-[#a1a1aa] dark:hover:text-[#60a5fa] dark:hover:bg-[#262626]">
                                <LayoutDashboard className="w-4 h-4" />
                                Quản trị
                              </button>
                            </Link>
                          )}

                          <Link href="/profile" onClick={() => setUserMenuOpen(false)}>
                            <button className="w-full inline-flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#636363] hover:text-[#0046C1] hover:bg-[#F7F7F7] transition-all duration-200 cursor-pointer dark:text-[#a1a1aa] dark:hover:text-[#60a5fa] dark:hover:bg-[#262626]">
                              <User className="w-4 h-4" />
                              Hồ sơ
                            </button>
                          </Link>

                          <Link href="/wishlist" onClick={() => setUserMenuOpen(false)}>
                            <button className="w-full inline-flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#636363] hover:text-[#ED1D24] hover:bg-[#FFE5E3] transition-all duration-200 cursor-pointer dark:text-[#a1a1aa] dark:hover:text-[#f87171] dark:hover:bg-[#2a1a1a]">
                              <Heart className="w-4 h-4" />
                              Tour đã lưu
                            </button>
                          </Link>

                          <div className="border-t border-[#DDDDDD] my-1 dark:border-[#2a2a2a]" />

                          <button
                            onClick={() => { logout(); setUserMenuOpen(false); }}
                            className="w-full inline-flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#ED1D24] hover:bg-[#FFE5E3] transition-all duration-200 cursor-pointer dark:text-[#f87171] dark:hover:bg-[#2a1a1a]"
                          >
                            <LogOut className="w-4 h-4" />
                            Đăng xuất
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <button className="px-5 py-2.5 text-sm font-semibold text-[#0046C1] border-2 border-[#0046C1] rounded-full hover:bg-[#E6F0FF] active:bg-[#B3D1FF] transition-all duration-200 cursor-pointer hover:shadow-md active:scale-[0.98] dark:text-[#60a5fa] dark:border-[#60a5fa] dark:hover:bg-[#1e3a5f] dark:active:bg-[#1e3a5f]">
                      Đăng nhập
                    </button>
                  </Link>
                  <Link href="/register">
                    <button className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#0046C1] to-[#0391FF] rounded-full hover:shadow-lg hover:shadow-[#0046C1]/25 active:scale-[0.98] transition-all duration-200 cursor-pointer dark:from-[#1d4ed8] dark:to-[#38bdf8]">
                      Đăng ký
                    </button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Toggle */}
            <button
              className="lg:hidden inline-flex items-center justify-center bg-transparent hover:bg-[#F7F7F7] active:bg-[#DDDDDD] rounded-xl transition-colors cursor-pointer dark:hover:bg-[#1a1a1a] dark:active:bg-[#2a2a2a]"
              style={{ width: 44, height: 44 }}
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Mở menu"
            >
              {mobileOpen ? (
                <X className="w-5 h-5 text-[#000E1A] dark:text-white" />
              ) : (
                <Menu className="w-5 h-5 text-[#000E1A] dark:text-white" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Drawer ──────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-x-0 top-16 z-50 lg:hidden bg-white/95 backdrop-blur-md border-b border-[#DDDDDD] shadow-elevated animate-slide-down dark:bg-[#0a0a0a]/95 dark:border-[#2a2a2a]">
          <div className="container-page py-4 flex flex-col gap-1">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="mb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999] dark:text-[#71717a]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm tour, điểm đến..."
                  className="w-full pl-9 pr-4 py-3 text-sm bg-[#F7F7F7] border border-[#DDDDDD] rounded-xl focus:outline-none focus:border-[#0046C1] focus:ring-2 focus:ring-[#0046C1]/10 transition-all dark:bg-[#262626] dark:border-[#3a3a3a] dark:text-white dark:placeholder-[#71717a]"
                />
              </div>
            </form>

            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href} onClick={() => setMobileOpen(false)}>
                  <button
                    className={cn(
                      "w-full text-left inline-flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer",
                      isActive
                        ? "text-[#0046C1] bg-[#E6F0FF] dark:text-[#60a5fa] dark:bg-[#1e3a5f]"
                        : "text-[#636363] hover:text-[#0046C1] hover:bg-[#F7F7F7] dark:text-[#a1a1aa] dark:hover:text-[#60a5fa] dark:hover:bg-[#1a1a1a]"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </button>
                </Link>
              );
            })}

            <Link href="/bookings" onClick={() => setMobileOpen(false)}>
              <button className="w-full text-left inline-flex items-center gap-3 px-4 py-3 text-sm font-semibold text-[#636363] hover:text-[#0046C1] hover:bg-[#F7F7F7] rounded-xl transition-all duration-200 cursor-pointer dark:text-[#a1a1aa] dark:hover:text-[#60a5fa] dark:hover:bg-[#1a1a1a]">
                <Calendar className="w-5 h-5" />
                Đặt tour
              </button>
            </Link>

            <Link href="/wishlist" onClick={() => setMobileOpen(false)}>
              <button className="w-full text-left inline-flex items-center gap-3 px-4 py-3 text-sm font-semibold text-[#636363] hover:text-[#ED1D24] hover:bg-[#FFE5E3] rounded-xl transition-all duration-200 cursor-pointer dark:text-[#a1a1aa] dark:hover:text-[#f87171] dark:hover:bg-[#2a1a1a]">
                <Heart className="w-5 h-5" />
                Tour đã lưu
              </button>
            </Link>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 px-4 py-2">
              <button
                onClick={toggleTheme}
                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-full border border-[#DDDDDD] text-[#636363] hover:border-[#0046C1] hover:text-[#0046C1] transition-all duration-200 cursor-pointer dark:border-[#3a3a3a] dark:text-[#a1a1aa] dark:hover:border-[#60a5fa] dark:hover:text-[#60a5fa]"
              >
                {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                {theme === "dark" ? "Chế độ sáng" : "Chế độ tối"}
              </button>
              <button
                onClick={toggleLanguage}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold rounded-full border border-[#DDDDDD] text-[#636363] hover:border-[#0046C1] hover:text-[#0046C1] transition-all duration-200 cursor-pointer dark:border-[#3a3a3a] dark:text-[#a1a1aa] dark:hover:border-[#60a5fa] dark:hover:text-[#60a5fa]"
              >
                <Globe className="w-3.5 h-3.5" />
                {language === "vi" ? "English" : "Tiếng Việt"}
              </button>
            </div>

            {/* Auth divider */}
            <div className="border-t border-[#DDDDDD] my-2 dark:border-[#2a2a2a]" />
            {isAuthenticated ? (
              <div className="flex flex-col gap-1">
                {user?.role === "ADMIN" && (
                  <Link href="/admin" onClick={() => setMobileOpen(false)}>
                    <button className="w-full text-left inline-flex items-center gap-3 px-4 py-3 text-sm font-semibold text-[#636363] hover:text-[#0046C1] hover:bg-[#F7F7F7] rounded-xl transition-all duration-200 cursor-pointer dark:text-[#a1a1aa] dark:hover:text-[#60a5fa] dark:hover:bg-[#1a1a1a]">
                      <LayoutDashboard className="w-5 h-5" />
                      Quản trị
                    </button>
                  </Link>
                )}
                <Link href="/profile" onClick={() => setMobileOpen(false)}>
                  <button className="w-full text-left inline-flex items-center gap-3 px-4 py-3 text-sm font-semibold text-[#636363] hover:text-[#0046C1] hover:bg-[#F7F7F7] rounded-xl transition-all duration-200 cursor-pointer dark:text-[#a1a1aa] dark:hover:text-[#60a5fa] dark:hover:bg-[#1a1a1a]">
                    <User className="w-5 h-5" />
                    {user?.full_name || "Tài khoản"}
                  </button>
                </Link>
                <button
                  className="w-full text-left inline-flex items-center gap-3 px-4 py-3 text-sm font-semibold text-[#ED1D24] hover:bg-[#FFE5E3] rounded-xl transition-all duration-200 cursor-pointer dark:text-[#f87171] dark:hover:bg-[#2a1a1a]"
                  onClick={() => { logout(); setMobileOpen(false); }}
                >
                  <LogOut className="w-5 h-5" />
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 pt-2">
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  <button className="w-full inline-flex items-center justify-center px-5 py-3 text-sm font-semibold text-[#0046C1] border-2 border-[#0046C1] rounded-full hover:bg-[#E6F0FF] active:bg-[#B3D1FF] transition-all duration-200 cursor-pointer dark:text-[#60a5fa] dark:border-[#60a5fa] dark:hover:bg-[#1e3a5f]">
                    Đăng nhập
                  </button>
                </Link>
                <Link href="/register" onClick={() => setMobileOpen(false)}>
                  <button className="w-full inline-flex items-center justify-center px-5 py-3 text-sm font-semibold text-white bg-gradient-to-r from-[#0046C1] to-[#0391FF] rounded-full hover:shadow-lg transition-all duration-200 cursor-pointer dark:from-[#1d4ed8] dark:to-[#38bdf8]">
                    Đăng ký
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-down { animation: slide-down 0.2s ease-out; }
        .animate-fade-in { animation: fade-in 0.15s ease-out; }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </>
  );
}
