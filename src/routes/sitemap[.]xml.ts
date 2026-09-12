import { createFileRoute } from "@tanstack/react-router";

/**
 * XML sitemap.
 *
 * Only indexable pages are listed. Cart, checkout, account, wishlist, search
 * results and the admin area are excluded — they carry a noindex tag, and
 * listing them would contradict it.
 */
const STATIC_PATHS = [
  "/",
  "/winkel",
  "/categorieen",
  "/merken",
  "/aanbiedingen",
  "/over-ons",
  "/contact",
  "/veelgestelde-vragen",
  "/verzending",
  // /retouren is the customer's own returns portal and carries noindex, so it
  // is deliberately absent: listing it would contradict the tag.
  "/voorwaarden",
  "/herroeping",
  "/privacy",
  "/cookies",
];

function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, (c) =>
    c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" : c === "'" ? "&apos;" : "&quot;",
  );
}

type SitemapUrl = { loc: string; lastmod: string | null; priority: string };

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // The configured shop address, falling back to whatever host served
        // this request. Absolute URLs in a sitemap have to match the canonical
        // domain or search engines discard them.
        const { settingValue } = await import("@/lib/settings.server");
        const configured = await settingValue<string>("general.site_url");
        const origin = (configured || new URL(request.url).origin).replace(/\/$/, "");
        const { fetchCategories, fetchProducts } = await import("@/lib/catalog.server");
        const { brands } = await import("@/data/catalogue");

        const urls: SitemapUrl[] = STATIC_PATHS.map((path) => ({
          loc: `${origin}${path}`,
          lastmod: null,
          priority: path === "/" ? "1.0" : "0.7",
        }));

        urls.push(
          ...brands.map((brand) => ({
            loc: `${origin}/merken/${brand.slug}`,
            lastmod: null,
            priority: "0.6",
          })),
        );

        try {
          const [categories, products] = await Promise.all([
            fetchCategories(),
            fetchProducts({ limit: 200 }),
          ]);
          urls.push(
            ...categories.map((c) => ({
              loc: `${origin}/categorie/${c.slug}`,
              lastmod: null,
              priority: "0.8",
            })),
            ...products.map((p) => ({
              loc: `${origin}/product/${p.slug}`,
              lastmod: (p as { updated_at?: string }).updated_at ?? null,
              priority: "0.9",
            })),
          );
        } catch (error) {
          // A catalogue outage must not produce a broken sitemap; the static
          // pages are still served.
          console.error("sitemap: catalogue unavailable", error);
        }

        const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${escapeXml(u.loc)}</loc>${
        u.lastmod ? `<lastmod>${escapeXml(u.lastmod.slice(0, 10))}</lastmod>` : ""
      }<priority>${u.priority}</priority></url>`,
  )
  .join("\n")}
</urlset>`;

        return new Response(body, {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
