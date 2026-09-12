import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";

import { MANAGED_SECRETS } from "@/lib/secrets";
import { SETTINGS, SETTING_KEYS } from "@/lib/settings-schema";

/**
 * A settings screen that saves a value nothing reads is worse than no settings
 * screen: it tells the shop owner they have changed something when they have
 * not. This nearly shipped — the payment mode, the webhook address, the
 * e-mail sender and all five integration credentials were still being read
 * straight from `process.env` by the code that uses them, so the admin would
 * have saved a Mollie key that checkout never touched.
 *
 * These tests are the check that would have caught it: once a variable has a
 * setting or a secret behind it, nothing outside the two resolver modules may
 * read it from the environment again.
 */

/** The only modules allowed to touch the environment for these variables. */
const RESOLVERS = ["settings.server.ts", "secret-store.server.ts", "settings-schema.ts"];

function sourceFiles(): string[] {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = `${dir}/${entry.name}`;
      if (entry.isDirectory()) {
        if (entry.name !== "__tests__") walk(path);
        continue;
      }
      if (!/\.tsx?$/.test(entry.name)) continue;
      if (RESOLVERS.includes(entry.name)) continue;
      files.push(path);
    }
  };
  walk("src");
  return files;
}

/** Reads of `process.env.X` / `import.meta.env.X`, ignoring mentions in text. */
function environmentReads(source: string, variable: string): boolean {
  const direct = new RegExp(
    `(?:process|import\\.meta)\\.env(?:\\.${variable}\\b|\\[["'\`]${variable}["'\`]\\])`,
  );
  return direct.test(source);
}

describe("settings actually drive the application", () => {
  const files = sourceFiles();

  it("scans a meaningful number of files", () => {
    expect(files.length).toBeGreaterThan(80);
  });

  it("reads no managed credential straight from the environment", () => {
    // The secret store is the only reader. Anything else means a credential
    // replaced in the admin is saved, reported as saved, and then ignored by
    // the code that actually calls the service.
    const offenders: string[] = [];
    for (const path of files) {
      const source = readFileSync(path, "utf8");
      for (const secret of MANAGED_SECRETS) {
        if (environmentReads(source, secret)) offenders.push(`${path}: ${secret}`);
      }
    }
    expect(
      offenders,
      "read these through readSecret() so a credential saved in the admin is the one that gets used",
    ).toEqual([]);
  });

  it("reads no migrated setting straight from the environment", () => {
    // Every envKey in the schema is now a fallback *inside* the resolver. A
    // second reader elsewhere would quietly win or quietly lose depending on
    // which one the code path happened to use.
    const migrated = SETTING_KEYS.map((key) => SETTINGS[key].envKey).filter(
      (envKey): envKey is string => Boolean(envKey),
    );
    expect(migrated.length).toBeGreaterThan(15);

    const offenders: string[] = [];
    for (const path of files) {
      const source = readFileSync(path, "utf8");
      for (const variable of migrated) {
        if (environmentReads(source, variable)) offenders.push(`${path}: ${variable}`);
      }
    }
    expect(
      offenders,
      "read these through settingValue() so the admin screen is not decorative",
    ).toEqual([]);
  });

  it("still lets the bootstrap variables be read directly", () => {
    // The counterpart: these cannot come from a database, so a test that
    // banned every environment read would be wrong. This pins that they are
    // still reachable, and that the list of them has not quietly grown.
    const bootstrap = [
      "SUPABASE_SERVICE_ROLE_KEY",
      "SUPABASE_URL",
      "VITE_SUPABASE_URL",
      "TRUSTED_PROXY",
      "ADMIN_BOOTSTRAP_EMAIL",
      "NODE_ENV",
    ];
    const read = new Set<string>();
    for (const path of files) {
      const source = readFileSync(path, "utf8");
      for (const variable of bootstrap) {
        if (environmentReads(source, variable)) read.add(variable);
      }
    }
    // Not all of them appear in every build, but the two that decide who is
    // trusted must still be environment-only, and must not have become settings.
    expect(read.has("SUPABASE_SERVICE_ROLE_KEY")).toBe(true);
    for (const variable of bootstrap) {
      expect(
        SETTING_KEYS.some((key) => SETTINGS[key].envKey === variable),
        `${variable} must not become a setting`,
      ).toBe(false);
    }
  });
});
