import { describe, expect, it } from "vitest";
import { readFileSync, globSync } from "node:fs";

import { ACTION_LABELS, MODULE_LABELS } from "../admin-access";

/**
 * A typo in a permission is silent.
 *
 * `requirePermission(context, "shipment", "edit")` — singular — compiles only
 * because the argument is typed, but a string built at runtime, a renamed
 * module or a hand-edited migration all get past that. The check itself never
 * throws: it looks for a permission nobody holds and refuses everyone, so the
 * screen simply stops working for every role at once, which reads like a bug
 * anywhere except in the authorisation layer.
 *
 * These tests hold the three lists in step: the modules and actions the UI
 * knows about, the ones the server functions demand, and the ones the database
 * actually grants.
 */

const MODULES = new Set(Object.keys(MODULE_LABELS));
const ACTIONS = new Set(Object.keys(ACTION_LABELS));

type Call = { file: string; module: string; action: string };

function permissionCalls(): Call[] {
  const calls: Call[] = [];
  const pattern = /requirePermission\(\s*context\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\)/g;

  for (const path of globSync("src/lib/*.ts")) {
    const source = readFileSync(path, "utf8");
    for (const match of source.matchAll(pattern)) {
      calls.push({ file: path.split("/").pop()!, module: match[1], action: match[2] });
    }
  }
  return calls;
}

/** Every (role, module, action) the seed migration grants. */
function seededPermissions(): Set<string> {
  const granted = new Set<string>();
  const source = readFileSync(
    "supabase/migrations/20260731100301_8bd658a9-0882-4531-94a0-561fcc85a582.sql",
    "utf8",
  );
  const extra = readFileSync(
    "supabase/migrations/20260911150000_permission_matrix_matches_reality.sql",
    "utf8",
  );
  const both = `${source}\n${extra}`;

  // The cross-join seeds: unnest(ARRAY[...modules]) CROSS JOIN unnest(ARRAY[...actions]).
  const crossJoin =
    /unnest\(ARRAY\[([^\]]+)\]\)\s*m\s*CROSS JOIN\s*unnest\(ARRAY\[([^\]]+)\]\)\s*a/gi;
  for (const match of both.matchAll(crossJoin)) {
    const modules = match[1].split(",").map((s) => s.trim().replace(/'/g, ""));
    const actions = match[2].split(",").map((s) => s.trim().replace(/'/g, ""));
    for (const m of modules) for (const a of actions) granted.add(`${m}:${a}`);
  }

  // The single-action seeds: SELECT '<role>', m, '<action>' FROM unnest(ARRAY[...]).
  const singleAction = /,\s*m\s*,\s*'(\w+)'\s*\nFROM unnest\(ARRAY\[([^\]]+)\]\)\s*m/gi;
  for (const match of both.matchAll(singleAction)) {
    const action = match[1];
    for (const m of match[2].split(",").map((s) => s.trim().replace(/'/g, ""))) {
      granted.add(`${m}:${action}`);
    }
  }

  // The VALUES seeds: ('role','module','action').
  for (const match of both.matchAll(
    /\(\s*'[\w]+'(?:::app_role)?\s*,\s*'(\w+)'\s*,\s*'(\w+)'\s*\)/g,
  )) {
    granted.add(`${match[1]}:${match[2]}`);
  }

  return granted;
}

describe("permission mapping", () => {
  const calls = permissionCalls();

  it("finds the permission checks to verify", () => {
    expect(calls.length).toBeGreaterThan(25);
  });

  it("demands only modules the admin knows about", () => {
    const unknown = calls.filter((c) => !MODULES.has(c.module));
    expect(
      unknown.map((c) => `${c.file}: ${c.module}`),
      "requirePermission names a module that is not in MODULE_LABELS, so no role can ever hold it",
    ).toEqual([]);
  });

  it("demands only actions the admin knows about", () => {
    const unknown = calls.filter((c) => !ACTIONS.has(c.action));
    expect(
      unknown.map((c) => `${c.file}: ${c.action}`),
      "requirePermission names an action that is not in ACTION_LABELS",
    ).toEqual([]);
  });

  it("demands only permissions some role is actually granted", () => {
    const granted = seededPermissions();
    const orphans = calls.map((c) => `${c.module}:${c.action}`).filter((key) => !granted.has(key));

    expect(
      [...new Set(orphans)],
      "These permissions are required by a server function but granted to nobody but super_admin, " +
        "so the screen behind them is dead for every other role. Grant them in a migration, or " +
        "require a permission that exists.",
    ).toEqual([]);
  });

  it("reads the seed migration correctly", () => {
    // Guards the parser above: if it silently matched nothing, the orphan test
    // would pass by accident.
    const granted = seededPermissions();
    expect(granted.has("orders:view")).toBe(true);
    expect(granted.has("shipments:edit")).toBe(true);
    expect(granted.has("returns:approve")).toBe(true);
    expect(granted.size).toBeGreaterThan(20);
  });
});
