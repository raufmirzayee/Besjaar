import { Link } from "@tanstack/react-router";
import { ChevronDown, Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { BesjaarLogo } from "@/components/besjaar-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { SiteSearch } from "@/components/site-search";
import { MobileMenu } from "@/components/mobile-menu";
import { Button } from "@/components/ui/button";
import { brands, categories, countByBrand, countByCategory } from "@/data/catalogue";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { themedCategories } from "@/lib/navigation";
import { useWishlist } from "@/lib/wishlist";
import { cn } from "@/lib/utils";

const categoryCounts = countByCategory();
const brandCounts = countByBrand();

export function SiteHeader() {
  const { t } = useI18n();
  const { itemCount, openCart } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { user } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [compact, setCompact] = useState(false);

  // The header tightens slightly once the page scrolls, keeping more of the
  // product grid in view without the navigation jumping.
  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <AnnouncementBar />

      <div
        className={cn(
          "container-page flex items-center gap-3 transition-[padding] duration-200 ease-brand",
          compact ? "py-2.5" : "py-3.5",
        )}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label={t("nav.menu")}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <Menu className="size-5" />
        </Button>

        <Link
          to="/"
          aria-label="Besjaar"
          className="shrink-0 rounded-md text-primary transition-opacity hover:opacity-85"
        >
          <BesjaarLogo />
        </Link>

        <DesktopNav />

        <div className="ml-auto flex items-center gap-0.5">
          <div className="mr-2 hidden w-full max-w-sm xl:block">
            <SiteSearch />
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="xl:hidden"
            aria-label={mobileSearchOpen ? t("search.close") : t("search.open")}
            aria-expanded={mobileSearchOpen}
            onClick={() => setMobileSearchOpen((open) => !open)}
          >
            {mobileSearchOpen ? <X className="size-5" /> : <Search className="size-5" />}
          </Button>

          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>

          <Button
            asChild
            variant="ghost"
            size="icon"
            className="hidden sm:inline-flex"
            aria-label={t("header.account")}
          >
            <Link to={user ? "/account" : "/inloggen"}>
              <User className="size-5" />
            </Link>
          </Button>

          <Button asChild variant="ghost" size="icon" aria-label={t("header.wishlist")}>
            <Link to="/verlanglijst" className="relative">
              <Heart className="size-5" />
              {wishlistCount > 0 ? <CountBubble count={wishlistCount} /> : null}
            </Link>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("header.cart")}
            onClick={openCart}
            className="relative"
          >
            <ShoppingBag className="size-5" />
            {itemCount > 0 ? <CountBubble count={itemCount} /> : null}
          </Button>
        </div>
      </div>

      {mobileSearchOpen ? (
        <div className="border-t border-border bg-card px-4 py-3 xl:hidden">
          <SiteSearch autoFocus onNavigate={() => setMobileSearchOpen(false)} />
        </div>
      ) : null}

      <MobileMenu open={menuOpen} onOpenChange={setMenuOpen} />
    </header>
  );
}

function CountBubble({ count }: { count: number }) {
  return (
    <span
      aria-hidden="true"
      className="absolute -right-0.5 -top-0.5 flex min-w-4.5 items-center justify-center rounded-full bg-sale px-1 text-[10px] font-bold leading-4 text-sale-foreground"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

/**
 * Rotating announcement bar. Each message is a fact the store can support —
 * range size, returns window, service, payment methods — never a delivery
 * promise the fulfilment side has not committed to.
 */
function AnnouncementBar() {
  const { t } = useI18n();
  const messages = [
    t("announce.assortment"),
    t("announce.returns"),
    t("announce.secure"),
    t("announce.service"),
  ];

  return (
    <div className="bg-navy-deep text-white">
      <div className="container-page flex items-center justify-center gap-x-8 py-2 text-center text-xs font-medium">
        {messages.map((message, index) => (
          <span
            key={message}
            className={cn(
              index === 0 ? "block" : "hidden",
              index === 1 && "sm:block",
              index === 2 && "lg:block",
              index === 3 && "xl:block",
            )}
          >
            {message}
          </span>
        ))}
      </div>
    </div>
  );
}

function DesktopNav() {
  const { t } = useI18n();
  const [openMenu, setOpenMenu] = useState<"categories" | "brands" | null>(null);
  const navRef = useRef<HTMLElement>(null);

  // Close the mega-menu on Escape or when focus leaves the nav entirely.
  useEffect(() => {
    if (!openMenu) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMenu(null);
    };
    const onPointerDown = (event: MouseEvent) => {
      if (!navRef.current?.contains(event.target as Node)) setOpenMenu(null);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [openMenu]);

  const linkClass =
    "whitespace-nowrap rounded-md px-2 py-2 text-sm font-semibold text-foreground transition-colors hover:text-primary xl:px-3";

  return (
    <nav
      ref={navRef}
      aria-label={t("nav.menu")}
      className="hidden lg:flex lg:items-center"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpenMenu(null);
      }}
    >
      <Link to="/winkel" className={linkClass}>
        {t("nav.shop")}
      </Link>

      <MegaMenuTrigger
        label={t("nav.categories")}
        expanded={openMenu === "categories"}
        onToggle={() => setOpenMenu((current) => (current === "categories" ? null : "categories"))}
      />

      <MegaMenuTrigger
        label={t("nav.brands")}
        expanded={openMenu === "brands"}
        onToggle={() => setOpenMenu((current) => (current === "brands" ? null : "brands"))}
      />

      <Link to="/winkel" search={{ sort: "populariteit" }} className={linkClass}>
        {t("nav.bestsellers")}
      </Link>
      <Link to="/aanbiedingen" className={cn(linkClass, "text-sale hover:text-sale")}>
        {t("nav.deals")}
      </Link>
      <Link to="/over-ons" className={cn(linkClass, "hidden xl:block")}>
        {t("nav.about")}
      </Link>

      {openMenu === "categories" ? <CategoryMegaMenu onNavigate={() => setOpenMenu(null)} /> : null}
      {openMenu === "brands" ? <BrandMegaMenu onNavigate={() => setOpenMenu(null)} /> : null}
    </nav>
  );
}

function MegaMenuTrigger({
  label,
  expanded,
  onToggle,
}: {
  label: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-expanded={expanded}
      aria-haspopup="true"
      onClick={onToggle}
      className={cn(
        "flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-2 text-sm font-semibold transition-colors xl:px-3",
        expanded ? "text-primary" : "text-foreground hover:text-primary",
      )}
    >
      {label}
      <ChevronDown
        className={cn("size-3.5 transition-transform duration-200", expanded && "rotate-180")}
        aria-hidden="true"
      />
    </button>
  );
}

function CategoryMegaMenu({ onNavigate }: { onNavigate: () => void }) {
  const { t } = useI18n();
  const themes = themedCategories();
  const bySlug = new Map(categories.map((c) => [c.slug, c]));

  return (
    <div className="absolute inset-x-0 top-full border-b border-border bg-popover shadow-pop">
      <div className="container-page grid gap-8 py-8 md:grid-cols-4">
        {themes.map((theme) => (
          <div key={theme.id}>
            <h3 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              {t(theme.titleKey)}
            </h3>
            <ul className="space-y-1">
              {theme.categorySlugs.map((slug) => {
                const category = bySlug.get(slug);
                if (!category) return null;
                return (
                  <li key={slug}>
                    <Link
                      to="/categorie/$slug"
                      params={{ slug }}
                      onClick={onNavigate}
                      className="flex items-baseline justify-between gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary hover:text-primary"
                    >
                      <span>{category.name}</span>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {categoryCounts[slug] ?? 0}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border bg-secondary/50">
        <div className="container-page py-3">
          <Link
            to="/winkel"
            onClick={onNavigate}
            className="text-sm font-semibold text-primary hover:underline"
          >
            {t("nav.viewAllProducts")} →
          </Link>
        </div>
      </div>
    </div>
  );
}

function BrandMegaMenu({ onNavigate }: { onNavigate: () => void }) {
  const { t } = useI18n();

  return (
    <div className="absolute inset-x-0 top-full border-b border-border bg-popover shadow-pop">
      <div className="container-page grid gap-4 py-8 md:grid-cols-3">
        {brands.map((brand) => (
          <Link
            key={brand.slug}
            to="/merken/$slug"
            params={{ slug: brand.slug }}
            onClick={onNavigate}
            className="group rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-lift"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-display text-lg font-extrabold text-foreground">
                {brand.name}
              </span>
              <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                {t("brand.productCount", { count: brandCounts[brand.slug] ?? 0 })}
              </span>
            </div>
            <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{brand.description}</p>
            <span className="mt-3 inline-block text-sm font-semibold text-primary group-hover:underline">
              {t("brand.viewAll", { brand: brand.name })} →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
