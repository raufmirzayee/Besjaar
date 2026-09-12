import { describe, expect, it } from "vitest";

import { decideFirstAdminClaim } from "@/lib/admin-bootstrap";

/**
 * A deployed shop is reachable the moment it goes up. If "no admin exists yet"
 * were the only condition on the first-admin claim, whoever signed up first
 * could take the shop over.
 */
describe("decideFirstAdminClaim", () => {
  const owner = "owner@besjaar.nl";

  it("refuses entirely when no bootstrap address is configured", () => {
    for (const configuredEmail of [undefined, "", "   "]) {
      const decision = decideFirstAdminClaim({
        configuredEmail,
        callerEmail: "attacker@example.com",
        staffExists: false,
      });
      expect(decision.allowed, String(configuredEmail)).toBe(false);
      expect(decision).toHaveProperty("reason", expect.stringContaining("uitgeschakeld"));
    }
  });

  it("refuses an address the operator did not name", () => {
    const decision = decideFirstAdminClaim({
      configuredEmail: owner,
      callerEmail: "attacker@example.com",
      staffExists: false,
    });
    expect(decision.allowed).toBe(false);
    expect(decision).toHaveProperty("reason", expect.stringContaining("mag zichzelf niet"));
  });

  it("refuses a caller with no address at all", () => {
    for (const callerEmail of [null, undefined, "", "  "]) {
      expect(
        decideFirstAdminClaim({ configuredEmail: owner, callerEmail, staffExists: false }).allowed,
      ).toBe(false);
    }
  });

  it("refuses once any staff role already exists, even for the named address", () => {
    const decision = decideFirstAdminClaim({
      configuredEmail: owner,
      callerEmail: owner,
      staffExists: true,
    });
    expect(decision.allowed).toBe(false);
    expect(decision).toHaveProperty("reason", expect.stringContaining("al een beheerder"));
  });

  it("allows the named address on a shop with no staff", () => {
    expect(
      decideFirstAdminClaim({ configuredEmail: owner, callerEmail: owner, staffExists: false }),
    ).toEqual({ allowed: true });
  });

  it("compares addresses case-insensitively and ignores surrounding spaces", () => {
    expect(
      decideFirstAdminClaim({
        configuredEmail: "  Owner@Besjaar.NL ",
        callerEmail: "owner@besjaar.nl",
        staffExists: false,
      }),
    ).toEqual({ allowed: true });
  });

  it("does not treat a partial match as the configured address", () => {
    for (const callerEmail of [
      "owner@besjaar.nl.attacker.com",
      "xowner@besjaar.nl",
      "owner@besjaar.n",
    ]) {
      expect(
        decideFirstAdminClaim({ configuredEmail: owner, callerEmail, staffExists: false }).allowed,
        callerEmail,
      ).toBe(false);
    }
  });
});
