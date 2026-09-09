import { Link, useLoaderData, useNavigate } from "@tanstack/react-router";
import { Heart, Menu, Search, ShoppingBag, User } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LanguageSwitcher } from "@/components/language-switcher";
import type { CategoryRow } from "@/lib/catalog.server";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { localize } from "@/lib/content-i18n";
import { useI18n } from "@/lib/i18n";

export function SiteHeader() {
  const navigate = useNavigate();
  const { itemCount } = useCart();
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);

  // Root loader data is serialised into the HTML, so server and client render identically.
  const categories = (useLoaderData({ from: "__root__" }) as { categories: CategoryRow[] })
    .categories;

  const topLevel = (categories ?? []).filter((c) => c.parent_id === null).slice(0, 6);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    navigate({ to: "/winkel", search: { q: term || undefined, sort: undefined } });
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="bg-primary text-primary-foreground">
        <div className="container-page flex flex-wrap items-center justify-center gap-x-6 gap-y-1 py-2 text-xs">
          <span>{t("banner.freeShipping")}</span>
          <span className="hidden sm:inline">{t("banner.cutoff")}</span>
          <span className="hidden md:inline">{t("banner.returns")}</span>
        </div>
      </div>

      <div className="container-page flex items-center gap-4 py-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label={t("header.openMenu")}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetTitle className="mb-4">{t("nav.categories")}</SheetTitle>
            <nav className="flex flex-col gap-1">
              <Link
                to="/winkel"
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2 hover:bg-muted"
              >
                {t("nav.allProducts")}
              </Link>
              {(categories ?? [])
                .filter((c) => c.parent_id === null)
                .map((c) => (
                  <Link
                    key={c.id}
                    to="/categorie/$slug"
                    params={{ slug: c.slug }}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-2 py-2 hover:bg-muted"
                  >
                    {localize(c, "name", locale)}
                  </Link>
                ))}
            </nav>
          </SheetContent>
        </Sheet>

        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-2xl font-bold tracking-tight text-primary">
            Besjaar
          </span>
        </Link>

        <form onSubmit={submitSearch} className="ml-auto hidden max-w-md flex-1 md:block">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder={t("header.searchPlaceholder")}
              className="pl-9"
              aria-label={t("header.search")}
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <LanguageSwitcher />
          <Button
            variant="ghost"
            size="icon"
            asChild
            aria-label={t("header.wishlist")}
            className="hidden sm:inline-flex"
          >
            <Link to="/verlanglijst">
              <Heart className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild aria-label={t("header.account")}>
            <Link to={user ? "/account" : "/inloggen"}>
              <User className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild aria-label={t("header.cart")}>
            <Link to="/winkelwagen" className="relative">
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                  {itemCount}
                </span>
              ) : null}
            </Link>
          </Button>
        </div>
      </div>

      <nav className="hidden border-t lg:block">
        <div className="container-page flex items-center gap-6 py-2 text-sm">
          <Link to="/winkel" className="font-medium hover:text-primary">
            {t("nav.allProducts")}
          </Link>
          {topLevel.map((c) => (
            <Link
              key={c.id}
              to="/categorie/$slug"
              params={{ slug: c.slug }}
              className="text-muted-foreground hover:text-primary"
            >
              {localize(c, "name", locale)}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
