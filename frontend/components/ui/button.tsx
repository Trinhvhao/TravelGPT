import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// ── Vietravel Design System — Button ───────────────────────────────────────────

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-normal transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        // Primary CTA — Cobalt Blue (0px radius, solid fill)
        default:
          "bg-[#0046C1] text-white border border-[#0046C1] rounded-none hover:bg-[#002540] hover:border-[#002540] active:bg-[#000E1A] active:border-[#000E1A]",
        // Secondary — White with Azure border (40px radius, pill style)
        secondary:
          "bg-white text-[#0391FF] border border-[#0391FF] rounded-full hover:bg-[#D9EEFF] hover:text-[#0046C1] hover:border-[#0046C1] active:bg-[#D9EEFF] active:text-[#002540]",
        // Outline — same as secondary
        outline:
          "bg-transparent text-[#0391FF] border border-[#0391FF] rounded-full hover:bg-[#D9EEFF] hover:text-[#0046C1] hover:border-[#0046C1] active:bg-[#D9EEFF] active:text-[#002540]",
        // Ghost — transparent, underline on hover
        ghost:
          "bg-transparent text-[#000E1A] border-none rounded-none hover:underline active:underline p-0",
        // Accent — Bright Azure (40px radius)
        accent:
          "bg-[#0391FF] text-white border border-[#0391FF] rounded-none hover:bg-[#0274CC] hover:border-[#0274CC] active:bg-[#015799] active:border-[#015799]",
        // Destructive — Error Red
        destructive:
          "bg-[#ED1D24] text-white border border-[#ED1D24] rounded-none hover:bg-[#DB0F00] hover:border-[#DB0F00] active:bg-[#000E1A] active:border-[#000E1A]",
        // Success — Lime Green
        success:
          "bg-[#77DD77] text-white border border-[#77DD77] rounded-none hover:bg-[#2D7A2D] hover:border-[#2D7A2D] active:bg-[#1A4D1A] active:border-[#1A4D1A]",
        // Link — text link with underline
        link:
          "bg-transparent text-[#0000EE] border-none underline-offset-4 hover:underline hover:text-[#0046C1] active:text-[#0046C1] rounded-none p-0 min-h-0",
      },
      size: {
        default:   "h-11 px-5 min-h-[44px]",
        sm:        "h-9 px-4 min-h-[36px]",
        lg:        "h-12 px-8 min-h-[48px]",
        xs:        "h-8 px-3 min-h-[32px]",
        icon:      "h-12 w-12 min-h-[48px] min-w-[48px] p-0",
        "icon-sm": "h-10 w-10 min-h-[40px] min-w-[40px] p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
