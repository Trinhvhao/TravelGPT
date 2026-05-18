import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApi } from "@/lib/auth-api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3008/api/v1";

export interface WishlistTour {
  id: string;
  tourId: string;
  addedAt: string;
  tour: {
    id: string;
    name: string;
    slug: string;
    destination: string;
    duration: string;
    price: number;
    discountPrice: number | null;
    images: string[];
    rating: number;
    reviewCount: number;
    isFeatured: boolean;
  };
}

interface WishlistState {
  items: WishlistTour[];
  wishlistIds: Set<string>;
  isLoading: boolean;
  isOpen: boolean;
  
  // Actions
  fetchWishlist: () => Promise<void>;
  toggleWishlist: (tourId: string) => Promise<boolean>;
  isInWishlist: (tourId: string) => boolean;
  fetchWishlistIds: () => Promise<void>;
  openWishlist: () => void;
  closeWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      wishlistIds: new Set<string>(),
      isLoading: false,
      isOpen: false,

      fetchWishlistIds: async () => {
        const token = localStorage.getItem("tgpt_access");
        if (!token) {
          set({ wishlistIds: new Set() });
          return;
        }

        try {
          const res = await fetch(`${API_BASE}/wishlist/ids`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            set({ wishlistIds: new Set(data.ids) });
          }
        } catch (error) {
          console.error("Failed to fetch wishlist IDs:", error);
        }
      },

      fetchWishlist: async () => {
        const token = localStorage.getItem("tgpt_access");
        if (!token) {
          set({ items: [] });
          return;
        }

        set({ isLoading: true });
        try {
          const res = await fetch(`${API_BASE}/wishlist`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            set({ items: data.items });
          }
        } catch (error) {
          console.error("Failed to fetch wishlist:", error);
        } finally {
          set({ isLoading: false });
        }
      },

      toggleWishlist: async (tourId: string) => {
        const token = localStorage.getItem("tgpt_access");
        if (!token) {
          // Redirect to login or show toast
          return false;
        }

        try {
          const res = await fetch(`${API_BASE}/wishlist/${tourId}`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (res.ok) {
            const data = await res.json();
            const currentIds = get().wishlistIds;
            const newIds = new Set(currentIds);

            if (data.isInWishlist) {
              newIds.add(tourId);
            } else {
              newIds.delete(tourId);
            }

            set({ wishlistIds: newIds });

            // If wishlist is open, refresh the list
            if (get().isOpen) {
              get().fetchWishlist();
            }

            return data.isInWishlist;
          }
        } catch (error) {
          console.error("Failed to toggle wishlist:", error);
        }
        return false;
      },

      isInWishlist: (tourId: string) => {
        return get().wishlistIds.has(tourId);
      },

      openWishlist: () => {
        set({ isOpen: true });
        get().fetchWishlist();
      },

      closeWishlist: () => {
        set({ isOpen: false });
      },
    }),
    {
      name: "wishlist-storage",
      partialize: (state) => ({
        wishlistIds: Array.from(state.wishlistIds),
      }),
      merge: (persisted, current) => {
        const persistedData = persisted as { wishlistIds?: string[] };
        return {
          ...current,
          wishlistIds: new Set(persistedData?.wishlistIds || []),
        };
      },
    }
  )
);
