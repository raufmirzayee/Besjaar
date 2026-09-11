import { describe, expect, it } from "vitest";

import { safeExternalUrl, safeImageUrl } from "../safe-url";

describe("safeExternalUrl", () => {
  it("keeps an ordinary web address", () => {
    expect(safeExternalUrl("https://postnl.nl/tracktrace/3SABCD123")).toBe(
      "https://postnl.nl/tracktrace/3SABCD123",
    );
    expect(safeExternalUrl("http://example.test/a?b=c#d")).toBe("http://example.test/a?b=c#d");
  });

  it("drops a script URL", () => {
    // The reason this module exists: React renders whatever an href says, and
    // `javascript:` in one is a script that runs when a visitor clicks.
    expect(safeExternalUrl("javascript:alert(1)")).toBeNull();
    expect(safeExternalUrl("JavaScript:alert(1)")).toBeNull();
    expect(safeExternalUrl("  javascript:alert(1)  ")).toBeNull();
    expect(safeExternalUrl("java\tscript:alert(1)")).toBeNull();
  });

  it("drops every other scheme", () => {
    expect(safeExternalUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
    expect(safeExternalUrl("vbscript:msgbox(1)")).toBeNull();
    expect(safeExternalUrl("file:///etc/passwd")).toBeNull();
    expect(safeExternalUrl("mailto:iemand@example.test")).toBeNull();
  });

  it("returns null rather than an empty string for nothing", () => {
    // An <a href=""> reloads the page; the caller has to skip the link
    // entirely, and null is what makes that obvious at the call site.
    expect(safeExternalUrl(null)).toBeNull();
    expect(safeExternalUrl(undefined)).toBeNull();
    expect(safeExternalUrl("")).toBeNull();
    expect(safeExternalUrl("   ")).toBeNull();
    expect(safeExternalUrl("niet eens een url")).toBeNull();
  });

  it("does not accept a relative path as an external link", () => {
    expect(safeExternalUrl("/winkel")).toBeNull();
  });
});

describe("safeImageUrl", () => {
  it("keeps an absolute image address", () => {
    expect(safeImageUrl("https://cdn.example.test/lamp.jpg")).toBe(
      "https://cdn.example.test/lamp.jpg",
    );
  });

  it("keeps a path within this site", () => {
    expect(safeImageUrl("/images/lamp.jpg")).toBe("/images/lamp.jpg");
  });

  it("refuses a protocol-relative address", () => {
    // The browser reads "//host/x" as protocol-relative and fetches it from
    // another origin, so it is not the same-site path it looks like.
    expect(safeImageUrl("//elders.test/lamp.jpg")).toBeNull();
  });

  it("refuses a data image", () => {
    expect(safeImageUrl("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=")).toBeNull();
  });

  it("falls back to nothing for junk", () => {
    expect(safeImageUrl(null)).toBeNull();
    expect(safeImageUrl("")).toBeNull();
    expect(safeImageUrl("javascript:alert(1)")).toBeNull();
  });
});
