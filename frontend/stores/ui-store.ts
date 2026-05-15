// ============================================================
// UI Store — toasts, modals, sidebar, global loading
// ============================================================
import { create } from "zustand";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms, default 4000
}

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

  // Toasts (managed by react-hot-toast; this is for reference)
  // toasts are handled by toast() from react-hot-toast directly
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  mobileNavOpen: false,
  toggleMobileNav: () => set((s) => ({ mobileNavOpen: !s.mobileNavOpen })),
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),

  globalLoading: false,
  setGlobalLoading: (loading) => set({ globalLoading: loading }),
}));
