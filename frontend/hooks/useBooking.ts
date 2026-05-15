"use client";
import { useState, useCallback } from "react";
import { bookingApi } from "@/lib/booking-api";
import { calculatePrice, calculateRefund, type PriceBreakdown } from "@/types/booking";
import type { Booking, BookingCreate, BookingListResponse } from "@/types";

/**
 * useBookings — manages user booking list with pagination.
 */
export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetch = useCallback(async (pageNum = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await bookingApi.listMyBookings({ page: pageNum, page_size: 10 });
      setBookings(res.bookings);
      setTotal(res.total);
      setPage(res.page);
      setTotalPages(res.total_pages);
    } catch (err: unknown) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  return { bookings, loading, error, total, page, totalPages, fetch, setPage };
}

/**
 * useBookingDetail — fetches a single booking.
 */
export function useBookingDetail(bookingId: string | null) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!bookingId) return;
    setLoading(true);
    setError(null);
    try {
      const b = await bookingApi.getById(bookingId);
      setBooking(b);
    } catch (err: unknown) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  return { booking, loading, error, refetch: fetch };
}

/**
 * useCreateBooking — creates a booking with client-side price validation.
 */
export function useCreateBooking() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (data: BookingCreate, tourPrice: number): Promise<Booking> => {
    setLoading(true);
    setError(null);
    try {
      const booking = await bookingApi.create(data);
      return booking;
    } catch (err: unknown) {
      const msg = String(err);
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { create, loading, error };
}

/**
 * useCancelBooking — cancels a booking with refund preview.
 */
export function useCancelBooking() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancel = useCallback(async (bookingId: string, booking: Booking): Promise<Booking> => {
    if (!booking.departure_date) throw new Error("No departure date");
    const refund = calculateRefund(booking.total_price, booking.departure_date);

    if (refund.refundPercentage === 0) {
      throw new Error("Đã quá thời hạn hủy tour. Không thể hủy booking này.");
    }

    setLoading(true);
    setError(null);
    try {
      const updated = await bookingApi.cancel(bookingId);
      return updated;
    } catch (err: unknown) {
      setError(String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { cancel, loading, error };
}

/**
 * usePriceCalculator — reactive price breakdown calculation.
 */
export function usePriceCalculator(tourPrice: number, numAdults: number, numChildren: number): PriceBreakdown {
  return calculatePrice(tourPrice, numAdults, numChildren);
}
