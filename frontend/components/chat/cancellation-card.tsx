"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  X,
  CheckCircle2,
  Calendar,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import type { CancellationFlowData, RefundPolicyTier } from "@/types";

interface CancellationCardProps {
  /** Current cancellation step */
  step?: string;
  /** Booking info */
  data?: Partial<CancellationFlowData>;
  /** Refund policy tiers (fetched from API) */
  refundPolicy?: RefundPolicyTier[];
  /** Called when user confirms cancellation */
  onConfirm?: (reason?: string) => void;
  /** Called when user cancels the flow */
  onCancel?: () => void;
  /** Called when user wants to reschedule instead */
  onReschedule?: () => void;
}

// Refund policy tiers from backend (default values)
const DEFAULT_REFUND_POLICY: RefundPolicyTier[] = [
  { days_before: "14+", refund_percent: 90, description: "Hoàn 90% giá tour" },
  { days_before: "7–13", refund_percent: 70, description: "Hoàn 70% giá tour" },
  { days_before: "3–6", refund_percent: 50, description: "Hoàn 50% giá tour" },
  { days_before: "1–2", refund_percent: 20, description: "Hoàn 20% giá tour" },
  { days_before: "0", refund_percent: 0, description: "Không hoàn tiền" },
];

export function CancellationCard({
  step,
  data,
  refundPolicy = DEFAULT_REFUND_POLICY,
  onConfirm,
  onCancel,
  onReschedule,
}: CancellationCardProps) {
  const bookingCode = data?.booking_code;
  const refundAmount = data?.refund_amount;
  const refundPercent = data?.refund_percentage;

  // Step is active if it's not COMPLETED or SUCCESS
  const isActive = step && !["SUCCESS", "COMPLETED"].includes(step);

  if (!isActive && !refundAmount && !bookingCode) return null;

  return (
    <div className="animate-[slide-up_0.3s_ease-out] ml-14">
      <Card
        className="border-0 overflow-hidden"
        style={{
          borderRadius: "20px",
          boxShadow: "0 8px 30px rgba(239,68,68,0.12)",
        }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{
            background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
          }}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-white" />
            <span className="text-white font-bold text-[15px]">
              Yêu cầu hủy booking
            </span>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer"
              style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
              aria-label="Đóng"
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "rgba(255,255,255,0.3)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "rgba(255,255,255,0.2)")
              }
            >
              <X className="h-4 w-4 text-white" />
            </button>
          )}
        </div>

        {/* Booking code badge */}
        {bookingCode && (
          <div className="px-5 pt-4 pb-2">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{
                backgroundColor: "#FEF2F2",
                color: "#DC2626",
                border: "1px solid #FECACA",
              }}
            >
              <span>Mã booking:</span>
              <span className="font-mono tracking-wide">{bookingCode}</span>
            </div>
          </div>
        )}

        {/* Refund table */}
        <div className="px-5 pb-4 space-y-2">
          <p className="text-[12px] font-semibold" style={{ color: "#374151" }}>
            Chính sách hoàn tiền:
          </p>
          <div className="space-y-1">
            {(refundPolicy.length > 0 ? refundPolicy : DEFAULT_REFUND_POLICY).map(
              (tier) => (
                <div
                  key={tier.days_before}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-[12px]"
                  style={{
                    backgroundColor:
                      tier.days_before === "14+"
                        ? "#FEF9C3"
                        : tier.days_before === "0"
                          ? "#FEE2E2"
                          : "#F9FAFB",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#6B7280" }} />
                    <span style={{ color: "#374151" }}>
                      {tier.days_before === "0"
                        ? "Ngày khởi hành"
                        : `${tier.days_before} ngày trước`}
                    </span>
                  </div>
                  <span
                    className="font-bold"
                    style={{
                      color:
                        tier.refund_percent >= 70
                          ? "#16A34A"
                          : tier.refund_percent > 0
                            ? "#D97706"
                            : "#EF4444",
                    }}
                  >
                    {tier.refund_percent}%
                  </span>
                </div>
              )
            )}
          </div>

          {/* Refund estimate */}
          {refundAmount !== undefined && refundPercent !== undefined && (
            <div
              className="mt-3 flex items-center justify-between px-4 py-3 rounded-xl font-bold"
              style={{
                backgroundColor: "#FEF2F2",
                border: "1px solid #FECACA",
              }}
            >
              <span className="text-[13px]" style={{ color: "#7F1D1D" }}>
                Số tiền hoàn (ước tính):
              </span>
              <span className="text-[16px]" style={{ color: "#DC2626" }}>
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                  maximumFractionDigits: 0,
                }).format(refundAmount)}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        {(onConfirm || onReschedule) && (
          <div
            className="px-5 pb-5 flex gap-3"
            style={{ borderTop: "1px solid #FEE2E2", paddingTop: "16px" }}
          >
            {onReschedule && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-10 text-[13px] font-semibold gap-1.5"
                style={{
                  borderRadius: "12px",
                  border: "1px solid #FECACA",
                  color: "#0046C1",
                }}
                onClick={onReschedule}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Đổi lịch
              </Button>
            )}
            {onCancel && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-10 text-[13px] font-semibold"
                style={{
                  borderRadius: "12px",
                  border: "1px solid #E5E7EB",
                  color: "#6B7280",
                }}
                onClick={onCancel}
              >
                Không hủy
              </Button>
            )}
            {onConfirm && (
              <Button
                size="sm"
                className="flex-1 h-10 text-[13px] font-semibold text-white shadow-md"
                style={{
                  background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
                  borderRadius: "12px",
                  border: "none",
                }}
                onClick={() => onConfirm(data?.reason)}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                Xác nhận hủy
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
