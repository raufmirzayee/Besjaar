import { describe, expect, it } from "vitest";

import {
  callerIdentity,
  clientIpFromHeaders,
  describeProxyTrust,
  ipBucket,
  resolveProxyTrust,
  type HeaderLike,
} from "../caller-identity";

/** A `Headers`-shaped double; the real one lowercases names, so this does too. */
function headersOf(values: Record<string, string>): HeaderLike {
  const map = new Map(Object.entries(values).map(([key, value]) => [key.toLowerCase(), value]));
  return { get: (name: string) => map.get(name.toLowerCase()) ?? null };
}

describe("resolveProxyTrust", () => {
  it("defaults to Cloudflare, which is what the shop deploys behind", () => {
    expect(resolveProxyTrust(undefined)).toEqual({ kind: "platform", platform: "cloudflare" });
    expect(resolveProxyTrust("")).toEqual({ kind: "platform", platform: "cloudflare" });
    expect(resolveProxyTrust("   ")).toEqual({ kind: "platform", platform: "cloudflare" });
  });

  it("reads the platform names case-insensitively", () => {
    expect(resolveProxyTrust("Vercel")).toEqual({ kind: "platform", platform: "vercel" });
    expect(resolveProxyTrust(" NETLIFY ")).toEqual({ kind: "platform", platform: "netlify" });
  });

  it("reads a hop count for a generic reverse proxy", () => {
    expect(resolveProxyTrust("1")).toEqual({ kind: "hops", hops: 1 });
    expect(resolveProxyTrust("3")).toEqual({ kind: "hops", hops: 3 });
  });

  it("trusts nothing when the setting is unreadable", () => {
    // A typo must not silently fall back to trusting a client header.
    expect(resolveProxyTrust("cloudfare")).toEqual({ kind: "none" });
    expect(resolveProxyTrust("true")).toEqual({ kind: "none" });
    expect(resolveProxyTrust("99")).toEqual({ kind: "none" });
    expect(resolveProxyTrust("-1")).toEqual({ kind: "none" });
    expect(resolveProxyTrust("none")).toEqual({ kind: "none" });
  });

  it("describes itself for an operator message", () => {
    expect(describeProxyTrust({ kind: "platform", platform: "vercel" })).toBe("vercel");
    expect(describeProxyTrust({ kind: "hops", hops: 1 })).toBe("1 proxy hop");
    expect(describeProxyTrust({ kind: "hops", hops: 2 })).toBe("2 proxy hops");
    expect(describeProxyTrust({ kind: "none" })).toContain("none");
  });
});

describe("ipBucket", () => {
  it("keeps an IPv4 address whole", () => {
    expect(ipBucket("203.0.113.7")).toBe("v4:203.0.113.7");
    expect(ipBucket("  203.0.113.7  ")).toBe("v4:203.0.113.7");
  });

  it("refuses a second spelling of the same IPv4 address", () => {
    // 203.0.113.07 and 203.0.113.7 are the same host; two buckets for one
    // caller is two budgets.
    expect(ipBucket("203.0.113.07")).toBeNull();
    expect(ipBucket("203.0.113.256")).toBeNull();
    expect(ipBucket("203.0.113")).toBeNull();
    expect(ipBucket("203.0.113.7.1")).toBeNull();
  });

  it("collapses IPv6 to its /64", () => {
    // A single host is routinely handed a whole /64 and can pick a fresh
    // address per request, so counting full addresses would limit nobody.
    expect(ipBucket("2001:db8:85a3:8d3:1319:8a2e:370:7348")).toBe("v6:2001:db8:85a3:8d3::/64");
    expect(ipBucket("2001:db8:85a3:8d3:ffff:ffff:ffff:ffff")).toBe("v6:2001:db8:85a3:8d3::/64");
  });

  it("expands every compressed spelling to the same bucket", () => {
    expect(ipBucket("2001:db8::1")).toBe("v6:2001:db8:0:0::/64");
    expect(ipBucket("2001:0db8:0000:0000:0000:0000:0000:0001")).toBe("v6:2001:db8:0:0::/64");
    expect(ipBucket("::1")).toBe("v6:0:0:0:0::/64");
  });

  it("treats an IPv4-mapped address as the IPv4 caller", () => {
    // Otherwise one host spends two budgets by switching notation.
    expect(ipBucket("::ffff:203.0.113.7")).toBe("v4:203.0.113.7");
    expect(ipBucket("::ffff:cb00:7107")).toBe("v4:203.0.113.7");
  });

  it("drops a zone index, which names an interface and not a caller", () => {
    expect(ipBucket("fe80::1%eth0")).toBe("v6:fe80:0:0:0::/64");
  });

  it("refuses anything that is not an address", () => {
    // The bucket name must never be attacker-chosen text.
    expect(ipBucket("")).toBeNull();
    expect(ipBucket("unknown")).toBeNull();
    expect(ipBucket("1.2.3.4, 5.6.7.8")).toBeNull();
    expect(ipBucket("2001:db8::1::2")).toBeNull();
    expect(ipBucket("2001:db8:85a3:8d3:1319:8a2e:370")).toBeNull();
    expect(ipBucket("gggg::1")).toBeNull();
    expect(ipBucket("x".repeat(200))).toBeNull();
    expect(ipBucket("'; drop table rate_limits; --")).toBeNull();
  });
});

describe("clientIpFromHeaders", () => {
  const cloudflare = { kind: "platform", platform: "cloudflare" } as const;

  it("reads the header Cloudflare overwrites", () => {
    const headers = headersOf({ "cf-connecting-ip": "203.0.113.7" });
    expect(clientIpFromHeaders(headers, cloudflare)).toBe("203.0.113.7");
  });

  it("ignores x-forwarded-for entirely under Cloudflare", () => {
    // This is the bug the whole module exists for: each hop *appends* to
    // x-forwarded-for, so its leftmost entry is whatever the caller typed.
    const headers = headersOf({ "x-forwarded-for": "10.0.0.1, 203.0.113.7" });
    expect(clientIpFromHeaders(headers, cloudflare)).toBeNull();
  });

  it("does not let a forged cf-connecting-ip carry a list", () => {
    // The real header holds one address. More than one means it was not
    // written by the edge.
    const headers = headersOf({ "cf-connecting-ip": "1.1.1.1, 203.0.113.7" });
    expect(clientIpFromHeaders(headers, cloudflare)).toBeNull();
  });

  it("refuses a value that is not an address", () => {
    const headers = headersOf({ "cf-connecting-ip": "not-an-ip" });
    expect(clientIpFromHeaders(headers, cloudflare)).toBeNull();
  });

  it("falls back to the rightmost forwarded entry on Vercel", () => {
    const trust = { kind: "platform", platform: "vercel" } as const;
    expect(clientIpFromHeaders(headersOf({ "x-vercel-forwarded-for": "203.0.113.7" }), trust)).toBe(
      "203.0.113.7",
    );
    expect(
      clientIpFromHeaders(headersOf({ "x-forwarded-for": "9.9.9.9, 203.0.113.7" }), trust),
    ).toBe("203.0.113.7");
  });

  it("reads the header Netlify sets", () => {
    const trust = { kind: "platform", platform: "netlify" } as const;
    expect(
      clientIpFromHeaders(headersOf({ "x-nf-client-connection-ip": "203.0.113.7" }), trust),
    ).toBe("203.0.113.7");
  });

  it("counts hops from the right, where the trusted proxies wrote", () => {
    const forwarded = "198.51.100.1, 203.0.113.7, 10.0.0.9";
    expect(
      clientIpFromHeaders(headersOf({ "x-forwarded-for": forwarded }), { kind: "hops", hops: 1 }),
    ).toBe("10.0.0.9");
    expect(
      clientIpFromHeaders(headersOf({ "x-forwarded-for": forwarded }), { kind: "hops", hops: 2 }),
    ).toBe("203.0.113.7");
  });

  it("gives up when the list is shorter than the configured hops", () => {
    // Fewer entries than trusted proxies means the header did not travel the
    // path the setting describes; nothing on it is worth reading.
    const headers = headersOf({ "x-forwarded-for": "203.0.113.7" });
    expect(clientIpFromHeaders(headers, { kind: "hops", hops: 2 })).toBeNull();
  });

  it("cannot be lengthened into trusting a client entry", () => {
    // One real proxy in front, and a caller who pads the header hoping their
    // own value lands on the trusted index. It never does: the proxy's own
    // entry is always appended last.
    const headers = headersOf({ "x-forwarded-for": "1.1.1.1, 2.2.2.2, 3.3.3.3, 203.0.113.7" });
    expect(clientIpFromHeaders(headers, { kind: "hops", hops: 1 })).toBe("203.0.113.7");
  });

  it("trusts no header at all when told there is no proxy", () => {
    const headers = headersOf({
      "cf-connecting-ip": "203.0.113.7",
      "x-forwarded-for": "203.0.113.7",
      "x-real-ip": "203.0.113.7",
    });
    expect(clientIpFromHeaders(headers, { kind: "none" })).toBeNull();
  });
});

describe("callerIdentity", () => {
  const cloudflare = { kind: "platform", platform: "cloudflare" } as const;

  it("keys on the account when there is one", () => {
    // A signed-in caller cannot shed a limit by moving address.
    const headers = headersOf({ "cf-connecting-ip": "203.0.113.7" });
    expect(callerIdentity(headers, cloudflare, "user-1")).toEqual({
      key: "user:user-1",
      trusted: true,
    });
  });

  it("keys on the address for an anonymous caller", () => {
    const headers = headersOf({ "cf-connecting-ip": "203.0.113.7" });
    expect(callerIdentity(headers, cloudflare)).toEqual({
      key: "v4:203.0.113.7",
      trusted: true,
    });
  });

  it("reports untrusted rather than guessing", () => {
    // The caller stripped every header, or the deployment is not behind what
    // TRUSTED_PROXY says. Either way the limiter is told it does not know.
    const headers = headersOf({ "x-forwarded-for": "203.0.113.7" });
    expect(callerIdentity(headers, cloudflare)).toEqual({
      key: "shared:unidentified",
      trusted: false,
    });
  });

  it("puts every spoofed header into the one shared bucket", () => {
    // The attack: a fresh x-forwarded-for per request to get a fresh counter.
    // All of these land on the same key, so they spend one budget between them.
    const keys = new Set(
      ["1.1.1.1", "2.2.2.2", "3.3.3.3", "4.4.4.4"].map(
        (ip) => callerIdentity(headersOf({ "x-forwarded-for": ip }), cloudflare).key,
      ),
    );
    expect(keys.size).toBe(1);
  });
});
