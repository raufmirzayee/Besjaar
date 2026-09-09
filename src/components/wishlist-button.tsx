import { Heart } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useWishlist } from "@/lib/wishlist";
import { cn } from "@/lib/utils";

export function WishlistButton({
  productId,
  productName,
  variant = "icon",
  className,
}: {
  productId: string;
  productName?: string;
  variant?: "icon" | "full";
  className?: string;
}) {
  const { t } = useI18n();
  const { has, toggle } = useWishlist();
  const active = has(productId);

  const label = active
    ? t("wishlist.remove", { name: productName ?? "" })
    : t("wishlist.add", { name: productName ?? "" });

  const onToggle = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const result = await toggle(productId);
    toast.success(result === "added" ? t("wishlist.added") : t("wishlist.removed"));
  };

  if (variant === "icon") {
    return (
      <Button
        type="button"
        variant="subtle"
        size="icon-sm"
        aria-label={label}
        aria-pressed={active}
        title={label}
        onClick={onToggle}
        className={cn(
          "rounded-full border-transparent bg-card/90 backdrop-blur-sm hover:bg-card",
          active && "text-sale",
          className,
        )}
      >
        <Heart className={cn("size-4", active ? "fill-sale text-sale" : "text-muted-foreground")} />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="subtle"
      size="lg"
      aria-pressed={active}
      onClick={onToggle}
      className={className}
    >
      <Heart className={cn("size-4", active && "fill-sale text-sale")} />
      {active ? t("wishlist.labelRemove") : t("wishlist.labelAdd")}
    </Button>
  );
}
