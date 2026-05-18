// ============================================================
// UI Store — toasts, modals, sidebar, global loading, theme, language
// ============================================================
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms, default 4000
}

export type Theme = "light" | "dark";
export type Language = "vi" | "en";

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Mobile nav
  mobileNavOpen: boolean;
  toggleMobileNav: () => void;
  setMobileNavOpen: (open: boolean) => void;

  // Global loading overlay
  globalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;

  // Theme
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;

  // Language
  language: Language;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;

  // Notifications (mock data — replace with real API)
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "booking" | "promo" | "system";
}

// TODO: replace with real API call: GET /api/v1/notifications
// Currently loaded from booking events, auth events, and system alerts
const defaultNotifications: NotificationItem[] = [];

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      sidebarOpen: false,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      mobileNavOpen: false,
      toggleMobileNav: () => set((s) => ({ mobileNavOpen: !s.mobileNavOpen })),
      setMobileNavOpen: (open) => set({ mobileNavOpen: open }),

      globalLoading: false,
      setGlobalLoading: (loading) => set({ globalLoading: loading }),

      // Theme
      theme: "light",
      toggleTheme: () =>
        set((s) => {
          const next = s.theme === "light" ? "dark" : "light";
          if (typeof document !== "undefined") {
            document.documentElement.classList.toggle("dark", next === "dark");
          }
          return { theme: next };
        }),
      setTheme: (theme) =>
        set(() => {
          if (typeof document !== "undefined") {
            document.documentElement.classList.toggle("dark", theme === "dark");
          }
          return { theme };
        }),

      // Language
      language: "vi",
      toggleLanguage: () =>
        set((s) => ({ language: s.language === "vi" ? "en" : "vi" })),
      setLanguage: (language) => set({ language }),

      // Notifications
      notifications: defaultNotifications,
      unreadCount: 0,
      markAsRead: (id) =>
        set((s) => {
          const updated = s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          );
          return {
            notifications: updated,
            unreadCount: updated.filter((n) => !n.read).length,
          };
        }),
      markAllAsRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        })),
    }),
    {
      name: "travelgpt-ui-store",
      partialize: (s) => ({ theme: s.theme, language: s.language }),
    }
  )
);
