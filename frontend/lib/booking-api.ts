// ============================================================
// Booking API — create, read, update, cancel
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
