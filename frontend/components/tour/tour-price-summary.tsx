"use client";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import { PriceBreakdown as PriceBreakdownType } from "@/types/booking";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";

interface PriceSummaryProps {
  price: number;
  numAdults: number;
  numChildren: number;
  breakdown: PriceBreakdownType | null;
  showDetails?: boolean;
  className?: string;
}

export function PriceSummary({
  price,
  numAdults,
  numChildren,
  breakdown,
  showDetails = true,
  className,
}: PriceSummaryProps) {
  const display = useMemo(() => {
    if (breakdown) return breakdown;
    const adultPrice = price;
    const childPrice = price * 0.5;
    const subtotalAdults = adultPrice * numAdults;
    const subtotalChildren = childPrice * numChildren;
    const subtotal = subtotalAdults + subtotalChildren;
    const serviceFee = Math.round(subtotal * 0.05);
    const total = subtotal + serviceFee;
    return {
      adultPrice, childPrice, numAdults, numChildren,
      subtotalAdults, subtotalChildren, subtotal, serviceFee, total,
    };
  }, [breakdown, price, numAdults, numChildren]);

  return (
    <div className={cn("rounded-lg border border-border bg-white", className)}>
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-body text-dark-gray">Giá tour</span>
          <span className="text-heading-2 font-bold text-navy">
            {formatPrice(display.adultPrice)}
          </span>
        </div>

        {showDetails && (
          <>
            <Separator />

            {/* Line items */}
            <div className="space-y-2">
              {display.numAdults > 0 && (
                <div className="flex justify-between text-body-sm">
                  <span className="text-dark-gray">
                    Người lớn × {display.numAdults}
                  </span>
                  <span className="text-navy">{formatPrice(display.subtotalAdults)}</span>
                </div>
              )}

              {display.numChildren > 0 && (
                <div className="flex justify-between text-body-sm">
                  <span className="text-dark-gray">
                    Trẻ em × {display.numChildren} (50%)
                  </span>
                  <span className="text-navy">{formatPrice(display.subtotalChildren)}</span>
                </div>
              )}

              <div className="flex justify-between text-body-sm">
                <span className="text-dark-gray">Phí dịch vụ (5%)</span>
                <span className="text-navy">{formatPrice(display.serviceFee)}</span>
              </div>

              <Separator />

              <div className="flex justify-between text-heading-3 font-bold">
                <span className="text-navy">Tổng cộng</span>
                <span className="text-primary">{formatPrice(display.total)}</span>
              </div>
            </div>

            {/* Info note */}
            <div className="flex items-start gap-2 p-3 rounded-md bg-lightest-gray text-metadata text-dark-gray">
              <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-medium-gray" />
              <span>Giá đã bao gồm thuế VAT. Trẻ em dưới 6 tuổi được miễn phí.</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
