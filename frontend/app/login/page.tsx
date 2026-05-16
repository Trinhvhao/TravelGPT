"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores";
import { authApi } from "@/lib/auth-api";
import { Card } from "@/components/ui/card";
import { Eye, EyeOff, Loader2, Bot } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

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
    <div className="min-h-[calc(100vh-64px)] bg-[#F7F7F7] dark:bg-[#0a0a0a] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-[#0046C1] to-[#0391FF] rounded-2xl shadow-lg mb-4">
            <Bot className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#000E1A] dark:text-white">
            Chào mừng trở lại!
          </h1>
          <p className="text-sm text-[#636363] mt-2 dark:text-[#a1a1aa]">
            Đăng nhập để tiếp tục trải nghiệm TravelGPT
          </p>
        </div>

        {/* Form Card */}
        <Card className="p-6 sm:p-8 space-y-5 shadow-floating dark:bg-[#111111] dark:border-[#2a2a2a]">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-semibold text-[#000E1A] dark:text-white">
                Email <span className="text-[#ED1D24]">*</span>
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 border border-[#DDDDDD] bg-[#F7F7F7] dark:bg-[#1a1a1a] dark:border-[#3a3a3a] dark:text-white dark:placeholder-[#71717a] text-sm text-[#000E1A] placeholder:text-[#999999] rounded-xl transition-all duration-200 focus:outline-none focus:border-[#0046C1] focus:bg-white dark:focus:bg-[#262626] focus:ring-2 focus:ring-[#0046C1]/10 disabled:opacity-50"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-semibold text-[#000E1A] dark:text-white">
                  Mật khẩu <span className="text-[#ED1D24]">*</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-[#0046C1] dark:text-[#60a5fa] hover:underline font-medium"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3 pr-12 border border-[#DDDDDD] bg-[#F7F7F7] dark:bg-[#1a1a1a] dark:border-[#3a3a3a] dark:text-white dark:placeholder-[#71717a] text-sm text-[#000E1A] placeholder:text-[#999999] rounded-xl transition-all duration-200 focus:outline-none focus:border-[#0046C1] focus:bg-white dark:focus:bg-[#262626] focus:ring-2 focus:ring-[#0046C1]/10 disabled:opacity-50"
                  required
                />
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

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full h-12 text-sm font-semibold text-white rounded-full transition-all duration-200 cursor-pointer",
                loading
                  ? "bg-[#0046C1]/60 cursor-not-allowed"
                  : "bg-gradient-to-r from-[#0046C1] to-[#0391FF] hover:shadow-lg hover:shadow-[#0046C1]/25 active:scale-[0.98]"
              )}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang đăng nhập...
                </span>
              ) : (
                "Đăng nhập"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#DDDDDD] dark:border-[#2a2a2a]" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-xs text-[#999999] dark:text-[#71717a] bg-white dark:bg-[#111111]">
                hoặc
              </span>
            </div>
          </div>

          {/* Register link */}
          <p className="text-center text-sm text-[#636363] dark:text-[#a1a1aa]">
            Chưa có tài khoản?{" "}
            <Link href="/register" className="font-semibold text-[#0046C1] dark:text-[#60a5fa] hover:underline">
              Đăng ký ngay
            </Link>
          </p>
        </Card>

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
  );
}
