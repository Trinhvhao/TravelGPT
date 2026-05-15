"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { TourScheduleDay } from "@/types";

interface TourScheduleProps {
  schedule: TourScheduleDay[];
  className?: string;
}

export function TourSchedule({ schedule, className }: TourScheduleProps) {
  const [expandedDay, setExpandedDay] = useState<number | null>(schedule.length > 0 ? 0 : null);

  const toggle = (day: number) => setExpandedDay((cur) => (cur === day ? null : day));

  if (!schedule.length) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-heading-2 font-bold text-navy">Lịch trình</h3>

      <div className="space-y-2">
        {schedule.map((item) => {
          const isOpen = expandedDay === item.day;
          return (
            <div
              key={item.day}
              className="rounded-lg border border-border overflow-hidden"
            >
              {/* Day header */}
              <button
                className={cn(
                  "w-full flex items-center gap-4 p-4 text-left transition-colors",
                  isOpen ? "bg-primary/5" : "bg-white hover:bg-lightest-gray"
                )}
                onClick={() => toggle(item.day)}
              >
                {/* Day badge */}
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm",
                  isOpen ? "bg-primary text-white" : "bg-lightest-gray text-dark-gray"
                )}>
                  {item.day}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "font-semibold text-navy",
                    isOpen ? "text-primary" : ""
                  )}>
                    {item.title}
                  </p>
                  {item.meals && item.meals.length > 0 && (
                    <p className="text-metadata text-dark-gray mt-0.5">
                      {item.meals.join(" • ")}
                    </p>
                  )}
                </div>

                <span className={cn(
                  "text-medium-gray transition-transform",
                  isOpen && "rotate-180"
                )}>
                  ▼
                </span>
              </button>

              {/* Activities */}
              {isOpen && (
                <div className="px-4 pb-4 pl-[4.5rem] space-y-2">
                  {item.activities.map((activity, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-muted-foreground mt-0.5">•</span>
                      <span className="text-body-sm text-navy">{activity}</span>
                    </div>
                  ))}
                  {item.notes && (
                    <p className="text-metadata text-medium-gray italic pt-2">
                      {item.notes}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
