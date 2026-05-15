"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks";

// Routes that don't require authentication
const PUBLIC_PATHS = ["/", "/login", "/register", "/search", "/chat"];
const PUBLIC_PREFIXES = ["/tour/", "/bookings/lookup"];

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "USER" | "ADMIN";
  fallbackPath?: string;
}

/**
 * AuthGuard — protects routes that require authentication.
 * Redirects to /login if user is not authenticated.
 */
export function AuthGuard({ children, requiredRole, fallbackPath = "/login" }: AuthGuardProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return; // Wait for auth check

    const isPublic =
      PUBLIC_PATHS.includes(pathname) ||
      PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

    if (isPublic) return;

    if (!isAuthenticated) {
      // Save intended destination
      sessionStorage.setItem("redirect_after_login", pathname);
      router.push(fallbackPath);
      return;
    }

    if (requiredRole === "ADMIN" && user?.role !== "ADMIN") {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, user, pathname, router, fallbackPath, requiredRole]);

  // Show nothing while checking auth (prevents flash)
  if (isLoading) {
    return null;
  }

  const isPublic =
    PUBLIC_PATHS.includes(pathname) ||
    PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

  if (isPublic) return <>{children}</>;

  if (!isAuthenticated) return null;

  if (requiredRole === "ADMIN" && user?.role !== "ADMIN") return null;

  return <>{children}</>;
}

/**
 * AdminGuard — shorthand for admin-only routes.
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  return <AuthGuard requiredRole="ADMIN">{children}</AuthGuard>;
}

/**
 * GuestGuard — redirects to / if user is already logged in.
 * Use on login/register pages.
 */
export function GuestGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) return null;
  if (isAuthenticated) return null;

  return <>{children}</>;
}
