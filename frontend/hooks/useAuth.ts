"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { authApi } from "@/lib/auth-api";
import { authStorage, type User } from "@/lib/auth";
import { useAuthStore } from "@/stores/auth-store";
import { useRouter } from "next/navigation";

/**
 * useAuth — manages authentication lifecycle.
 *
 * Features:
 * - Auto-fetch user on mount if tokens exist
 * - Login / register / logout / update profile
 * - Protected route redirect
 */
export function useAuth() {
  const { user, isAuthenticated, isLoading, setUser, setLoading, logout: clearStore } = useAuthStore();
  const router = useRouter();
  const initialized = useRef(false);

  // Fetch user profile once if we have tokens but no user
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const token = authStorage.getAccessToken();
    if (token && !user) {
      setLoading(true);
      authApi
        .getMe()
        .then((u) => setUser(u))
        .catch(() => {
          authApi.logout();
          clearStore();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user, setUser, setLoading, clearStore]);

  const login = useCallback(
    async (email: string, password: string): Promise<User> => {
      setLoading(true);
      try {
        const res = await authApi.login(email, password);
        setUser(res.user);
        return res.user;
      } finally {
        setLoading(false);
      }
    },
    [setUser, setLoading]
  );

  const register = useCallback(
    async (data: { email: string; password: string; full_name: string; phone?: string }): Promise<User> => {
      setLoading(true);
      try {
        const res = await authApi.register(data);
        setUser(res.user);
        return res.user;
      } finally {
        setLoading(false);
      }
    },
    [setUser, setLoading]
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    clearStore();
    router.push("/");
  }, [clearStore, router]);

  const updateProfile = useCallback(
    async (data: Partial<Pick<User, "full_name" | "phone" | "avatar_url">>): Promise<User> => {
      const updated = await authApi.updateMe(data);
      setUser(updated);
      return updated;
    },
    [setUser]
  );

  return {
    user,
    isAuthenticated,
    isLoading,
    isAdmin: user?.role === "ADMIN",
    login,
    register,
    logout,
    updateProfile,
  };
}

/**
 * useRequireAuth — redirect to /login if not authenticated.
 */
export function useRequireAuth(redirectTo = "/login") {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, redirectTo, router]);

  return { isAuthenticated, isLoading };
}

/**
 * useRequireAdmin — redirect to / if not admin.
 */
export function useRequireAdmin() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && user.role !== "ADMIN") {
      router.push("/");
    }
  }, [user, isLoading, router]);

  return { user, isLoading, isAdmin: user?.role === "ADMIN" };
}
