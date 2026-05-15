// ============================================================
// Tour Types — mirrors backend schemas/tour.py + prisma Tour model
// ============================================================

export type Region = "NORTH" | "CENTRAL" | "SOUTH" | "INTERNATIONAL";

export interface TourImage {
  url: string;
  alt?: string;
}

export interface TourHighlight {
  icon?: string;
  text: string;
}

export interface TourScheduleDay {
  day: number;
  title: string;
  activities: string[];
  meals?: string[];
  notes?: string;
}

export interface Tour {
  id: string;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  destination: string;
  region?: Region;
  duration: string; // e.g. "3 ngày 2 đêm"
  price: number;
  discount_price?: number;
  max_participants: number;
  current_participants: number;
  images: string[] | TourImage[];
  highlights?: string[] | TourHighlight[];
  includes?: string[];
  excludes?: string[];
  schedule?: TourScheduleDay[];
  departure_dates?: string[];
  rating: number;
  review_count: number;
  is_featured: boolean;
  is_active: boolean;
  category?: string;
  tags?: string[];
  created_at: string;
  updated_at?: string;
}

export interface TourFilters {
  destination?: string;
  region?: Region;
  category?: string;
  min_price?: number;
  max_price?: number;
  search?: string;
  is_featured?: boolean;
  page?: number;
  page_size?: number;
}

export interface TourListResponse {
  tours: Tour[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface TourCreate {
  name: string;
  slug?: string;
  description?: string;
  short_description?: string;
  destination: string;
  region?: Region;
  duration: string;
  price: number;
  discount_price?: number;
  max_participants?: number;
  images?: string[];
  highlights?: string[];
  includes?: string[];
  excludes?: string[];
  schedule?: TourScheduleDay[];
  departure_dates?: string[];
  is_featured?: boolean;
  category?: string;
  tags?: string[];
}

export interface TourUpdate extends Partial<TourCreate> {
  is_active?: boolean;
}

export interface Review {
  id: string;
  user_id: string;
  tour_id: string;
  booking_id?: string;
  rating: number;
  comment?: string;
  is_verified: boolean;
  created_at: string;
  user?: {
    full_name: string;
    avatar_url?: string;
  };
}

export interface TourWithReviews extends Tour {
  reviews?: Review[];
}
