"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { tourApi, type TourSearchParams } from "@/lib/tour-api";
import type { Tour, TourListResponse } from "@/types";

const DEFAULT_PAGE_SIZE = 12;

export const TOUR_QUERY_KEY = {
  list: (params: TourSearchParams) => ["tours", "list", params] as const,
  featured: (limit: number) => ["tours", "featured", limit] as const,
  detail: (slug: string) => ["tours", "detail", slug] as const,
  search: (query: string) => ["tours", "search", query] as const,
};

/**
 * useTours — paginated tour list with TanStack Query.
 * Cache: staleTime=5min, background refetch on window focus.
 */
export function useTours(initialParams: TourSearchParams = {}) {
  const [params, setParams] = useState(initialParams);

  const query = useQuery({
    queryKey: TOUR_QUERY_KEY.list(params),
    queryFn: () => tourApi.listTours(params),
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const setFilters = (newParams: Partial<TourSearchParams>) => {
    setParams((prev) => ({ ...prev, ...newParams, page: 1 }));
  };

  const setPage = (page: number) => {
    setParams((prev) => ({ ...prev, page }));
  };

  const clearFilters = () => {
    setParams({ page: 1, page_size: DEFAULT_PAGE_SIZE });
  };

  return {
    tours: query.data?.tours ?? [],
    total: query.data?.total ?? 0,
    page: query.data?.page ?? 1,
    pageSize: query.data?.page_size ?? DEFAULT_PAGE_SIZE,
    totalPages: query.data?.total_pages ?? 1,
    loading: query.isLoading,
    error: query.error ? String(query.error) : null,
    setFilters,
    setPage,
    clearFilters,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}

/**
 * useFeaturedTours — featured tours with 15-min cache.
 * Perfect for homepage — won't refetch on every page load.
 */
export function useFeaturedTours(limit = 8) {
  const query = useQuery({
    queryKey: TOUR_QUERY_KEY.featured(limit),
    queryFn: () => tourApi.getFeatured(limit),
    staleTime: 15 * 60 * 1000,
  });

  return {
    tours: query.data ?? [],
    loading: query.isLoading,
    error: query.error ? String(query.error) : null,
  };
}

/**
 * useTourDetail — single tour by slug.
 * Cache: staleTime=5min, refetch on slug change.
 */
export function useTourDetail(slug: string | null) {
  const query = useQuery({
    queryKey: TOUR_QUERY_KEY.detail(slug ?? ""),
    queryFn: () => (slug ? tourApi.getBySlug(slug) : Promise.resolve(null)),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });

  return {
    tour: query.data ?? null,
    loading: query.isLoading,
    error: query.error ? String(query.error) : null,
  };
}

/**
 * useTourSearch — instant search with debounce handled upstream.
 */
export function useTourSearch(query: string, limit = 10) {
  return useQuery({
    queryKey: TOUR_QUERY_KEY.search(query),
    queryFn: () => tourApi.search(query, limit),
    enabled: query.length >= 2,
    staleTime: 2 * 60 * 1000,
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * useTourCacheInvalidation — exposes invalidate() for manual cache control.
 * Call invalidate() after creating/updating a tour to refresh lists.
 */
export function useTourCacheInvalidation() {
  const qc = useQueryClient();
  return {
    invalidateTours: (params?: TourSearchParams) => {
      if (params) {
        qc.invalidateQueries({ queryKey: ["tours", "list", params] });
      } else {
        qc.invalidateQueries({ queryKey: ["tours"] });
      }
    },
    invalidateFeatured: () => {
      qc.invalidateQueries({ queryKey: ["tours", "featured"] });
    },
  };
}
