"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/stores";
import { authApi } from "@/lib/auth-api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eye, EyeOff, Loader2, Globe, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
      {/* ── Left: Branding ───────────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 bg-[#0046C1] p-12 relative overflow-hidden"
        aria-hidden="true"
      >
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 flex items-center justify-center">
            <Globe className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-extrabold text-white">TravelGPT</span>
        </div>

        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 text-sm text-white/80 border border-white/20">
              <Sparkles className="w-4 h-4" />
              Hơn 50,000+ khách hàng tin tưởng
            </div>
            <h1 className="text-4xl font-extrabold text-white leading-tight">
              Bắt đầu hành trình
              <br />
              <span className="text-white/80">du lịch thông minh</span>
            </h1>
            <p className="text-white/70 text-lg max-w-md leading-relaxed">
              Tạo tài khoản miễn phí để trò chuyện với AI, tìm và đặt tour
              du lịch hoàn hảo cho bạn.
            </p>
          </div>

          <div className="space-y-3">
            {[
              "AI gợi ý tour phù hợp ngân sách",
              "Đặt tour nhanh chóng chỉ vài giây",
              "Hỗ trợ hủy và đổi lịch linh hoạt",
            ].map((feat) => (
              <div key={feat} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-white/80 text-sm font-medium">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="relative overflow-hidden aspect-[16/9] shadow-floating">
            <Image
              src="https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800&q=80"
              alt="Hội An"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        </div>
      </div>

      {/* ── Right: Register Form ─────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-[#F7F7F7]">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-4">
            <div className="w-10 h-10 bg-[#0046C1] flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-extrabold text-[#000E1A]">TravelGPT</span>
          </div>

          {/* Header */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-[#D9EEFF] mb-4">
              <Sparkles className="w-7 h-7 text-[#0046C1]" />
            </div>
            <h2 className="text-2xl font-bold text-[#000E1A]">Tạo tài khoản mới</h2>
            <p className="text-sm text-[#4D4D4D]">
              Đăng ký miễn phí để bắt đầu trải nghiệm TravelGPT
            </p>
          </div>

          {/* Form */}
          <Card className="p-8 space-y-5">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label htmlFor="full_name" className="text-sm font-semibold text-[#000E1A]">
                  Họ và tên <span className="text-[#ED1D24]">*</span>
                </label>
                <input
                  id="full_name"
                  type="text"
                  autoComplete="name"
                  placeholder="Nguyễn Văn A"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full px-4 py-3 border border-[#DDDDDD] bg-[#F7F7F7] text-sm text-[#000E1A] placeholder:text-[#999999] transition-all duration-200 focus:outline-none focus:border-[#0391FF] focus:bg-white"
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-semibold text-[#000E1A]">
                  Email <span className="text-[#ED1D24]">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 border border-[#DDDDDD] bg-[#F7F7F7] text-sm text-[#000E1A] placeholder:text-[#999999] transition-all duration-200 focus:outline-none focus:border-[#0391FF] focus:bg-white"
                  required
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label htmlFor="phone" className="text-sm font-semibold text-[#000E1A]">
                  Số điện thoại <span className="text-xs text-[#636363]">(tùy chọn)</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="0901 234 567"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-[#DDDDDD] bg-[#F7F7F7] text-sm text-[#000E1A] placeholder:text-[#999999] transition-all duration-200 focus:outline-none focus:border-[#0391FF] focus:bg-white"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-semibold text-[#000E1A]">
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
                    className="w-full px-4 py-3 pr-12 border border-[#DDDDDD] bg-[#F7F7F7] text-sm text-[#000E1A] placeholder:text-[#999999] transition-all duration-200 focus:outline-none focus:border-[#0391FF] focus:bg-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#636363] hover:text-[#000E1A] transition-colors cursor-pointer"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="text-sm font-semibold text-[#000E1A]">
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
                    className="w-full px-4 py-3 pr-12 border border-[#DDDDDD] bg-[#F7F7F7] text-sm text-[#000E1A] placeholder:text-[#999999] transition-all duration-200 focus:outline-none focus:border-[#0391FF] focus:bg-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#636363] hover:text-[#000E1A] transition-colors cursor-pointer"
                    aria-label={showConfirm ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Terms */}
              <p className="text-xs text-[#636363] text-center">
                Bằng việc đăng ký, bạn đồng ý với{" "}
                <Link href="#" className="text-[#0046C1] hover:underline">Điều khoản sử dụng</Link>
                {" "}và{" "}
                <Link href="#" className="text-[#0046C1] hover:underline">Chính sách bảo mật</Link>
              </p>

              {/* Submit */}
              <Button
                type="submit"
                size="lg"
                className="w-full h-12"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Đang đăng ký...
                  </>
                ) : (
                  "Tạo tài khoản"
                )}
              </Button>
            </form>
          </Card>

          {/* Login link */}
          <p className="text-center text-sm text-[#4D4D4D]">
            Đã có tài khoản?{" "}
            <Link href="/login" className="font-semibold text-[#0046C1] hover:text-[#002540] transition-colors">
              Đăng nhập ngay
            </Link>
          </p>

          <div className="text-center">
            <Link href="/" className="text-xs text-[#636363] hover:text-[#0046C1] transition-colors">
              ← Quay về trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
