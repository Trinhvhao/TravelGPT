"use client";
import { cn } from "@/lib/utils";
import type { BookingStatus, PaymentStatus } from "@/types";
import { Badge } from "@/components/ui/badge";

interface BookingStatusBadgeProps {
  status: BookingStatus;
  className?: string;
}

const STATUS_CONFIG: Record<BookingStatus, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" | "neutral"; className?: string }> = {
  PENDING: { label: "Chờ xác nhận", variant: "warning" },
  CONFIRMED: { label: "Đã xác nhận", variant: "success" },
  CANCELLED: { label: "Đã hủy", variant: "destructive" },
  COMPLETED: { label: "Hoàn thành", variant: "default" },
};

export function BookingStatusBadge({ status, className }: BookingStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  return (
    <Badge variant={config.variant} className={cn("font-medium", className)}>
      {config.label}
    </Badge>
  );
}

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  className?: string;
}

const PAYMENT_CONFIG: Record<PaymentStatus, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" | "neutral" }> = {
  UNPAID: { label: "Chưa thanh toán", variant: "warning" },
  PAID: { label: "Đã thanh toán", variant: "success" },
  REFUNDED: { label: "Đã hoàn tiền", variant: "neutral" },
};

export function PaymentStatusBadge({ status, className }: PaymentStatusBadgeProps) {
  const config = PAYMENT_CONFIG[status] ?? PAYMENT_CONFIG.UNPAID;
  return (
    <Badge variant={config.variant} className={cn("font-medium", className)}>
      {config.label}
    </Badge>
  );
}
