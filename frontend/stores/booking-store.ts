// ============================================================
// Booking Store — manages multi-step booking flow state
//
// Mirrors backend BookingFlowStep:
// GREETING → COLLECT_NAME → COLLECT_EMAIL → COLLECT_PHONE → COLLECT_TOUR
// → COLLECT_DATE → COLLECT_PARTICIPANTS → COLLECT_SPECIAL_REQUESTS
// → CONFIRM_BOOKING → PROCESSING → SUCCESS → COMPLETED
// ============================================================
import { create } from "zustand";
import type { BookingFlowStep, BookingFlowData } from "@/types";
import type { PriceBreakdown } from "@/types/booking";

interface BookingState {
  // Flow control
  isActive: boolean;
  currentStep: BookingFlowStep | null;

  // Booking data collected through steps
  bookingData: BookingFlowData;

  // Computed price (updated reactively)
  priceBreakdown: PriceBreakdown | null;

  // Selected tour info
  tourId: string | null;
  tourName: string | null;
  tourPrice: number | null;
  tourDepartureDates: string[] | null;

  // Confirmed booking result
  confirmedBookingId: string | null;
  confirmedBookingCode: string | null;

  // Actions
  startFlow: (tourId?: string, tourName?: string, tourPrice?: number) => void;
  setStep: (step: BookingFlowStep) => void;
  updateData: (data: Partial<BookingFlowData>) => void;
  setTourInfo: (id: string, name: string, price: number, departureDates?: string[]) => void;
  setPriceBreakdown: (breakdown: PriceBreakdown) => void;
  setConfirmedBooking: (id: string, code: string) => void;
  resetFlow: () => void;
  goToStep: (step: BookingFlowStep) => void;
}

const initialBookingData: BookingFlowData = {
  contact_name: undefined,
  contact_email: undefined,
  contact_phone: undefined,
  tour_id: undefined,
  tour_name: undefined,
  departure_date: undefined,
  num_adults: 1,
  num_children: 0,
  special_requests: undefined,
  total_price: undefined,
  booking_code: undefined,
  booking_id: undefined,
};

export const useBookingStore = create<BookingState>()((set) => ({
  isActive: false,
  currentStep: null,
  bookingData: { ...initialBookingData },
  priceBreakdown: null,
  tourId: null,
  tourName: null,
  tourPrice: null,
  tourDepartureDates: null,
  confirmedBookingId: null,
  confirmedBookingCode: null,

  startFlow: (tourId, tourName, tourPrice) =>
    set({
      isActive: true,
      currentStep: null,
      bookingData: { ...initialBookingData },
      priceBreakdown: null,
      tourId: tourId ?? null,
      tourName: tourName ?? null,
      tourPrice: tourPrice ?? null,
      tourDepartureDates: null,
      confirmedBookingId: null,
      confirmedBookingCode: null,
    }),

  setStep: (step) => set({ currentStep: step }),

  updateData: (data) =>
    set((s) => ({
      bookingData: { ...s.bookingData, ...data },
    })),

  setTourInfo: (id, name, price, departureDates) =>
    set((s) => ({
      ...s,
      tourId: id,
      tourName: name,
      tourPrice: price,
      tourDepartureDates: departureDates ?? null,
      bookingData: { ...s.bookingData, tour_id: id, tour_name: name },
    })),

  setPriceBreakdown: (breakdown) => set({ priceBreakdown: breakdown }),

  setConfirmedBooking: (id, code) =>
    set((s) => ({
      ...s,
      confirmedBookingId: id,
      confirmedBookingCode: code,
      bookingData: { ...s.bookingData, booking_id: id, booking_code: code },
    })),

  resetFlow: () =>
    set({
      isActive: false,
      currentStep: null,
      bookingData: { ...initialBookingData },
      priceBreakdown: null,
      tourId: null,
      tourName: null,
      tourPrice: null,
      tourDepartureDates: null,
      confirmedBookingId: null,
      confirmedBookingCode: null,
    }),

  goToStep: (step) => set({ currentStep: step }),
}));

// Step ordering for flow navigation
export const BOOKING_STEP_ORDER: BookingFlowStep[] = [
  "COLLECT_NAME",
  "COLLECT_EMAIL",
  "COLLECT_PHONE",
  "COLLECT_DATE",
  "COLLECT_PARTICIPANTS",
  "COLLECT_SPECIAL_REQUESTS",
  "CONFIRM_BOOKING",
  "PROCESSING",
  "SUCCESS",
  "COMPLETED",
];

export const STEP_LABELS: Record<BookingFlowStep, string> = {
  GREETING: "Chào bạn",
  COLLECT_NAME: "Họ tên",
  COLLECT_EMAIL: "Email",
  COLLECT_PHONE: "Số điện thoại",
  COLLECT_TOUR: "Chọn tour",
  COLLECT_DATE: "Ngày khởi hành",
  COLLECT_PARTICIPANTS: "Số người",
  COLLECT_SPECIAL_REQUESTS: "Yêu cầu đặc biệt",
  CONFIRM_BOOKING: "Xác nhận",
  PROCESSING: "Đang xử lý...",
  SUCCESS: "Đặt tour thành công!",
  COMPLETED: "Hoàn tất",
};
