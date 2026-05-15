"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/stores";
import { authApi } from "@/lib/auth-api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bot, Eye, EyeOff, Loader2, Globe } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    setLoading(true);
    try {
      const response = await authApi.login(form.email, form.password);
      setUser(response.user);
      toast.success("Đăng nhập thành công!");
      router.push("/");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      toast.error(error.response?.data?.detail || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left: Branding Panel ─────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 bg-[#0046C1] p-12 relative overflow-hidden"
        aria-hidden="true"
      >
        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 flex items-center justify-center">
            <Globe className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-extrabold text-white">TravelGPT</span>
        </div>

        {/* Content */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 text-sm text-white/80 border border-white/20">
              <Bot className="w-4 h-4" />
              AI Travel Agent • Online
            </div>
            <h1 className="text-4xl font-extrabold text-white leading-tight">
              Du lịch thông minh
              <br />
              cùng <span className="text-white/80">AI</span>
            </h1>
            <p className="text-white/70 text-lg max-w-md leading-relaxed">
              Chỉ cần trò chuyện — AI sẽ tìm tour hoàn hảo, đặt ngay trong chat.
              Không cần lướt hàng trăm trang web.
            </p>
          </div>

          {/* Feature bullets */}
          <div className="space-y-3">
            {[
              "Tìm tour với AI trong vài giây",
              "Hơn 500+ tour du lịch chất lượng",
              "Hỗ trợ 24/7 bằng tiếng Việt",
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

        {/* Bottom image */}
        <div className="relative z-10">
          <div className="relative overflow-hidden aspect-[16/9] shadow-floating">
            <Image
              src="https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800&q=80"
              alt="Du lịch biển"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
        </div>
      </div>

      {/* ── Right: Login Form ────────────────────────────────────── */}
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
              <Bot className="w-7 h-7 text-[#0046C1]" />
            </div>
            <h2 className="text-2xl font-bold text-[#000E1A]">Chào mừng trở lại!</h2>
            <p className="text-sm text-[#4D4D4D]">
              Đăng nhập để tiếp tục trải nghiệm TravelGPT
            </p>
          </div>

          {/* Form */}
          <Card className="p-8 space-y-5">
            <form onSubmit={handleSubmit} className="space-y-5">
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
                  className="w-full px-4 py-3 border border-[#DDDDDD] bg-[#F7F7F7] text-sm text-[#000E1A] placeholder:text-[#999999] transition-all duration-200 focus:outline-none focus:border-[#0391FF] focus:bg-white disabled:opacity-50"
                  required
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
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-4 py-3 pr-12 border border-[#DDDDDD] bg-[#F7F7F7] text-sm text-[#000E1A] placeholder:text-[#999999] transition-all duration-200 focus:outline-none focus:border-[#0391FF] focus:bg-white disabled:opacity-50"
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
                    Đang đăng nhập...
                  </>
                ) : (
                  "Đăng nhập"
                )}
              </Button>
            </form>
          </Card>

          {/* Register link */}
          <p className="text-center text-sm text-[#4D4D4D]">
            Chưa có tài khoản?{" "}
            <Link href="/register" className="font-semibold text-[#0046C1] hover:text-[#002540] transition-colors">
              Đăng ký ngay
            </Link>
          </p>

          {/* Back to home */}
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
