"use client";

import * as React from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns"
import { vi } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  value?: string
  onChange: (date: string) => void
  placeholder?: string
  className?: string
  icon?: React.ReactNode
}

export function DatePicker({ value, onChange, placeholder = "Chọn ngày", className, icon }: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [viewDate, setViewDate] = React.useState(() => {
    return value ? new Date(value) : new Date()
  })

  const selectedDate = value ? new Date(value) : null

  const calendarDays = React.useMemo(() => {
    const monthStart = startOfMonth(viewDate)
    const monthEnd = endOfMonth(viewDate)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }, [viewDate])

  const handleSelect = (day: Date) => {
    onChange(format(day, "yyyy-MM-dd"))
    setOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      setOpen(!open)
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex w-full items-center rounded-lg border border-light-gray bg-off-white",
          "text-[16px] leading-[20px] font-normal text-navy",
          "min-h-[48px] transition-all duration-200 ease-in-out",
          "focus:outline-none focus:border-2 focus:border-primary",
          "focus:bg-white focus:shadow-[0px_0px_0px_3px_rgba(0,70,193,0.10)]",
          "hover:border-primary cursor-pointer",
          icon ? "pl-10 pr-4" : "px-4",
          className
        )}
      >
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
            {icon}
          </span>
        )}
        <span className={selectedDate ? "text-navy" : "text-medium-gray"}>
          {selectedDate ? format(selectedDate, "dd/MM/yyyy") : placeholder}
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 left-0">
          <div className="w-72 rounded-xl border border-light-gray bg-white p-4 shadow-elevated">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => setViewDate(subMonths(viewDate, 1))}
                className="p-1.5 rounded-lg hover:bg-lightblue transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-navy" />
              </button>
              <span className="text-[14px] font-semibold text-navy capitalize">
                {format(viewDate, "MMMM yyyy", { locale: vi })}
              </span>
              <button
                type="button"
                onClick={() => setViewDate(addMonths(viewDate, 1))}
                className="p-1.5 rounded-lg hover:bg-lightblue transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-navy" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => (
                <div key={day} className="text-center text-[11px] font-medium text-dark-gray py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-0.5">
              {calendarDays.map((day) => {
                const isSelected = selectedDate && isSameDay(day, selectedDate)
                const isCurrentMonth = isSameMonth(day, viewDate)
                const isToday = isSameDay(day, new Date())

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => handleSelect(day)}
                    className={cn(
                      "w-8 h-8 rounded-lg text-[13px] font-normal transition-colors",
                      isSelected
                        ? "bg-primary text-white font-medium"
                        : isCurrentMonth
                        ? "text-navy hover:bg-lightblue"
                        : "text-medium-gray hover:bg-lightblue",
                      isToday && !isSelected && "border border-primary"
                    )}
                  >
                    {format(day, "d")}
                  </button>
                )
              })}
            </div>

            {/* Today button */}
            <div className="mt-4 pt-3 border-t border-light-gray">
              <button
                type="button"
                onClick={() => {
                  const today = new Date()
                  setViewDate(today)
                  onChange(format(today, "yyyy-MM-dd"))
                  setOpen(false)
                }}
                className="w-full text-[13px] text-primary font-medium hover:underline"
              >
                Chọn hôm nay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop to close */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  )
}
