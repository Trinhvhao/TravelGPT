// ============================================================
// Auth API — login, register, token management
// ============================================================
import { api, storage } from "./api";
import type { UserCreate } from "@/types/user";

interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  role: "USER" | "ADMIN";
  is_active: boolean;
  created_at: string;
}

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export const authApi = {
  /**
   * Register a new user account.
   */
  register: async (data: UserCreate): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/register", data);
    storage.setTokens(response.data.access_token, response.data.refresh_token);
    return response.data;
  },

  /**
   * Login with email and password.
   */
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>("/auth/login", { email, password });
    storage.setTokens(response.data.access_token, response.data.refresh_token);
    return response.data;
  },

  /**
   * Logout — clears tokens locally.
   */
  logout: async (): Promise<void> => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore errors — always clear local state
    } finally {
      storage.clearTokens();
    }
  },

  /**
   * Get current user profile.
   */
  getMe: async (): Promise<User> => {
    const response = await api.get<User>("/auth/me");
    return response.data;
  },

  /**
   * Update current user profile.
   */
  updateMe: async (data: Partial<Pick<User, "full_name" | "phone" | "avatar_url">>): Promise<User> => {
    const response = await api.put<User>("/auth/me", data);
    return response.data;
  },

  /**
   * Change password.
   */
  changePassword: async (current_password: string, new_password: string): Promise<void> => {
    await api.post("/auth/change-password", { current_password, new_password });
  },

  /**
   * Refresh access token.
   */
  refreshToken: async (refreshToken: string): Promise<{ access_token: string; refresh_token: string }> => {
    const response = await api.post<{ access_token: string; refresh_token: string }>("/auth/refresh", {
      refresh_token: refreshToken,
    });
    storage.setTokens(response.data.access_token, response.data.refresh_token);
    return response.data;
  },
};

export type { AuthResponse, User };
