import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import type { ProductListItem } from "@/lib/catalog.server";

export const Route = createFileRoute("/verlanglijst")({
  head: () => ({
    meta: [
      { title: "Mijn verlanglijst — Besjaar" },
      {
        name: "description",
        content: "Bewaar je favoriete Besjaar producten op je persoonlijke verlanglijst.",
      },
      { property: "og:title", content: "Mijn verlanglijst — Besjaar" },
      { property: "og:description", content: "Je bewaarde producten bij Besjaar." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WishlistPage,
});

/* eslint-disable @typescript-eslint/no-explicit-any */
function WishlistPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/inloggen", replace: true });
  }, [loading, user, navigate]);

  const { data, isPending } = useQuery({
    queryKey: ["wishlist-products", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("wishlist_items")
        .select(
          `product_id,
           products ( id, name, slug, short_description, regular_price, sale_price, stock_quantity,
                      featured, bestseller, rating_average, rating_count, translations,
                      brands ( name, translations ),
                      product_images ( image_url, is_main, sort_order ) )`,
        )
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return ((rows ?? []) as any[])
        .map((row) => row.products)
        .filter(Boolean)
        .map((p: any): ProductListItem => {
          const images = [...(p.product_images ?? [])].sort(
            (a: any, b: any) =>
              Number(b.is_main) - Number(a.is_main) || a.sort_order - b.sort_order,
          );
          return {
            id: p.id,
            name: p.name,
            slug: p.slug,
            short_description: p.short_description,
            regular_price: Number(p.regular_price),
            sale_price: p.sale_price === null ? null : Number(p.sale_price),
            stock_quantity: p.stock_quantity ?? 0,
            featured: !!p.featured,
            bestseller: !!p.bestseller,
            rating_average: Number(p.rating_average ?? 0),
            rating_count: p.rating_count ?? 0,
            brand: p.brands?.name ?? null,
            category: null,
            category_slug: null,
            image_url: images[0]?.image_url ?? null,
            translations: p.translations ?? null,
            brand_translations: p.brands?.translations ?? null,
            category_translations: null,
          };
        });
    },
  });

  if (loading || !user) {
    return (
      <div className="container-page py-16">
        <p className="text-center text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  const products = data ?? [];

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-3xl font-bold">{t("wishlistPage.title")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("wishlistPage.subtitle")}</p>

      {isPending ? (
        <p className="mt-8 text-sm text-muted-foreground">{t("wishlistPage.loading")}</p>
      ) : products.length === 0 ? (
        <div className="mt-8 rounded-2xl border bg-card p-8 text-center shadow-soft">
          <p className="text-muted-foreground">{t("wishlistPage.empty")}</p>
          <Button asChild className="mt-4">
            <Link to="/winkel">{t("account.toShop")}</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
