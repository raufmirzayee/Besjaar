import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportClientError } from "../lib/error-reporting";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CookieConsent } from "@/components/cookie-consent";
import { ConsentScripts } from "@/components/consent-scripts";

import { Toaster } from "@/components/ui/sonner";
import { storeConfig } from "@/lib/store-config";
import { CartProvider } from "@/lib/cart";
import { WishlistProvider } from "@/lib/wishlist";
import { CartDrawer } from "@/components/cart-drawer";
import { RecentlyViewedProvider } from "@/lib/recently-viewed";
import { AuthProvider } from "@/lib/auth";
import { getCategories } from "@/lib/catalog.functions";
import { I18nProvider } from "@/lib/i18n";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Pagina niet gevonden</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Deze pagina bestaat niet (meer). Bekijk ons assortiment via de winkel.
        </p>
        <div className="mt-6">
          <Link
            to="/winkel"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Naar de winkel
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportClientError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Deze pagina kon niet geladen worden
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Er ging iets mis. Probeer het opnieuw of ga terug naar de homepage.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Opnieuw proberen
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Naar home
          </a>
        </div>
      </div>
    </div>
  );
}

const OG_IMAGE = `${storeConfig.origin.replace(/\/$/, "")}/images/brand/og-besjaar.png`;

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Besjaar — Slimme producten voor huis, tuin en onderweg" },
      {
        name: "description",
        content:
          "Ontdek zaklampen, douchekoppen, powerbanks en airstylers van Besjaar, RYNEX en LYNEX. Snel geleverd in NL, BE en DE.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "Besjaar — Slimme producten voor huis, tuin en onderweg" },
      { name: "twitter:title", content: "Besjaar — Slimme producten voor huis, tuin en onderweg" },
      {
        property: "og:description",
        content:
          "Ontdek zaklampen, douchekoppen, powerbanks en airstylers van Besjaar, RYNEX en LYNEX. Snel geleverd in NL, BE en DE.",
      },
      {
        name: "twitter:description",
        content:
          "Ontdek zaklampen, douchekoppen, powerbanks en airstylers van Besjaar, RYNEX en LYNEX. Snel geleverd in NL, BE en DE.",
      },
      // Served from this site. It used to point at a screenshot of a preview
      // build in a third-party bucket, so every share of the shop depended on
      // storage nobody here controls.
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  loader: async ({ context }) => {
    // Returned from the loader (not just cached) so the header renders identically
    // on server and client — loader data is serialised into the HTML.
    const categories = await context.queryClient.ensureQueryData({
      queryKey: ["categories"],
      queryFn: () => getCategories(),
      staleTime: 5 * 60 * 1000,
    });
    return { categories };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="nl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AuthProvider>
          <WishlistProvider>
            <RecentlyViewedProvider>
              <CartProvider>
                <a href="#hoofdinhoud" className="skip-link">
                  Naar de inhoud
                </a>
                <div className="flex min-h-screen flex-col">
                  <SiteHeader />
                  <main id="hoofdinhoud" tabIndex={-1} className="flex-1 outline-none">
                    {/* Required: nested routes render here. */}
                    <Outlet />
                  </main>
                  <SiteFooter />
                </div>
                <CartDrawer />
                <CookieConsent />
                <ConsentScripts />
                <Toaster position="top-center" richColors />
              </CartProvider>
            </RecentlyViewedProvider>
          </WishlistProvider>
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
