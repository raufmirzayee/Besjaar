import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * database -> environment -> application default.
 *
 * This chain is what lets an installation that is running today keep running
 * after the upgrade: the seed rows carry JSON null, the loader skips them, and
 * the environment variable that was already there still wins until somebody
 * sets a value in the admin. Getting it wrong in either direction is a silent
 * failure — either the shop ignores a value the deployment set, or the admin
 * screen appears to change nothing.
 */

let rows: { key: string; value: unknown; updated_at: string }[] = [];
let failLoad = false;

vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: {
    from: () => ({
      select: () =>
        Promise.resolve(
          failLoad
            ? { data: null, error: { message: "database unreachable" } }
            : { data: rows, error: null },
        ),
    }),
  },
}));

async function settings() {
  const module = await import("@/lib/settings.server");
  module.invalidateSettingsCache();
  return module;
}

const ENV_KEYS = ["VITE_SITE_URL", "VITE_STORE_EMAIL", "CHECKOUT_MODE"];
const originalEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  rows = [];
  failLoad = false;
  for (const key of ENV_KEYS) originalEnv[key] = process.env[key];
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
});

describe("where a setting's value comes from", () => {
  it("falls back to the application default when nothing else has a value", async () => {
    delete process.env.VITE_SITE_URL;
    const { resolveSetting } = await settings();

    const resolved = await resolveSetting("general.site_url");
    expect(resolved.source).toBe("default");
    expect(resolved.value).toBe("https://www.besjaar.nl");
  });

  it("prefers the environment over the default", async () => {
    process.env.VITE_SITE_URL = "https://staging.besjaar.nl";
    const { resolveSetting } = await settings();

    const resolved = await resolveSetting("general.site_url");
    expect(resolved.source).toBe("environment");
    expect(resolved.value).toBe("https://staging.besjaar.nl");
  });

  it("prefers a saved value over the environment", async () => {
    process.env.VITE_SITE_URL = "https://staging.besjaar.nl";
    rows = [
      {
        key: "general.site_url",
        value: "https://www.besjaar.nl",
        updated_at: "2026-09-12T00:00:00Z",
      },
    ];
    const { resolveSetting } = await settings();

    const resolved = await resolveSetting("general.site_url");
    expect(resolved.source).toBe("database");
    expect(resolved.value).toBe("https://www.besjaar.nl");
  });

  it("treats a seeded null row as no value at all", async () => {
    // This is what makes the upgrade invisible. Every key is seeded so the
    // table is complete, but a null row must not shadow the environment
    // variable the deployment is currently running on.
    process.env.VITE_SITE_URL = "https://staging.besjaar.nl";
    rows = [{ key: "general.site_url", value: null, updated_at: "2026-09-12T00:00:00Z" }];
    const { resolveSetting } = await settings();

    const resolved = await resolveSetting("general.site_url");
    expect(resolved.source).toBe("environment");
    expect(resolved.value).toBe("https://staging.besjaar.nl");
  });

  it("ignores an empty environment variable", async () => {
    process.env.VITE_SITE_URL = "   ";
    const { resolveSetting } = await settings();
    expect((await resolveSetting("general.site_url")).source).toBe("default");
  });

  it("ignores an environment value the schema refuses", async () => {
    // A deployment that has been running must not start failing because a
    // value it has always had is not one this schema accepts.
    process.env.VITE_SITE_URL = "not-a-url-at-all";
    const { resolveSetting } = await settings();
    expect((await resolveSetting("general.site_url")).source).toBe("default");
  });

  it("coerces the environment's strings into the shape the schema wants", async () => {
    process.env.CHECKOUT_MODE = "test";
    const { resolveSetting } = await settings();
    const resolved = await resolveSetting("payments.mode");
    expect(resolved.source).toBe("environment");
    expect(resolved.value).toBe("test");
  });

  it("keeps the storefront up when the settings table cannot be read", async () => {
    // Losing the table should cost the shop its customisations, not its ability
    // to serve a page.
    failLoad = true;
    process.env.VITE_SITE_URL = "https://www.besjaar.nl";
    const { resolveSetting } = await settings();

    const resolved = await resolveSetting("general.site_url");
    expect(resolved.source).toBe("environment");
    expect(resolved.value).toBe("https://www.besjaar.nl");
  });

  it("refuses to resolve a key nobody defined", async () => {
    const { resolveSetting } = await settings();
    await expect(resolveSetting("company.nonsense")).rejects.toThrow();
  });
});

describe("what an anonymous visitor receives", () => {
  it("returns only the keys the schema marks public", async () => {
    const { publicSettings } = await settings();
    const { PUBLIC_SETTING_KEYS, SETTINGS } = await import("@/lib/settings-schema");

    const exposed = Object.keys(await publicSettings());
    expect(exposed.sort()).toEqual([...PUBLIC_SETTING_KEYS].sort());
    for (const key of exposed) expect(SETTINGS[key].isPublic, key).toBe(true);
  });

  it("does not leak a private setting even when the database says it is public", async () => {
    // Belt and braces: the filter runs off the schema, not off the row's own
    // is_public column, so a wrongly-flagged row cannot expose anything.
    rows = [
      {
        key: "payments.webhook_url",
        value: "https://example.invalid/hook",
        updated_at: "2026-09-12T00:00:00Z",
      },
      { key: "email.from", value: "orders@besjaar.nl", updated_at: "2026-09-12T00:00:00Z" },
    ];
    const { publicSettings } = await settings();

    const exposed = await publicSettings();
    expect(exposed).not.toHaveProperty("payments.webhook_url");
    expect(exposed).not.toHaveProperty("email.from");
    expect(JSON.stringify(exposed)).not.toContain("example.invalid");
  });
});
