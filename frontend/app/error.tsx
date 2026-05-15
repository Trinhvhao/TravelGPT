"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home, MessageSquare } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error server-side in production
    console.error("[TravelGPT Error Boundary]:", error?.message, error?.digest);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#FAFAFA]">
      {/* Icon */}
      <div className="w-20 h-20 rounded-full bg-[#FEF2F2] border border-[#FEE2E2] flex items-center justify-center mb-8">
        <AlertTriangle className="w-10 h-10 text-[#DC2626]" />
      </div>

      {/* Text */}
      <div className="text-center max-w-md space-y-3 mb-8">
        <h1 className="text-2xl font-extrabold text-[#000E1A]">
          Đã xảy ra lỗi
        </h1>
        <p className="text-[#636363] text-sm leading-relaxed">
          Rất tiếc, đã có lỗi không mong muốn xảy ra. Đội ngũ TravelGPT đã được
          thông báo và đang xử lý. Bạn có thể thử tải lại trang hoặc quay về trang chủ.
        </p>
        {error?.digest && (
          <p className="text-xs text-[#9CA3AF] font-mono">
            Mã lỗi: {error.digest}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
        <Button
          variant="outline"
          onClick={reset}
          className="gap-2 border-[#DDDDDD]"
        >
          <RefreshCw className="w-4 h-4" />
          Thử lại
        </Button>
        <Link href="/" className="block">
          <Button className="w-full gap-2">
            <Home className="w-4 h-4" />
            Trang chủ
          </Button>
        </Link>
      </div>

      <div className="mt-6">
        <Link href="/chat">
          <Button variant="ghost" className="text-[#636363] gap-2">
            <MessageSquare className="w-4 h-4" />
            Liên hệ hỗ trợ AI
          </Button>
        </Link>
      </div>
    </div>
  );
}
