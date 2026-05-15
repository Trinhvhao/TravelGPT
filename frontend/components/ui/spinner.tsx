// ============================================================
// Spinner — lightweight loading indicator
// ============================================================
import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Đang tải..."
      className={cn(
        "animate-spin rounded-full border-2 border-light-gray border-t-primary",
        size === "sm" && "w-4 h-4",
        size === "md" && "w-6 h-6",
        size === "lg" && "w-8 h-8",
        className
      )}
    />
  );
}

// Full-screen loading overlay
interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = "Đang tải..." }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-overlay bg-white/80 flex flex-col items-center justify-center gap-4">
      <Spinner size="lg" />
      <p className="text-body text-dark-gray">{message}</p>
    </div>
  );
}
