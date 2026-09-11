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

/**
 * Every (role, module, action) any migration grants.
 *
 * This reads the migrations rather than the database because the check has to
 * run in a plain unit test, which means parsing SQL — and a parser that
 * memorises the exact layout of each INSERT goes stale the first time someone
 * writes the same grant a different way. It happened: a new migration seeded
 * permissions with the columns in a shape the old parser did not recognise,
 * and the test reported them as granted to nobody.
 *
 * So this parses the structure instead: for each INSERT into role_permissions,
 * take the three column expressions and whatever `unnest(ARRAY[...]) alias`
 * bindings are in scope, then expand the cross product. A literal resolves to
 * itself, an alias to its list, and the shape of the statement stops mattering.
 */
function seededPermissions(): Set<string> {
  const granted = new Set<string>();

  for (const path of globSync("supabase/migrations/*.sql")) {
    for (const statement of roleGrantStatements(readFileSync(path, "utf8"))) {
      for (const triple of expandGrant(statement)) granted.add(triple);
    }
  }
  return granted;
}

/** The body of every `INSERT INTO ... role_permissions ...` up to its semicolon. */
function roleGrantStatements(sql: string): string[] {
  const statements: string[] = [];
  const opener = /INSERT\s+INTO\s+(?:public\.)?role_permissions\s*\([^)]*\)/gi;

  for (const match of sql.matchAll(opener)) {
    const from = match.index! + match[0].length;
    const semicolon = sql.indexOf(";", from);
    statements.push(sql.slice(from, semicolon === -1 ? sql.length : semicolon));
  }
  return statements;
}

/** `'view'`, `'store_manager'::app_role` -> the literal. Anything else -> null. */
function literal(expression: string): string | null {
  const match = /^'([^']+)'(?:::\w+)?$/.exec(expression.trim());
  return match ? match[1] : null;
}

function arrayLiteral(sql: string): string[] {
  return sql
    .split(",")
    .map((item) => literal(item))
    .filter((item): item is string => item !== null);
}

function expandGrant(statement: string): string[] {
  const triples: string[] = [];

  // VALUES ('role', 'module', 'action'), (...), ...
  const values = /VALUES\s*([\s\S]*)$/i.exec(statement);
  if (values && !/\bSELECT\b/i.test(statement)) {
    for (const tuple of values[1].matchAll(/\(([^()]+)\)/g)) {
      const parts = tuple[1].split(",").map((part) => literal(part));
      if (parts.length === 3 && parts.every(Boolean)) {
        triples.push(`${parts[1]}:${parts[2]}`);
      }
    }
    return triples;
  }

  // SELECT <role>, <module>, <action> FROM unnest(ARRAY[...]) alias ...
  const select = /SELECT\s+([\s\S]*?)\s+FROM\s+([\s\S]*)$/i.exec(statement);
  if (!select) return triples;

  const bindings = new Map<string, string[]>();
  for (const bind of select[2].matchAll(/unnest\(ARRAY\[([^\]]+)\]\)\s*(?:AS\s+)?(\w+)/gi)) {
    bindings.set(bind[2], arrayLiteral(bind[1]));
  }

  const columns = splitTopLevel(select[1]);
  if (columns.length !== 3) return triples;

  const resolved = columns.map((column) => {
    const asLiteral = literal(column);
    if (asLiteral) return [asLiteral];
    const alias = /^(\w+)(?:::\w+)?$/.exec(column.trim());
    return alias ? (bindings.get(alias[1]) ?? []) : [];
  });

  for (const module of resolved[1]) {
    for (const action of resolved[2]) {
      // The role is resolved too, but the orphan check only asks whether some
      // role holds the permission, not which.
      if (resolved[0].length > 0) triples.push(`${module}:${action}`);
    }
  }
  return triples;
}

/** Splits a select list on commas that are not inside brackets. */
function splitTopLevel(list: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";

  for (const character of list) {
    if (character === "(" || character === "[") depth += 1;
    if (character === ")" || character === "]") depth -= 1;
    if (character === "," && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += character;
  }
  if (current.trim()) parts.push(current);
  return parts;
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
      "These permissions are required by a server function but no migration grants them to any " +
        "role, so the screen behind them is dead for everyone. Grant them in a migration, or " +
        "require a permission that exists.",
    ).toEqual([]);
  });

  it("reads every grant shape the migrations use", () => {
    // Guards the parser above: if it silently matched nothing, the orphan test
    // would pass by accident. One assertion per statement shape in the
    // migrations, so a parser that stops understanding one of them fails here
    // with a name rather than quietly reporting a permission as ungranted.
    const granted = seededPermissions();

    // module list CROSS JOIN action list
    expect(granted.has("orders:view"), "module x action cross join").toBe(true);
    // module list, single action
    expect(granted.has("shipments:edit"), "module list, single action").toBe(true);
    expect(granted.has("returns:approve"), "module list, single action").toBe(true);
    // single module, action list
    expect(granted.has("settings:edit"), "single module, action list").toBe(true);
    expect(granted.has("integrations:create"), "single module, action list").toBe(true);
    // role list, single module, single action
    expect(granted.has("integrations:view"), "role list, single module and action").toBe(true);
    // VALUES tuple
    expect(granted.has("security:view"), "VALUES tuple").toBe(true);
    // super_admin's own cross join
    expect(granted.has("secrets:manage_settings"), "super_admin cross join").toBe(true);

    expect(granted.size).toBeGreaterThan(20);
  });
});
