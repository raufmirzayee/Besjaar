import { describe, expect, it } from "vitest";

import { SETUP_STEPS, setupProgress, type SetupContext } from "@/lib/setup-wizard";
import type { SecretStatus } from "@/lib/secrets";

/**
 * The counter on the setup screen is a claim about the shop, so it has to be
 * earned. These tests are mostly about the ways it could lie: counting a step
 * that is not done, or letting a button mark one done that is supposed to be
 * measured.
 */

function secret(name: SecretStatus["name"]): SecretStatus {
  return {
    name,
    configured: true,
    source: "vault",
    maskedHint: null,
    updatedAt: null,
    liveNow: true,
  };
}

const empty: SetupContext = { settings: {}, secrets: [], states: {}, acknowledged: [] };

const configured: SetupContext = {
  settings: {
    "general.store_name": "Besjaar",
    "general.site_url": "https://www.besjaar.nl",
    "company.legal_name": "Besjaar B.V.",
    "company.kvk": "12345678",
    "company.vat": "NL123456789B01",
    "company.street": "Straatweg 1",
    "company.postal_code": "1234 AB",
    "company.city": "Amsterdam",
    "company.support_email": "hallo@besjaar.nl",
    "email.provider": "resend",
    "email.from": "Besjaar <orders@besjaar.nl>",
    "payments.webhook_url": "https://www.besjaar.nl/api/public/mollie-webhook",
    "commerce.return_days": 14,
    "seo.title_suffix": " — Besjaar",
    "seo.default_description": "Praktische producten voor huis en tuin.",
    "seo.indexing_enabled": true,
    "payments.mode": "live",
  },
  secrets: [secret("RESEND_API_KEY"), secret("MOLLIE_API_KEY"), secret("DEEPL_API_KEY")],
  states: { supabase: "connected" },
  acknowledged: ["shipping"],
};

describe("setup progress", () => {
  it("counts almost nothing on a fresh installation", () => {
    const progress = setupProgress(empty);
    // Only the administrator step, which being on this screen already proves.
    expect(progress.completed).toBe(1);
    expect(progress.total).toBe(12);
    expect(progress.blocking.length).toBeGreaterThan(8);
  });

  it("counts every step on a shop that is actually ready", () => {
    const progress = setupProgress(configured);
    expect(progress.completed).toBe(12);
    expect(progress.blocking).toEqual([]);
  });

  it("does not count a database it has not heard from", () => {
    // "configured" is not "connected": credentials existing is not a query
    // having been answered, and this is the distinction the whole dashboard
    // is built on.
    const almost = { ...configured, states: { supabase: "configured" as const } };
    expect(setupProgress(almost).blocking.map((step) => step.id)).toContain("database");
  });

  it("does not count a Mollie key without a webhook Mollie can reach", () => {
    const noHook = {
      ...configured,
      settings: { ...configured.settings, "payments.webhook_url": "" },
    };
    expect(setupProgress(noHook).blocking.map((step) => step.id)).toContain("payments");

    const httpHook = {
      ...configured,
      settings: { ...configured.settings, "payments.webhook_url": "http://besjaar.nl/hook" },
    };
    expect(setupProgress(httpHook).blocking.map((step) => step.id)).toContain("payments");
  });

  it("refuses a return window shorter than the law allows", () => {
    const short = {
      ...configured,
      settings: { ...configured.settings, "commerce.return_days": 7 },
    };
    expect(setupProgress(short).blocking.map((step) => step.id)).toContain("returns");
  });

  it("counts e-mail as done when the shop has deliberately switched it off", () => {
    // A staging shop that sends nothing is configured, not broken.
    const noEmail = {
      ...configured,
      settings: { ...configured.settings, "email.provider": "none" },
      secrets: configured.secrets.filter((entry) => entry.name !== "RESEND_API_KEY"),
    };
    expect(setupProgress(noEmail).blocking.map((step) => step.id)).not.toContain("email");
  });

  it("does not let indexing be off and the SEO step be done", () => {
    const hidden = {
      ...configured,
      settings: { ...configured.settings, "seo.indexing_enabled": false },
    };
    expect(setupProgress(hidden).blocking.map((step) => step.id)).toContain("seo");
  });

  it("only lets the two judgement steps be ticked by hand", () => {
    // Everything else is measured. A button that could mark a measured step
    // complete would turn the checklist into decoration, which is the failure
    // mode this whole design exists to avoid.
    const tickable = SETUP_STEPS.filter((step) => step.acknowledged).map((step) => step.id);
    expect(tickable).toEqual(["shipping", "translations"]);
  });

  it("ignores an acknowledgement for a step that is measured", () => {
    const forged = { ...empty, acknowledged: ["payments", "seo", "database", "returns"] };
    const done = setupProgress(forged)
      .steps.filter((entry) => entry.complete)
      .map((entry) => entry.step.id);
    expect(done).toEqual(["admins"]);
  });

  it("treats translations as optional", () => {
    const noTranslation = {
      ...configured,
      secrets: configured.secrets.filter((entry) => entry.name !== "DEEPL_API_KEY"),
      acknowledged: ["shipping"],
    };
    const progress = setupProgress(noTranslation);
    // Not complete, but never blocking: a Dutch-only shop is not misconfigured.
    expect(progress.completed).toBe(11);
    expect(progress.blocking).toEqual([]);
  });

  it("points every step at a page that exists", () => {
    for (const step of SETUP_STEPS) {
      expect(step.to, step.id).toMatch(/^\/beheer\//);
    }
  });
});
