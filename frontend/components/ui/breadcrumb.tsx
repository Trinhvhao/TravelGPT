import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center flex-wrap gap-1", className)}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRight
                className="h-4 w-4 text-medium-gray mx-1 shrink-0"
                aria-hidden
              />
            )}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-[14px] font-semibold text-primary hover:underline transition-colors duration-200"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  "text-[14px] leading-[20px]",
                  isLast
                    ? "font-semibold text-navy"
                    : "font-normal text-dark-gray"
                )}
                aria-current={isLast ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
