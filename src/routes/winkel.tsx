import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";

import { ProductCard } from "@/components/product-card";
import { getProducts } from "@/lib/catalog.functions";
import { useI18n } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/translations";

type Sort = "nieuwste" | "prijs-op" | "prijs-af" | "naam";

type WinkelSearch = { q?: string; sort?: Sort };

const sortLabels: Record<Sort, TranslationKey> = {
  nieuwste: "sort.newest",
  "prijs-op": "sort.priceAsc",
  "prijs-af": "sort.priceDesc",
  naam: "sort.name",
};

function productsQuery(search: WinkelSearch) {
  return queryOptions({
    queryKey: ["products", "winkel", search.q ?? "", search.sort ?? "nieuwste"],
    queryFn: () => getProducts({ data: { search: search.q, sort: search.sort ?? "nieuwste" } }),
  });
}

export const Route = createFileRoute("/winkel")({
  validateSearch: (search: Record<string, unknown>): WinkelSearch => ({
    q: typeof search.q === "string" && search.q ? search.q : undefined,
    sort:
      typeof search.sort === "string" && search.sort in sortLabels
        ? (search.sort as Sort)
        : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(productsQuery(deps)),
  head: () => ({
    meta: [
      { title: "Winkel — het volledige Besjaar assortiment" },
      {
        name: "description",
        content:
          "Bekijk alle producten van Besjaar, RYNEX en LYNEX: verlichting, badkamer, elektronica, keuken en meer.",
      },
      { property: "og:title", content: "Winkel — het volledige Besjaar assortiment" },
      {
        property: "og:description",
        content: "Filter en sorteer het complete assortiment van Besjaar.",
      },
    ],
  }),
  component: WinkelPage,
});

function WinkelPage() {
  const search = Route.useSearch();
  const { data: products } = useSuspenseQuery(productsQuery(search));
  const { t } = useI18n();

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold sm:text-4xl">{t("shop.title")}</h1>
      <p className="mt-2 text-muted-foreground">
        {search.q ? `${t("shop.resultsFor", { q: search.q })} · ` : ""}
        {products.length === 1 ? t("shop.countOne") : t("shop.count", { count: products.length })}
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {(Object.keys(sortLabels) as Sort[]).map((key) => (
          <Link
            key={key}
            to="/winkel"
            search={{ q: search.q, sort: key }}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              (search.sort ?? "nieuwste") === key
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            {t(sortLabels[key])}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <p className="mt-12 text-muted-foreground">{t("shop.empty")}</p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
