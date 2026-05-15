"use client";
import { useMemo } from "react";
import { TourCard } from "../tours/tour-card";
import { TourCardSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

interface TourCardData {
  id: string;
  slug: string;
  name: string;
  destination: string;
  duration: string;
  price: number | string;
  discount_price?: number | string | null;
  images: string[] | { url: string; alt?: string }[];
  rating: number | string;
  review_count: number;
  is_featured?: boolean;
}

interface TourGridProps {
  tours: TourCardData[];
  loading?: boolean;
  skeletonCount?: number;
  className?: string;
  emptyMessage?: string;
}

export function TourGrid({
  tours,
  loading = false,
  skeletonCount = 12,
  className,
  emptyMessage = "Không tìm thấy tour nào phù hợp.",
}: TourGridProps) {
  const items = useMemo(() => {
    if (loading) return Array.from({ length: skeletonCount }, (_, i) => i);
    return tours;
  }, [loading, tours, skeletonCount]);

  if (!loading && tours.length === 0) {
    return (
      <EmptyState
        icon={Search}
        title="Không tìm thấy kết quả"
        description={emptyMessage}
      />
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5",
        className
      )}
    >
      {items.map((_, index) =>
        loading ? (
          <TourCardSkeleton key={index} />
        ) : (
          <TourCard key={(tours[index] as TourCardData).id} tour={tours[index] as TourCardData} />
        )
      )}
    </div>
  );
}
