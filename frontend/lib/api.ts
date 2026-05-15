// ============================================================
// API Client — Axios instance with interceptors
// Features:
// - Auto-refresh token on 401
// - Rate limit tracking (60/m for chat)
// - Consistent error formatting
// - Request deduplication
// ============================================================
import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { ApiError } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// ── Storage helpers (avoids circular imports) ────────────────────────────────
export const storage = {
  ACCESS_TOKEN_KEY: "tgpt_access",
  REFRESH_TOKEN_KEY: "tgpt_refresh",

  getAccessToken: (): string | null => {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(storage.ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  },
  getRefreshToken: (): string | null => {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(storage.REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },
  setTokens: (access: string, refresh: string) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(storage.ACCESS_TOKEN_KEY, access);
      localStorage.setItem(storage.REFRESH_TOKEN_KEY, refresh);
    } catch {
      // ignore storage errors
    }
  },
  clearTokens: () => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(storage.ACCESS_TOKEN_KEY);
      localStorage.removeItem(storage.REFRESH_TOKEN_KEY);
    } catch {
      // ignore storage errors
    }
  },
};

// ── Rate limiter ────────────────────────────────────────────────────────────
export const rateLimiter = {
  requests: 0,
  windowStart: Date.now(),
  WINDOW_MS: 60 * 1000,
  MAX_REQUESTS: 60,

  track: (): { allowed: boolean; remaining: number; resetIn: number } => {
    const now = Date.now();
    if (now - rateLimiter.windowStart > rateLimiter.WINDOW_MS) {
      rateLimiter.windowStart = now;
      rateLimiter.requests = 0;
    }
    rateLimiter.requests++;
    return {
      allowed: rateLimiter.requests <= rateLimiter.MAX_REQUESTS,
      remaining: Math.max(0, rateLimiter.MAX_REQUESTS - rateLimiter.requests),
      resetIn: Math.max(0, rateLimiter.WINDOW_MS - (now - rateLimiter.windowStart)),
    };
  },
};

// ── Axios instance ─────────────────────────────────────────────────────────
export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});

// ── Lock to prevent concurrent refresh attempts ─────────────────────────────
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};
const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

// ── Request interceptor ────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = storage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Attach a unique request ID for tracing
    config.headers["X-Request-ID"] = crypto.randomUUID();
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor ───────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 — attempt token refresh once
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Wait for ongoing refresh
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = storage.getRefreshToken();
      if (!refreshToken) {
        storage.clearTokens();
        isRefreshing = false;
        redirectToLogin();
        return Promise.reject(error);
      }

      try {
        const response = await axios.post<{
          access_token: string;
          refresh_token: string;
          user: unknown;
        }>(`${BASE_URL}/auth/refresh`, { refresh_token: refreshToken });

        const { access_token, refresh_token } = response.data;
        storage.setTokens(access_token, refresh_token);
        onTokenRefreshed(access_token);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }
        isRefreshing = false;
        return api(originalRequest);
      } catch {
        isRefreshing = false;
        storage.clearTokens();
        redirectToLogin();
        return Promise.reject(error);
      }
    }

    // Handle 429 — Rate limited
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers["retry-after"];
      const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : rateLimiter.WINDOW_MS;
      return Promise.reject({ ...error, _type: "rate_limited", _retryAfter: waitMs });
    }

    // Format error response consistently
    const backendError = error.response?.data?.error;
    if (backendError) {
      return Promise.reject({
        ...error,
        _type: "api_error",
        message: backendError.message,
        code: backendError.code,
        details: backendError.details,
      });
    }

    return Promise.reject(error);
  }
);

// ── Helpers ────────────────────────────────────────────────────────────────
function redirectToLogin() {
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

export const isAuthError = (error: unknown): boolean => {
  return axios.isAxiosError(error) && error.response?.status === 401;
};

export const isRateLimited = (error: unknown): error is { _type: string; _retryAfter: number } => {
  return typeof error === "object" && error !== null && (error as { _type?: string })._type === "rate_limited";
};

export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const apiErr = error as AxiosError<ApiError>;
    if (apiErr.response?.data?.error?.message) {
      return apiErr.response.data.error.message;
    }
    if (apiErr.message) return apiErr.message;
  }
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Đã xảy ra lỗi không xác định. Vui lòng thử lại.";
};
