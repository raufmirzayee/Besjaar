/**
 * The response headers a browser needs in order to defend the shop for us.
 *
 * These are set in `src/server.ts`, on every response, rather than in a
 * host-specific file. `_headers` only means something on Cloudflare Pages and
 * Netlify; a Node deployment behind nginx and a Workers deployment both ignore
 * it, and a security header that is only present on one of three supported
 * hosts is worse than none because it reads as covered.
 *
 * Pure, so the policy can be asserted in tests without a server.
 */

export type SecurityHeaderOptions = {
  /**
   * Where the Supabase project lives. Every API call, realtime socket and
   * storage fetch goes there, so it has to be named in connect-src — and
   * naming it is what makes connect-src worth having: an injected script can
   * then not post what it reads to anywhere else.
   */
  supabaseUrl?: string | null;
  /** Serving over TLS. HSTS on a plain-HTTP origin is meaningless and is left off. */
  secure?: boolean;
  /**
   * Report violations instead of enforcing them. Useful for one deploy when
   * changing the policy, so a mistake shows up in the console rather than as a
   * blank page.
   */
  reportOnly?: boolean;
};

/** The origin part of a URL, or null. Nothing but the origin belongs in a CSP. */
function originOf(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

/**
 * Builds the Content-Security-Policy.
 *
 * About `'unsafe-inline'` in script-src, which is the weakest thing here and is
 * deliberate rather than overlooked. The page carries two inline scripts that
 * cannot be hashed or moved out: the theme and language bootstrap, which has to
 * run before first paint or the page flashes the wrong language, and the
 * streaming barrier that TanStack Start emits, whose contents differ on every
 * render because the streamed data is in it. A nonce is the right answer and
 * the framework has the plumbing for one, but React emits the bootstrap script
 * itself and a nonce that does not reach it produces a blank page — so this
 * stays until that path is verified end to end in a browser, not assumed.
 *
 * What the policy still buys with `'unsafe-inline'` present:
 *
 *   * no script from another origin can load at all;
 *   * no `eval` — `'unsafe-eval'` is absent, so a payload that builds code from
 *     a string has nowhere to run it;
 *   * `connect-src` names Supabase and nothing else, so a script that does run
 *     cannot post what it read to an address of its choosing;
 *   * `base-uri 'self'` stops an injected `<base>` from re-pointing every
 *     relative URL on the page;
 *   * `object-src 'none'` and `frame-ancestors 'none'` remove plugin content
 *     and clickjacking.
 */
export function contentSecurityPolicy(options: SecurityHeaderOptions = {}): string {
  const supabase = originOf(options.supabaseUrl);

  const connect = ["'self'", supabase, supabase?.replace(/^https:/, "wss:")].filter(
    Boolean,
  ) as string[];

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    // See the note above.
    "script-src": ["'self'", "'unsafe-inline'"],
    // Radix and the toast layer write inline styles at runtime as they
    // position and animate elements, so this cannot be tightened without
    // replacing them. Google Fonts serves the stylesheet.
    "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
    // Product photography comes from whichever supplier or channel the
    // catalogue was imported from, so the set of image hosts is not knowable
    // here. `data:` is excluded on purpose and safeImageUrl refuses it too.
    "img-src": ["'self'", "https:", "blob:"],
    "connect-src": connect,
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "frame-src": ["'none'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "worker-src": ["'self'", "blob:"],
    "manifest-src": ["'self'"],
  };

  const parts = Object.entries(directives).map(([name, values]) => `${name} ${values.join(" ")}`);
  // Only meaningful over TLS, and on plain HTTP it would break a local run.
  if (options.secure) parts.push("upgrade-insecure-requests");
  return parts.join("; ");
}

/**
 * Every security header, ready to apply.
 *
 * The CSP is only attached to HTML: a JSON response or an image has no
 * document to govern, and the header costs bytes on every one of them.
 */
export function securityHeaders(
  options: SecurityHeaderOptions & { html?: boolean } = {},
): Record<string, string> {
  const headers: Record<string, string> = {
    // Stops a browser guessing that a .txt or a JSON response is really HTML
    // or a script, which is how an uploaded file becomes a page on this origin.
    "x-content-type-options": "nosniff",
    // Full URLs leak order numbers and access tokens in the Referer header when
    // a customer follows a link off the site.
    "referrer-policy": "strict-origin-when-cross-origin",
    // frame-ancestors below is the modern rule; this is for anything that
    // still only understands the old one.
    "x-frame-options": "DENY",
    // Nothing in the shop asks for a camera, a microphone or a location.
    // `payment=(self)` stays open because a payment sheet, if one is ever
    // added, is initiated by this origin.
    "permissions-policy":
      "accelerometer=(), camera=(), display-capture=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(self), usb=()",
    // A window this page opens, and any window that opened it, get their own
    // browsing context group, so neither can reach into the other.
    "cross-origin-opener-policy": "same-origin",
    // Another origin cannot embed this page's responses as a subresource.
    "cross-origin-resource-policy": "same-origin",
  };

  if (options.secure) {
    // Two years, subdomains included. Not preloaded from here: preloading is a
    // decision about the domain that is hard to undo, and belongs to whoever
    // owns it rather than to a default.
    headers["strict-transport-security"] = "max-age=63072000; includeSubDomains";
  }

  if (options.html !== false) {
    const header = options.reportOnly
      ? "content-security-policy-report-only"
      : "content-security-policy";
    headers[header] = contentSecurityPolicy(options);
  }

  return headers;
}
