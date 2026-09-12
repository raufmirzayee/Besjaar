/**
 * Links and images whose address came from outside.
 *
 * React escapes text, so `{product.name}` can never become markup. It does not
 * check URLs: `<a href={value}>` renders whatever `value` says, and
 * `javascript:...` in an href is a script that runs when a visitor clicks the
 * link. The addresses this shop renders are not all its own — a supplier feed
 * fills `source_url`, a warehouse colleague or a channel import fills
 * `tracking_url` — so they are checked before they reach an attribute.
 *
 * Pure and dependency-free so the storefront, the admin and the e-mail
 * templates can all use the same rule.
 */

/** Schemes that are safe in an href. Everything else is dropped. */
const WEB_SCHEMES = new Set(["http:", "https:"]);

/**
 * An absolute http(s) URL, or null.
 *
 * Null means "do not render a link", not "render an empty one": an `<a>` with
 * no href is not a link, and an `<a href="">` reloads the page.
 */
export function safeExternalUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const text = String(value).trim();
  if (!text) return null;
  try {
    const url = new URL(text);
    return WEB_SCHEMES.has(url.protocol) ? url.toString() : null;
  } catch {
    // Not absolute. A relative link to somebody else's site is meaningless,
    // and this function is only ever asked about external addresses.
    return null;
  }
}

/**
 * An image address the page may load: absolute http(s), or a path within this
 * site.
 *
 * `<img src>` does not execute `javascript:`, so this is not the same hole as
 * an href. It still matters: a `data:` image is a way to smuggle content past
 * anything that inspects outgoing requests, and a URL with any other scheme is
 * a sign the value did not come from where it was supposed to.
 */
export function safeImageUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const text = String(value).trim();
  if (!text) return null;
  // A site-relative path. Rejecting "//host/x" matters: the browser reads that
  // as protocol-relative and fetches from another origin.
  if (text.startsWith("/") && !text.startsWith("//")) return text;
  return safeExternalUrl(text);
}
