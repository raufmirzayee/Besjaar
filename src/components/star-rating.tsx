import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

export function StarRating({
  value,
  size = "sm",
  className,
}: {
  value: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const dimension = size === "md" ? "h-5 w-5" : "h-4 w-4";
  return (
    <span
      role="img"
      className={cn("inline-flex items-center gap-0.5", className)}
      aria-label={`${value} van 5 sterren`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          aria-hidden="true"
          className={cn(
            dimension,
            star <= Math.round(value) ? "fill-accent text-accent" : "text-muted-foreground/40",
          )}
        />
      ))}
    </span>
  );
}
