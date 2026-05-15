// ============================================================
// Auth helpers — token storage + user types
// Kept separate from api.ts to avoid circular imports
// ============================================================
import { storage } from "./api";

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  role: "USER" | "ADMIN";
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export { storage as authStorage };

export const getAuthToken = (): string | null => storage.getAccessToken();
export const getRefreshToken = (): string | null => storage.getRefreshToken();
export const setAuthToken = (access: string, refresh: string) => storage.setTokens(access, refresh);
export const removeAuthToken = () => storage.clearTokens();

export const isAuthenticated = (): boolean => !!getAuthToken();
