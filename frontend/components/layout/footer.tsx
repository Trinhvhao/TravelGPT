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
  FileText,
  Info,
  Blog,
  Users,
  Briefcase,
  Shield,
  MessageCircle,
  Star,
  Award,
} from "lucide-react";

const COLUMNS = [
  {
    title: "Dịch vụ",
    icon: Ticket,
    links: [
      { href: "/tours", label: "Tours" },
      { href: "/chat", label: "AI Chat" },
      { href: "/bookings", label: "Đặt tour" },
      { href: "#", label: "Khuyến mãi" },
    ],
  },
  {
    title: "Hỗ trợ",
    icon: HelpCircle,
    links: [
      { href: "#", label: "Trung tâm trợ giúp" },
      { href: "#", label: "Liên hệ" },
      { href: "#", label: "Câu hỏi thường gặp" },
      { href: "#", label: "Chính sách" },
    ],
  },
  {
    title: "Công ty",
    icon: Building2,
    links: [
      { href: "#", label: "Giới thiệu" },
      { href: "#", label: "Blog" },
      { href: "#", label: "Tuyển dụng" },
      { href: "#", label: "Điều khoản" },
    ],
  },
];

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

          {COLUMNS.map((col) => (
            <div key={col.title} className="space-y-4">
              <div className="flex items-center gap-2">
                <col.icon className="w-4 h-4" style={{ color: "#0046C1" }} />
                <h4 className="font-bold text-lg">{col.title}</h4>
              </div>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="transition-colors inline-flex items-center gap-1.5 group"
                      style={{ color: "#999999" }}
                    >
                      <span
                        className="transition-all"
                        style={{ color: "#0046C1", opacity: 0 }}
                      >
                        ›
                      </span>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
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
