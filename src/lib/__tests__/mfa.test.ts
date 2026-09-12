import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";

import {
  assuranceLevel,
  hasVerifiedFactor,
  isValidTotpCode,
  staffGateState,
  staffSessionMayAct,
} from "@/lib/mfa";

const verified = [{ id: "f1", status: "verified" }];
const unverified = [{ id: "f1", status: "unverified" }];

describe("assuranceLevel", () => {
  it("reads aal2 only when the claim says so exactly", () => {
    expect(assuranceLevel({ aal: "aal2" })).toBe("aal2");
  });

  it("treats anything else as password-only", () => {
    // A missing, null, empty or unrecognised claim must never be read as a
    // satisfied second factor — that would be the whole control, silently off.
    for (const aal of [undefined, null, "", "aal1", "aal3", "AAL2", "true", "2"]) {
      expect(assuranceLevel({ aal } as never), String(aal)).toBe("aal1");
    }
    expect(assuranceLevel(null)).toBe("aal1");
    expect(assuranceLevel(undefined)).toBe("aal1");
    expect(assuranceLevel({})).toBe("aal1");
  });
});

describe("staffSessionMayAct", () => {
  it("permits only a session that proved the second factor", () => {
    expect(staffSessionMayAct({ aal: "aal2" })).toBe(true);
  });

  it("refuses a password-only session, however it is dressed up", () => {
    for (const claims of [null, undefined, {}, { aal: "aal1" }, { aal: "AAL2" }]) {
      expect(staffSessionMayAct(claims as never)).toBe(false);
    }
  });
});

describe("staffGateState", () => {
  it("asks an account with no authenticator to enrol", () => {
    expect(staffGateState({ factors: [], claims: { aal: "aal1" } })).toBe("enrol");
    expect(staffGateState({ factors: unverified, claims: { aal: "aal1" } })).toBe("enrol");
  });

  it("still asks to enrol even if the session somehow claims aal2", () => {
    // Without a verified factor there is nothing that could have been proved.
    expect(staffGateState({ factors: [], claims: { aal: "aal2" } })).toBe("enrol");
  });

  it("challenges an enrolled account whose session is password-only", () => {
    expect(staffGateState({ factors: verified, claims: { aal: "aal1" } })).toBe("challenge");
    expect(staffGateState({ factors: verified, claims: null })).toBe("challenge");
  });

  it("lets an enrolled account through once the code is verified", () => {
    expect(staffGateState({ factors: verified, claims: { aal: "aal2" } })).toBe("ready");
  });

  it("counts a verified factor among several", () => {
    expect(hasVerifiedFactor([...unverified, ...verified])).toBe(true);
    expect(hasVerifiedFactor(unverified)).toBe(false);
    expect(hasVerifiedFactor([])).toBe(false);
    expect(hasVerifiedFactor(null)).toBe(false);
  });
});

describe("isValidTotpCode", () => {
  it("accepts exactly six digits, trimmed", () => {
    expect(isValidTotpCode("123456")).toBe(true);
    expect(isValidTotpCode("  000000 ")).toBe(true);
  });

  it("rejects anything else", () => {
    for (const code of ["12345", "1234567", "12345a", "", "   ", "12 34 56", "-123456"]) {
      expect(isValidTotpCode(code), code).toBe(false);
    }
  });
});

/**
 * The application refuses admin work on a password-only session, but that only
 * covers callers who go through the application. A staff member could call
 * PostgREST directly with their token, so the row-level policies have to carry
 * the same requirement. Exactly four helpers gate every policy in the schema —
 * if a fifth appears, or one of these loses the check, the guarantee is gone.
 */
describe("row-level enforcement", () => {
  const sql = readdirSync("supabase/migrations")
    .sort()
    .map((file) => readFileSync(`supabase/migrations/${file}`, "utf8"))
    .join("\n");

  /** The last definition wins in Postgres, so only that one matters. */
  function lastDefinition(name: string): string {
    const marker = `CREATE OR REPLACE FUNCTION private.${name}(`;
    const start = sql.lastIndexOf(marker);
    expect(start, `private.${name} is not defined in any migration`).toBeGreaterThan(-1);
    const end = sql.indexOf("$$;", start);
    return sql.slice(start, end);
  }

  it("defines the assurance-level helper", () => {
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION private\.session_is_aal2/);
    // Read from the verified JWT claims, never from anything the caller sets.
    expect(lastDefinition("session_is_aal2")).toMatch(/request\.jwt\.claims/);
  });

  for (const helper of ["has_role", "has_any_role", "is_staff", "can_manage_catalog"]) {
    it(`makes private.${helper} require a second factor`, () => {
      expect(lastDefinition(helper)).toMatch(/session_is_aal2\(\)/);
    });
  }

  it("still lets the customer role work without one", () => {
    // Shoppers have no second factor and need none; requiring it there would
    // break every order and every account page.
    for (const helper of ["has_role", "has_any_role"]) {
      expect(lastDefinition(helper)).toMatch(/role = 'customer' OR private\.session_is_aal2\(\)/);
    }
  });
});
