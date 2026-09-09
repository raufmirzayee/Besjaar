import { Link, useNavigate } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/product-image";
import { searchProducts } from "@/data/catalogue";
import { formatPrice } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const MAX_SUGGESTIONS = 6;

/**
 * Search with live suggestions.
 *
 * The catalogue is small enough to search in the browser, so suggestions appear
 * as the shopper types with no round trip. Implemented as a combobox: arrow
 * keys move through results, Enter opens the highlighted one, Escape closes.
 */
export function SiteSearch({
  onNavigate,
  autoFocus = false,
  className,
}: {
  onNavigate?: () => void;
  autoFocus?: boolean;
  className?: string;
}) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const results = useMemo(() => {
    const query = term.trim();
    if (query.length < 2) return [];
    return searchProducts(query);
  }, [term]);

  const suggestions = results.slice(0, MAX_SUGGESTIONS);

  // Close when focus or a click leaves the search area.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [term]);

  const goToResults = useCallback(() => {
    const query = term.trim();
    if (!query) return;
    setOpen(false);
    onNavigate?.();
    navigate({ to: "/zoeken", search: { q: query } });
  }, [term, navigate, onNavigate]);

  const openProduct = useCallback(
    (slug: string) => {
      setOpen(false);
      setTerm("");
      onNavigate?.();
      navigate({ to: "/product/$slug", params: { slug } });
    },
    [navigate, onNavigate],
  );

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (index + 1) % Math.max(suggestions.length, 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        openProduct(suggestions[activeIndex].slug);
      } else {
        goToResults();
      }
    } else if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  const showPanel = open && term.trim().length >= 2;

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          goToResults();
        }}
      >
        <label htmlFor={`${listboxId}-input`} className="sr-only">
          {t("search.label")}
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id={`${listboxId}-input`}
            ref={inputRef}
            type="search"
            role="combobox"
            autoFocus={autoFocus}
            autoComplete="off"
            aria-expanded={showPanel}
            aria-controls={showPanel ? listboxId : undefined}
            aria-activedescendant={
              activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
            }
            aria-autocomplete="list"
            placeholder={t("search.placeholder")}
            value={term}
            onChange={(event) => {
              setTerm(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            className={cn(
              "h-11 w-full rounded-lg border border-input bg-card pl-10 pr-10 text-sm text-foreground",
              "placeholder:text-muted-foreground",
              "focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring",
              // Hide the browser's own search clear button; we render our own.
              "[&::-webkit-search-cancel-button]:appearance-none",
            )}
          />
          {term ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t("search.clear")}
              onClick={() => {
                setTerm("");
                inputRef.current?.focus();
              }}
              className="absolute right-1 top-1/2 -translate-y-1/2"
            >
              <X className="size-4" />
            </Button>
          ) : null}
        </div>
      </form>

      {showPanel ? (
        <div
          className={cn(
            "absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-xl",
            "border border-border bg-popover shadow-pop",
          )}
        >
          {suggestions.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm font-semibold text-foreground">
                {t("search.noResults", { q: term.trim() })}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{t("search.noResultsHint")}</p>
            </div>
          ) : (
            <>
              <ul id={listboxId} role="listbox" aria-label={t("search.resultsTitle")}>
                {suggestions.map((product, index) => (
                  <li key={product.slug} role="none">
                    <button
                      type="button"
                      id={`${listboxId}-option-${index}`}
                      role="option"
                      aria-selected={index === activeIndex}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => openProduct(product.slug)}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                        index === activeIndex ? "bg-secondary" : "hover:bg-secondary",
                      )}
                    >
                      <span className="size-11 shrink-0 overflow-hidden rounded-md border border-border bg-white p-1">
                        <ProductImage
                          src={product.imageUrl}
                          alt=""
                          width={88}
                          height={88}
                          sizes="44px"
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          {product.brand}
                        </span>
                        <span className="block truncate text-sm font-medium text-foreground">
                          {product.name}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm font-bold tabular-nums text-foreground">
                        {formatPrice(product.price)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <Link
                to="/zoeken"
                search={{ q: term.trim() }}
                onClick={() => {
                  setOpen(false);
                  onNavigate?.();
                }}
                className="block border-t border-border bg-secondary/60 px-4 py-3 text-center text-sm font-semibold text-primary transition-colors hover:bg-secondary"
              >
                {t("search.viewAll", { count: results.length })}
              </Link>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
