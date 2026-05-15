"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";

interface RegisterFormData {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export function RegisterForm() {
  const router = useRouter();
  const { register: registerUser, isLoading } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({ mode: "onBlur" });

  const password = watch("password");

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      await registerUser({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone || undefined,
        password: data.password,
      });
      toast.success("Đăng ký thành công!");
      router.push("/");
    } catch (err: unknown) {
      const msg = String(err);
      if (msg.toLowerCase().includes("exists") || msg.toLowerCase().includes("duplicate")) {
        setServerError("Email đã được sử dụng. Vui lòng đăng nhập.");
      } else {
        setServerError(msg || "Đăng ký thất bại. Vui lòng thử lại.");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {serverError && (
        <div className="p-3 rounded-md bg-error-light border border-error/20 text-error text-body-sm">
          {serverError}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="full_name">Họ và tên <span className="text-error">*</span></Label>
        <Input
          id="full_name"
          type="text"
          placeholder="Nguyễn Văn A"
          autoComplete="name"
          error={!!errors.full_name}
          {...register("full_name", {
            required: "Họ và tên là bắt buộc",
            minLength: { value: 2, message: "Tên tối thiểu 2 ký tự" },
            maxLength: { value: 100, message: "Tên tối đa 100 ký tự" },
          })}
        />
        {errors.full_name && (
          <p className="text-error text-metadata mt-1">{errors.full_name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email <span className="text-error">*</span></Label>
        <Input
          id="email"
          type="email"
          placeholder="email@example.com"
          autoComplete="email"
          error={!!errors.email}
          {...register("email", {
            required: "Email là bắt buộc",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Email không hợp lệ",
            },
          })}
        />
        {errors.email && (
          <p className="text-error text-metadata mt-1">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">Số điện thoại</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="0912 345 678"
          autoComplete="tel"
          error={!!errors.phone}
          {...register("phone", {
            pattern: {
              value: /^(0[3|5|7|8|9])+([0-9]{8})$/,
              message: "Số điện thoại không hợp lệ (VD: 0912345678)",
            },
          })}
        />
        {errors.phone && (
          <p className="text-error text-metadata mt-1">{errors.phone.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Mật khẩu <span className="text-error">*</span></Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Tối thiểu 6 ký tự"
            autoComplete="new-password"
            error={!!errors.password}
            className="pr-10"
            {...register("password", {
              required: "Mật khẩu là bắt buộc",
              minLength: { value: 6, message: "Mật khẩu tối thiểu 6 ký tự" },
            })}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-medium-gray hover:text-navy"
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-error text-metadata mt-1">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Xác nhận mật khẩu <span className="text-error">*</span></Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirm ? "text" : "password"}
            placeholder="Nhập lại mật khẩu"
            autoComplete="new-password"
            error={!!errors.confirmPassword}
            className="pr-10"
            {...register("confirmPassword", {
              required: "Xác nhận mật khẩu là bắt buộc",
              validate: (v: string) => v === password || "Mật khẩu không khớp",
            })}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-medium-gray hover:text-navy"
            onClick={() => setShowConfirm((v) => !v)}
          >
            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-error text-metadata mt-1">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Đang đăng ký..." : "Đăng ký"}
      </Button>

      <p className="text-center text-body-sm text-dark-gray">
        Đã có tài khoản?{" "}
        <Link href="/login" className="text-primary font-semibold hover:underline">
          Đăng nhập
        </Link>
      </p>
    </form>
  );
}
