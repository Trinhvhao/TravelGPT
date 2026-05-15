// ============================================================
// Admin Types
// ============================================================

import type { Booking, BookingStatus, PaymentStatus } from "./booking";
import type { User } from "./user";
import type { Tour } from "./tour";

export interface AdminStats {
  total_tours: number;
  total_bookings: number;
  total_users: number;
  total_revenue: number;
  pending_bookings: number;
  confirmed_bookings: number;
}

export interface AdminBooking {
  id: string;
  user_id: string;
  tour_id?: string;
  booking_code: string;
  status: BookingStatus;
  num_adults: number;
  num_children: number;
  total_price: number;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  departure_date?: string;
  special_requests?: string;
  note?: string;
  payment_status: PaymentStatus;
  payment_method?: string;
  payment_date?: string;
  created_at: string;
  updated_at?: string;
  user: Pick<User, "id" | "full_name" | "email">;
  tour?: Pick<Tour, "id" | "name" | "slug" | "destination" | "duration" | "images">;
  review?: { id: string; rating: number; comment: string };
}

export interface AdminBookingFilters {
  status?: BookingStatus;
  payment_status?: PaymentStatus;
  search?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  page_size?: number;
}

export interface UserFilters {
  search?: string;
  role?: "USER" | "ADMIN";
  is_active?: boolean;
  page?: number;
  page_size?: number;
}
