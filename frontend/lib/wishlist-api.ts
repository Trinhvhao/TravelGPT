const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3008/api/v1";

const handleAuthError = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("tgpt_access");
    localStorage.removeItem("tgpt_refresh");
    localStorage.removeItem("tgpt_user");
    window.location.href = "/";
  }
};

export const wishlistApi = {
  async getWishlist(token: string) {
    const res = await fetch(`${API_BASE}/wishlist`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) {
      handleAuthError();
      return { items: [], total: 0, page: 1, pageSize: 20 };
    }
    if (!res.ok) throw new Error("Failed to fetch wishlist");
    return res.json();
  },

  async toggleWishlist(tourId: string, token: string) {
    const res = await fetch(`${API_BASE}/wishlist/${tourId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) {
      handleAuthError();
      return { success: false, isInWishlist: false };
    }
    if (!res.ok) throw new Error("Failed to toggle wishlist");
    return res.json();
  },

  async removeFromWishlist(tourId: string, token: string) {
    const res = await fetch(`${API_BASE}/wishlist/${tourId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) {
      handleAuthError();
      return { success: false };
    }
    if (!res.ok) throw new Error("Failed to remove from wishlist");
    return res.json();
  },

  async checkWishlist(tourId: string, token: string) {
    const res = await fetch(`${API_BASE}/wishlist/check/${tourId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) {
      return { isInWishlist: false };
    }
    if (!res.ok) throw new Error("Failed to check wishlist");
    return res.json();
  },

  async getWishlistIds(token: string) {
    const res = await fetch(`${API_BASE}/wishlist/ids`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) {
      handleAuthError();
      return { ids: [] };
    }
    if (!res.ok) throw new Error("Failed to fetch wishlist IDs");
    return res.json();
  },
};
