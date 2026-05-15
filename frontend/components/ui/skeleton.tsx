// ============================================================
// Skeleton — loading placeholder with shimmer animation
// ============================================================
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

function Skeleton({ className, variant = "rectangular", width, height, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-lightest-gray",
        variant === "text" && "rounded h-4",
        variant === "circular" && "rounded-full",
        variant === "rectangular" && "rounded-md",
        className
      )}
      style={{ width, height }}
      {...props}
    />
  );
}

// Pre-built skeleton patterns
function TourCardSkeleton() {
  return (
    <div className="bg-white border border-[#EEEEEE] rounded-2xl overflow-hidden shadow-sm">
      <div className="rounded-t-2xl overflow-hidden" style={{ aspectRatio: "16/10" }}>
        <Skeleton className="w-full h-full rounded-t-2xl" />
      </div>
      <div className="p-5 space-y-3">
        <div className="flex justify-between">
          <Skeleton width="40%" height={12} />
          <Skeleton width="25%" height={12} />
        </div>
        <Skeleton width="85%" height={16} />
        <Skeleton width="60%" height={16} />
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => <Skeleton key={i} width={12} height={12} className="rounded-full" />)}
        </div>
        <div className="border-t border-[#EEEEEE] pt-3 flex justify-between items-end">
          <Skeleton width="35%" height={24} />
          <Skeleton width="80px" height={36} className="rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function TourDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="w-full h-80" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton width="60%" height={32} />
          <Skeleton width="40%" height={20} />
          <div className="space-y-2">
            <Skeleton width="100%" />
            <Skeleton width="95%" />
            <Skeleton width="88%" />
          </div>
        </div>
        <div>
          <Skeleton className="w-full h-64" />
        </div>
      </div>
    </div>
  );
}

function BookingCardSkeleton() {
  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      <div className="flex justify-between">
        <Skeleton width="30%" height={18} />
        <Skeleton width="20%" height={24} />
      </div>
      <Skeleton width="60%" />
      <div className="flex gap-4">
        <Skeleton width="25%" height={14} />
        <Skeleton width="25%" height={14} />
      </div>
    </div>
  );
}

function ChatMessageSkeleton() {
  return (
    <div className="flex gap-3">
      <Skeleton variant="circular" width={36} height={36} />
      <div className="space-y-2 flex-1">
        <Skeleton width="30%" height={14} />
        <Skeleton width="80%" />
        <Skeleton width="60%" />
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="rounded-lg border border-border p-6 space-y-2">
      <Skeleton width="40%" height={14} />
      <Skeleton width="60%" height={28} />
      <Skeleton width="30%" height={12} />
    </div>
  );
}

export { Skeleton, TourCardSkeleton, TourDetailSkeleton, BookingCardSkeleton, ChatMessageSkeleton, StatCardSkeleton };
