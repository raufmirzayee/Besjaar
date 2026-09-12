import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Badges carry meaning, so each variant maps to one fact the data supports:
 * `sale` to a genuine discount, `bestseller` to review volume, `stock` to
 * availability. Never decorate a product with a badge its data cannot back up.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide leading-5",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        sale: "border-transparent bg-sale text-sale-foreground",
        bestseller: "border-transparent bg-navy-deep text-white",
        stock: "border-success/25 bg-success/10 text-success",
        outline: "border-border-strong bg-card text-muted-foreground",
        secondary: "border-transparent bg-accent text-accent-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
