"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks";
import { useForm } from "react-hook-form";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";

interface LoginFormData {
  email: string;
  password: string;
}

export function LoginForm() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({ mode: "onBlur" });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      await login(data.email, data.password);
      toast.success("Đăng nhập thành công!");
      router.push("/");
    } catch (err: unknown) {
      const msg = String(err);
      if (msg.toLowerCase().includes("401") || msg.toLowerCase().includes("invalid")) {
        setServerError("Email hoặc mật khẩu không đúng.");
      } else {
        setServerError(msg || "Đăng nhập thất bại. Vui lòng thử lại.");
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
        <Label htmlFor="email">Email</Label>
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
        <Label htmlFor="password">Mật khẩu</Label>
        <Input
          id="password"
          type="password"
          placeholder="Nhập mật khẩu"
          autoComplete="current-password"
          error={!!errors.password}
          {...register("password", {
            required: "Mật khẩu là bắt buộc",
            minLength: { value: 6, message: "Mật khẩu tối thiểu 6 ký tự" },
          })}
        />
        {errors.password && (
          <p className="text-error text-metadata mt-1">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
      </Button>
    </form>
  );
}
