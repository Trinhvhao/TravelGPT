// ============================================================
// User Admin API — list, update role, toggle status
// ============================================================
import { api } from "./api";
import type { User } from "@/types";

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface UserFilters {
  search?: string;
  role?: "USER" | "ADMIN";
  is_active?: boolean;
  page?: number;
  page_size?: number;
}

export const userApi = {
  /**
   * List all users (ADMIN only).
   */
  list: async (params: UserFilters = {}): Promise<UserListResponse> => {
    const response = await api.get<UserListResponse>("/users", { params });
    return response.data;
  },

  /**
   * Get a single user by ID (ADMIN only).
   */
  getById: async (id: string): Promise<User> => {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  /**
   * Update user role (ADMIN only).
   */
  updateRole: async (id: string, role: "USER" | "ADMIN"): Promise<User> => {
    const response = await api.put<User>(`/users/${id}/role`, { role });
    return response.data;
  },

  /**
   * Activate or deactivate a user (ADMIN only).
   */
  updateStatus: async (id: string, is_active: boolean): Promise<User> => {
    const response = await api.put<User>(`/users/${id}/status`, { is_active });
    return response.data;
  },
};
