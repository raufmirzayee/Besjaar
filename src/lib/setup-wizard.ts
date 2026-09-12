/**
 * The twelve steps between an empty installation and a shop taking real money.
 *
 * Every step decides for itself whether it is done, from data the server
 * actually has: a settings value that is filled in, a credential that exists, a
 * connection test that came back. None of them is a checkbox somebody ticks,
 * because a checkbox is a claim and this list is supposed to be evidence.
 *
 * The two exceptions are marked `acknowledged`: steps whose subject is a
 * decision rather than a value — you have looked at the shipping rates and they
 * are the ones you want. There is nothing to measure there, so the shop records
 * that somebody said so, and the step says that is what it means.
 *
 * Client-safe: it reads statuses, never credentials.
 */

import type { SecretStatus } from "./secrets";
import type { ConnectionState, IntegrationId } from "./integrations/types";
import type { SettingValues } from "./settings-schema";

export type WizardStepId =
  | "shop"
  | "company"
  | "support"
  | "database"
  | "admins"
  | "email"
  | "payments"
  | "shipping"
  | "returns"
  | "seo"
  | "translations"
  | "live";

export type SetupContext = {
  settings: SettingValues;
  secrets: SecretStatus[];
  states: Partial<Record<IntegrationId, ConnectionState>>;
  /** Step ids somebody has explicitly marked as reviewed. */
  acknowledged: string[];
};

export type WizardStep = {
  id: WizardStepId;
  /** Translation keys. */
  title: string;
  description: string;
  to: string;
  /**
   * Whether the shop can take real orders without it. Optional steps still
   * appear — a shop owner deciding not to sell on bol.com should see that the
   * choice exists — but they never block the launch checklist.
   */
  required: boolean;
  /** True when the step measures a decision rather than a value. */
  acknowledged?: boolean;
  isComplete: (context: SetupContext) => boolean;
};

const text = (values: SettingValues, key: string): string =>
  typeof values[key] === "string" ? (values[key] as string).trim() : "";

const has = (values: SettingValues, ...keys: string[]): boolean =>
  keys.every((key) => text(values, key).length > 0);

const secret = (context: SetupContext, name: string): boolean =>
  context.secrets.some((entry) => entry.name === name && entry.configured);

export const SETUP_STEPS: WizardStep[] = [
  {
    id: "shop",
    title: "admin.wizard.shop.title",
    description: "admin.wizard.shop.body",
    to: "/beheer/instellingen/algemeen",
    required: true,
    isComplete: (c) =>
      has(c.settings, "general.store_name") &&
      text(c.settings, "general.site_url").startsWith("https://"),
  },
  {
    id: "company",
    title: "admin.wizard.company.title",
    description: "admin.wizard.company.body",
    to: "/beheer/instellingen/algemeen",
    required: true,
    // The facts a Dutch webshop is legally required to publish. Not a style
    // preference: without them the shop is not allowed to trade.
    isComplete: (c) =>
      has(
        c.settings,
        "company.legal_name",
        "company.kvk",
        "company.vat",
        "company.street",
        "company.postal_code",
        "company.city",
      ),
  },
  {
    id: "support",
    title: "admin.wizard.support.title",
    description: "admin.wizard.support.body",
    to: "/beheer/instellingen/algemeen",
    required: true,
    isComplete: (c) => has(c.settings, "company.support_email"),
  },
  {
    id: "database",
    title: "admin.wizard.database.title",
    description: "admin.wizard.database.body",
    to: "/beheer/instellingen/supabase",
    required: true,
    // "connected" here is the real thing: a query that came back.
    isComplete: (c) => c.states.supabase === "connected",
  },
  {
    id: "admins",
    title: "admin.wizard.admins.title",
    description: "admin.wizard.admins.body",
    to: "/beheer/medewerkers",
    required: true,
    // Signed in to see this at all, which on a shop with no staff is only
    // possible through the first-administrator claim. Reaching this screen is
    // therefore the evidence.
    isComplete: () => true,
  },
  {
    id: "email",
    title: "admin.wizard.email.title",
    description: "admin.wizard.email.body",
    to: "/beheer/instellingen/email",
    required: true,
    isComplete: (c) =>
      text(c.settings, "email.provider") === "none" ||
      (secret(c, "RESEND_API_KEY") && has(c.settings, "email.from")),
  },
  {
    id: "payments",
    title: "admin.wizard.payments.title",
    description: "admin.wizard.payments.body",
    to: "/beheer/instellingen/betalingen",
    required: true,
    isComplete: (c) =>
      secret(c, "MOLLIE_API_KEY") &&
      text(c.settings, "payments.webhook_url").startsWith("https://"),
  },
  {
    id: "shipping",
    title: "admin.wizard.shipping.title",
    description: "admin.wizard.shipping.body",
    to: "/beheer/instellingen/verzending",
    required: true,
    // Nothing here can be wrong in a way software can see: zero is a valid
    // shipping rate and so is nine euros. Only a person knows which is meant.
    acknowledged: true,
    isComplete: (c) => c.acknowledged.includes("shipping"),
  },
  {
    id: "returns",
    title: "admin.wizard.returns.title",
    description: "admin.wizard.returns.body",
    to: "/beheer/instellingen/winkel",
    required: true,
    isComplete: (c) => Number(c.settings["commerce.return_days"] ?? 0) >= 14,
  },
  {
    id: "seo",
    title: "admin.wizard.seo.title",
    description: "admin.wizard.seo.body",
    to: "/beheer/instellingen/seo",
    required: true,
    isComplete: (c) =>
      has(c.settings, "seo.title_suffix", "seo.default_description") &&
      c.settings["seo.indexing_enabled"] === true,
  },
  {
    id: "translations",
    title: "admin.wizard.translations.title",
    description: "admin.wizard.translations.body",
    to: "/beheer/instellingen/vertalingen",
    required: false,
    acknowledged: true,
    isComplete: (c) => secret(c, "DEEPL_API_KEY") || c.acknowledged.includes("translations"),
  },
  {
    id: "live",
    title: "admin.wizard.live.title",
    description: "admin.wizard.live.body",
    to: "/beheer/instellingen/betalingen",
    required: true,
    isComplete: (c) => c.settings["payments.mode"] === "live",
  },
];

export type SetupProgress = {
  steps: { step: WizardStep; complete: boolean }[];
  completed: number;
  total: number;
  /** Required steps still outstanding — what the launch checklist blocks on. */
  blocking: WizardStep[];
};

export function setupProgress(context: SetupContext): SetupProgress {
  const steps = SETUP_STEPS.map((step) => ({ step, complete: step.isComplete(context) }));
  return {
    steps,
    completed: steps.filter((entry) => entry.complete).length,
    total: steps.length,
    blocking: steps
      .filter((entry) => entry.step.required && !entry.complete)
      .map((entry) => entry.step),
  };
}
