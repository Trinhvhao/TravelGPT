"use client";
import { useMemo } from "react";
import { formatPrice } from "@/lib/utils";
import { calculateRefund } from "@/types/booking";
import { AlertTriangle, Info } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface RefundCalculatorProps {
  totalPrice: number;
  departureDate: string;
  className?: string;
}

export function RefundCalculator({ totalPrice, departureDate, className }: RefundCalculatorProps) {
  const refund = useMemo(
    () => calculateRefund(totalPrice, departureDate),
    [totalPrice, departureDate]
  );

  const isRefundable = refund.refundPercentage > 0;

  return (
    <div className={`rounded-lg border border-border bg-white ${className ?? ""}`}>
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-heading-3 font-bold text-navy">
          <AlertTriangle className={isRefundable ? "w-5 h-5 text-warning" : "w-5 h-5 text-error"} />
          Chính sách hủy tour
        </div>

        {/* Refund policy breakdown */}
        <div className="space-y-1.5 text-body-sm">
          <div className="flex justify-between">
            <span className="text-dark-gray">14+ ngày trước</span>
            <span className="text-success font-medium">Hoàn 90%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-dark-gray">7-13 ngày</span>
            <span className="text-success font-medium">Hoàn 70%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-dark-gray">3-6 ngày</span>
            <span className="text-warning font-medium">Hoàn 50%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-dark-gray">1-2 ngày</span>
            <span className="text-warning font-medium">Hoàn 20%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-dark-gray">Ngày khởi hành</span>
            <span className="text-error font-medium">Không hoàn</span>
          </div>
        </div>

        <Separator />

        {/* Current refund calculation */}
        <div className="space-y-2">
          <div className="flex justify-between text-body-sm">
            <span className="text-dark-gray">Còn lại</span>
            <span className="font-medium">{refund.daysRemaining} ngày</span>
          </div>
          <div className="flex justify-between text-body-sm">
            <span className="text-dark-gray">Tỷ lệ hoàn</span>
            <span className="font-medium text-warning">{refund.refundPercentage}%</span>
          </div>
          <div className="flex justify-between text-body-sm">
            <span className="text-dark-gray">Số tiền hoàn (trước phí)</span>
            <span>{formatPrice(refund.grossRefund)}</span>
          </div>
          <div className="flex justify-between text-body-sm text-error">
            <span className="flex items-center gap-1">
              <Info className="w-3 h-3" />
              Phí xử lý ({refund.processingFeePercentage}%)
            </span>
            <span>- {formatPrice(refund.grossRefund * (refund.processingFeePercentage / 100))}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-heading-3 font-bold">
            <span className="text-navy">Số tiền nhận lại</span>
            <span className={isRefundable ? "text-success" : "text-error"}>
              {isRefundable ? formatPrice(refund.netRefund) : "0 ₫"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
