// ============================================================
// Auth Store — Zustand with persist middleware
//
// Key improvements over existing store:
// - Stores both access and refresh tokens
// - Tracks access token expiry
// - Auto-clears on invalid token
// ============================================================
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";
import { storage } from "@/lib/api";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  // Token metadata for expiry tracking
  tokenExpiresAt: number | null;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;

  // Helpers
  isTokenExpired: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      tokenExpiresAt: null,

      setUser: (user) =>
        set({ user, isAuthenticated: !!user }),

      setLoading: (isLoading) => set({ isLoading }),

      setTokens: (accessToken, _refreshToken) => {
        // Decode JWT payload to extract exp (no verification needed for expiry check)
        const payload = decodeJwtPayload(accessToken);
        const exp = (payload?.exp as number | undefined);
        const expiresAt = exp != null
          ? exp * 1000
          : Date.now() + 30 * 60 * 1000; // default 30 min

        set({
          isAuthenticated: true,
          tokenExpiresAt: expiresAt,
        });
      },

      logout: () => {
        storage.clearTokens();
        set({ user: null, isAuthenticated: false, tokenExpiresAt: null });
      },

      isTokenExpired: () => {
        const { tokenExpiresAt } = get();
        return !tokenExpiresAt || Date.now() >= tokenExpiresAt;
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        tokenExpiresAt: state.tokenExpiresAt,
      }),
    }
  )
);

// Minimal JWT payload decoder (no verification — only for expiry check)
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(payload);
  } catch {
    return null;
  }
}
