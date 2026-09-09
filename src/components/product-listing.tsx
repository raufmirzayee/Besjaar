import { Link, useNavigate } from "@tanstack/react-router";
import { SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";

import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { categories as catalogueCategories } from "@/data/catalogue";
import type { ProductListItem } from "@/lib/catalog.server";
import { useI18n } from "@/lib/i18n";
import { EMPTY_LISTING_SEARCH, hasActiveFilters, type ListingSearch } from "@/lib/listing-search";
import { facetCounts, filterProducts, SORT_OPTIONS, type SortOption } from "@/lib/product-filters";
import { formatPrice } from "@/lib/format";
import type { TranslationKey } from "@/lib/translations";
import { cn } from "@/lib/utils";

const SORT_LABEL_KEYS: Record<SortOption, TranslationKey> = {
  populariteit: "sort.populariteit",
  "prijs-op": "sort.prijs-op",
  "prijs-af": "sort.prijs-af",
  nieuwste: "sort.nieuwste",
  naam: "sort.naam",
  korting: "sort.korting",
};

export type ListingFacet = "category" | "brand" | "price" | "availability" | "sale";

const ALL_FACETS: ListingFacet[] = ["category", "brand", "price", "availability", "sale"];

/**
 * The product listing used by the shop, category, brand, deals and search
 * pages. Filters live in the URL, so every view is linkable and renders on the
 * server. On desktop the facets sit in a left rail; on a phone they open in a
 * bottom sheet with a clear "show N products" action.
 */
export function ProductListing({
  products,
  search,
  facets = ALL_FACETS,
  isLoading = false,
  emptyAction,
}: {
  /** Products already scoped to the page (a category, a brand, the sale). */
  products: ProductListItem[];
  search: ListingSearch;
  facets?: ListingFacet[];
  isLoading?: boolean;
  emptyAction?: React.ReactNode;
}) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const counts = useMemo(() => facetCounts(products), [products]);

  const visible = useMemo(
    () =>
      filterProducts(products, {
        categorySlugs: search.categorie,
        brands: search.merk,
        minPrice: search.min,
        maxPrice: search.max,
        onSale: search.sale,
        inStock: search.voorraad,
        search: search.q,
        sort: search.sort ?? "populariteit",
      }),
    [products, search],
  );

  const update = (next: Partial<ListingSearch>) => {
    navigate({
      to: ".",
      search: (previous: Record<string, unknown>) => ({ ...previous, ...next }),
      replace: true,
      resetScroll: false,
    });
  };

  const toggleValue = (key: "categorie" | "merk", value: string) => {
    const current = search[key] ?? [];
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    update({ [key]: next.length ? next : undefined } as Partial<ListingSearch>);
  };

  const clearAll = () => update(EMPTY_LISTING_SEARCH);
  const filtersActive = hasActiveFilters(search);

  const filterPanel = (
    <FilterPanel
      facets={facets}
      search={search}
      counts={counts}
      onToggle={toggleValue}
      onUpdate={update}
    />
  );

  return (
    <div className="lg:grid lg:grid-cols-[17rem_1fr] lg:gap-10">
      <aside className="hidden lg:block">
        <div className="sticky top-32 max-h-[calc(100vh-9rem)] overflow-y-auto pr-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-bold">{t("filters.title")}</h2>
            {filtersActive ? (
              <Button variant="link" size="sm" onClick={clearAll} className="h-auto p-0">
                {t("filters.clear")}
              </Button>
            ) : null}
          </div>
          {filterPanel}
        </div>
      </aside>

      <div className="min-w-0">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p aria-live="polite" className="text-sm text-muted-foreground">
            {visible.length === 1
              ? t("list.resultsOne")
              : t("list.results", { count: visible.length })}
          </p>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="subtle"
              className="lg:hidden"
              onClick={() => setMobileFiltersOpen(true)}
              aria-expanded={mobileFiltersOpen}
            >
              <SlidersHorizontal className="size-4" />
              {t("filters.open")}
              {filtersActive ? (
                <span className="ml-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {activeFilterCount(search)}
                </span>
              ) : null}
            </Button>

            <div className="flex items-center gap-2">
              <Label htmlFor="sort" className="sr-only">
                {t("sort.label")}
              </Label>
              <Select
                value={search.sort ?? "populariteit"}
                onValueChange={(value) => update({ sort: value as SortOption })}
              >
                <SelectTrigger id="sort" className="h-10 w-[11.5rem]">
                  <SelectValue placeholder={t("sort.label")} />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {t(SORT_LABEL_KEYS[option])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {filtersActive ? (
          <ActiveFilterChips
            search={search}
            onToggle={toggleValue}
            onUpdate={update}
            onClear={clearAll}
          />
        ) : null}

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-strong bg-surface px-6 py-16 text-center">
            <p className="font-display text-lg font-bold">{t("list.empty")}</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              {t("list.emptyText")}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {filtersActive ? (
                <Button onClick={clearAll}>{t("list.emptyCta")}</Button>
              ) : (
                <Button asChild>
                  <Link to="/winkel">{t("nav.viewAllProducts")}</Link>
                </Button>
              )}
              {emptyAction}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((product, index) => (
              <ProductCard key={product.id} product={product} priority={index < 4} />
            ))}
          </div>
        )}
      </div>

      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <SheetContent side="bottom" className="flex max-h-[85vh] flex-col gap-0 p-0">
          <SheetHeader className="border-b border-border px-5 py-4 text-left">
            <SheetTitle>{t("filters.title")}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-5 py-4">{filterPanel}</div>
          <div className="grid grid-cols-2 gap-2 border-t border-border bg-surface p-4">
            <Button variant="subtle" size="lg" onClick={clearAll} disabled={!filtersActive}>
              {t("filters.clear")}
            </Button>
            <Button size="lg" onClick={() => setMobileFiltersOpen(false)}>
              {t("filters.apply", { count: visible.length })}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function activeFilterCount(search: ListingSearch): number {
  return (
    (search.categorie?.length ?? 0) +
    (search.merk?.length ?? 0) +
    (search.min !== undefined || search.max !== undefined ? 1 : 0) +
    (search.sale ? 1 : 0) +
    (search.voorraad ? 1 : 0)
  );
}

function FilterPanel({
  facets,
  search,
  counts,
  onToggle,
  onUpdate,
}: {
  facets: ListingFacet[];
  search: ListingSearch;
  counts: ReturnType<typeof facetCounts>;
  onToggle: (key: "categorie" | "merk", value: string) => void;
  onUpdate: (next: Partial<ListingSearch>) => void;
}) {
  const { t } = useI18n();

  const categoryEntries = catalogueCategories.filter((c) => (counts.categories[c.slug] ?? 0) > 0);
  const brandEntries = Object.entries(counts.brands).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      {facets.includes("category") && categoryEntries.length > 1 ? (
        <FilterGroup title={t("filters.category")}>
          {categoryEntries.map((category) => (
            <FilterCheckbox
              key={category.slug}
              id={`cat-${category.slug}`}
              label={category.name}
              count={counts.categories[category.slug] ?? 0}
              checked={search.categorie?.includes(category.slug) ?? false}
              onChange={() => onToggle("categorie", category.slug)}
            />
          ))}
        </FilterGroup>
      ) : null}

      {facets.includes("brand") && brandEntries.length > 1 ? (
        <FilterGroup title={t("filters.brand")}>
          {brandEntries.map(([brand, count]) => (
            <FilterCheckbox
              key={brand}
              id={`brand-${brand}`}
              label={brand}
              count={count}
              checked={search.merk?.includes(brand) ?? false}
              onChange={() => onToggle("merk", brand)}
            />
          ))}
        </FilterGroup>
      ) : null}

      {facets.includes("price") ? (
        <FilterGroup title={t("filters.price")}>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Label htmlFor="price-min" className="text-xs text-muted-foreground">
                {t("filters.priceFrom")}
              </Label>
              <Input
                id="price-min"
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="0"
                defaultValue={search.min ?? ""}
                onBlur={(event) => {
                  const value = event.target.value.trim();
                  onUpdate({ min: value ? Number(value) : undefined });
                }}
                className="mt-1 h-10"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="price-max" className="text-xs text-muted-foreground">
                {t("filters.priceTo")}
              </Label>
              <Input
                id="price-max"
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="100"
                defaultValue={search.max ?? ""}
                onBlur={(event) => {
                  const value = event.target.value.trim();
                  onUpdate({ max: value ? Number(value) : undefined });
                }}
                className="mt-1 h-10"
              />
            </div>
          </div>
        </FilterGroup>
      ) : null}

      {facets.includes("availability") || facets.includes("sale") ? (
        <FilterGroup title={t("filters.availability")}>
          {facets.includes("availability") ? (
            <FilterCheckbox
              id="in-stock"
              label={t("filters.inStock")}
              count={counts.inStock}
              checked={search.voorraad ?? false}
              onChange={() => onUpdate({ voorraad: search.voorraad ? undefined : true })}
            />
          ) : null}
          {facets.includes("sale") ? (
            <FilterCheckbox
              id="on-sale"
              label={t("filters.onSale")}
              count={counts.onSale}
              checked={search.sale ?? false}
              onChange={() => onUpdate({ sale: search.sale ? undefined : true })}
            />
          ) : null}
        </FilterGroup>
      ) : null}
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-t border-border pt-4 first:border-t-0 first:pt-0">
      <legend className="mb-2.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        {title}
      </legend>
      <div className="space-y-1">{children}</div>
    </fieldset>
  );
}

function FilterCheckbox({
  id,
  label,
  count,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  count: number;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2 py-2 transition-colors hover:bg-secondary",
        checked && "bg-secondary",
      )}
    >
      <Checkbox id={id} checked={checked} onCheckedChange={onChange} />
      <Label htmlFor={id} className="flex-1 cursor-pointer text-sm font-medium">
        {label}
      </Label>
      <span className="text-xs tabular-nums text-muted-foreground">{count}</span>
    </div>
  );
}

function ActiveFilterChips({
  search,
  onToggle,
  onUpdate,
  onClear,
}: {
  search: ListingSearch;
  onToggle: (key: "categorie" | "merk", value: string) => void;
  onUpdate: (next: Partial<ListingSearch>) => void;
  onClear: () => void;
}) {
  const { t } = useI18n();
  const categoryName = (slug: string) =>
    catalogueCategories.find((c) => c.slug === slug)?.name ?? slug;

  const chips: { key: string; label: string; onRemove: () => void }[] = [
    ...(search.categorie ?? []).map((slug) => ({
      key: `cat-${slug}`,
      label: categoryName(slug),
      onRemove: () => onToggle("categorie", slug),
    })),
    ...(search.merk ?? []).map((brand) => ({
      key: `brand-${brand}`,
      label: brand,
      onRemove: () => onToggle("merk", brand),
    })),
  ];

  if (search.min !== undefined || search.max !== undefined) {
    chips.push({
      key: "price",
      label: `${formatPrice(search.min ?? 0)} – ${search.max !== undefined ? formatPrice(search.max) : "∞"}`,
      onRemove: () => onUpdate({ min: undefined, max: undefined }),
    });
  }
  if (search.voorraad) {
    chips.push({
      key: "stock",
      label: t("filters.inStock"),
      onRemove: () => onUpdate({ voorraad: undefined }),
    });
  }
  if (search.sale) {
    chips.push({
      key: "sale",
      label: t("filters.onSale"),
      onRemove: () => onUpdate({ sale: undefined }),
    });
  }

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      <span className="sr-only">{t("filters.active")}</span>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onRemove}
          aria-label={t("filters.clearOne", { name: chip.label })}
          className="inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-primary hover:bg-secondary"
        >
          {chip.label}
          <X className="size-3" aria-hidden="true" />
        </button>
      ))}
      <Button variant="link" size="sm" onClick={onClear} className="h-auto p-0 text-xs">
        {t("filters.clear")}
      </Button>
    </div>
  );
}
