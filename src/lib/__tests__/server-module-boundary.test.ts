import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";

/**
 * Route and component files must not import a `.server` module.
 *
 * Those modules read `SUPABASE_SERVICE_ROLE_KEY`, `MOLLIE_API_KEY` and
 * `BOL_CLIENT_SECRET`. A route file that imports one pulls it into the client
 * graph, and what keeps the credentials out of the shipped bundle is then the
 * bundler's tree-shaking rather than the module boundary.
 *
 * That is not a theoretical distinction. `beheer.bolcom.tsx` imported two label
 * constants from `bol.server.ts`, and the optimiser did strip the rest — the
 * built assets carry no `api.bol.com` and no `BOL_CLIENT_SECRET`. It worked
 * because of a property of the optimiser, not a property of the code, and one
 * refactor that makes a module harder to analyse is all it takes for that to
 * stop being true silently.
 *
 * A `.functions.ts` module is the supported way across: it exports server
 * functions, which the framework turns into an RPC call rather than inlining.
 */

const SERVER_IMPORT = /from\s+["'][^"']*\.server["']/;

function sourceFiles(): string[] {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = `${dir}/${entry.name}`;
      if (entry.isDirectory()) {
        if (entry.name === "__tests__") continue;
        walk(path);
      } else if (entry.name.endsWith(".tsx")) {
        files.push(path);
      }
    }
  };
  walk("src/routes");
  walk("src/components");
  return files;
}

describe("server modules stay on the server", () => {
  const files = sourceFiles();

  it("scans a meaningful number of files", () => {
    expect(files.length).toBeGreaterThan(40);
  });

  it("has no component or route importing a .server module", () => {
    const offenders: string[] = [];

    for (const path of files) {
      // Collapse the source to one statement per line first. A multi-line
      // `import type { ... } from "x.server"` would otherwise be judged on its
      // closing brace, where the `type` keyword is nowhere in sight.
      const statements = readFileSync(path, "utf8")
        .replace(/\n/g, " ")
        .split(";")
        .map((statement) => statement.trim());

      for (const statement of statements) {
        if (!statement.startsWith("import")) continue;
        // `import type` is erased at compile time and never reaches a bundle.
        if (/^import\s+type\b/.test(statement)) continue;
        if (SERVER_IMPORT.test(statement)) {
          offenders.push(`${path}: ${statement.replace(/\s+/g, " ").slice(0, 100)}`);
        }
      }
    }

    expect(
      offenders,
      "these pull a server module into the client graph; move the shared part " +
        "into a plain module, or reach it through a .functions.ts server function",
    ).toEqual([]);
  });
});
