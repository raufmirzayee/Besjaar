import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportClientError } from "../lib/error-reporting";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CookieConsent } from "@/components/cookie-consent";
import { ConsentScripts } from "@/components/consent-scripts";

import { Toaster } from "@/components/ui/sonner";
import { NotFound } from "@/components/not-found";
import { storeConfig } from "@/lib/store-config";
import { CartProvider } from "@/lib/cart";
import { WishlistProvider } from "@/lib/wishlist";
import { CartDrawer } from "@/components/cart-drawer";
import { RecentlyViewedProvider } from "@/lib/recently-viewed";
import { AuthProvider } from "@/lib/auth";
import { getCategories } from "@/lib/catalog.functions";
import { getInitialLocale } from "@/lib/i18n.functions";
import { localeFromHead } from "@/lib/seo";
import { pageSeo } from "@/lib/page-seo";
import { I18nProvider, localeFromRouterState, translateOutsideProvider } from "@/lib/i18n";

/**
 * The root error boundary.
 *
 * Copy comes from `translateOutsideProvider`, not `useI18n`: this component
 * replaces the one that renders `I18nProvider`, so the hook would throw on top
 * of the error it is here to report. A French visitor reading a Dutch error
 * page is a small failure next to that, but it is still a failure, and this
 * costs nothing to get right.
 */
function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  // The router context carries the locale the server detected. Reading it here
  // rather than off the document means the error page is already in the right
  // language in the first response, not after hydration.
  const locale = localeFromRouterState(router.state);
  const tr = (key: Parameters<typeof translateOutsideProvider>[0]) =>
    translateOutsideProvider(key, locale);
  useEffect(() => {
    reportClientError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {tr("error.title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{tr("error.text")}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {tr("error.retry")}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {tr("error.home")}
          </a>
        </div>
      </div>
    </div>
  );
}

const OG_IMAGE = `${storeConfig.origin.replace(/\/$/, "")}/images/brand/og-besjaar.png`;

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: (ctx) => {
    // The root supplies the defaults every route inherits and the fallback for
    // any route that sets none of its own. Localised like the rest: leaving
    // this Dutch meant a German visitor's browser tab and every shared link
    // stayed Dutch, however well the page itself translated.
    const locale = localeFromHead(ctx) ?? "nl";
    const copy = pageSeo("home", locale);
    const title = copy.title;
    const description = copy.description;

    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title },
        { name: "description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { property: "og:title", content: title },
        { name: "twitter:title", content: title },
        { property: "og:description", content: description },
        { name: "twitter:description", content: description },
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
    };
  },
  beforeLoad: async () => {
    // Decided on the server from the CDN country header and Accept-Language,
    // and serialised into the HTML with the rest of the router state — so the
    // first paint is already in the visitor's language rather than flashing
    // Dutch. It lands in the route context, which is the one place both the
    // component tree and every route's head() can read.
    const { locale } = await getInitialLocale();
    return { locale };
  },
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
  notFoundComponent: NotFound,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  // `lang` is what a screen reader picks a voice from and what a search engine
  // reads the page as, so it has to be right in the served HTML — correcting
  // it from an effect after hydration is already too late for both. The root
  // match carries the locale that beforeLoad detected, which is available here
  // on the server as well as in the browser.
  const locale = useRouterState({
    select: (state) => (state.matches[0]?.context as { locale?: string } | undefined)?.locale,
  });

  return (
    <html lang={locale ?? "nl"}>
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
  const { queryClient, locale } = Route.useRouteContext();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isAdminArea = pathname === "/beheer" || pathname.startsWith("/beheer/");

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider initialLocale={locale}>
        <AuthProvider>
          <WishlistProvider>
            <RecentlyViewedProvider>
              <CartProvider>
                <a href="#hoofdinhoud" className="skip-link">
                  {translateOutsideProvider("common.skipToContent", locale)}
                </a>
                {isAdminArea ? (
                  // The backoffice brings its own shell, and the staff sign-in
                  // is deliberately bare. Wrapping either in the shop's header
                  // and footer would put a cart and a catalogue menu on a
                  // screen that has no business showing them.
                  <main id="hoofdinhoud" tabIndex={-1} className="min-h-screen outline-none">
                    <Outlet />
                  </main>
                ) : (
                  <div className="flex min-h-screen flex-col">
                    <SiteHeader />
                    <main id="hoofdinhoud" tabIndex={-1} className="flex-1 outline-none">
                      {/* Required: nested routes render here. */}
                      <Outlet />
                    </main>
                    <SiteFooter />
                  </div>
                )}
                {isAdminArea ? null : (
                  <>
                    <CartDrawer />
                    <CookieConsent />
                    <ConsentScripts />
                  </>
                )}
                <Toaster position="top-center" richColors />
              </CartProvider>
            </RecentlyViewedProvider>
          </WishlistProvider>
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
