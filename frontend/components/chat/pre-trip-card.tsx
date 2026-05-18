"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ContentBlockPreTrip, PreTripChecklist, PreTripWeather } from "@/types";
import {
  CheckCircle2,
  Cloud,
  Sun,
  Thermometer,
  Droplets,
  Wind,
  MapPin,
  CalendarDays,
  ListChecks,
  PlaneTakeoff,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

const PRIMARY = "#0046C1";
const ACCENT = "#0391FF";
const NAVY = "#000E1A";
const GRAY = "#636363";

interface PreTripCardProps {
  block: ContentBlockPreTrip;
  onBook?: () => void;
}

export function PreTripCard({ block, onBook }: PreTripCardProps) {
  const { data } = block;
  const {
    countdown_message,
    weather_info,
    local_tips = [],
    packing_tips,
    checklist,
    weather,
    checklist_items,
    destination,
    departure_date,
  } = data;

  return (
    <div className="my-3 animate-[slide-up_0.3s_ease-out]">
      <Card
        className="border-0 overflow-hidden"
        style={{
          borderRadius: "20px",
          boxShadow: "0 4px 20px rgba(0,70,193,0.1)",
        }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 flex items-center gap-3"
          style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${ACCENT})` }}
        >
          <PlaneTakeoff className="h-5 w-5 text-white" />
          <div>
            <h3 className="text-white font-bold text-[15px]">Chuẩn bị chuyến đi</h3>
            {destination && (
              <p className="text-white/80 text-[12px] flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {destination}
              </p>
            )}
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Countdown */}
          {countdown_message && (
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ backgroundColor: "#EEF6FF" }}
            >
              <CalendarDays className="h-5 w-5 flex-shrink-0" style={{ color: PRIMARY }} />
              <p className="text-[13px] font-medium" style={{ color: NAVY }}>
                {countdown_message}
              </p>
            </div>
          )}

          {/* Weather */}
          {(weather || weather_info) && (
            <div>
              <h4 className="text-[13px] font-bold mb-2 flex items-center gap-2" style={{ color: NAVY }}>
                <Cloud className="h-4 w-4" style={{ color: ACCENT }} />
                Thời tiết
              </h4>
              {weather ? (
                <div
                  className="flex items-center gap-4 px-4 py-3 rounded-xl"
                  style={{ backgroundColor: "#F7F7F7" }}
                >
                  <div className="text-3xl">{weather.current?.icon ?? "☀️"}</div>
                  <div>
                    <p className="text-[18px] font-bold" style={{ color: NAVY }}>
                      {weather.current?.temperature ?? "25"}°C
                    </p>
                    <p className="text-[12px]" style={{ color: GRAY }}>
                      {weather.current?.condition ?? "Nắng"}
                    </p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-[11px] flex items-center gap-1" style={{ color: GRAY }}>
                      <Droplets className="h-3 w-3" />
                      {weather.current?.humidity ?? "70"}%
                    </p>
                    <p className="text-[11px] flex items-center gap-1" style={{ color: GRAY }}>
                      <Wind className="h-3 w-3" />
                      {weather.current?.wind ?? "10"} km/h
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-[13px]" style={{ color: GRAY }}>
                  {weather_info}
                </p>
              )}
              {weather?.travel_advice && (
                <p className="text-[12px] mt-2 italic" style={{ color: ACCENT }}>
                  💡 {weather.travel_advice}
                </p>
              )}
            </div>
          )}

          {/* Checklist */}
          {(checklist_items || checklist) && (
            <div>
              <h4 className="text-[13px] font-bold mb-2 flex items-center gap-2" style={{ color: NAVY }}>
                <ListChecks className="h-4 w-4" style={{ color: PRIMARY }} />
                Checklist chuẩn bị
              </h4>
              <div className="space-y-1">
                {(checklist_items ?? checklist?.split("\n").filter(Boolean) ?? []).map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: "#16A34A" }} />
                    <span className="text-[13px]" style={{ color: NAVY }}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Packing tips */}
          {packing_tips && (
            <div
              className="p-4 rounded-xl"
              style={{ backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0" }}
            >
              <h4 className="text-[13px] font-bold mb-2 flex items-center gap-2" style={{ color: "#16A34A" }}>
                <CheckCircle2 className="h-4 w-4" />
                Mẹo đóng gói
              </h4>
              <p className="text-[13px] leading-relaxed" style={{ color: NAVY }}>
                {packing_tips}
              </p>
            </div>
          )}

          {/* Local tips */}
          {local_tips.length > 0 && (
            <div>
              <h4 className="text-[13px] font-bold mb-2 flex items-center gap-2" style={{ color: NAVY }}>
                <MapPin className="h-4 w-4" style={{ color: ACCENT }} />
                Mẹo địa phương
              </h4>
              <div className="space-y-1.5">
                {local_tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-[13px]" style={{ color: ACCENT }}>•</span>
                    <span className="text-[13px]" style={{ color: NAVY }}>
                      {tip}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          {onBook && (
            <div className="pt-2">
              <Button
                size="sm"
                className="w-full h-10 text-[13px] font-semibold text-white shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${ACCENT}, ${PRIMARY})`,
                  borderRadius: "12px",
                  border: "none",
                }}
                onClick={onBook}
              >
                Đặt tour ngay
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
