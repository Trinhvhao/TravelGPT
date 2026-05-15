"use client";
import { cn } from "@/lib/utils";
import type { BookingFlowStep } from "@/types";
import { CheckCircle, Circle } from "lucide-react";

// ─── Design Tokens (Airbnb Style) ──────────────────────────────────────────────
const PRIMARY = "#0046C1";
const ACCENT = "#0391FF";
const SURFACE_LIGHT = "#D9EEFF";
const NAVY = "#000E1A";
const GRAY = "#636363";

interface BookingFlowCardProps {
  step: BookingFlowStep;
  bookingData: Record<string, unknown>;
  className?: string;
}

const STEP_ORDER: BookingFlowStep[] = [
  "COLLECT_NAME",
  "COLLECT_EMAIL",
  "COLLECT_PHONE",
  "COLLECT_TOUR",
  "COLLECT_DATE",
  "COLLECT_PARTICIPANTS",
  "COLLECT_SPECIAL_REQUESTS",
  "CONFIRM_BOOKING",
];

export function BookingFlowCard({ step, bookingData, className }: BookingFlowCardProps) {
  const currentIdx = STEP_ORDER.indexOf(step);

  return (
    <div
      className={cn("p-4", className)}
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: "16px",
        boxShadow: "0 4px 20px rgba(0,70,193,0.12)",
        border: `1px solid ${SURFACE_LIGHT}`,
      }}
    >
      <p
        className="text-[14px] font-semibold mb-4"
        style={{ color: PRIMARY }}
      >
        Đang thu thập thông tin đặt tour...
      </p>

      {/* Progress steps */}
      <div className="space-y-2">
        {STEP_ORDER.map((s, idx) => {
          const isDone = idx < currentIdx;
          const isCurrent = s === step;
          return (
            <div key={s} className="flex items-center gap-2">
              {isDone ? (
                <CheckCircle
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: "#22C55E" }}
                />
              ) : isCurrent ? (
                <div
                  className="w-4 h-4 rounded-full border-2 flex-shrink-0"
                  style={{
                    borderColor: PRIMARY,
                    animation: "pulse 2s ease-in-out infinite",
                  }}
                />
              ) : (
                <Circle
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: "#E5E5E5" }}
                />
              )}
              <span
                className={cn("text-[13px]")}
                style={
                  isCurrent
                    ? { fontWeight: 600, color: PRIMARY }
                    : isDone
                    ? { color: "#22C55E", textDecoration: "line-through" }
                    : { color: GRAY }
                }
              >
                {s.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                {isCurrent && bookingData && (
                  <span className="ml-1" style={{ color: GRAY }}>
                    (đang nhập...)
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
