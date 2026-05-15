"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Home, Search, MessageSquare, ArrowLeft } from "lucide-react";

export default function NotFound() {
  useEffect(() => {
    // Log for debugging
    console.warn("404 — page not found");
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md w-full space-y-8">
          {/* Animated 404 */}
          <div className="relative mx-auto w-40 h-40">
            {/* Glow ring */}
            <div className="absolute inset-0 rounded-full bg-[#0046C1]/10 animate-pulse" />
            {/* Outer circle */}
            <div className="absolute inset-4 rounded-full bg-[#D9EEFF] border border-[#DDDDDD] flex items-center justify-center">
              <span className="text-6xl font-extrabold text-[#0046C1]">404</span>
            </div>
            {/* Floating decorative blobs */}
            <div
              className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#0391FF]/20 animate-bounce"
              style={{ animationDuration: "2s" }}
            />
            <div
              className="absolute -bottom-2 -left-2 w-6 h-6 rounded-full bg-[#0046C1]/20 animate-bounce"
              style={{ animationDuration: "2.5s", animationDelay: "0.5s" }}
            />
          </div>

          {/* Text */}
          <div className="space-y-3">
            <h1 className="text-2xl font-extrabold text-[#000E1A]">
              Trang không tìm thấy
            </h1>
            <p className="text-[#636363] text-sm leading-relaxed">
              Rất tiếc, trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
              Hãy quay về trang chủ hoặc thử tìm kiếm tour mới.
            </p>
          </div>

          {/* Suggested actions */}
          <div className="space-y-3">
            <Link href="/" className="block">
              <Button className="w-full gap-2 shadow-md">
                <Home className="w-4 h-4" />
                Về trang chủ
              </Button>
            </Link>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/tours" className="block">
                <Button variant="outline" className="w-full gap-2 border-[#DDDDDD]">
                  <Search className="w-4 h-4" />
                  Tìm tours
                </Button>
              </Link>
              <Link href="/chat" className="block">
                <Button variant="outline" className="w-full gap-2 border-[#DDDDDD]">
                  <MessageSquare className="w-4 h-4" />
                  AI Chat
                </Button>
              </Link>
            </div>
          </div>

          {/* Back link */}
          <button
            onClick={() => history.back()}
            className="inline-flex items-center gap-2 text-sm text-[#636363] hover:text-[#0046C1] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại trang trước
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
