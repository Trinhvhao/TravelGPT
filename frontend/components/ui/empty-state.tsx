// ============================================================
// EmptyState — shown when there's no data
// ============================================================
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Button } from "./button";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-[#D9EEFF] flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-[#0046C1]" />
        </div>
      )}
      <h3 className="text-base font-bold text-[#000E1A] mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[#636363] max-w-sm mb-4 leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
