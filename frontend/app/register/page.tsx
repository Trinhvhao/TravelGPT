"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/stores";
import { authApi } from "@/lib/auth-api";
import { Eye, EyeOff, Loader2, Check, Plane, MapPin, Star } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.password) {
      toast.error("Vui lòng nhập đầy đủ thông tin bắt buộc");
      return;
    }
    if (!agreed) {
      toast.error("Vui lòng đồng ý với Điều khoản sử dụng");
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    setLoading(true);
    try {
      const response = await authApi.register({
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        phone: form.phone || undefined,
      });
      setUser(response.user);
      toast.success("Đăng ký thành công!");
      router.push("/");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      toast.error(error.response?.data?.detail || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ─── LEFT — Travel Hero Panel ─────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-[#000E1A]">

        {/* Background image with overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1200&q=80')",
          }}
        />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#000E1A]/80 via-[#000E1A]/50 to-[#0046C1]/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#000E1A]/60 via-transparent to-[#000E1A]/30" />

        {/* Decorative floating orbs */}
        <div className="absolute top-16 left-12 w-24 h-24 rounded-full bg-[#0391FF]/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-24 right-16 w-32 h-32 rounded-full bg-[#0046C1]/20 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/3 right-20 w-16 h-16 rounded-full bg-[#FFD700]/10 blur-2xl animate-pulse" style={{ animationDelay: "2s" }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 w-full">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0391FF] to-[#0046C1] flex items-center justify-center shadow-lg">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-extrabold text-xl tracking-tight">TravelGPT</span>
          </div>

          {/* Main text */}
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-[#0391FF] text-sm font-semibold uppercase tracking-widest">
                Bắt đầu hành trình
              </p>
              <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight">
                Khám phá thế giới<br />
                <span className="bg-gradient-to-r from-[#0391FF] to-[#00D4AA] bg-clip-text text-transparent">
                  cùng TravelGPT
                </span>
              </h1>
              <p className="text-white/60 text-base xl:text-lg max-w-md leading-relaxed">
                Đăng ký tài khoản để nhận kế hoạch du lịch cá nhân hóa, gợi ý điểm đến độc đáo và trải nghiệm AI thông minh.
              </p>
            </div>

            {/* Feature chips */}
            <div className="flex flex-wrap gap-3">
              {[
                { icon: MapPin, label: "Hơn 10,000+ điểm đến" },
                { icon: Star, label: "Được yêu thích nhất" },
                { icon: Plane, label: "Lên kế hoạch tức thì" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white/90 text-sm font-medium"
                >
                  <Icon className="w-4 h-4 text-[#0391FF]" />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial */}
          <div className="space-y-3">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-4 h-4 fill-[#FFD700] text-[#FFD700]" />
              ))}
            </div>
            <p className="text-white/70 text-sm italic max-w-sm leading-relaxed">
              &ldquo;TravelGPT giúp tôi lên kế hoạch chuyến đi Đà Lạt trong 5 phút. Tuyệt vời!&rdquo;
            </p>
            <p className="text-white/50 text-xs">— Minh Anh, Hà Nội</p>
          </div>

        </div>

        {/* Bottom decorative gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#000E1A]/80 to-transparent" />
      </div>

      {/* ─── RIGHT — Register Form Panel ──────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-10 py-10 bg-white dark:bg-[#0a0a0a] overflow-y-auto">

        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0391FF] to-[#0046C1] flex items-center justify-center shadow-lg">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <span className="text-[#000E1A] dark:text-white font-extrabold text-xl tracking-tight">TravelGPT</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#000E1A] dark:text-white leading-tight">
              Tạo tài khoản mới
            </h1>
            <p className="text-[#636363] dark:text-[#a1a1aa] mt-2 text-sm sm:text-base">
              Tham gia cùng hàng nghìn du khách Việt Nam
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white dark:bg-[#111111] border border-[#DDDDDD] dark:border-[#2a2a2a] rounded-2xl p-6 sm:p-8 shadow-elevated">

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Full Name */}
              <div className="space-y-1.5">
                <label htmlFor="full_name" className="text-sm font-semibold text-[#000E1A] dark:text-white">
                  Họ và tên <span className="text-[#ED1D24]">*</span>
                </label>
                <div className="relative">
                  <input
                    id="full_name"
                    type="text"
                    autoComplete="name"
                    placeholder="Nguyễn Văn A"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    className="w-full px-4 py-3 pl-11 border border-[#DDDDDD] dark:border-[#3a3a3a] bg-[#F7F7F7] dark:bg-[#1a1a1a] dark:text-white dark:placeholder-[#71717a] text-sm text-[#000E1A] placeholder:text-[#999999] rounded-xl transition-all duration-200 focus:outline-none focus:border-[#0046C1] focus:bg-white dark:focus:bg-[#1e1e1e] focus:ring-2 focus:ring-[#0046C1]/10"
                    required
                  />
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                    <svg className="w-4 h-4 text-[#999999] dark:text-[#71717a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-semibold text-[#000E1A] dark:text-white">
                  Email <span className="text-[#ED1D24]">*</span>
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 pl-11 border border-[#DDDDDD] dark:border-[#3a3a3a] bg-[#F7F7F7] dark:bg-[#1a1a1a] dark:text-white dark:placeholder-[#71717a] text-sm text-[#000E1A] placeholder:text-[#999999] rounded-xl transition-all duration-200 focus:outline-none focus:border-[#0046C1] focus:bg-white dark:focus:bg-[#1e1e1e] focus:ring-2 focus:ring-[#0046C1]/10"
                    required
                  />
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                    <svg className="w-4 h-4 text-[#999999] dark:text-[#71717a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label htmlFor="phone" className="text-sm font-semibold text-[#000E1A] dark:text-white">
                  Số điện thoại <span className="text-xs text-[#999999] dark:text-[#71717a] font-normal">(tùy chọn)</span>
                </label>
                <div className="relative">
                  <input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="0901 234 567"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-3 pl-11 border border-[#DDDDDD] dark:border-[#3a3a3a] bg-[#F7F7F7] dark:bg-[#1a1a1a] dark:text-white dark:placeholder-[#71717a] text-sm text-[#000E1A] placeholder:text-[#999999] rounded-xl transition-all duration-200 focus:outline-none focus:border-[#0046C1] focus:bg-white dark:focus:bg-[#1e1e1e] focus:ring-2 focus:ring-[#0046C1]/10"
                  />
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                    <svg className="w-4 h-4 text-[#999999] dark:text-[#71717a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.99 12 19.79 19.79 0 0 1 1.93 3.5 2 2 0 0 1 3.9 1.35h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-semibold text-[#000E1A] dark:text-white">
                  Mật khẩu <span className="text-[#ED1D24]">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Ít nhất 6 ký tự"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-4 py-3 pl-11 pr-12 border border-[#DDDDDD] dark:border-[#3a3a3a] bg-[#F7F7F7] dark:bg-[#1a1a1a] dark:text-white dark:placeholder-[#71717a] text-sm text-[#000E1A] placeholder:text-[#999999] rounded-xl transition-all duration-200 focus:outline-none focus:border-[#0046C1] focus:bg-white dark:focus:bg-[#1e1e1e] focus:ring-2 focus:ring-[#0046C1]/10"
                    required
                  />
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                    <svg className="w-4 h-4 text-[#999999] dark:text-[#71717a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#636363] dark:text-[#71717a] hover:text-[#0046C1] dark:hover:text-[#60a5fa] transition-colors cursor-pointer"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="text-sm font-semibold text-[#000E1A] dark:text-white">
                  Xác nhận mật khẩu <span className="text-[#ED1D24]">*</span>
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Nhập lại mật khẩu"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 pl-11 pr-12 border border-[#DDDDDD] dark:border-[#3a3a3a] bg-[#F7F7F7] dark:bg-[#1a1a1a] dark:text-white dark:placeholder-[#71717a] text-sm text-[#000E1A] placeholder:text-[#999999] rounded-xl transition-all duration-200 focus:outline-none focus:border-[#0046C1] focus:bg-white dark:focus:bg-[#1e1e1e] focus:ring-2 focus:ring-[#0046C1]/10"
                    required
                  />
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                    <svg className={cn(
                      "w-4 h-4",
                      form.confirmPassword
                        ? form.confirmPassword === form.password
                          ? "text-[#77DD77]"
                          : "text-[#ED1D24]"
                        : "text-[#999999] dark:text-[#71717a]"
                    )} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {form.confirmPassword && form.confirmPassword === form.password ? (
                        <path d="M20 6 9 17l-5-5" />
                      ) : (
                        <>
                          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </>
                      )}
                    </svg>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#636363] dark:text-[#71717a] hover:text-[#0046C1] dark:hover:text-[#60a5fa] transition-colors cursor-pointer"
                    aria-label={showConfirm ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => setAgreed(!agreed)}
                  className={cn(
                    "mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 cursor-pointer",
                    agreed
                      ? "bg-[#0046C1] border-[#0046C1]"
                      : "border-[#DDDDDD] dark:border-[#3a3a3a] bg-transparent hover:border-[#0046C1]"
                  )}
                  aria-label="Đồng ý điều khoản"
                >
                  {agreed && <Check className="w-3 h-3 text-white" />}
                </button>
                <p className="text-xs text-[#636363] dark:text-[#71717a] leading-relaxed">
                  Tôi đồng ý với{" "}
                  <Link href="#" className="text-[#0046C1] dark:text-[#60a5fa] hover:underline font-medium">
                    Điều khoản sử dụng
                  </Link>
                  {" "}và{" "}
                  <Link href="#" className="text-[#0046C1] dark:text-[#60a5fa] hover:underline font-medium">
                    Chính sách bảo mật
                  </Link>
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "w-full h-12 text-sm font-bold text-white rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center gap-2",
                  loading
                    ? "bg-[#0046C1]/60 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#0046C1] to-[#0391FF] hover:shadow-xl hover:shadow-[#0046C1]/30 active:scale-[0.98]"
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang đăng ký...
                  </>
                ) : (
                  <>
                    <Plane className="w-4 h-4" />
                    Tạo tài khoản miễn phí
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative mt-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#DDDDDD] dark:border-[#2a2a2a]" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 text-xs text-[#999999] dark:text-[#71717a] bg-white dark:bg-[#111111]">
                  đã có tài khoản
                </span>
              </div>
            </div>

            {/* Login link */}
            <Link
              href="/login"
              className="mt-6 block w-full h-12 text-sm font-semibold text-[#0046C1] dark:text-[#60a5fa] border border-[#0046C1]/30 dark:border-[#60a5fa]/30 rounded-full flex items-center justify-center gap-2 hover:bg-[#0046C1]/5 dark:hover:bg-[#60a5fa]/10 transition-all duration-200"
            >
              Đăng nhập ngay
            </Link>

          </div>

          {/* Back to home */}
          <div className="text-center mt-6">
            <Link
              href="/"
              className="text-xs text-[#636363] dark:text-[#71717a] hover:text-[#0046C1] dark:hover:text-[#60a5fa] transition-colors"
            >
              ← Quay về trang chủ
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
