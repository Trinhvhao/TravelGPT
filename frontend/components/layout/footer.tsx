"use client";

import Link from "next/link";
import {
  Globe,
  Phone,
  Map,
  Bot,
  Ticket,
  HelpCircle,
  Building2,
  Award,
} from "lucide-react";

export default function Footer() {
  return (
    <footer style={{ backgroundColor: "#000E1A", color: "#FFFFFF" }}>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 flex items-center justify-center"
                style={{ backgroundColor: "#0046C1", borderRadius: "12px" }}
              >
                <Globe className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold">TravelGPT</span>
            </div>
            <p className="leading-relaxed" style={{ color: "#999999" }}>
              AI Travel Agent — Du lịch thông minh cùng công nghệ AI tiên tiến nhất.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <Phone className="w-4 h-4 flex-shrink-0" style={{ color: "#636363" }} />
              <span style={{ color: "#999999" }}>1900 1234</span>
            </div>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Ticket className="w-4 h-4" style={{ color: "#0046C1" }} />
              <h4 className="font-bold text-lg">Dịch vụ</h4>
            </div>
            <ul className="space-y-3">
              <li>
                <Link href="/tours" className="transition-colors inline-flex items-center gap-1.5 group" style={{ color: "#999999" }}>
                  <span className="transition-all" style={{ color: "#0046C1", opacity: 0 }}>›</span>
                  Tours
                </Link>
              </li>
              <li>
                <Link href="/chat" className="transition-colors inline-flex items-center gap-1.5 group" style={{ color: "#999999" }}>
                  <span className="transition-all" style={{ color: "#0046C1", opacity: 0 }}>›</span>
                  AI Chat
                </Link>
              </li>
              <li>
                <Link href="/bookings" className="transition-colors inline-flex items-center gap-1.5 group" style={{ color: "#999999" }}>
                  <span className="transition-all" style={{ color: "#0046C1", opacity: 0 }}>›</span>
                  Đặt tour
                </Link>
              </li>
              <li>
                <Link href="#" className="transition-colors inline-flex items-center gap-1.5 group" style={{ color: "#999999" }}>
                  <span className="transition-all" style={{ color: "#0046C1", opacity: 0 }}>›</span>
                  Khuyến mãi
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4" style={{ color: "#0046C1" }} />
              <h4 className="font-bold text-lg">Hỗ trợ</h4>
            </div>
            <ul className="space-y-3">
              <li>
                <Link href="#" className="transition-colors inline-flex items-center gap-1.5 group" style={{ color: "#999999" }}>
                  <span className="transition-all" style={{ color: "#0046C1", opacity: 0 }}>›</span>
                  Trung tâm trợ giúp
                </Link>
              </li>
              <li>
                <Link href="#" className="transition-colors inline-flex items-center gap-1.5 group" style={{ color: "#999999" }}>
                  <span className="transition-all" style={{ color: "#0046C1", opacity: 0 }}>›</span>
                  Liên hệ
                </Link>
              </li>
              <li>
                <Link href="#" className="transition-colors inline-flex items-center gap-1.5 group" style={{ color: "#999999" }}>
                  <span className="transition-all" style={{ color: "#0046C1", opacity: 0 }}>›</span>
                  Câu hỏi thường gặp
                </Link>
              </li>
              <li>
                <Link href="#" className="transition-colors inline-flex items-center gap-1.5 group" style={{ color: "#999999" }}>
                  <span className="transition-all" style={{ color: "#0046C1", opacity: 0 }}>›</span>
                  Chính sách
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" style={{ color: "#0046C1" }} />
              <h4 className="font-bold text-lg">Công ty</h4>
            </div>
            <ul className="space-y-3">
              <li>
                <Link href="#" className="transition-colors inline-flex items-center gap-1.5 group" style={{ color: "#999999" }}>
                  <span className="transition-all" style={{ color: "#0046C1", opacity: 0 }}>›</span>
                  Giới thiệu
                </Link>
              </li>
              <li>
                <Link href="#" className="transition-colors inline-flex items-center gap-1.5 group" style={{ color: "#999999" }}>
                  <span className="transition-all" style={{ color: "#0046C1", opacity: 0 }}>›</span>
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="transition-colors inline-flex items-center gap-1.5 group" style={{ color: "#999999" }}>
                  <span className="transition-all" style={{ color: "#0046C1", opacity: 0 }}>›</span>
                  Tuyển dụng
                </Link>
              </li>
              <li>
                <Link href="#" className="transition-colors inline-flex items-center gap-1.5 group" style={{ color: "#999999" }}>
                  <span className="transition-all" style={{ color: "#0046C1", opacity: 0 }}>›</span>
                  Điều khoản
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div
          className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ borderTop: "1px solid #4D4D4D" }}
        >
          <p className="text-sm" style={{ color: "#636363" }}>
            © 2026 TravelGPT. Mọi quyền được bảo lưu.
          </p>
          <div className="flex items-center gap-4 text-sm" style={{ color: "#636363" }}>
            <span className="flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              Hỗ trợ 24/7
            </span>
            <span style={{ color: "#4D4D4D" }}>|</span>
            <span className="flex items-center gap-1.5">
              <Phone className="w-4 h-4" />
              hotline: 1900 1234
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
