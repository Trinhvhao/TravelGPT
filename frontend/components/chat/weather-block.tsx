"use client";

import { useState } from "react";
import type { ContentBlockWeather, WeatherData } from "@/types/chat";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Cloud,
  CloudRain,
  CloudSnow,
  Sun,
  CloudSun,
  CloudLightning,
  Droplets,
  Wind,
  MapPin,
  Calendar,
  Info,
  Thermometer,
  Umbrella,
  Shirt,
} from "lucide-react";

const PRIMARY = "#0046C1";
const ACCENT = "#0391FF";
const GRAY = "#636363";
const NAVY = "#000E1A";

// ─── Weather Icon ─────────────────────────────────────────────────────────
function WeatherIcon({ icon, size = 32 }: { icon: string; size?: number }) {
  const iconMap: Record<string, React.ReactNode> = {
    sunny: <Sun className="w-full h-full text-[#F59E0B] fill-[#F59E0B]" />,
    partly_cloudy: <CloudSun className="w-full h-full text-[#636363]" />,
    cloudy: <Cloud className="w-full h-full text-[#9CA3AF]" />,
    rain: <CloudRain className="w-full h-full text-[#3B82F6]" />,
    heavy_rain: <CloudRain className="w-full h-full text-[#1D4ED8]" />,
    storm: <CloudLightning className="w-full h-full text-[#6B7280]" />,
    snow: <CloudSnow className="w-full h-full text-[#93C5FD]" />,
  };

  return (
    <div style={{ width: size, height: size }}>
      {iconMap[icon] || <Cloud className="w-full h-full text-[#9CA3AF]" />}
    </div>
  );
}

// ─── Weather Block ─────────────────────────────────────────────────────────
export function WeatherBlock({ block }: { block: ContentBlockWeather }) {
  const { data } = block;
  const { destination, current, forecast, best_time_to_visit, travel_advice } = data;

  return (
    <Card
      className="border-0 overflow-hidden"
      style={{
        borderRadius: "20px",
        boxShadow: "0 4px 20px rgba(0,70,193,0.12)",
      }}
    >
      {/* Header gradient */}
      <div
        className="px-5 pt-5 pb-4 flex items-start justify-between"
        style={{
          background: `linear-gradient(135deg, ${PRIMARY}, ${ACCENT})`,
          borderRadius: "20px 20px 0 0",
        }}
      >
        <div>
          <div className="flex items-center gap-1.5 text-white/80 text-[12px] mb-1">
            <MapPin className="w-3.5 h-3.5" />
            {destination}
          </div>
          <div className="flex items-end gap-3">
            <span className="text-5xl font-bold text-white leading-none">
              {current.temperature}°C
            </span>
            <div className="pb-1">
              <WeatherIcon icon={current.icon} size={36} />
            </div>
          </div>
          <p className="text-white/90 text-[13px] mt-1">{current.condition}</p>
        </div>

        {/* Current stats */}
        <div className="flex flex-col gap-2 items-end">
          <div className="flex items-center gap-1.5 text-white/80 text-[12px]">
            <Droplets className="w-3.5 h-3.5" />
            {current.humidity}% ẩm
          </div>
          <div className="flex items-center gap-1.5 text-white/80 text-[12px]">
            <Wind className="w-3.5 h-3.5" />
            {current.wind}
          </div>
          {data.source === "live" && (
            <Badge
              className="text-[10px] px-1.5"
              style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "#fff" }}
            >
              Live
            </Badge>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        {/* Travel advice */}
        {travel_advice && (
          <div
            className="rounded-xl p-4 flex gap-3"
            style={{ backgroundColor: "#EEF6FF" }}
          >
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: PRIMARY }} />
            <p className="text-[13px] leading-relaxed" style={{ color: NAVY }}>
              {travel_advice}
            </p>
          </div>
        )}

        {/* Best time */}
        {best_time_to_visit && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" style={{ color: ACCENT }} />
              <span className="text-[13px] font-bold" style={{ color: NAVY }}>
                Thời điểm tốt nhất
              </span>
            </div>
            <p className="text-[13px] leading-relaxed" style={{ color: GRAY }}>
              {best_time_to_visit}
            </p>
          </div>
        )}

        {/* Forecast */}
        {forecast && forecast.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4" style={{ color: ACCENT }} />
              <span className="text-[13px] font-bold" style={{ color: NAVY }}>
                Dự báo
              </span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {forecast.map((day, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 flex flex-col items-center gap-1 p-3 rounded-xl"
                  style={{ backgroundColor: "#F7F7F7" }}
                >
                  <p className="text-[11px] font-medium" style={{ color: GRAY }}>
                    {day.date}
                  </p>
                  <WeatherIcon icon={day.icon} size={24} />
                  <div className="text-[11px] font-semibold" style={{ color: NAVY }}>
                    {day.temperature_high}° / {day.temperature_low}°
                  </div>
                  <p className="text-[10px]" style={{ color: GRAY }}>
                    {day.condition}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
