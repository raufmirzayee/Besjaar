import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";

import { ROLE_LABELS, STAFF_ROLES, STAFF_ROLE_OPTIONS, roleLabel } from "@/lib/staff";

const MIGRATIONS = readdirSync("supabase/migrations")
  .sort()
  .map((file) => readFileSync(`supabase/migrations/${file}`, "utf8"))
  .join("\n");

describe("staff roles", () => {
  it("never offers the customer role as a staff role", () => {
    expect(STAFF_ROLE_OPTIONS).not.toContain("customer");
    expect(STAFF_ROLES).not.toContain("customer");
  });

  it("labels every assignable role", () => {
    for (const role of STAFF_ROLE_OPTIONS) {
      expect(ROLE_LABELS[role], role).toBeTruthy();
    }
  });

  it("prints an unknown role as itself rather than losing it", () => {
    expect(roleLabel("magazijnchef")).toBe("magazijnchef");
    expect(roleLabel("super_admin")).toBe("Super admin");
  });
});

/**
 * The separation has to hold in the database, not just in the screens. These
 * assert the guarantees exist in the migrations; the behaviour itself is
 * exercised against a real PostgreSQL instance during verification.
 */
describe("database enforcement", () => {
  it("creates the staff pool table", () => {
    expect(MIGRATIONS).toMatch(/CREATE TABLE IF NOT EXISTS public\.staff_accounts/i);
  });

  it("refuses a staff role for an account outside the pool", () => {
    expect(MIGRATIONS).toMatch(/FUNCTION public\.enforce_staff_role_pool/i);
    expect(MIGRATIONS).toMatch(
      /CREATE TRIGGER trg_enforce_staff_role_pool[\s\S]*?ON public\.user_roles/i,
    );
  });

  it("refuses an order that belongs to a staff account", () => {
    expect(MIGRATIONS).toMatch(/FUNCTION public\.reject_staff_orders/i);
    expect(MIGRATIONS).toMatch(/CREATE TRIGGER trg_reject_staff_orders[\s\S]*?ON public\.orders/i);
  });

  it("revokes staff roles when an account leaves the pool", () => {
    expect(MIGRATIONS).toMatch(/FUNCTION public\.revoke_roles_on_staff_removal/i);
  });

  it("gives anon no way into the staff pool", () => {
    // Only authenticated super admins get a policy; there is deliberately no
    // INSERT grant for anon, so public sign-up cannot create staff.
    const section = MIGRATIONS.slice(MIGRATIONS.indexOf("public.staff_accounts"));
    expect(section).not.toMatch(/CREATE POLICY[^;]*ON public\.staff_accounts[^;]*TO anon/i);
    expect(MIGRATIONS).toMatch(/GRANT ALL ON public\.staff_accounts TO service_role/i);
  });
});

describe("the storefront does not advertise the admin", () => {
  it("has no link to /beheer anywhere in customer-facing code", () => {
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = `${dir}/${entry.name}`;
        if (entry.isDirectory()) {
          // The admin area links to itself; that is not a leak.
          if (path.includes("/components/admin")) continue;
          walk(path);
        } else if (/\.(tsx|ts)$/.test(entry.name) && !entry.name.startsWith("beheer.")) {
          files.push(path);
        }
      }
    };
    walk("src");

    const offenders = files.filter((file) => {
      if (file.endsWith("routeTree.gen.ts") || file.includes("admin-access")) return false;
      return /to=\{?"\/beheer/.test(readFileSync(file, "utf8"));
    });
    expect(offenders).toEqual([]);
  });
});
