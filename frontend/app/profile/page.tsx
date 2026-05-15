"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { authApi } from "@/lib/auth-api";
import type { User } from "@/lib/auth";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import {
  User as UserIcon,
  Mail,
  Phone,
  Shield,
  Camera,
  Loader2,
  Check,
  AlertCircle,
  Calendar,
  MapPin,
  Edit3,
  LogOut,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

// ─── Profile Avatar ─────────────────────────────────────────────────────────────
function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string) {
  const colors = [
    "from-[#0046C1] to-[#0391FF]",
    "from-[#0391FF] to-[#0E7490]",
    "from-[#16A34A] to-[#15803D]",
    "from-[#D97706] to-[#B45309]",
    "from-[#DC2626] to-[#B91C1C]",
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

// ─── Edit Form ──────────────────────────────────────────────────────────────────
function EditProfileForm({
  user,
  onSave,
  onCancel,
}: {
  user: User;
  onSave: (data: { full_name: string; phone: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    full_name: user.full_name,
    phone: user.phone || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim()) {
      toast.error("Họ tên không được để trống");
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
      toast.success("Cập nhật thông tin thành công!");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-[#000E1A]">Họ và tên</label>
        <input
          type="text"
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-sm text-[#000E1A] focus:outline-none focus:ring-2 focus:ring-[#0046C1]/20 focus:border-[#0046C1] transition-all"
          required
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-[#000E1A]">Email</label>
        <input
          type="email"
          value={user.email}
          readOnly
          className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-sm text-[#636363] cursor-not-allowed"
        />
        <p className="text-xs text-[#9CA3AF]">Email không thể thay đổi</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-[#000E1A]">
          Số điện thoại
        </label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="0901 234 567"
          className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-sm text-[#000E1A] focus:outline-none focus:ring-2 focus:ring-[#0046C1]/20 focus:border-[#0046C1] transition-all"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 border-[#DDDDDD] text-[#636363]"
        >
          Hủy
        </Button>
        <Button
          type="submit"
          className="flex-1 shadow-sm"
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Đang lưu...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Lưu thay đổi
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

// ─── Change Password Form ─────────────────────────────────────────────────────
function ChangePasswordForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.new_password !== form.confirm_password) {
      toast.error("Mật khẩu mới không khớp");
      return;
    }
    if (form.new_password.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }
    setSaving(true);
    try {
      await authApi.changePassword(form.current_password, form.new_password);
      toast.success("Đổi mật khẩu thành công!");
      setForm({ current_password: "", new_password: "", confirm_password: "" });
      onSuccess();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      toast.error(error.response?.data?.detail || "Đổi mật khẩu thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-[#000E1A]">Mật khẩu hiện tại</label>
        <input
          type="password"
          value={form.current_password}
          onChange={(e) => setForm({ ...form, current_password: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-sm text-[#000E1A] focus:outline-none focus:ring-2 focus:ring-[#0046C1]/20 focus:border-[#0046C1] transition-all"
          required
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-[#000E1A]">Mật khẩu mới</label>
        <input
          type="password"
          value={form.new_password}
          onChange={(e) => setForm({ ...form, new_password: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-sm text-[#000E1A] focus:outline-none focus:ring-2 focus:ring-[#0046C1]/20 focus:border-[#0046C1] transition-all"
          required
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-[#000E1A]">Xác nhận mật khẩu mới</label>
        <input
          type="password"
          value={form.confirm_password}
          onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white text-sm text-[#000E1A] focus:outline-none focus:ring-2 focus:ring-[#0046C1]/20 focus:border-[#0046C1] transition-all"
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? (
          <><Loader2 className="w-4 h-4 animate-spin mr-2" />Đang đổi mật khẩu...</>
        ) : "Đổi mật khẩu"}
      </Button>
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <Spinner size="lg" />
      </div>
    );
  }

  const handleSave = async (data: { full_name: string; phone: string }) => {
    await updateProfile(data);
    setEditing(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0046C1] to-[#0391FF] pt-12 pb-20 px-4">
          <div className="container-page">
            <div className="flex items-end gap-6">
              {/* Avatar */}
              <div className="relative">
                <div
                  className={cn(
                    "w-24 h-24 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-2xl font-extrabold shadow-lg"
                  )}
                  style={{ background: `linear-gradient(135deg, #0046C1, #0391FF)` }}
                >
                  {getInitials(user.full_name)}
                </div>
                <button
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white border-2 border-[#DDDDDD] flex items-center justify-center shadow-md hover:bg-[#D9EEFF] transition-colors cursor-pointer"
                  aria-label="Đổi ảnh đại diện"
                >
                  <Camera className="w-4 h-4 text-[#0046C1]" />
                </button>
              </div>

              {/* Info */}
              <div className="pb-1">
                <h1 className="text-2xl font-extrabold text-white">{user.full_name}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1.5 text-white/70 text-sm">
                    <Mail className="w-4 h-4" />
                    {user.email}
                  </span>
                  <Badge
                    variant="outline"
                    className="border-white/30 text-white/80 bg-white/10 backdrop-blur-sm"
                  >
                    <Shield className="w-3 h-3 mr-1" />
                    {user.role === "ADMIN" ? "Quản trị viên" : "Khách hàng"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container-page -mt-10 pb-16">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: Profile Card */}
            <div className="lg:col-span-2 space-y-6">
              {/* Edit Profile */}
              <Card className="border border-[#DDDDDD] shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDDDDD]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#D9EEFF] flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-[#0046C1]" />
                    </div>
                    <div>
                      <h2 className="font-bold text-[#000E1A]">Thông tin cá nhân</h2>
                      <p className="text-xs text-[#636363]">Cập nhật hồ sơ của bạn</p>
                    </div>
                  </div>
                  {!editing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditing(true)}
                      className="gap-1.5 text-[#0046C1] hover:bg-[#D9EEFF]"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Chỉnh sửa
                    </Button>
                  )}
                </div>
                <div className="p-6">
                  {editing ? (
                    <EditProfileForm
                      user={user}
                      onSave={handleSave}
                      onCancel={() => setEditing(false)}
                    />
                  ) : (
                    <div className="space-y-4">
                      {/* Field list */}
                      {[
                        {
                          icon: UserIcon,
                          label: "Họ và tên",
                          value: user.full_name,
                        },
                        {
                          icon: Mail,
                          label: "Email",
                          value: user.email,
                        },
                        {
                          icon: Phone,
                          label: "Số điện thoại",
                          value: user.phone || "Chưa cập nhật",
                        },
                        {
                          icon: Calendar,
                          label: "Ngày tham gia",
                          value: formatDate(user.created_at),
                        },
                      ].map((field) => {
                        const Icon = field.icon;
                        return (
                          <div
                            key={field.label}
                            className="flex items-start gap-4 py-3 border-b border-[#F3F4F6] last:border-0"
                          >
                            <div className="w-9 h-9 rounded-xl bg-[#D9EEFF] flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Icon className="w-4 h-4 text-[#0046C1]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-[#636363] mb-0.5">{field.label}</p>
                              <p className="text-sm font-medium text-[#000E1A]">{field.value}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Card>

              {/* Danger zone */}
              <Card className="border border-[#FEE2E2] shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-[#FEE2E2] bg-[#FEF2F2]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#FEE2E2] flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-[#DC2626]" />
                    </div>
                    <div>
                      <h2 className="font-bold text-[#000E1A]">Đổi mật khẩu</h2>
                      <p className="text-xs text-[#636363]">Cập nhật mật khẩu để bảo mật tài khoản</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <ChangePasswordForm onSuccess={() => setShowPassword(false)} />
                </div>
              </Card>
            </div>

            {/* Right: Stats & Activity */}
            <div className="space-y-6">
              {/* Quick stats */}
              <Card className="border border-[#DDDDDD] shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-[#DDDDDD]">
                  <h2 className="font-bold text-[#000E1A]">Tài khoản</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#636363]">Trạng thái</span>
                    <Badge variant="success">Hoạt động</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#636363]">Vai trò</span>
                    <Badge variant={user.role === "ADMIN" ? "accent" : "secondary"}>
                      <Shield className="w-3 h-3 mr-1" />
                      {user.role === "ADMIN" ? "Quản trị" : "Khách hàng"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#636363]">Ngày tham gia</span>
                    <span className="text-sm font-medium text-[#000E1A]">
                      {formatDate(user.created_at)}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Quick actions */}
              <Card className="border border-[#DDDDDD] shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-[#DDDDDD]">
                  <h2 className="font-bold text-[#000E1A]">Thao tác nhanh</h2>
                </div>
                <div className="p-4 space-y-2">
                  {[
                    { label: "Đơn đặt tour của tôi", href: "/bookings", icon: Calendar },
                    { label: "Trò chuyện với AI", href: "/chat", icon: UserIcon },
                  ].map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#D9EEFF] transition-colors group"
                    >
                      <item.icon className="w-5 h-5 text-[#0046C1] flex-shrink-0" />
                      <span className="text-sm font-medium text-[#000E1A] group-hover:text-[#0046C1] transition-colors">
                        {item.label}
                      </span>
                    </a>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
