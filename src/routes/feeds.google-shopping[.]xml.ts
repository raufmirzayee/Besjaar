import { createFileRoute } from "@tanstack/react-router";

/**
 * Google Merchant Center product feed (RSS 2.0 with the g: namespace).
 *
 * Point Merchant Center at https://<your-domain>/feeds/google-shopping.xml and
 * schedule a daily fetch. The same feed is accepted by Facebook/Meta catalogues
 * and most comparison-shopping engines.
 *
 * Two deliberate omissions:
 *
 * - `g:gtin` is sent only for a product that actually has a barcode. The
 *   bundled catalogue carries none, so those items declare
 *   `g:identifier_exists` as "no" instead — a wrong GTIN gets the whole
 *   Merchant Center account suspended, and a missing one only costs the item
 *   some matching. The two are mutually exclusive: declaring "no" alongside a
 *   real GTIN is itself a feed error.
 * - No `g:shipping`. Shipping here has a free-delivery threshold, which the
 *   feed format cannot express per item; configure the rates in Merchant
 *   Center instead, where thresholds are supported.
 */

function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, (c) =>
    c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" : c === "'" ? "&apos;" : "&quot;",
  );
}

/** Google wants "12.34 EUR" with a dot, not the Dutch display format. */
function feedPrice(value: number): string {
  return `${value.toFixed(2)} EUR`;
}

/** Feed text has a length cap and must not carry markup. */
function plain(value: string, max: number): string {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

export const Route = createFileRoute("/feeds/google-shopping.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // The configured shop address, falling back to whatever host served
        // this request. Absolute URLs in a sitemap have to match the canonical
        // domain or search engines discard them.
        const { settingValue } = await import("@/lib/settings.server");
        const configured = await settingValue<string>("general.site_url");
        const origin = (configured || new URL(request.url).origin).replace(/\/$/, "");
        const { fetchProducts } = await import("@/lib/catalog.server");
        const { storeConfig } = await import("@/lib/store-config");

        const products = await fetchProducts({});

        const items = products
          .filter((product) => product.image_url && product.regular_price > 0)
          .map((product) => {
            const price = product.regular_price;
            // Only a genuine former price becomes a sale; nothing is discounted
            // into existence for the feed.
            const sale =
              product.sale_price !== null && product.sale_price < price ? product.sale_price : null;
            const inStock = product.stock_quantity > 0;
            const description = product.short_description ?? product.full_title ?? product.name;
            // Google accepts GTIN-8, -12, -13 and -14. Anything else in the
            // column is a supplier code that happens to live there, and
            // sending it as a barcode is worse than sending nothing.
            const ean = (product.ean ?? "").replace(/\D/g, "");
            const gtin = [8, 12, 13, 14].includes(ean.length) ? ean : null;

            const fields = [
              `<g:id>${escapeXml(product.product_id ?? product.slug)}</g:id>`,
              `<g:title>${escapeXml(plain(product.name, 150))}</g:title>`,
              `<g:description>${escapeXml(plain(description, 5000))}</g:description>`,
              `<g:link>${escapeXml(`${origin}/product/${product.slug}`)}</g:link>`,
              `<g:image_link>${escapeXml(product.image_url!)}</g:image_link>`,
              `<g:availability>${inStock ? "in_stock" : "out_of_stock"}</g:availability>`,
              `<g:condition>new</g:condition>`,
              // g:price is the list price and g:sale_price the current one.
              // Where the catalogue has no former price, only g:price is sent.
              `<g:price>${feedPrice(price)}</g:price>`,
              sale !== null ? `<g:sale_price>${feedPrice(sale)}</g:sale_price>` : "",
              product.brand ? `<g:brand>${escapeXml(product.brand)}</g:brand>` : "",
              // A GTIN when the product has one, and the honest declaration
              // when it does not. This used to be hardcoded to "no", which was
              // right for the bundled catalogue and would have quietly stayed
              // wrong once real barcodes were imported.
              gtin
                ? `<g:gtin>${escapeXml(gtin)}</g:gtin>`
                : `<g:identifier_exists>no</g:identifier_exists>`,
              product.category
                ? `<g:product_type>${escapeXml(product.category)}</g:product_type>`
                : "",
              `<g:item_group_id>${escapeXml(product.category_slug ?? "besjaar")}</g:item_group_id>`,
            ].filter(Boolean);

            return `  <item>\n    ${fields.join("\n    ")}\n  </item>`;
          })
          .join("\n");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
  <title>${escapeXml(storeConfig.name)}</title>
  <link>${escapeXml(origin)}</link>
  <description>${escapeXml(`Productfeed van ${storeConfig.name}`)}</description>
${items}
</channel>
</rss>`;

        return new Response(xml, {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            // Merchant Center fetches daily; an hour of caching is plenty and
            // keeps a crawl from hammering the database.
            "cache-control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
