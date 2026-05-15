// ============================================================
// User Types — mirrors backend schemas/user.py
// ============================================================

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  role: "USER" | "ADMIN";
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in?: number;
  user: User;
}

export interface UserCreate {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}

export interface UserUpdate {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
}

export interface ChangePassword {
  current_password: string;
  new_password: string;
}

// ============================================================
// API Common Types
// ============================================================

export interface PaginationParams {
  page?: number;
  page_size?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}
