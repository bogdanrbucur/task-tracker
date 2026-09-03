import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      // Disabled: the filled variants mute to the muted/muted-foreground pair rather than fading,
      // because opacity-50 on a tonal fill drops the label to ~2.2:1 and leaves the fill within
      // 1.02:1 of the page - the control disappears. The unfilled variants have nothing to mute.
      variant: {
        // Filled with the accent's soft rendering, not the raw accent - a saturated accent slab
        // is far too loud in Latte. The hairline border is what gives the button an edge in
        // Latte, where the pale wash sits only ~1.05:1 off the page background.
        default:
          "border border-primary-soft-foreground/20 bg-primary-soft text-primary-soft-foreground hover:bg-primary-soft-hover disabled:border-transparent disabled:bg-muted disabled:text-muted-foreground",
        destructive:
          "border border-destructive-soft-foreground/20 bg-destructive-soft text-destructive-soft-foreground hover:bg-destructive-soft-hover disabled:border-transparent disabled:bg-muted disabled:text-muted-foreground",
        // Affirmative counterpart to `destructive`, for actions like re-activating a user.
        success:
          "border border-success-soft-foreground/20 bg-success-soft text-success-soft-foreground hover:bg-success-soft-hover disabled:border-transparent disabled:bg-muted disabled:text-muted-foreground",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50",
        ghost: "hover:bg-accent hover:text-accent-foreground disabled:opacity-50",
        link: "text-primary underline-offset-4 hover:underline disabled:opacity-50",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
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
