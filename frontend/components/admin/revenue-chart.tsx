"use client";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";

const PRIMARY = "#0046C1";
const ACCENT = "#0391FF";

interface RevenueBar {
  date: string;
  label: string;
  revenue: number;
  bookings: number;
}

interface RevenueChartProps {
  data: RevenueBar[];
  className?: string;
}

export function RevenueChart({ data, className }: RevenueChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-[#636363] text-sm">
        Không có dữ liệu doanh thu
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  const formatLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN", { weekday: "short", day: "numeric", month: "short" });
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Chart */}
      <div className="flex items-end gap-2 h-40">
        {data.map((d, idx) => {
          const pct = Math.max((d.revenue / maxRevenue) * 100, 4);
          const isToday = idx === data.length - 1;
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
              {/* Tooltip */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute z-10 -top-8 bg-[#000E1A] text-white text-[11px] px-2 py-1 rounded-lg whitespace-nowrap pointer-events-none">
                {formatPrice(d.revenue)} · {d.bookings} đơn
              </div>

              {/* Bar */}
              <div className="relative w-full flex flex-col items-center">
                <div
                  className="w-full rounded-t-lg transition-all duration-300 group-hover:opacity-80"
                  style={{
                    height: `${pct}%`,
                    background: isToday
                      ? `linear-gradient(180deg, ${ACCENT}, ${PRIMARY})`
                      : `linear-gradient(180deg, ${ACCENT}80, ${PRIMARY}80)`,
                    minHeight: 8,
                  }}
                />
              </div>

              {/* Label */}
              <p className="text-[10px] text-[#636363] text-center leading-tight">
                {formatLabel(d.date)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 pt-2 border-t border-[#EEEEEE]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: `linear-gradient(180deg, ${ACCENT}, ${PRIMARY})` }} />
          <span className="text-[11px] text-[#636363]">Hôm nay</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: `linear-gradient(180deg, ${ACCENT}80, ${PRIMARY}80)` }} />
          <span className="text-[11px] text-[#636363]">Các ngày trước</span>
        </div>
      </div>
    </div>
  );
}
