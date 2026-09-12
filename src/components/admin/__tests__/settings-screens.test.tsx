// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import axe from "axe-core";
import type { ReactElement } from "react";

import { I18nProvider } from "@/lib/i18n";
import {
  ConnectionCard,
  DetailList,
  ProgressBar,
  SecretField,
  SettingsForm,
  TestResultPanel,
} from "@/components/admin/settings-ui";
import { msg, raw } from "@/lib/integrations/types";
import type { SecretStatus, SecretStoreCapability } from "@/lib/secrets";
import type { ResolvedSetting } from "@/lib/settings-schema";
import type { Locale } from "@/lib/i18n";

/**
 * The settings screens, rendered.
 *
 * They sit behind a staff sign-in and a second factor, so driving them in a
 * real browser needs a Supabase project this environment does not have. What
 * can be checked without one is everything that lives in the markup: that
 * every control has a label, that the credential field really has no value in
 * it, that the copy changes with the locale, and that axe finds nothing.
 */

const VAULT: SecretStoreCapability = { writable: true, backend: "vault", reason: null };
const ENV_ONLY: SecretStoreCapability = {
  writable: false,
  backend: "environment-only",
  reason: "Supabase Vault is not available on this project.",
};

const SECRET: SecretStatus = {
  name: "MOLLIE_API_KEY",
  configured: true,
  source: "vault",
  maskedHint: "live_••••1234",
  updatedAt: "2026-09-12T10:00:00Z",
  liveNow: true,
};

const RESOLVED: ResolvedSetting[] = [
  { key: "general.site_url", value: "https://www.besjaar.nl", source: "database", updatedAt: null },
  { key: "general.store_name", value: "Besjaar", source: "default", updatedAt: null },
  { key: "general.default_language", value: "nl", source: "environment", updatedAt: null },
  { key: "general.timezone", value: "Europe/Amsterdam", source: "default", updatedAt: null },
];

function render(element: ReactElement, locale: Locale = "nl"): string {
  return renderToStaticMarkup(<I18nProvider initialLocale={locale}>{element}</I18nProvider>);
}

async function axeViolations(html: string): Promise<string[]> {
  document.body.innerHTML = `<main>${html}</main>`;
  const results = await axe.run(document.body, {
    // Contrast needs real layout and colours, which static markup does not
    // have; it is covered by the browser pass over the running application.
    rules: { "color-contrast": { enabled: false } },
  });
  return results.violations.map(
    (violation) => `${violation.id}: ${violation.nodes.length} node(s)`,
  );
}

describe("the settings form", () => {
  const html = render(
    <SettingsForm
      category="general"
      resolved={RESOLVED}
      canEdit
      saving={false}
      errors={{}}
      onSave={() => {}}
    />,
  );

  it("gives every control a label that points at it", () => {
    const ids = [
      ...html.matchAll(/<(?:input|select|textarea|button)[^>]*id="(setting-[^"]+)"/g),
    ].map((match) => match[1]);
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      expect(html, `no label for ${id}`).toContain(`for="${id}"`);
    }
  });

  it("says where each value came from", () => {
    // The row that makes the screen honest: a value inherited from the
    // deployment looks identical to one somebody typed here, and the
    // difference decides whether editing this page changes anything.
    expect(html).toContain("Ingesteld in het beheer");
    expect(html).toContain("Komt uit de serveromgeving");
    expect(html).toContain("Standaardwaarde");
  });

  it("renders the control each setting's type calls for", () => {
    expect(html).toContain('id="setting-general-site_url"');
    // The language setting is an enum, so it must be a select rather than a
    // free-text box that can be typed full of nonsense.
    expect(html).toMatch(/id="setting-general-default_language"[^>]*role="combobox"|<select/);
  });

  it("shows the selected option's label without waiting for hydration", () => {
    // Radix only learns an option's label when its items mount. Without a
    // placeholder the language field renders as an empty box on the server and
    // until the JavaScript lands, which reads as "not set".
    expect(html).toContain("Nederlands");
  });

  it("offers no save button to somebody who may only look", () => {
    const readOnly = render(
      <SettingsForm
        category="general"
        resolved={RESOLVED}
        canEdit={false}
        saving={false}
        errors={{}}
        onSave={() => {}}
      />,
    );
    expect(readOnly).toContain("Je mag deze instellingen bekijken");
    expect(readOnly).not.toContain(">Opslaan<");
    // Every field is disabled too, so the screen does not invite an edit it
    // would then have to refuse.
    expect(readOnly).toContain("disabled");
  });

  it("shows a validation error against the field it belongs to", () => {
    const withError = render(
      <SettingsForm
        category="general"
        resolved={RESOLVED}
        canEdit
        saving={false}
        errors={{ "general.site_url": "Moet een volledig https-adres zijn" }}
        onSave={() => {}}
      />,
    );
    expect(withError).toContain('role="alert"');
    expect(withError).toContain("Moet een volledig https-adres zijn");
  });

  it("has no accessibility violations", async () => {
    expect(await axeViolations(html)).toEqual([]);
  });
});

describe("the credential field", () => {
  it("shows the state and the hint, and never a value", async () => {
    const html = render(
      <SecretField
        status={SECRET}
        capability={VAULT}
        canManage
        saving={false}
        onSave={() => {}}
        onRemove={() => {}}
      />,
    );

    expect(html).toContain("Mollie API-sleutel");
    expect(html).toContain("live_••••1234");
    expect(html).toContain("Vervangen");
    // There is no field in SecretStatus for a value, so there is nothing that
    // could be rendered — this pins that the screen does not invent one.
    expect(html).not.toMatch(/value="[^"]{12,}"/);
    expect(await axeViolations(html)).toEqual([]);
  });

  it("tells the truth when the deployment cannot store credentials", async () => {
    const html = render(
      <SecretField
        status={{ ...SECRET, configured: false, source: "none", maskedHint: null }}
        capability={ENV_ONLY}
        canManage
        saving={false}
        onSave={() => {}}
        onRemove={() => {}}
      />,
    );

    // No replace button, because pressing it could not work. Instead the
    // variable name to set, which is the thing that actually would.
    expect(html).not.toContain(">Vervangen<");
    expect(html).toContain("MOLLIE_API_KEY");
    expect(html).toContain("Deze omgeving kan geen credentials opslaan");
    expect(await axeViolations(html)).toEqual([]);
  });

  it("offers nothing to somebody without the permission", () => {
    const html = render(
      <SecretField
        status={SECRET}
        capability={VAULT}
        canManage={false}
        saving={false}
        onSave={() => {}}
        onRemove={() => {}}
      />,
    );
    expect(html).not.toContain(">Vervangen<");
    expect(html).not.toContain(">Verwijderen<");
  });
});

describe("connection cards", () => {
  const html = render(
    <ConnectionCard
      status={{
        id: "mollie",
        state: "configured",
        level: "attention",
        details: [
          {
            label: msg("admin.conn.label.mode"),
            value: msg("admin.conn.mode.test"),
            level: "attention",
          },
          {
            label: msg("admin.conn.label.apiKey"),
            value: msg("admin.conn.mollie.setTest"),
            level: "ok",
          },
        ],
        lastTestedAt: null,
        testMode: true,
      }}
      canTest
      onTest={() => {}}
    />,
  );

  it("says configured rather than connected until something proved it", () => {
    // The distinction the whole dashboard exists for.
    expect(html).toContain("Ingesteld");
    expect(html).not.toContain(">Verbonden<");
  });

  it("renders the server's message names as words", () => {
    expect(html).toContain("Modus");
    expect(html).toContain("Ingesteld (testsleutel)");
    // A key that reached the screen untranslated would show up verbatim.
    expect(html).not.toContain("admin.conn.");
  });

  it("has no accessibility violations", async () => {
    expect(await axeViolations(html)).toEqual([]);
  });
});

describe("test results", () => {
  it("renders a failure as advice, not as a stack trace", async () => {
    const html = render(
      <TestResultPanel
        result={{ ok: false, message: msg("admin.conn.err.auth"), durationMs: 214 }}
      />,
    );
    expect(html).toContain("Authenticatie mislukt");
    expect(html).toContain('role="status"');
    expect(html).toContain("214 ms");
    expect(await axeViolations(html)).toEqual([]);
  });

  it("passes through content that is the answer rather than copy", () => {
    const html = render(
      <TestResultPanel
        result={{ ok: true, message: raw("Practical products for home and garden") }}
      />,
    );
    expect(html).toContain("Practical products for home and garden");
  });
});

describe("the progress bar", () => {
  it("carries the numbers in ARIA as well as in text", async () => {
    const html = render(<ProgressBar completed={8} total={12} label="Voortgang" />);
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="8"');
    expect(html).toContain('aria-valuemax="12"');
    expect(html).toContain("8 / 12");
    expect(await axeViolations(html)).toEqual([]);
  });
});

describe("both admin languages", () => {
  it("renders the same screen in Dutch and English", () => {
    const element = (
      <DetailList
        details={[
          {
            label: msg("admin.conn.label.apiKey"),
            value: msg("admin.conn.value.notSet"),
            level: "attention",
          },
          {
            label: msg("admin.conn.label.sendingDomain"),
            value: raw("besjaar.nl"),
            level: "neutral",
          },
        ]}
      />
    );

    const nl = render(element, "nl");
    const en = render(element, "en");

    expect(nl).toContain("API-sleutel");
    expect(nl).toContain("Niet ingesteld");
    expect(en).toContain("API key");
    expect(en).toContain("Not set");
    // The domain is content, not copy, so it is identical in both.
    expect(nl).toContain("besjaar.nl");
    expect(en).toContain("besjaar.nl");
  });

  it("translates the form for an English administrator", () => {
    const en = render(
      <SettingsForm
        category="general"
        resolved={RESOLVED}
        canEdit
        saving={false}
        errors={{}}
        onSave={() => {}}
      />,
      "en",
    );
    expect(en).toContain("Shop address");
    expect(en).toContain("Set in the admin");
    expect(en).not.toContain("Ingesteld in het beheer");
  });
});
