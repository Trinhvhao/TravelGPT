// ============================================================
// Booking API — create, read, update, cancel, payment
// ============================================================
import { api } from "./api";
import type {
  Booking,
  BookingCreate,
  BookingListResponse,
  BookingStatus,
  PaymentStatus,
} from "@/types";

export interface BookingFilters {
  status?: BookingStatus;
  payment_status?: PaymentStatus;
  page?: number;
  page_size?: number;
}

export interface CreateCheckoutResponse {
  session_id: string;
  checkout_url: string;
}

export interface VerifyCheckoutResponse {
  booking_id: string;
  booking_code: string | null;
  status: string;
  payment_method: string;
}

export const bookingApi = {
  /**
   * List my bookings (authenticated).
   */
  listMyBookings: async (params: BookingFilters = {}): Promise<BookingListResponse> => {
    const response = await api.get<BookingListResponse>("/bookings", { params });
    return response.data;
  },

  /**
   * Get a booking by ID (owner or admin).
   */
  getById: async (id: string): Promise<Booking> => {
    const response = await api.get<Booking>(`/bookings/${id}`);
    return response.data;
  },

  /**
   * Look up a booking by its public booking code.
   * Does not require authentication.
   */
  getByCode: async (code: string): Promise<Booking> => {
    const response = await api.get<Booking>(`/bookings/code/${code}`);
    return response.data;
  },

  /**
   * Create a new booking (authenticated).
   * Must pass optimistic validation before calling.
   */
  create: async (data: BookingCreate): Promise<Booking> => {
    const response = await api.post<Booking>("/bookings", data);
    return response.data;
  },

  /**
   * Cancel my booking (owner only).
   */
  cancel: async (id: string): Promise<Booking> => {
    const response = await api.put<Booking>(`/bookings/${id}/cancel`);
    return response.data;
  },

  /**
   * Create a Stripe Checkout Session for a booking.
   */
  createCheckout: async (
    booking_id: string,
    success_url?: string,
    cancel_url?: string
  ): Promise<CreateCheckoutResponse> => {
    const response = await api.post<CreateCheckoutResponse>("/payments/create-checkout", {
      booking_id,
      success_url: success_url ?? `${window.location.origin}/bookings?booking_id=${booking_id}&paid=true`,
      cancel_url: cancel_url ?? `${window.location.origin}/bookings?cancelled=true`,
    });
    return response.data;
  },

  /**
   * Verify a Stripe checkout session.
   */
  verifyCheckout: async (session_id: string): Promise<VerifyCheckoutResponse> => {
    const response = await api.post<VerifyCheckoutResponse>("/payments/verify-checkout", {
      session_id,
    });
    return response.data;
  },

  /**
   * Get Stripe publishable key.
   */
  getStripeKey: async (): Promise<{ publishable_key: string }> => {
    const response = await api.get<{ publishable_key: string }>("/payments/stripe-publishable-key");
    return response.data;
  },

  // ── Admin endpoints ───────────────────────────────────────────────────────

  /**
   * List all bookings (ADMIN only).
   */
  listAll: async (params: BookingFilters & { search?: string } = {}): Promise<BookingListResponse> => {
    const response = await api.get<BookingListResponse>("/bookings/admin/all", { params });
    return response.data;
  },

  /**
   * Admin update any booking.
   */
  adminUpdate: async (id: string, data: Partial<Booking>): Promise<Booking> => {
    const response = await api.put<Booking>(`/bookings/admin/${id}`, data);
    return response.data;
  },

  /**
   * Admin confirm payment for a booking.
   */
  confirmPayment: async (id: string, payment_method?: string): Promise<Booking> => {
    const response = await api.put<Booking>(`/bookings/${id}/confirm-payment`, {
      payment_method,
    });
    return response.data;
  },
};
