// ============================================================
// Tour API — CRUD, search, filters, recommendations
// ============================================================
import { api } from "./api";
import type {
  Tour,
  TourCreate,
  TourFilters,
  TourListResponse,
  TourUpdate,
  Region,
} from "@/types";

export interface TourSearchParams {
  destination?: string;
  region?: Region;
  category?: string;
  min_price?: number;
  max_price?: number;
  search?: string;
  is_featured?: boolean;
  page?: number;
  page_size?: number;
  sort_by?: "price" | "rating" | "created_at";
  sort_order?: "asc" | "desc";
}

export const tourApi = {
  /**
   * List tours with optional filters and pagination.
   */
  listTours: async (params: TourSearchParams = {}): Promise<TourListResponse> => {
    const response = await api.get<TourListResponse>("/tours", { params });
    return response.data;
  },

  /**
   * Get featured tours (is_featured=true, sorted by rating desc).
   */
  getFeatured: async (limit = 8): Promise<Tour[]> => {
    const response = await api.get<{ tours: Tour[] }>("/tours/featured", {
      params: { limit },
    });
    return response.data.tours ?? response.data;
  },

  /**
   * Search tours by free-text query.
   */
  search: async (query: string, limit = 10): Promise<Tour[]> => {
    const response = await api.get<TourListResponse>("/tours/search", {
      params: { q: query, limit },
    });
    return response.data.tours;
  },

  /**
   * Get a single tour by UUID.
   */
  getById: async (id: string): Promise<Tour> => {
    const response = await api.get<Tour>(`/tours/${id}`);
    return response.data;
  },

  /**
   * Get a single tour by slug (preferred for SEO).
   */
  getBySlug: async (slug: string): Promise<Tour> => {
    const response = await api.get<Tour>(`/tours/slug/${slug}`);
    return response.data;
  },

  // ── Admin-only endpoints ──────────────────────────────────────────────────

  /**
   * Create a new tour (ADMIN only).
   */
  create: async (data: TourCreate): Promise<Tour> => {
    const response = await api.post<Tour>("/tours", data);
    return response.data;
  },

  /**
   * Update an existing tour (ADMIN only).
   */
  update: async (id: string, data: Partial<TourCreate>): Promise<Tour> => {
    const response = await api.put<Tour>(`/tours/${id}`, data);
    return response.data;
  },

  /**
   * Soft-delete a tour (ADMIN only).
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/tours/${id}`);
  },
};
