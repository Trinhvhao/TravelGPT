import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// ── Vietravel Design System — Badge ────────────────────────────────────────────

const badgeVariants = cva(
  "inline-flex items-center rounded-none text-xs font-bold px-2 py-1 transition-colors duration-200",
  {
    variants: {
      variant: {
        // Primary — Cobalt Blue solid fill
        default:   "bg-[#0046C1] text-white",
        // Secondary — Light Blue background
        secondary: "bg-[#D9EEFF] text-[#0046C1] border border-[#0046C1]",
        // Success — Lime Green solid fill
        success:   "bg-[#77DD77] text-white",
        // Warning — Gold solid fill
        warning:   "bg-[#F8C700] text-[#000E1A]",
        // Error / destructive — Red solid fill
        destructive: "bg-[#ED1D24] text-white",
        // Neutral — Gray
        neutral:   "bg-[#F7F7F7] text-[#4D4D4D] border border-[#DDDDDD]",
        // Outline — transparent with border
        outline:   "bg-transparent text-[#0046C1] border border-[#0046C1]",
        // Accent — Light Blue background, Azure text
        accent:    "bg-[#D9EEFF] text-[#0046C1]",
        // Promo — Gold
        promo:     "bg-[#F8C700] text-[#000E1A]",
      },
      size: {
        sm: "text-[10px] px-2 py-0.5",
        default: "text-[12px] px-2 py-1",
        lg: "text-[14px] px-3 py-1.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
