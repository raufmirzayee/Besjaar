import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";

import {
  INTERNAL_SETTING_KEYS,
  PUBLIC_SETTING_KEYS,
  SETTINGS,
  SETTING_CATEGORIES,
  SETTING_KEYS,
  controlFor,
  editableSettings,
  validateSetting,
} from "@/lib/settings-schema";
import { MANAGED_SECRETS } from "@/lib/secrets";

/**
 * The settings system has one property worth testing above all others: a
 * credential never leaves the server. Everything below is either that claim or
 * one of the claims it rests on.
 */

describe("no credential can reach a browser", () => {
  it("has no value field anywhere in the client-safe secret module", () => {
    const source = readFileSync("src/lib/secrets.ts", "utf8");
    // The type is the control. A `value` on SecretStatus is the single edit
    // that would turn every status call into a credential disclosure, so it is
    // worth failing loudly on rather than trusting review to catch.
    expect(source).not.toMatch(/^\s*value\s*[?]?:/m);
    expect(source).not.toContain("readSecret");
    expect(source).not.toContain("process.env");
  });

  it("keeps the secret store out of the client graph", () => {
    // Only .server and .functions modules may import it. Anything else would
    // put the module that holds credentials one bundler decision away from the
    // browser.
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = `${dir}/${entry.name}`;
        if (entry.isDirectory()) {
          if (entry.name !== "__tests__") walk(path);
          continue;
        }
        if (!/\.tsx?$/.test(entry.name)) continue;
        if (/\.server\.ts$|\.functions\.ts$/.test(entry.name)) continue;

        const source = readFileSync(path, "utf8").replace(/\n/g, " ");
        for (const statement of source.split(";")) {
          const trimmed = statement.trim();
          if (!trimmed.startsWith("import")) continue;
          if (/^import\s+type\b/.test(trimmed)) continue;
          if (/from\s+["'][^"']*secret-store\.server["']/.test(trimmed)) {
            offenders.push(`${path}: ${trimmed.slice(0, 90)}`);
          }
        }
      }
    };
    walk("src");
    expect(offenders).toEqual([]);
  });

  it("never returns a credential from a server function", () => {
    // readSecret is the only function that produces a credential. A server
    // function may call it — testConnection has to — but must not hand the
    // result back, so no handler may return it.
    for (const file of ["settings.functions.ts", "connections.functions.ts"]) {
      const source = readFileSync(`src/lib/${file}`, "utf8");
      expect(source, file).not.toMatch(/return\s+(await\s+)?readSecret/);
      expect(source, file).not.toMatch(/\breturn\s*\{[^}]*\bvalue\s*[,:}]/);
    }
  });

  it("logs that a credential changed, never what it changed to", () => {
    const source = readFileSync("src/lib/settings.functions.ts", "utf8");
    const secretAudit = source.slice(source.indexOf("export const saveSecret"));
    const entry = secretAudit.slice(0, secretAudit.indexOf("export const removeSecret"));
    expect(entry).toContain("newValue: { stored: result.stored }");
    expect(entry).not.toMatch(/newValue:[^}]*data\.value/);
  });

  it("excludes the service role key from the credentials the admin manages", () => {
    // It is the key that opens the vault, so it cannot live inside it.
    expect(MANAGED_SECRETS as readonly string[]).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    // Nor may anything that decides who is trusted become an editable setting.
    for (const key of SETTING_KEYS) {
      expect(SETTINGS[key].envKey ?? "").not.toBe("TRUSTED_PROXY");
      expect(SETTINGS[key].envKey ?? "").not.toBe("ADMIN_BOOTSTRAP_EMAIL");
      expect(SETTINGS[key].envKey ?? "").not.toBe("SUPABASE_SERVICE_ROLE_KEY");
    }
  });
});

describe("public and private settings stay apart", () => {
  it("exposes only what a storefront actually renders", () => {
    // An anonymous visitor gets these. Each one has to be something already
    // visible on the shop, or it does not belong here.
    const leaked = PUBLIC_SETTING_KEYS.filter((key) =>
      ["webhook", "approved", "provider", "reply_to", "endpoint", "setup"].some((fragment) =>
        key.includes(fragment),
      ),
    );
    expect(leaked, "these are operational details, not storefront copy").toEqual([]);
  });

  it("keeps the operational settings private", () => {
    for (const key of [
      "payments.webhook_url",
      "payments.live_approved_by",
      "email.from",
      "email.reply_to",
      "commerce.low_stock_threshold",
      "system.setup_completed_steps",
    ]) {
      expect(SETTINGS[key].isPublic, key).toBe(false);
    }
  });

  it("treats sensitive as a write flag, not a read flag", () => {
    // Both of these are public and sensitive, which is correct and worth
    // pinning: a visitor can see whether checkout is live by looking at the
    // shop, but only an elevated role may change it.
    expect(SETTINGS["payments.mode"].isPublic).toBe(true);
    expect(SETTINGS["payments.mode"].sensitive).toBe(true);
    expect(SETTINGS["seo.indexing_enabled"].isPublic).toBe(true);
    expect(SETTINGS["seo.indexing_enabled"].sensitive).toBe(true);
  });

  it("agrees with the is_public column the migration seeds", () => {
    const migration = readFileSync("supabase/migrations/20260913090000_store_settings.sql", "utf8");
    // The database is what anon actually reads through, so a key marked public
    // in TypeScript and private in SQL would be a silent difference between
    // what the code believes and what the row-level policy allows.
    for (const key of SETTING_KEYS) {
      const row = new RegExp(`'${key.replace(/\./g, "\\.")}'\\s*,\\s*'[a-z_]+'[^)]*`).exec(
        migration,
      );
      expect(row, `${key} is not seeded`).not.toBeNull();
      const seededPublic = /\btrue\b/.test(row![0]);
      expect(seededPublic, `${key}: is_public disagrees with the schema`).toBe(
        SETTINGS[key].isPublic,
      );
    }
  });
});

describe("the public settings endpoint", () => {
  const source = readFileSync("src/lib/settings.functions.ts", "utf8");
  const handler = source.slice(source.indexOf("export const getPublicSettings"));

  it("returns the filtered set, never the whole table", () => {
    // The one endpoint here with no authentication, so what it calls is the
    // whole of its safety. resolveAllSettings would hand an anonymous visitor
    // the webhook address and the sender e-mail.
    expect(handler).toContain("publicSettings");
    expect(handler).not.toContain("resolveAllSettings");
    expect(handler).not.toContain("allSecretStatuses");
    expect(handler).not.toContain("readSecret");
  });

  it("is the only handler in the file without an auth middleware", () => {
    const unauthenticated = [
      ...source.matchAll(/export const (\w+) = createServerFn\([^)]*\)\s*(\.middleware)?/g),
    ]
      .filter((match) => match[2] === undefined)
      .map((match) => match[1]);
    expect(unauthenticated).toEqual(["getPublicSettings"]);
  });
});

describe("validation refuses what the shop cannot use", () => {
  it("insists on https for addresses customers and Mollie follow", () => {
    expect(validateSetting("general.site_url", "http://besjaar.nl").ok).toBe(false);
    expect(validateSetting("general.site_url", "https://besjaar.nl").ok).toBe(true);
    expect(validateSetting("payments.webhook_url", "http://x.nl/hook").ok).toBe(false);
  });

  it("checks the shapes a Dutch shop is judged on", () => {
    expect(validateSetting("company.kvk", "1234567").ok).toBe(false);
    expect(validateSetting("company.kvk", "12345678").ok).toBe(true);
    expect(validateSetting("company.vat", "NL123456789B01").ok).toBe(true);
    expect(validateSetting("company.vat", "not-a-vat-number").ok).toBe(false);
    expect(validateSetting("company.postal_code", "1234 AB").ok).toBe(true);
  });

  it("accepts a sender with a display name, which is how people write them", () => {
    expect(validateSetting("email.from", "Besjaar <orders@besjaar.nl>").ok).toBe(true);
    expect(validateSetting("email.from", "orders@besjaar.nl").ok).toBe(true);
    expect(validateSetting("email.from", "not an address").ok).toBe(false);
  });

  it("refuses money and durations that cannot be true", () => {
    expect(validateSetting("shipping.free_threshold", -1).ok).toBe(false);
    expect(validateSetting("commerce.return_days", -1).ok).toBe(false);
    expect(validateSetting("commerce.return_days", 14).ok).toBe(true);
    expect(validateSetting("commerce.return_days", 1.5).ok).toBe(false);
  });

  it("refuses a key that is not a setting at all", () => {
    // The shape an injection takes: a key nobody defined, written anyway.
    expect(validateSetting("company.__proto__", "x").ok).toBe(false);
    expect(validateSetting("anything.else", "x").ok).toBe(false);
  });
});

describe("the form renders every setting", () => {
  it("gives each editable setting a control", () => {
    const seen = new Set<string>();
    for (const category of SETTING_CATEGORIES) {
      for (const definition of editableSettings(category)) {
        seen.add(definition.key);
        expect(() => controlFor(definition), definition.key).not.toThrow();
      }
    }
    // Every key is either editable or deliberately internal; none is stranded
    // in the table with no way to reach it and no reason to be hidden.
    for (const key of SETTING_KEYS) {
      expect(seen.has(key) || INTERNAL_SETTING_KEYS.includes(key), key).toBe(true);
    }
  });

  it("keeps the approval fields out of reach of a form", () => {
    // An editable copy of "approved at" would be a way to forge an approval.
    expect(INTERNAL_SETTING_KEYS).toContain("payments.live_approved_at");
    expect(INTERNAL_SETTING_KEYS).toContain("payments.live_approved_by");
  });

  it("has a label and an explanation for every field", () => {
    const source = readFileSync("src/lib/translations/settings.ts", "utf8");
    for (const key of SETTING_KEYS) {
      expect(source, `label for ${key}`).toContain(`"admin.set.f.${key}"`);
      expect(source, `help for ${key}`).toContain(`"admin.set.h.${key}"`);
    }
  });
});
