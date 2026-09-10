import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { globSync } from "node:fs";

/**
 * Two-factor authentication is only worth anything if it covers everything.
 *
 * Every authenticated server function must route through requireRoles or
 * requirePermission, because that is where the aal2 assertion lives. A new
 * admin function that forgets the guard would be an unprotected hole, and the
 * mistake is invisible in review — so this test finds it instead.
 *
 * The exemptions below are deliberate and each is justified. Adding to this
 * list should take a good reason.
 */
const EXEMPT: Record<string, string> = {
  // Return only the caller's own roles, which they already know. The admin
  // gate needs them before the second factor to decide what to draw.
  "admin-core.functions.ts:getMyAccess": "own roles; needed by the gate at aal1",
  "admin.functions.ts:getMyRoles": "own roles; needed by the gate at aal1",
  // One boolean about the caller, used by the storefront login to send staff
  // to their own entrance.
  "staff.functions.ts:getIsStaffAccount": "own staff status; needed at aal1",
  // First-run bootstrap. It cannot require a second factor because no account
  // has one yet; it is gated on ADMIN_BOOTSTRAP_EMAIL instead.
  "admin.functions.ts:claimFirstAdmin": "bootstrap; gated on ADMIN_BOOTSTRAP_EMAIL",
  // Customer-facing, scoped to the caller's own orders and reviews. Staff
  // cannot own orders at all, so these never touch a staff session.
  "returns.functions.ts:getMyReturns": "customer's own returns",
  "returns.functions.ts:getReturnableOrders": "customer's own orders",
  "returns.functions.ts:requestReturn": "customer's own order",
  "returns.functions.ts:cancelMyReturn": "customer's own return",
  "reviews.functions.ts:submitReview": "customer's own review",
};

type Fn = { key: string; guarded: boolean };

function serverFunctions(): Fn[] {
  const files = globSync("src/lib/*.functions.ts");
  const found: Fn[] = [];

  for (const path of files) {
    const source = readFileSync(path, "utf8");
    const name = path.split("/").pop()!;
    const pattern = /export const (\w+) = createServerFn\([\s\S]*?(?=\nexport |\n*$)/g;

    for (const match of source.matchAll(pattern)) {
      const body = match[0];
      // A function with no auth middleware is public by design; the storefront
      // needs those, and they are not what this test is about.
      if (!body.includes("requireSupabaseAuth")) continue;
      found.push({
        key: `${name}:${match[1]}`,
        guarded: body.includes("requireRoles(") || body.includes("requirePermission("),
      });
    }
  }
  return found;
}

describe("two-factor coverage", () => {
  const functions = serverFunctions();

  it("finds the server functions to check", () => {
    // Guards the test itself: if the parser breaks, everything below would
    // pass vacuously.
    expect(functions.length).toBeGreaterThan(50);
  });

  it("routes every authenticated server function through the guard", () => {
    const unguarded = functions
      .filter((fn) => !fn.guarded)
      .map((fn) => fn.key)
      .filter((key) => !(key in EXEMPT));

    expect(
      unguarded,
      `These authenticated server functions call neither requireRoles nor requirePermission, ` +
        `so they run on a password-only session. Add a guard, or add a justified entry to EXEMPT.`,
    ).toEqual([]);
  });

  it("keeps the exemption list honest", () => {
    // An exemption for a function that no longer exists hides the fact that
    // the list was never revisited.
    const keys = new Set(functions.map((fn) => fn.key));
    const stale = Object.keys(EXEMPT).filter((key) => !keys.has(key));
    expect(stale, "EXEMPT lists functions that no longer exist").toEqual([]);
  });

  it("exempts nothing that already carries a guard", () => {
    const guarded = new Set(functions.filter((fn) => fn.guarded).map((fn) => fn.key));
    const pointless = Object.keys(EXEMPT).filter((key) => guarded.has(key));
    expect(pointless, "EXEMPT lists functions that are in fact guarded").toEqual([]);
  });

  it("asserts the second factor inside both guards", () => {
    expect(readFileSync("src/lib/admin.server.ts", "utf8")).toMatch(
      /export async function requireRoles[\s\S]{0,200}assertStaffMfa\(/,
    );
    expect(readFileSync("src/lib/admin-core.server.ts", "utf8")).toMatch(
      /export async function requirePermission[\s\S]{0,240}assertStaffMfa\(/,
    );
  });
});
