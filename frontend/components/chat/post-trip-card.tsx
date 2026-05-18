"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ContentBlockPostTrip } from "@/types";
import {
  Star,
  Gift,
  Heart,
  MessageSquare,
  MapPin,
  ArrowRight,
  Trophy,
  Sparkles,
} from "lucide-react";

const PRIMARY = "#0046C1";
const ACCENT = "#0391FF";
const NAVY = "#000E1A";
const GRAY = "#636363";

interface PostTripCardProps {
  block: ContentBlockPostTrip;
  onReview?: () => void;
  onBookAgain?: () => void;
}

export function PostTripCard({ block, onReview, onBookAgain }: PostTripCardProps) {
  const { data } = block;
  const {
    feedback_survey,
    review_prompt,
    loyalty_points,
    loyalty_tier,
    loyalty_benefits = [],
    points_to_next_tier,
    return_reminder,
  } = data;

  const tierColors: Record<string, { bg: string; text: string; border: string }> = {
    Bronze: { bg: "#FEF3C7", text: "#92400E", border: "#FDE68A" },
    Silver: { bg: "#F1F5F9", text: "#475569", border: "#CBD5E1" },
    Gold: { bg: "#FEF9C3", text: "#B45309", border: "#FDE047" },
    Platinum: { bg: "#EEF2FF", text: "#4338CA", border: "#A5B4FC" },
  };

  const tierColor = tierColors[loyalty_tier ?? "Bronze"] ?? tierColors.Bronze;

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
          <Sparkles className="h-5 w-5 text-white" />
          <div>
            <h3 className="text-white font-bold text-[15px]">Sau chuyến đi</h3>
            <p className="text-white/80 text-[12px]">Cảm ơn bạn đã đồng hành cùng TravelGPT!</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Loyalty */}
          {(loyalty_points !== undefined || loyalty_tier) && (
            <div
              className="p-4 rounded-xl"
              style={{
                backgroundColor: tierColor.bg,
                border: `1px solid ${tierColor.border}`,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" style={{ color: tierColor.text }} />
                  <h4 className="font-bold text-[14px]" style={{ color: tierColor.text }}>
                    Hạng thành viên
                  </h4>
                </div>
                {loyalty_tier && (
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{ backgroundColor: tierColor.text, color: "#FFFFFF" }}
                  >
                    {loyalty_tier}
                  </span>
                )}
              </div>

              <div className="flex items-end justify-between">
                <div>
                  {loyalty_points !== undefined && (
                    <p className="text-[24px] font-extrabold" style={{ color: tierColor.text }}>
                      {loyalty_points.toLocaleString("vi-VN")}
                    </p>
                  )}
                  <p className="text-[12px]" style={{ color: tierColor.text }}>
                    điểm tích lũy
                  </p>
                </div>
                {points_to_next_tier !== undefined && points_to_next_tier > 0 && (
                  <div className="text-right">
                    <p className="text-[12px]" style={{ color: tierColor.text }}>
                      Cần thêm
                    </p>
                    <p className="text-[14px] font-bold" style={{ color: tierColor.text }}>
                      {points_to_next_tier.toLocaleString("vi-VN")} điểm
                    </p>
                  </div>
                )}
              </div>

              {loyalty_benefits.length > 0 && (
                <div className="mt-3 space-y-1">
                  {loyalty_benefits.map((benefit, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Gift className="h-3.5 w-3.5" style={{ color: tierColor.text }} />
                      <span className="text-[12px]" style={{ color: tierColor.text }}>
                        {benefit}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Feedback survey */}
          {feedback_survey && (
            <div
              className="p-4 rounded-xl"
              style={{ backgroundColor: "#EEF6FF", border: "1px solid #BFDBFE" }}
            >
              <h4 className="text-[13px] font-bold mb-2 flex items-center gap-2" style={{ color: PRIMARY }}>
                <MessageSquare className="h-4 w-4" />
                Khảo sát trải nghiệm
              </h4>
              <p className="text-[13px] leading-relaxed" style={{ color: NAVY }}>
                {feedback_survey}
              </p>
            </div>
          )}

          {/* Review prompt */}
          {review_prompt && (
            <div
              className="p-4 rounded-xl"
              style={{ backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0" }}
            >
              <h4 className="text-[13px] font-bold mb-2 flex items-center gap-2" style={{ color: "#16A34A" }}>
                <Star className="h-4 w-4" />
                Chia sẻ trải nghiệm
              </h4>
              <p className="text-[13px] leading-relaxed" style={{ color: NAVY }}>
                {review_prompt}
              </p>
            </div>
          )}

          {/* Return reminder */}
          {return_reminder && (
            <div
              className="p-4 rounded-xl flex items-start gap-3"
              style={{ backgroundColor: "#FEF9C3", border: "1px solid #FDE68A" }}
            >
              <MapPin className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: "#D97706" }} />
              <p className="text-[13px] leading-relaxed" style={{ color: NAVY }}>
                {return_reminder}
              </p>
            </div>
          )}

          {/* Actions */}
          {(onReview || onBookAgain) && (
            <div className="flex gap-3">
              {onReview && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-10 text-[13px] font-semibold gap-1.5"
                  style={{
                    borderRadius: "12px",
                    border: `1px solid ${SURFACE_LIGHT}`,
                    color: PRIMARY,
                  }}
                  onClick={onReview}
                >
                  <Star className="h-3.5 w-3.5" />
                  Viết review
                </Button>
              )}
              {onBookAgain && (
                <Button
                  size="sm"
                  className="flex-1 h-10 text-[13px] font-semibold text-white shadow-md"
                  style={{
                    background: `linear-gradient(135deg, ${ACCENT}, ${PRIMARY})`,
                    borderRadius: "12px",
                    border: "none",
                  }}
                  onClick={onBookAgain}
                >
                  <Heart className="h-3.5 w-3.5 mr-1" />
                  Đặt tour mới
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

const SURFACE_LIGHT = "#D9EEFF";
