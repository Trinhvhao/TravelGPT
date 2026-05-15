import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// ── Vietravel Design System — Avatar Component ────────────────────────────

const avatarVariants = cva(
  "relative flex shrink-0 overflow-hidden rounded-full bg-lightblue flex items-center justify-center",
  {
    variants: {
      size: {
        xs:  "h-6 w-6 text-[10px]",
        sm:  "h-8 w-8 text-[12px]",
        md:  "h-10 w-10 text-[14px]",
        lg:  "h-12 w-12 text-[16px]",
        xl:  "h-16 w-16 text-[20px]",
        "2xl":"h-20 w-20 text-[24px]",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

export interface AvatarProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof avatarVariants> {}

const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(
  ({ className, size, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(avatarVariants({ size }), className)}
      {...props}
    />
  )
)
Avatar.displayName = "Avatar"

const AvatarImage = React.forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement>
>(({ className, ...props }, ref) => (
  <img
    ref={ref}
    className={cn("aspect-square h-full w-full object-cover", className)}
    {...props}
  />
))
AvatarImage.displayName = "AvatarImage"

const AvatarFallback = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center",
      "bg-lightblue text-primary font-bold",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarImage, AvatarFallback, avatarVariants }
