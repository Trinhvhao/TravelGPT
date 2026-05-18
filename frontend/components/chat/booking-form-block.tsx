"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  ContentBlockBookingForm,
  ContentBlockBookingPreview,
} from "@/types/chat";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  Users,
  Sparkles,
  X,
  ArrowRight,
  CheckCircle2,
  Loader2,
} from "lucide-react";

const PRIMARY = "#0046C1";
const ACCENT = "#0391FF";
const GRAY = "#636363";
const NAVY = "#000E1A";

// ─── Booking Form Block ───────────────────────────────────────────────────
export function BookingFormBlock({ block, onClose }: { block: ContentBlockBookingForm; onClose?: () => void }) {
  const { data } = block;
  const router = useRouter();

  const [departureDate, setDepartureDate] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const basePrice = data.base_price || 0;
  const childPrice = data.child_price || Math.round(basePrice * 0.75);
  const totalPrice = adults * basePrice + children * childPrice;

  const fmt = (n: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(n);

  const handleSubmit = async () => {
    if (!departureDate || !name || !email || !phone) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("tgpt_access");
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3008/api/v1";

      const res = await fetch(`${baseUrl}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          tour_id: data.tour_id,
          departure_date: departureDate,
          num_adults: adults,
          num_children: children,
          contact_name: name,
          contact_email: email,
          contact_phone: phone,
          special_requests: specialRequests,
        }),
      });

      if (!res.ok) throw new Error("Booking failed");
      const result = await res.json();

      // Navigate to chat with booking info
      router.push(`/chat?message=Đặt tour ${data.tour_name} thành công!&booking_code=${result.booking_code}`);
    } catch {
      alert("Đặt tour thất bại. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card
      className="border-0 overflow-hidden"
      style={{
        borderRadius: "20px",
        boxShadow: "0 8px 30px rgba(0,70,193,0.15)",
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{
          background: `linear-gradient(135deg, ${PRIMARY}, ${ACCENT})`,
        }}
      >
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-white" />
          <span className="text-white font-bold text-[15px]">
            Đặt tour: {data.tour_name}
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer"
            style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
          >
            <X className="h-4 w-4 text-white" />
          </button>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* Departure date */}
        <div className="space-y-1.5">
          <label className="text-[12px] font-semibold" style={{ color: GRAY }}>
            Ngày khởi hành <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={departureDate}
            onChange={(e) => setDepartureDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className="w-full px-4 py-2.5 text-[14px] rounded-xl border transition-all outline-none"
            style={{
              borderColor: "#E8F4FF",
              borderRadius: "12px",
              color: NAVY,
            }}
          />
        </div>

        {/* Participants */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold flex items-center gap-1" style={{ color: GRAY }}>
              <Users className="w-3.5 h-3.5" />
              Người lớn <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAdults(Math.max(1, adults - 1))}
                className="w-8 h-8 rounded-lg border flex items-center justify-center text-lg font-bold transition-all"
                style={{ borderColor: "#E8F4FF", color: PRIMARY }}
              >
                −
              </button>
              <span className="text-[16px] font-bold w-8 text-center" style={{ color: NAVY }}>
                {adults}
              </span>
              <button
                onClick={() => setAdults(Math.min(20, adults + 1))}
                className="w-8 h-8 rounded-lg border flex items-center justify-center text-lg font-bold transition-all"
                style={{ borderColor: "#E8F4FF", color: PRIMARY }}
              >
                +
              </button>
            </div>
            <p className="text-[11px]" style={{ color: GRAY }}>
              {fmt(basePrice)}/người
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold flex items-center gap-1" style={{ color: GRAY }}>
              <Users className="w-3.5 h-3.5" />
              Trẻ em
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setChildren(Math.max(0, children - 1))}
                className="w-8 h-8 rounded-lg border flex items-center justify-center text-lg font-bold transition-all"
                style={{ borderColor: "#E8F4FF", color: PRIMARY }}
              >
                −
              </button>
              <span className="text-[16px] font-bold w-8 text-center" style={{ color: NAVY }}>
                {children}
              </span>
              <button
                onClick={() => setChildren(Math.min(10, children + 1))}
                className="w-8 h-8 rounded-lg border flex items-center justify-center text-lg font-bold transition-all"
                style={{ borderColor: "#E8F4FF", color: PRIMARY }}
              >
                +
              </button>
            </div>
            <p className="text-[11px]" style={{ color: GRAY }}>
              {fmt(childPrice)}/trẻ
            </p>
          </div>
        </div>

        {/* Price summary */}
        <div
          className="flex justify-between items-center px-4 py-3 rounded-xl font-semibold"
          style={{ backgroundColor: "#EEF6FF" }}
        >
          <span className="text-[13px]" style={{ color: GRAY }}>
            Tổng tiền
          </span>
          <span className="text-[18px]" style={{ color: PRIMARY }}>
            {fmt(totalPrice)}
          </span>
        </div>

        {/* Contact info */}
        <div className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold" style={{ color: GRAY }}>
              Họ tên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="w-full px-4 py-2.5 text-[14px] rounded-xl border transition-all outline-none"
              style={{ borderColor: "#E8F4FF", borderRadius: "12px", color: NAVY }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold" style={{ color: GRAY }}>
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full px-4 py-2.5 text-[14px] rounded-xl border transition-all outline-none"
                style={{ borderColor: "#E8F4FF", borderRadius: "12px", color: NAVY }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold" style={{ color: GRAY }}>
                Điện thoại <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0901234567"
                className="w-full px-4 py-2.5 text-[14px] rounded-xl border transition-all outline-none"
                style={{ borderColor: "#E8F4FF", borderRadius: "12px", color: NAVY }}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold" style={{ color: GRAY }}>
              Yêu cầu đặc biệt
            </label>
            <textarea
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              placeholder="VD: Cần xe chở người khuyết tật, dị ứng thực phẩm..."
              rows={2}
              className="w-full px-4 py-2.5 text-[14px] rounded-xl border transition-all outline-none resize-none"
              style={{ borderColor: "#E8F4FF", borderRadius: "12px", color: NAVY }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          {onClose && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-11 text-[13px] font-semibold"
              style={{ borderRadius: "12px", border: `1px solid ${PRIMARY}30`, color: GRAY }}
              onClick={onClose}
            >
              Hủy
            </Button>
          )}
          <Button
            size="sm"
            className="flex-1 h-11 text-[13px] font-semibold text-white shadow-md"
            style={{
              background: `linear-gradient(135deg, ${ACCENT}, ${PRIMARY})`,
              borderRadius: "12px",
              border: "none",
            }}
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang đặt...
              </>
            ) : (
              <>
                Xác nhận đặt tour
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ─── Booking Preview Block ────────────────────────────────────────────────
export function BookingPreviewBlock({ block }: { block: ContentBlockBookingPreview }) {
  const { data } = block;

  const fmt = (n: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <Card
      className="border-0 overflow-hidden"
      style={{
        borderRadius: "20px",
        boxShadow: "0 8px 30px rgba(0,70,193,0.15)",
      }}
    >
      {/* Success header */}
      <div
        className="px-5 py-4 flex items-center gap-3"
        style={{
          background: "linear-gradient(135deg, #059669, #10B981)",
        }}
      >
        <CheckCircle2 className="h-5 w-5 text-white" />
        <span className="text-white font-bold text-[15px]">
          {data.booking_code
            ? `Đặt tour thành công! Mã: ${data.booking_code}`
            : "Xác nhận thông tin đặt tour"}
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Tour info */}
        <div className="space-y-2">
          <h4 className="font-bold text-[15px]" style={{ color: NAVY }}>
            {data.tour_name}
          </h4>
          <div className="flex items-center gap-4 text-[12px]" style={{ color: GRAY }}>
            <span className="flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5" style={{ color: ACCENT }} />
              {new Date(data.departure_date).toLocaleDateString("vi-VN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" style={{ color: ACCENT }} />
              {data.adults} người lớn{data.children > 0 ? `, ${data.children} trẻ em` : ""}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#EEEEEE]" />

        {/* Contact info */}
        <div className="space-y-2">
          <p className="text-[12px] font-semibold" style={{ color: GRAY }}>
            Thông tin liên hệ
          </p>
          <div className="space-y-1 text-[13px]">
            <p style={{ color: NAVY }}>
              <span style={{ color: GRAY }}>Tên: </span>
              {data.contact_name}
            </p>
            <p style={{ color: NAVY }}>
              <span style={{ color: GRAY }}>Email: </span>
              {data.contact_email}
            </p>
            <p style={{ color: NAVY }}>
              <span style={{ color: GRAY }}>Điện thoại: </span>
              {data.contact_phone}
            </p>
          </div>
        </div>

        {/* Special requests */}
        {data.special_requests && (
          <div className="space-y-1">
            <p className="text-[12px] font-semibold" style={{ color: GRAY }}>
              Yêu cầu đặc biệt
            </p>
            <p className="text-[13px] italic" style={{ color: GRAY }}>
              "{data.special_requests}"
            </p>
          </div>
        )}

        {/* Total price */}
        <div
          className="flex justify-between items-center px-4 py-3 rounded-xl"
          style={{ backgroundColor: "#EEF6FF" }}
        >
          <span className="text-[13px] font-semibold" style={{ color: GRAY }}>
            Tổng tiền
          </span>
          <span className="text-[20px] font-bold" style={{ color: PRIMARY }}>
            {fmt(data.total_price)}
          </span>
        </div>

        {/* Payment notice */}
        <div
          className="rounded-xl p-3 text-[12px]"
          style={{ backgroundColor: "#FFFBEB", border: "1px solid #FDE68A" }}
        >
          💳 Vui lòng thanh toán để xác nhận booking. Bạn sẽ nhận email với link thanh toán.
        </div>
      </div>
    </Card>
  );
}
