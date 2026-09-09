import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type WishlistRow = { id: string; product_id: string };

export function useWishlist() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["wishlist", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase.from("wishlist_items").select("id, product_id");
      if (error) throw new Error(error.message);
      return (data ?? []) as WishlistRow[];
    },
  });
}

export function WishlistButton({
  productId,
  variant = "icon",
  className,
}: {
  productId: string;
  variant?: "icon" | "full";
  className?: string;
}) {
  const { user } = useAuth();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { data: items } = useWishlist();
  const active = (items ?? []).some((i) => i.product_id === productId);

  const toggle = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error(t("wishlist.loginRequired"));
      if (active) {
        const { error } = await supabase
          .from("wishlist_items")
          .delete()
          .eq("product_id", productId)
          .eq("user_id", user.id);
        if (error) throw new Error(error.message);
        return "removed" as const;
      }
      const { error } = await supabase
        .from("wishlist_items")
        .insert({ product_id: productId, user_id: user.id });
      if (error) throw new Error(error.message);
      return "added" as const;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success(result === "added" ? t("wishlist.added") : t("wishlist.removed"));
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (variant === "icon") {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={active ? t("wishlist.remove") : t("wishlist.add")}
        aria-pressed={active}
        disabled={toggle.isPending}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          toggle.mutate();
        }}
        className={cn("bg-background/80 backdrop-blur hover:bg-background", className)}
      >
        <Heart
          className={cn("h-4 w-4", active ? "fill-sale text-sale" : "text-muted-foreground")}
        />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      disabled={toggle.isPending}
      onClick={() => toggle.mutate()}
      className={className}
    >
      <Heart className={cn("mr-2 h-4 w-4", active ? "fill-sale text-sale" : "")} />
      {active ? t("wishlist.labelRemove") : t("wishlist.labelAdd")}
    </Button>
  );
}
