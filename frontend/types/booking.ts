// ============================================================
// Booking Types — mirrors backend schemas/booking.py + prisma Booking model
// ============================================================

export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
export type PaymentStatus = "UNPAID" | "PAID" | "REFUNDED";

export interface Booking {
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
  tour?: {
    id: string;
    name: string;
    slug: string;
    destination: string;
    region?: string;
    duration: string;
    images?: string[];
  };
  user?: {
    id: string;
    full_name: string;
    email: string;
  };
  review?: {
    id: string;
    rating: number;
    comment: string;
  };
}

export interface BookingCreate {
  tour_id?: string;
  num_adults: number;
  num_children?: number;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  departure_date?: string;
  special_requests?: string;
}

export interface BookingUpdate {
  num_adults?: number;
  num_children?: number;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  departure_date?: string;
  special_requests?: string;
  note?: string;
  status?: BookingStatus;
  payment_status?: PaymentStatus;
  payment_method?: string;
}

export interface BookingListResponse {
  bookings: Booking[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ============================================================
// Price Calculation (mirrors backend BookingService)
// ============================================================

export interface PriceBreakdown {
  adultPrice: number;
  childPrice: number;
  numAdults: number;
  numChildren: number;
  subtotalAdults: number;
  subtotalChildren: number;
  subtotal: number;
  serviceFee: number;
  total: number;
}

export interface RefundInfo {
  daysRemaining: number;
  refundPercentage: number;
  processingFeePercentage: number;
  grossRefund: number;
  netRefund: number;
}

// Cancellation refund policy from backend ai/cancellation.py:
// days_before_departure >= 14 → 90%
// days_before_departure 7-13 → 70%
// days_before_departure 3-6  → 50%
// days_before_departure 1-2  → 20%
// days_before_departure 0    → 0%
// + 5% processing fee
export function calculateRefund(
  totalPrice: number,
  departureDate: string | Date
): RefundInfo {
  const departure = new Date(departureDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  departure.setHours(0, 0, 0, 0);
  const diffTime = departure.getTime() - today.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  let refundPercentage = 0;
  if (daysRemaining >= 14) refundPercentage = 90;
  else if (daysRemaining >= 7) refundPercentage = 70;
  else if (daysRemaining >= 3) refundPercentage = 50;
  else if (daysRemaining >= 1) refundPercentage = 20;

  const processingFeePercentage = 5;
  const grossRefund = totalPrice * (refundPercentage / 100);
  const netRefund = grossRefund * (1 - processingFeePercentage / 100);

  return { daysRemaining, refundPercentage, processingFeePercentage, grossRefund, netRefund };
}

// Client-side price calculation (mirrors backend PriceCalculator)
export function calculatePrice(
  tourPrice: number,
  numAdults: number,
  numChildren: number
): PriceBreakdown {
  const adultPrice = tourPrice;
  const childPrice = tourPrice * 0.5;
  const SERVICE_FEE_RATE = 0.05;

  const subtotalAdults = adultPrice * numAdults;
  const subtotalChildren = childPrice * numChildren;
  const subtotal = subtotalAdults + subtotalChildren;
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE);
  const total = subtotal + serviceFee;

  return { adultPrice, childPrice, numAdults, numChildren, subtotalAdults, subtotalChildren, subtotal, serviceFee, total };
}
