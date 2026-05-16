"use client";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Calendar,
  CreditCard,
  UserCheck,
  UserPlus,
  MapPin,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const PRIMARY = "#0046C1";
const ACCENT = "#0391FF";
const SUCCESS = "#059669";
const WARNING = "#D97706";
const DANGER = "#DC2626";

export interface ActivityItem {
  id: string;
  type: "booking" | "payment" | "payment_failed" | "user_register" | "cancellation" | "review" | "chat";
  message: string;
  detail?: string;
  timestamp: string;
  meta?: {
    booking_code?: string;
    amount?: number;
    user_name?: string;
    tour_name?: string;
  };
}

interface ActivityFeedProps {
  items: ActivityItem[];
  className?: string;
}

const TYPE_CONFIG: Record<ActivityItem["type"], {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  bg: string;
  color: string;
}> = {
  booking: { icon: Calendar, bg: "#D9EEFF", color: PRIMARY },
  payment: { icon: CreditCard, bg: "#DCFCE7", color: SUCCESS },
  payment_failed: { icon: AlertCircle, bg: "#FEF2F2", color: DANGER },
  user_register: { icon: UserPlus, bg: "#EDE9FE", color: "#7C3AED" },
  cancellation: { icon: XCircle, bg: "#FEF2F2", color: DANGER },
  review: { icon: CheckCircle2, bg: "#FEF3C7", color: WARNING },
  chat: { icon: MapPin, bg: "#D9EEFF", color: ACCENT },
};

function ActivityDot({ type }: { type: ActivityItem["type"] }) {
  const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.chat;
  return (
    <div
      className="w-2 h-2 rounded-full flex-shrink-0"
      style={{ backgroundColor: config.color }}
    />
  );
}

function ActivityAvatar({ type }: { type: ActivityItem["type"] }) {
  const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.chat;
  const Icon = config.icon;
  return (
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: config.bg }}
    >
      <span style={{ color: config.color }}>
        <Icon className="w-4 h-4" />
      </span>
    </div>
  );
}

export function ActivityFeed({ items, className }: ActivityFeedProps) {
  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <div className="w-12 h-12 rounded-full bg-[#F7F7F7] flex items-center justify-center">
          <Calendar className="w-6 h-6 text-[#999999]" />
        </div>
        <p className="text-[14px] text-[#636363]">Chưa có hoạt động nào gần đây</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-0">
        {items.map((item, idx) => {
          const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.chat;
          const timeAgo = (() => {
            try {
              return formatDistanceToNow(new Date(item.timestamp), { addSuffix: true, locale: vi });
            } catch {
              return "Vừa xong";
            }
          })();

          return (
            <div
              key={item.id}
              className="flex items-start gap-3 py-3 animate-[slide-up_0.3s_ease-out]"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {/* Avatar */}
              <ActivityAvatar type={item.type} />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[#000E1A] leading-snug">
                      {item.message}
                    </p>
                    {item.detail && (
                      <p className="text-[12px] text-[#636363] mt-0.5">{item.detail}</p>
                    )}
                    {item.meta?.booking_code && (
                      <p className="text-[11px] font-mono mt-0.5" style={{ color: PRIMARY }}>
                        {item.meta.booking_code}
                      </p>
                    )}
                  </div>
                  <span className="text-[11px] text-[#999999] flex-shrink-0 whitespace-nowrap">
                    {timeAgo}
                  </span>
                </div>
              </div>

              {/* Timeline connector */}
              {idx < items.length - 1 && (
                <div className="absolute left-[19px] top-[52px] w-px h-4" style={{ backgroundColor: "#EEEEEE" }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
