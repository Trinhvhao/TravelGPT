"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuthStore } from "@/stores";
import { wishlistApi } from "@/lib/wishlist-api";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import {
  Heart,
  MapPin,
  Clock,
  Star,
  Trash2,
  Calendar,
  ArrowRight,
  X,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PRIMARY = "#0046C1";
const ACCENT = "#0391FF";

interface WishlistItem {
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

function WishlistContent() {
  const { isAuthenticated, user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isAuthenticated) {
      fetchWishlist();
    } else if (mounted) {
      setLoading(false);
    }
  }, [mounted, isAuthenticated]);

  const fetchWishlist = async () => {
    const token = localStorage.getItem("tgpt_access");
    if (!token) return;

    setLoading(true);
    try {
      const data = await wishlistApi.getWishlist(token);
      setItems(data.items || []);
    } catch (error) {
      console.error("Failed to fetch wishlist:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (tourId: string) => {
    const token = localStorage.getItem("tgpt_access");
    if (!token) return;

    setRemoving(tourId);
    try {
      await wishlistApi.removeFromWishlist(tourId, token);
      setItems((prev) => prev.filter((item) => item.tourId !== tourId));
    } catch (error) {
      console.error("Failed to remove from wishlist:", error);
    } finally {
      setRemoving(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Show loading while hydrating
  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F7F7F7" }}>
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F7F7F7" }}>
        <div className="text-center max-w-md mx-auto px-4">
          <div
            className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{ backgroundColor: "#FFE5E3" }}
          >
            <Heart className="w-10 h-10" style={{ color: "#ED1D24" }} />
          </div>
          <h1 className="text-2xl font-extrabold text-[#000E1A] mb-3">
            Tour yêu thích
          </h1>
          <p className="text-[#636363] mb-6">
            Đăng nhập để lưu các tour bạn quan tâm và xem lại bất cứ lúc nào.
          </p>
          <Link href="/login">
            <Button
              className="h-12 px-8 text-[15px] font-bold text-white"
              style={{ backgroundColor: PRIMARY, borderRadius: "12px" }}
            >
              Đăng nhập ngay
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F7F7F7" }}>
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section
          className="relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${ACCENT} 100%)` }}
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full opacity-20" 
                 style={{ background: "linear-gradient(135deg, #FFFFFF, transparent)" }} />
          </div>
          <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
            <div
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
            >
              <Heart className="w-8 h-8 text-white fill-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">
              Tour yêu thích
            </h1>
            <p className="text-white/80 text-lg">
              {items.length} tour đã lưu
            </p>
          </div>
        </section>

        {/* Content */}
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Spinner size="lg" />
            </div>
          ) : items.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={Heart}
                title="Chưa có tour yêu thích"
                description="Khám phá và lưu lại những tour bạn quan tâm"
                action={
                  <Link href="/tours">
                    <Button
                      className="h-12 px-6 text-[15px] font-bold text-white"
                      style={{ backgroundColor: PRIMARY, borderRadius: "12px" }}
                    >
                      Khám phá tour
                    </Button>
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => {
                const images = Array.isArray(item.tour.images) && item.tour.images.length > 0
                  ? item.tour.images
                  : ["/placeholder-tour.jpg"];
                const firstImage = images[0];

                const displayPrice = item.tour.discountPrice ?? item.tour.price;
                const hasDiscount = !!item.tour.discountPrice && item.tour.discountPrice < item.tour.price;
                const discountPct = hasDiscount 
                  ? Math.round((1 - item.tour.discountPrice! / item.tour.price) * 100) 
                  : 0;

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group"
                  >
                    {/* Image */}
                    <Link href={`/tours/${item.tour.slug}`} className="block">
                      <div className="relative overflow-hidden" style={{ aspectRatio: "16/10" }}>
                        <img
                          src={firstImage}
                          alt={item.tour.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                        
                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                          {item.tour.isFeatured && (
                            <span
                              className="text-[11px] font-bold px-3 py-1 text-white rounded-full"
                              style={{ backgroundColor: PRIMARY }}
                            >
                              ★ Nổi bật
                            </span>
                          )}
                          {hasDiscount && (
                            <span
                              className="text-[11px] font-bold px-3 py-1 text-white rounded-full"
                              style={{ backgroundColor: "#ED1D24" }}
                            >
                              -{discountPct}%
                            </span>
                          )}
                        </div>

                        {/* Rating */}
                        {item.tour.rating > 0 && (
                          <div
                            className="absolute top-3 right-3 px-2.5 py-1 flex items-center gap-1 rounded-full text-[12px] font-bold text-white"
                            style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
                          >
                            <Star className="w-3.5 h-3.5 text-[#F8C700] fill-[#F8C700]" />
                            {item.tour.rating.toFixed(1)}
                          </div>
                        )}

                        {/* Remove button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleRemove(item.tourId);
                          }}
                          disabled={removing === item.tourId}
                          className="absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer hover:scale-110 disabled:opacity-50"
                          style={{ backgroundColor: "rgba(255,255,255,0.95)" }}
                        >
                          {removing === item.tourId ? (
                            <Spinner size="sm" />
                          ) : (
                            <Trash2 className="w-5 h-5" style={{ color: "#ED1D24" }} />
                          )}
                        </button>
                      </div>
                    </Link>

                    {/* Content */}
                    <div className="p-5">
                      {/* Meta */}
                      <div className="flex items-center gap-4 text-[12px] text-[#636363] mb-2">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" style={{ color: PRIMARY }} />
                          <span className="truncate">{item.tour.destination}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" style={{ color: PRIMARY }} />
                          {item.tour.duration}
                        </span>
                      </div>

                      {/* Title */}
                      <Link href={`/tours/${item.tour.slug}`}>
                        <h3 className="font-bold text-[15px] leading-snug text-[#000E1A] line-clamp-2 hover:text-[#0046C1] transition-colors mb-2 cursor-pointer">
                          {item.tour.name}
                        </h3>
                      </Link>

                      {/* Reviews */}
                      {item.tour.reviewCount > 0 && (
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "w-3 h-3",
                                  i < Math.round(item.tour.rating) 
                                    ? "text-[#F8C700] fill-[#F8C700]" 
                                    : "text-[#DDDDDD]"
                                )}
                              />
                            ))}
                          </div>
                          <span className="text-[12px] text-[#636363]">
                            ({item.tour.reviewCount.toLocaleString()} đánh giá)
                          </span>
                        </div>
                      )}

                      {/* Price */}
                      <div className="flex items-center justify-between pt-3 border-t border-[#EEEEEE]">
                        <div>
                          {hasDiscount && (
                            <p className="text-[12px] text-[#636363] line-through">
                              {formatPrice(item.tour.price)}
                            </p>
                          )}
                          <p className="text-[18px] font-extrabold" style={{ color: PRIMARY }}>
                            {formatPrice(displayPrice)}
                            <span className="text-[12px] font-normal text-[#636363]"> /người</span>
                          </p>
                        </div>
                        <Link href={`/tours/${item.tour.slug}`}>
                          <Button
                            size="sm"
                            className="h-9 px-4 text-[13px] font-bold text-white"
                            style={{ backgroundColor: PRIMARY, borderRadius: "10px" }}
                          >
                            Chi tiết
                          </Button>
                        </Link>
                      </div>

                      {/* Added date */}
                      <p className="text-[11px] text-[#999999] mt-3">
                        Đã lưu ngày {formatDate(item.addedAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function WishlistPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F7F7F7" }}>
          <Spinner size="lg" />
        </div>
      }
    >
      <WishlistContent />
    </Suspense>
  );
}
