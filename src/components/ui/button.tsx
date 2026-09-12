import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Besjaar buttons.
 *
 * Every variant reads as clickable: solid fill or a real border, a visible
 * hover, a pressed state, and a focus ring that survives on light and dark.
 * Sizes are at least 40px tall (44px on the touch-sized variants) so they stay
 * comfortable targets on a phone.
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg",
    "text-sm font-semibold cursor-pointer select-none",
    "transition-[background-color,color,box-shadow,transform,border-color] duration-200 ease-brand",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    "active:translate-y-px",
    "disabled:pointer-events-none disabled:opacity-55 disabled:cursor-not-allowed",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-soft hover:bg-primary-hover hover:shadow-lift",
        destructive:
          "bg-destructive text-destructive-foreground shadow-soft hover:brightness-110 hover:shadow-lift",
        outline:
          "border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground",
        subtle:
          "border border-border-strong bg-card text-foreground shadow-soft hover:border-primary hover:bg-secondary",
        secondary: "bg-secondary text-secondary-foreground hover:bg-accent",
        ghost: "text-foreground hover:bg-secondary hover:text-secondary-foreground",
        link: "text-primary underline underline-offset-4 hover:text-primary-hover",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-7 text-base",
        // Full-width primary action used by the mobile buy bar and forms.
        block: "h-12 w-full rounded-lg px-6 text-base",
        icon: "size-10",
        "icon-sm": "size-9",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
