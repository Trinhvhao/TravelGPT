"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { DatePicker } from "@/components/ui/date-picker";
import { chatApi } from "@/lib/chat-api";
import type { PreTripResponse } from "@/types";
import {
  MapPin,
  CalendarDays,
  Clock,
  CheckCircle2,
  Cloud,
  Sun,
  Droplets,
  Wind,
  PlaneTakeoff,
  ListChecks,
  Luggage,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const PRIMARY = "#0046C1";
const ACCENT = "#0391FF";
const NAVY = "#000E1A";
const GRAY = "#636363";

const TRIP_TYPES = [
  { value: "beach", label: "Biển", emoji: "🏖️" },
  { value: "mountain", label: "Núi", emoji: "🏔️" },
  { value: "city", label: "Thành phố", emoji: "🏙️" },
  { value: "cultural", label: "Văn hóa", emoji: "🏛️" },
];

function PreTripContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [destination, setDestination] = useState(searchParams.get("destination") ?? "");
  const [departureDate, setDepartureDate] = useState(searchParams.get("departure") ?? "");
  const [returnDate, setReturnDate] = useState(searchParams.get("return") ?? "");
  const [tripType, setTripType] = useState<"beach" | "mountain" | "city" | "cultural">(searchParams.get("type") as "beach" | "mountain" | "city" | "cultural" ?? "beach");
  const [duration, setDuration] = useState<number>(Number(searchParams.get("duration")) || 3);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PreTripResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPreTrip = async () => {
    if (!destination.trim()) {
      setError("Vui lòng nhập điểm đến");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await chatApi.preTripSummary({
        destination,
        trip_type: tripType,
        duration,
        departure_date: departureDate || undefined,
        return_date: returnDate || undefined,
      });
      setData(result);
    } catch (e) {
      setError("Không thể tải thông tin chuẩn bị chuyến đi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch if params provided
  useEffect(() => {
    if (searchParams.get("destination")) {
      fetchPreTrip();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tripTypeInfo = TRIP_TYPES.find((t) => t.value === tripType);

  const checklists = data?.checklist
    ? data.checklist.split("\n").filter(Boolean)
    : [];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F7F7F7" }}>
      <Navbar />

      {/* Hero */}
      <div
        className="w-full py-12 px-4"
        style={{
          background: `linear-gradient(135deg, ${PRIMARY}, ${ACCENT})`,
        }}
      >
        <div className="container mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 text-white text-xs font-semibold mb-4">
            <PlaneTakeoff className="h-3.5 w-3.5" />
            Chuẩn bị trước chuyến đi
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2">
            Sẵn sàng cho chuyến đi!
          </h1>
          <p className="text-white/80 text-[15px]">
            Nhận checklist, thời tiết và mẹo địa phương cho chuyến đi của bạn
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-3xl px-4 py-8 flex-1">
        {/* Search form */}
        <Card
          className="border-0 p-6 mb-6"
          style={{ borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,70,193,0.1)" }}
        >
          <h2 className="font-bold text-[16px] mb-4" style={{ color: NAVY }}>
            Thông tin chuyến đi
          </h2>
          <div className="space-y-4">
            {/* Điểm đến */}
            <div>
              <label className="text-[13px] font-medium mb-1.5 block" style={{ color: GRAY }}>
                Điểm đến <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10">
                  <MapPin className="h-4 w-4" style={{ color: GRAY }} />
                </div>
                <Input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="VD: Đà Nẵng, Phú Quốc, Hội An..."
                  className="pl-10"
                  onKeyDown={(e) => e.key === "Enter" && fetchPreTrip()}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Ngày khởi hành */}
              <div>
                <label className="text-[13px] font-medium mb-1.5 block" style={{ color: GRAY }}>
                  Ngày khởi hành
                </label>
                <DatePicker
                  value={departureDate}
                  onChange={setDepartureDate}
                  placeholder="Chọn ngày"
                  icon={<CalendarDays className="h-4 w-4" style={{ color: GRAY }} />}
                />
              </div>
              {/* Ngày về */}
              <div>
                <label className="text-[13px] font-medium mb-1.5 block" style={{ color: GRAY }}>
                  Ngày về
                </label>
                <DatePicker
                  value={returnDate}
                  onChange={setReturnDate}
                  placeholder="Chọn ngày"
                  icon={<CalendarDays className="h-4 w-4" style={{ color: GRAY }} />}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Loại chuyến đi */}
              <div>
                <label className="text-[13px] font-medium mb-1.5 block" style={{ color: GRAY }}>
                  Loại chuyến đi
                </label>
                <Select value={tripType} onValueChange={(v) => setTripType(v as "beach" | "mountain" | "city" | "cultural")}>
                  <SelectTrigger className="w-full" icon={<PlaneTakeoff className="h-4 w-4" style={{ color: GRAY }} />}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIP_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.emoji} {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Số ngày */}
              <div>
                <label className="text-[13px] font-medium mb-1.5 block" style={{ color: GRAY }}>
                  Số ngày
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10">
                    <Clock className="h-4 w-4" style={{ color: GRAY }} />
                  </div>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-[13px]"
                style={{ backgroundColor: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button
              onClick={fetchPreTrip}
              disabled={loading}
              className="w-full h-11 text-[14px] font-semibold text-white"
              style={{
                background: `linear-gradient(135deg, ${ACCENT}, ${PRIMARY})`,
                borderRadius: "12px",
                border: "none",
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang tải...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Xem checklist chuẩn bị
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Results */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-0 p-5" style={{ borderRadius: "20px" }}>
                <Skeleton className="h-5 w-32 mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-4/5" />
              </Card>
            ))}
          </div>
        )}

        {data && (
          <div className="space-y-4 animate-[slide-up_0.3s_ease-out]">
            {/* Countdown */}
            {data.countdown_message && (
              <Card
                className="border-0 p-5"
                style={{ borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,70,193,0.1)" }}
              >
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ backgroundColor: "#EEF6FF" }}>
                  <CalendarDays className="h-6 w-6 flex-shrink-0" style={{ color: PRIMARY }} />
                  <p className="text-[15px] font-semibold" style={{ color: NAVY }}>
                    {data.countdown_message}
                  </p>
                </div>
              </Card>
            )}

            {/* Weather */}
            {data.weather_info && (
              <Card
                className="border-0 p-5"
                style={{ borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,70,193,0.1)" }}
              >
                <h3 className="font-bold text-[15px] mb-3 flex items-center gap-2" style={{ color: NAVY }}>
                  <Cloud className="h-5 w-5" style={{ color: ACCENT }} />
                  Thời tiết
                </h3>
                <div
                  className="flex items-center gap-4 px-4 py-3 rounded-xl"
                  style={{ backgroundColor: "#F7F7F7" }}
                >
                  <div className="text-4xl">{tripTypeInfo?.emoji ?? "☀️"}</div>
                  <div className="flex-1">
                    <p className="text-[16px] font-semibold" style={{ color: NAVY }}>
                      {data.weather_info}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Local tips */}
            {data.local_tips && data.local_tips.length > 0 && (
              <Card
                className="border-0 p-5"
                style={{ borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,70,193,0.1)" }}
              >
                <h3 className="font-bold text-[15px] mb-3 flex items-center gap-2" style={{ color: NAVY }}>
                  <MapPin className="h-5 w-5" style={{ color: ACCENT }} />
                  Mẹo địa phương
                </h3>
                <div className="space-y-2">
                  {data.local_tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: ACCENT }} />
                      <p className="text-[13px]" style={{ color: NAVY }}>{tip}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Packing tips */}
            {data.packing_tips && (
              <Card
                className="border-0 p-5"
                style={{ borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,70,193,0.1)" }}
              >
                <h3 className="font-bold text-[15px] mb-3 flex items-center gap-2" style={{ color: NAVY }}>
                  <Luggage className="h-5 w-5" style={{ color: PRIMARY }} />
                  Mẹo đóng gói
                </h3>
                <p className="text-[14px] leading-relaxed" style={{ color: NAVY }}>
                  {data.packing_tips}
                </p>
              </Card>
            )}

            {/* Checklist */}
            {checklists.length > 0 && (
              <Card
                className="border-0 p-5"
                style={{ borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,70,193,0.1)" }}
              >
                <h3 className="font-bold text-[15px] mb-4 flex items-center gap-2" style={{ color: NAVY }}>
                  <ListChecks className="h-5 w-5" style={{ color: PRIMARY }} />
                  Checklist chuẩn bị ({checklists.length} mục)
                </h3>
                <div className="space-y-2">
                  {checklists.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl transition-colors"
                      style={{ backgroundColor: "#F7F7F7" }}>
                      <input
                        type="checkbox"
                        className="mt-0.5 rounded"
                        style={{ accentColor: PRIMARY }}
                      />
                      <label className="text-[13px] cursor-pointer" style={{ color: NAVY }}>
                        {item}
                      </label>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* CTA */}
            <Card
              className="border-0 p-5"
              style={{ borderRadius: "20px", background: `linear-gradient(135deg, ${PRIMARY}, ${ACCENT})` }}
            >
              <div className="text-center">
                <p className="text-white font-bold text-[15px] mb-2">
                  Sẵn sàng đặt tour?
                </p>
                <p className="text-white/80 text-[13px] mb-4">
                  Để AI hỗ trợ bạn tìm và đặt tour phù hợp nhất
                </p>
                <div className="flex gap-3 justify-center">
                  <Link href="/chat">
                    <Button
                      className="h-10 px-5 text-[13px] font-semibold"
                      style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "#FFFFFF", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.3)" }}
                    >
                      Trò chuyện với AI
                    </Button>
                  </Link>
                  <Link href="/tours">
                    <Button
                      className="h-10 px-5 text-[13px] font-semibold text-white"
                      style={{ backgroundColor: "#FFFFFF", color: PRIMARY, borderRadius: "12px", border: "none" }}
                    >
                      Tìm tour
                      <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Empty state */}
        {!loading && !data && !error && (
          <Card
            className="border-0 p-10 text-center"
            style={{ borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,70,193,0.1)" }}
          >
            <div className="text-5xl mb-4">{tripTypeInfo?.emoji ?? "✈️"}</div>
            <h3 className="font-bold text-[16px] mb-2" style={{ color: NAVY }}>
              Checklist chuẩn bị chuyến đi
            </h3>
            <p className="text-[13px] mb-6" style={{ color: GRAY }}>
              Nhập điểm đến và nhấn &quot;Xem checklist&quot; để nhận danh sách chuẩn bị chi tiết cho chuyến đi của bạn
            </p>
          </Card>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default function PreTripPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-[#0046C1]">Đang tải...</div></div>}>
      <PreTripContent />
    </Suspense>
  );
}
