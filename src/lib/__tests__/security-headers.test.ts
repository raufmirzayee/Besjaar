import { describe, expect, it } from "vitest";

import { contentSecurityPolicy, securityHeaders } from "../security-headers";

/** Pulls one directive out of a policy string. */
function directive(policy: string, name: string): string[] {
  const part = policy.split(";").find((chunk) => chunk.trim().startsWith(`${name} `));
  return part ? part.trim().split(/\s+/).slice(1) : [];
}

describe("contentSecurityPolicy", () => {
  const policy = contentSecurityPolicy({ supabaseUrl: "https://abc123.supabase.co" });

  it("names the Supabase project in connect-src and nothing else", () => {
    // This is what stops a script that does run from posting what it read to
    // an address of the attacker's choosing.
    expect(directive(policy, "connect-src")).toEqual([
      "'self'",
      "https://abc123.supabase.co",
      "wss://abc123.supabase.co",
    ]);
  });

  it("keeps only the origin of the Supabase URL", () => {
    const withPath = contentSecurityPolicy({
      supabaseUrl: "https://abc123.supabase.co/rest/v1/?apikey=secret",
    });
    expect(directive(withPath, "connect-src")).toContain("https://abc123.supabase.co");
    expect(withPath).not.toContain("apikey");
  });

  it("falls back to self alone when no Supabase URL is configured", () => {
    expect(directive(contentSecurityPolicy({}), "connect-src")).toEqual(["'self'"]);
    expect(directive(contentSecurityPolicy({ supabaseUrl: "not a url" }), "connect-src")).toEqual([
      "'self'",
    ]);
  });

  it("never allows eval", () => {
    // 'unsafe-inline' is present and documented; 'unsafe-eval' is the line that
    // does not move, because it is what a payload needs to build code from a
    // string it controls.
    expect(policy).not.toContain("unsafe-eval");
  });

  it("closes the directives that have no legitimate use here", () => {
    expect(directive(policy, "object-src")).toEqual(["'none'"]);
    expect(directive(policy, "frame-ancestors")).toEqual(["'none'"]);
    expect(directive(policy, "frame-src")).toEqual(["'none'"]);
    // An injected <base> would re-point every relative URL on the page.
    expect(directive(policy, "base-uri")).toEqual(["'self'"]);
    expect(directive(policy, "form-action")).toEqual(["'self'"]);
  });

  it("does not allow a data: image", () => {
    // safeImageUrl refuses these too; a data: image is a way to carry content
    // past anything that inspects outgoing requests.
    expect(directive(policy, "img-src")).not.toContain("data:");
  });

  it("only upgrades insecure requests when serving over TLS", () => {
    expect(contentSecurityPolicy({ secure: true })).toContain("upgrade-insecure-requests");
    // On a plain-HTTP local run that directive breaks every asset.
    expect(contentSecurityPolicy({ secure: false })).not.toContain("upgrade-insecure-requests");
  });
});

describe("securityHeaders", () => {
  it("sets the headers a browser acts on", () => {
    const headers = securityHeaders({ html: true, supabaseUrl: "https://abc.supabase.co" });
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["cross-origin-opener-policy"]).toBe("same-origin");
    expect(headers["permissions-policy"]).toContain("camera=()");
    expect(headers["content-security-policy"]).toBeTruthy();
  });

  it("leaves the referrer policy strict, because order URLs carry a token", () => {
    // /bestelling/BES-10001?token=… in a Referer header would hand a customer's
    // order to whatever site they clicked through to.
    expect(securityHeaders({})["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  });

  it("sends HSTS only over TLS", () => {
    expect(securityHeaders({ secure: true })["strict-transport-security"]).toContain(
      "max-age=63072000",
    );
    // Sending it from a plain-HTTP local run would pin localhost to https.
    expect(securityHeaders({ secure: false })["strict-transport-security"]).toBeUndefined();
  });

  it("does not preload HSTS", () => {
    // Preloading is hard to undo and is a decision about the domain, not a
    // default this code gets to make.
    expect(securityHeaders({ secure: true })["strict-transport-security"]).not.toContain("preload");
  });

  it("only attaches a CSP to HTML", () => {
    // A JSON response or an image has no document to govern, and the header
    // costs bytes on every one of them.
    expect(securityHeaders({ html: false })["content-security-policy"]).toBeUndefined();
    expect(securityHeaders({ html: false })["x-content-type-options"]).toBe("nosniff");
  });

  it("can report instead of enforce", () => {
    const headers = securityHeaders({ html: true, reportOnly: true });
    expect(headers["content-security-policy-report-only"]).toBeTruthy();
    expect(headers["content-security-policy"]).toBeUndefined();
  });
});
