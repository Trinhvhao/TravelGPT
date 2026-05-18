"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  X,
  CheckCircle2,
  Clock,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import type { RescheduleFlowData, RescheduleStep } from "@/types";

const PRIMARY = "#0046C1";
const ACCENT = "#0391FF";
const NAVY = "#000E1A";
const GRAY = "#636363";

interface RescheduleCardProps {
  step?: RescheduleStep | string;
  data?: Partial<RescheduleFlowData>;
  availableDates?: Array<{ date: string; date_display: string; day_of_week: string; available: boolean }>;
  onSelectDate?: (date: string) => void;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export function RescheduleCard({
  step,
  data,
  availableDates = [],
  onSelectDate,
  onConfirm,
  onCancel,
}: RescheduleCardProps) {
  const bookingCode = data?.booking_code;
  const originalDate = data?.original_date;
  const newDate = data?.new_date;
  const priceDiff = data?.price_difference;

  const isActive = step && !["SUCCESS", "COMPLETED"].includes(String(step));

  if (!isActive && !bookingCode && !newDate) return null;

  const stepLabels: Record<string, string> = {
    INIT: "Bắt đầu",
    VERIFY_BOOKING: "Xác minh booking",
    CHECK_ELIGIBILITY: "Kiểm tra điều kiện",
    SELECT_NEW_DATE: "Chọn ngày mới",
    CHECK_AVAILABILITY: "Kiểm tra ngày",
    CALCULATE_PRICE_DIFF: "Tính chênh lệch",
    CONFIRM_RESCHEDULE: "Xác nhận đổi lịch",
    PROCESSING: "Đang xử lý",
    SUCCESS: "Thành công",
  };

  const currentStepLabel = stepLabels[String(step)] ?? String(step ?? "");

  return (
    <div className="animate-[slide-up_0.3s_ease-out] ml-14">
      <Card
        className="border-0 overflow-hidden"
        style={{
          borderRadius: "20px",
          boxShadow: "0 8px 30px rgba(0,70,193,0.12)",
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
            <RefreshCw className="h-5 w-5 text-white" />
            <span className="text-white font-bold text-[15px]">
              Đổi lịch booking
            </span>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer"
              style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
              aria-label="Đóng"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          )}
        </div>

        {/* Booking code + original date */}
        {bookingCode && (
          <div className="px-5 pt-4 pb-2 space-y-2">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{
                backgroundColor: "#EEF6FF",
                color: PRIMARY,
                border: "1px solid #BFDBFE",
              }}
            >
              <span>Mã booking:</span>
              <span className="font-mono tracking-wide">{bookingCode}</span>
            </div>

            {originalDate && (
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-xl"
                style={{ backgroundColor: "#F7F7F7" }}
              >
                <Calendar className="h-4 w-4 flex-shrink-0" style={{ color: GRAY }} />
                <span className="text-[13px]" style={{ color: GRAY }}>
                  Ngày khởi hành cũ:
                </span>
                <span className="text-[13px] font-bold" style={{ color: NAVY }}>
                  {new Date(originalDate).toLocaleDateString("vi-VN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}

            {newDate && (
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-xl"
                style={{ backgroundColor: "#DCFCE7" }}
              >
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: "#16A34A" }} />
                <span className="text-[13px]" style={{ color: GRAY }}>
                  Ngày khởi hành mới:
                </span>
                <span className="text-[13px] font-bold" style={{ color: "#16A34A" }}>
                  {new Date(newDate).toLocaleDateString("vi-VN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}

            {priceDiff !== undefined && priceDiff !== 0 && (
              <div
                className="flex items-center justify-between px-4 py-3 rounded-xl font-semibold"
                style={{
                  backgroundColor: priceDiff > 0 ? "#FEF9C3" : "#DCFCE7",
                  border: `1px solid ${priceDiff > 0 ? "#FDE68A" : "#BBF7D0"}`,
                }}
              >
                <span className="text-[13px]" style={{ color: GRAY }}>
                  Chênh lệch giá
                </span>
                <span
                  className="text-[15px] font-bold"
                  style={{ color: priceDiff > 0 ? "#D97706" : "#16A34A" }}
                >
                  {priceDiff > 0 ? "+" : "-"}
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                    maximumFractionDigits: 0,
                  }).format(Math.abs(priceDiff))}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Available dates */}
        {availableDates.length > 0 && onSelectDate && (
          <div className="px-5 pb-4">
            <p className="text-[12px] font-semibold mb-2" style={{ color: NAVY }}>
              Chọn ngày khởi hành mới:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {availableDates.map((d) => (
                <button
                  key={d.date}
                  onClick={() => onSelectDate(d.date)}
                  className="px-3 py-2.5 rounded-xl text-[12px] font-medium transition-all cursor-pointer border"
                  style={{
                    backgroundColor: d.available ? "#FFFFFF" : "#F7F7F7",
                    borderColor: d.available ? PRIMARY : "#E5E7EB",
                    color: d.available ? PRIMARY : GRAY,
                  }}
                >
                  <div className="font-bold">{d.date_display}</div>
                  <div className="text-[11px] opacity-70">{d.day_of_week}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step indicator */}
        {currentStepLabel && (
          <div className="px-5 pb-3">
            <p className="text-[12px]" style={{ color: GRAY }}>
              Bước hiện tại:{" "}
              <span className="font-bold" style={{ color: PRIMARY }}>
                {currentStepLabel}
              </span>
            </p>
          </div>
        )}

        {/* Actions */}
        {(onConfirm || onCancel) && (
          <div
            className="px-5 pb-5 flex gap-3"
            style={{ borderTop: "1px solid #E8F4FF", paddingTop: "16px" }}
          >
            {onCancel && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-10 text-[13px] font-semibold"
                style={{
                  borderRadius: "12px",
                  border: "1px solid #E5E7EB",
                  color: GRAY,
                }}
                onClick={onCancel}
              >
                Không đổi nữa
              </Button>
            )}
            {onConfirm && (
              <Button
                size="sm"
                className="flex-1 h-10 text-[13px] font-semibold text-white shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${ACCENT}, ${PRIMARY})`,
                  borderRadius: "12px",
                  border: "none",
                }}
                onClick={onConfirm}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                Xác nhận đổi lịch
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
