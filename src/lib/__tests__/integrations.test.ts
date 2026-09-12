import { describe, expect, it } from "vitest";

import { classifyKey, keyMatchesMode } from "@/lib/integrations/mollie.server";
import { senderAddress, senderDomain } from "@/lib/integrations/resend.server";
import { endpointFor } from "@/lib/integrations/deepl.server";
import { maskSecret } from "@/lib/secret-store.server";
import { describeFailure } from "@/lib/integrations/types";

/**
 * The integration helpers that decide something consequential on their own,
 * away from a network call: which environment a payment key belongs to, how
 * much of a credential is safe to show, and how much of a failure is safe to
 * repeat to a browser.
 */

describe("Mollie keys and modes", () => {
  it("reads the environment off the prefix", () => {
    expect(classifyKey("live_abc123")).toBe("live");
    expect(classifyKey("test_abc123")).toBe("test");
    expect(classifyKey("abc123")).toBe("unknown");
    expect(classifyKey(undefined)).toBe("absent");
    expect(classifyKey("   ")).toBe("absent");
  });

  it("refuses a test key in live mode", () => {
    // The failure where customers complete a checkout that never charges them,
    // and the shop finds out at the end of the month.
    const result = keyMatchesMode("test", "live");
    expect(result.ok).toBe(false);
    expect(result.reason).not.toBeNull();
  });

  it("refuses a live key in test mode", () => {
    // The mirror failure, and the worse one: a staging run charging real cards.
    // Worth refusing rather than warning about, which is why this is symmetric.
    const result = keyMatchesMode("live", "test");
    expect(result.ok).toBe(false);
    expect(result.reason).not.toBeNull();
  });

  it("refuses a key whose prefix means nothing", () => {
    expect(keyMatchesMode("unknown", "test").ok).toBe(false);
    expect(keyMatchesMode("absent", "test").ok).toBe(false);
  });

  it("accepts the two combinations that are actually right", () => {
    expect(keyMatchesMode("live", "live").ok).toBe(true);
    expect(keyMatchesMode("test", "test").ok).toBe(true);
  });

  it("does not care what the key is while checkout is off", () => {
    // Nothing can be charged, so nothing can be charged wrongly.
    expect(keyMatchesMode("absent", "disabled").ok).toBe(true);
    expect(keyMatchesMode("test", "disabled").ok).toBe(true);
  });
});

describe("masking a credential", () => {
  it("shows a prefix and the last four, and nothing between", () => {
    const masked = maskSecret("live_abcdefghijklmnop1234");
    expect(masked).toContain("1234");
    expect(masked).not.toContain("abcdefghijklmnop");
    expect(masked).toMatch(/•/);
  });

  it("shows nothing at all for a short value", () => {
    // Four of twelve characters is a quarter of the secret. A hint is only a
    // hint when the thing it hints at is long enough for it not to matter.
    expect(maskSecret("short")).toBeNull();
    expect(maskSecret("elevenchars")).toBeNull();
  });

  it("never returns the whole value", () => {
    for (const value of ["live_0123456789abcdef", "re_averylongresendkeyvalue", "x".repeat(60)]) {
      expect(maskSecret(value)).not.toBe(value);
    }
  });
});

describe("sender addresses", () => {
  it("pulls the address out of a display-name form", () => {
    expect(senderAddress("Besjaar <orders@besjaar.nl>")).toBe("orders@besjaar.nl");
    expect(senderAddress("orders@besjaar.nl")).toBe("orders@besjaar.nl");
    expect(senderDomain("Besjaar <orders@Besjaar.NL>")).toBe("besjaar.nl");
  });

  it("returns nothing for something that is not an address", () => {
    expect(senderDomain("Besjaar")).toBeNull();
  });
});

describe("DeepL hosts", () => {
  it("sends a free key to the free host whatever the setting says", () => {
    // The single commonest DeepL mistake, and the error it produces reads like
    // an invalid key, which sends people hunting for the wrong problem.
    expect(endpointFor("abc:fx", "pro")).toBe("https://api-free.deepl.com");
    expect(endpointFor("abc:fx", "free")).toBe("https://api-free.deepl.com");
  });

  it("follows the setting for a key with no marker", () => {
    expect(endpointFor("abc", "pro")).toBe("https://api.deepl.com");
    expect(endpointFor("abc", "free")).toBe("https://api-free.deepl.com");
  });
});

describe("what a failure is allowed to say", () => {
  it("turns an authentication failure into advice", () => {
    const message = describeFailure(new Error("HTTP 401 Unauthorized"), "test");
    expect(message).toEqual({ key: "admin.conn.err.auth", params: undefined });
  });

  it("never returns the original error text", () => {
    // The thing that must not reach a browser: a response body, a header, a
    // stack trace, or a credential that found its way into an error string.
    const secrets = [
      "live_supersecretkey",
      "Bearer live_supersecretkey",
      "at Object.<anonymous> (/srv/app/secret-store.server.ts:42)",
    ];
    for (const raw of secrets) {
      const message = describeFailure(new Error(raw), "test");
      expect("key" in message).toBe(true);
      expect(JSON.stringify(message)).not.toContain("supersecretkey");
      expect(JSON.stringify(message)).not.toContain("secret-store.server");
    }
  });

  it("has a category for each failure worth telling apart", () => {
    const cases: [string, string][] = [
      ["HTTP 403", "admin.conn.err.denied"],
      ["HTTP 404", "admin.conn.err.notFound"],
      ["HTTP 429 quota exceeded", "admin.conn.err.limited"],
      ["The operation was aborted due to timeout", "admin.conn.err.timeout"],
      ["fetch failed ENOTFOUND", "admin.conn.err.unreachable"],
      ["something nobody anticipated", "admin.conn.err.unknown"],
    ];
    for (const [raw, key] of cases) {
      expect(describeFailure(new Error(raw), "test"), raw).toMatchObject({ key });
    }
  });
});
