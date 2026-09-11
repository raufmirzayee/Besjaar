/**
 * Who is calling — for rate limiting only.
 *
 * Every header that carries a client address is written by whoever is in front
 * of the application, and "whoever is in front" includes the caller when the
 * application is reachable directly. `x-forwarded-for` in particular is a list
 * that each hop *appends* to, so the leftmost entry is the one value on the
 * whole line that the client chose. Reading that entry as the caller's address
 * hands every attacker an unlimited supply of rate-limit buckets: send a new
 * value per request and the limiter never counts past one.
 *
 * So nothing here is trusted by default. The operator says what sits in front
 * of the shop (`TRUSTED_PROXY`) and only the header that hop is known to
 * overwrite is read. When no trustworthy address can be established the caller
 * is reported as untrusted rather than guessed at, and the limiter degrades to
 * a coarse shared bucket instead of pretending to know who this is.
 *
 * None of this is an authorisation input and it must never become one. It
 * decides which counter a request spends, nothing else.
 */

export type ProxyTrust =
  | { kind: "platform"; platform: "cloudflare" | "vercel" | "netlify" }
  | { kind: "hops"; hops: number }
  | { kind: "none" };

/** Anything with a case-insensitive `get`: a real `Headers`, or a test double. */
export type HeaderLike = { get(name: string): string | null | undefined };

export type CallerIdentity = {
  /** The bucket fragment. Never attacker-controlled text. */
  key: string;
  /**
   * Whether `key` identifies this caller specifically. False means the address
   * could not be established and the caller shares a bucket with every other
   * such caller.
   */
  trusted: boolean;
};

/**
 * The header each platform sets itself.
 *
 * These are overwritten at the edge, not appended to, so a value the client
 * sent under the same name never survives to the application.
 */
const PLATFORM_HEADER: Record<"cloudflare" | "vercel" | "netlify", string> = {
  cloudflare: "cf-connecting-ip",
  vercel: "x-vercel-forwarded-for",
  netlify: "x-nf-client-connection-ip",
};

/**
 * Reads `TRUSTED_PROXY`.
 *
 * Accepts a platform name, a hop count for a generic reverse proxy, or `none`.
 * Defaults to Cloudflare, which is what this shop deploys behind; on any other
 * host the default yields no address, which is the safe direction to be wrong
 * in — over-limiting rather than not limiting at all.
 */
export function resolveProxyTrust(raw: string | undefined | null): ProxyTrust {
  const value = (raw ?? "").trim().toLowerCase();
  if (!value) return { kind: "platform", platform: "cloudflare" };
  if (value === "cloudflare" || value === "vercel" || value === "netlify") {
    return { kind: "platform", platform: value };
  }
  if (value === "none" || value === "direct" || value === "0") return { kind: "none" };
  if (/^\d{1,2}$/.test(value)) {
    const hops = Number(value);
    if (hops >= 1 && hops <= 10) return { kind: "hops", hops };
  }
  // An unreadable setting is a misconfiguration, not a licence to trust
  // headers. Trust nothing until it is corrected.
  return { kind: "none" };
}

/** Human-readable description of a setting, for operator-facing messages. */
export function describeProxyTrust(trust: ProxyTrust): string {
  if (trust.kind === "platform") return trust.platform;
  if (trust.kind === "hops") return `${trust.hops} proxy hop${trust.hops === 1 ? "" : "s"}`;
  return "none (no forwarded header is trusted)";
}

const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

/**
 * Strict IPv4.
 *
 * Leading zeros are refused deliberately: `1.2.3.4` and `1.2.3.04` are the same
 * host, and accepting both spellings would be two buckets for one caller.
 */
function parseIpv4(value: string): number[] | null {
  const match = IPV4.exec(value);
  if (!match) return null;
  const parts: number[] = [];
  for (const raw of match.slice(1)) {
    if (raw.length > 1 && raw.startsWith("0")) return null;
    const octet = Number(raw);
    if (!Number.isInteger(octet) || octet > 255) return null;
    parts.push(octet);
  }
  return parts;
}

/** Expands any IPv6 spelling to its eight 16-bit groups, or null if invalid. */
function parseIpv6(value: string): number[] | null {
  // A zone index (`fe80::1%eth0`) names a local interface, not the caller.
  const zone = value.indexOf("%");
  let text = zone >= 0 ? value.slice(0, zone) : value;
  if (!text.includes(":")) return null;

  // Trailing dotted-quad form: `::ffff:192.0.2.1`, `64:ff9b::192.0.2.1`.
  const lastColon = text.lastIndexOf(":");
  const tail = text.slice(lastColon + 1);
  if (tail.includes(".")) {
    const quad = parseIpv4(tail);
    if (!quad) return null;
    const hi = ((quad[0] << 8) | quad[1]).toString(16);
    const lo = ((quad[2] << 8) | quad[3]).toString(16);
    text = `${text.slice(0, lastColon + 1)}${hi}:${lo}`;
  }

  const halves = text.split("::");
  if (halves.length > 2) return null;
  const toGroups = (part: string): number[] | null => {
    if (!part) return [];
    const groups: number[] = [];
    for (const piece of part.split(":")) {
      if (!/^[0-9a-fA-F]{1,4}$/.test(piece)) return null;
      groups.push(parseInt(piece, 16));
    }
    return groups;
  };

  const head = toGroups(halves[0]);
  if (!head) return null;
  if (halves.length === 1) return head.length === 8 ? head : null;

  const rest = toGroups(halves[1]);
  if (!rest) return null;
  const missing = 8 - head.length - rest.length;
  // `::` must stand for at least one group, otherwise it is a plain `:`.
  if (missing < 1) return null;
  return [...head, ...Array<number>(missing).fill(0), ...rest];
}

/**
 * A canonical bucket name for an address, or null if this is not an address.
 *
 * IPv6 collapses to its /64 prefix. A single residential or hosted IPv6 host is
 * routinely handed a whole /64 and can pick a fresh address out of it per
 * request, so counting full addresses would limit nobody.
 */
export function ipBucket(value: string): string | null {
  const text = value.trim();
  if (!text || text.length > 45) return null;

  const v4 = parseIpv4(text);
  if (v4) return `v4:${v4.join(".")}`;

  const v6 = parseIpv6(text);
  if (!v6) return null;

  // IPv4-mapped (`::ffff:a.b.c.d`) is an IPv4 caller; bucket it as one so the
  // same host cannot spend two budgets by switching notation.
  if (v6.slice(0, 5).every((group) => group === 0) && v6[5] === 0xffff) {
    const octets = [v6[6] >> 8, v6[6] & 0xff, v6[7] >> 8, v6[7] & 0xff];
    return `v4:${octets.join(".")}`;
  }

  const prefix = v6
    .slice(0, 4)
    .map((group) => group.toString(16))
    .join(":");
  return `v6:${prefix}::/64`;
}

/** The rightmost `hops`-th entry of an `x-forwarded-for` list. */
function forwardedEntry(headers: HeaderLike, hops: number): string | null {
  const raw = headers.get("x-forwarded-for");
  if (!raw) return null;
  const entries = raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  // Each hop appends, so the entry written by the nearest trusted proxy is at
  // the end. With two trusted hops it is the one before that, and so on.
  // Anything further left than the trusted hops reach was written by the
  // client and is worthless.
  const index = entries.length - hops;
  if (index < 0 || index >= entries.length) return null;
  return entries[index];
}

/**
 * The caller's address, or null when it cannot be established.
 *
 * Null is a real answer, not an error: it means the headers present prove
 * nothing about who this is.
 */
export function clientIpFromHeaders(headers: HeaderLike, trust: ProxyTrust): string | null {
  if (trust.kind === "none") return null;

  if (trust.kind === "platform") {
    const candidate = headers.get(PLATFORM_HEADER[trust.platform]);
    // Vercel appends to `x-forwarded-for` the way any proxy does, so the
    // rightmost entry is the address its edge observed.
    const fallback = !candidate && trust.platform === "vercel" ? forwardedEntry(headers, 1) : null;
    const value = (candidate ?? fallback)?.trim();
    // The platform header carries exactly one address. Multiple values mean
    // this is not the header the platform wrote.
    if (!value || value.includes(",")) return null;
    return ipBucket(value) ? value : null;
  }

  const entry = forwardedEntry(headers, trust.hops);
  if (!entry) return null;
  return ipBucket(entry) ? entry : null;
}

/**
 * The bucket fragment for a request.
 *
 * `userId` wins when present: a signed-in caller is identified by their account
 * and cannot shed a limit by moving address. Otherwise the trusted address is
 * used, and failing that the caller joins the shared bucket.
 */
export function callerIdentity(
  headers: HeaderLike,
  trust: ProxyTrust,
  userId?: string | null,
): CallerIdentity {
  if (userId) return { key: `user:${userId}`, trusted: true };
  const ip = clientIpFromHeaders(headers, trust);
  const bucket = ip ? ipBucket(ip) : null;
  if (bucket) return { key: bucket, trusted: true };
  return { key: "shared:unidentified", trusted: false };
}
