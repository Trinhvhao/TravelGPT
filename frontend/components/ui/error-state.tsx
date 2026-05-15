// ============================================================
// ErrorState — shown when data fetching fails
// ============================================================
import { cn } from "@/lib/utils";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Đã xảy ra lỗi",
  message = "Không thể tải dữ liệu. Vui lòng thử lại.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
      <div className="w-16 h-16 rounded-full bg-error-light flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-error" />
      </div>
      <h3 className="text-heading-3 font-bold text-navy mb-1">{title}</h3>
      <p className="text-body-sm text-dark-gray max-w-sm mb-4">{message}</p>
      {onRetry && (
        <Button
          variant="secondary"
          onClick={onRetry}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Thử lại
        </Button>
      )}
    </div>
  );
}
