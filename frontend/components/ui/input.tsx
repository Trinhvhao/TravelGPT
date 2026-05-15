import * as React from "react"
import { cn } from "@/lib/utils"

// ── Vietravel Design System — Input Component ─────────────────────────────

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex w-full rounded-lg border border-light-gray bg-off-white",
          "text-[16px] leading-[20px] font-normal text-navy",
          "placeholder:text-medium-gray placeholder:font-normal",
          "transition-all duration-200 ease-in-out",
          "focus:outline-none focus:border-2 focus:border-primary",
          "focus:bg-white focus:shadow-[0px_0px_0px_3px_rgba(0,70,193,0.10)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "disabled:bg-off-white disabled:text-medium-gray",
          "min-h-[48px]", // 48px touch target
          error && [
            "border-2 border-error bg-error-light",
            "focus:border-error focus:shadow-none",
          ],
          className
        )}
        style={{ padding: "12px 16px" }}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

// ── Rounded variant (pill-style search input) ─────────────────────────────

export interface InputRoundedProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const InputRounded = React.forwardRef<HTMLInputElement, InputRoundedProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex w-full rounded-full border border-light-gray bg-off-white",
          "text-[16px] leading-[20px] font-normal text-navy",
          "placeholder:text-medium-gray placeholder:font-normal",
          "transition-all duration-200 ease-in-out",
          "focus:outline-none focus:border-2 focus:border-primary",
          "focus:bg-white focus:shadow-[0px_0px_0px_3px_rgba(0,70,193,0.10)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "min-h-[48px]",
          className
        )}
        style={{ padding: "12px 20px" }}
        ref={ref}
        {...props}
      />
    )
  }
)
InputRounded.displayName = "InputRounded"

export { Input, InputRounded }
