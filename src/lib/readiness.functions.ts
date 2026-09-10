import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requirePermission } from "./admin-core.server";

export type ReadinessCheck = {
  id: string;
  label: string;
  ok: boolean;
  /** What the shop does while this is unset. */
  detail: string;
  /** The environment variables to set to satisfy it. */
  variables: string[];
  /** Blocks selling to real customers, rather than merely being advisable. */
  blocking: boolean;
};

/**
 * Whether the shop is ready to take real orders.
 *
 * Every check reads server-side configuration only; no key or secret is
 * returned, just whether it is present. The shop deliberately runs without any
 * of these — it simply refuses to pretend a payment was taken or an email was
 * sent — so this list is what stands between "running" and "trading".
 */
export const getReadiness = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requirePermission(context, "dashboard", "view");

    const { isPaymentProviderConfigured } = await import("./payments.server");
    const { isEmailConfigured } = await import("./email.server");
    const { missingCompanyIdentity, storeConfig } = await import("./store-config");

    const missingIdentity = missingCompanyIdentity();

    const checks: ReadinessCheck[] = [
      {
        id: "supabase",
        label: "Database en accounts",
        ok: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
        detail:
          "Zonder Supabase draait de winkel op de meegeleverde catalogus: bestellen, accounts en beheer werken niet.",
        variables: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_PUBLISHABLE_KEY"],
        blocking: true,
      },
      {
        id: "payments",
        label: "Betalingen",
        ok: isPaymentProviderConfigured(),
        detail:
          "Klanten kunnen bestellen, maar er wordt niets afgerekend: de bestelling blijft op 'wacht op betaling' staan en dat staat er ook bij.",
        variables: ["MOLLIE_API_KEY", "MOLLIE_WEBHOOK_URL"],
        blocking: true,
      },
      {
        id: "email",
        label: "Transactionele e-mail",
        ok: isEmailConfigured(),
        detail:
          "Er gaat geen bestelbevestiging of verzendmail uit. Een bevestiging op een duurzame gegevensdrager is wettelijk verplicht.",
        variables: ["RESEND_API_KEY", "EMAIL_FROM"],
        blocking: true,
      },
      {
        id: "company",
        label: "Bedrijfsgegevens",
        ok: missingIdentity.length === 0,
        detail: missingIdentity.length
          ? `Nog niet ingevuld: ${missingIdentity.map((f) => f.label).join(", ")}. Een webshop moet deze publiceren (BW 6:230m).`
          : "Volledig ingevuld en zichtbaar op de site.",
        variables: [
          "VITE_COMPANY_LEGAL_NAME",
          "VITE_COMPANY_KVK",
          "VITE_COMPANY_VAT",
          "VITE_COMPANY_STREET",
          "VITE_COMPANY_POSTAL_CODE",
          "VITE_COMPANY_CITY",
        ],
        blocking: true,
      },
      {
        id: "origin",
        label: "Eigen domein",
        ok: Boolean(process.env.VITE_SITE_URL && !process.env.VITE_SITE_URL.includes("localhost")),
        detail:
          "Canonieke URL's, sitemap en de betaal-webhook wijzen pas naar de juiste plek als het domein is ingesteld.",
        variables: ["VITE_SITE_URL"],
        blocking: true,
      },
      {
        id: "phone",
        label: "Telefoonnummer klantenservice",
        ok: Boolean(storeConfig.phone),
        detail:
          "Optioneel, maar klanten verwachten een tweede manier om je te bereiken naast e-mail.",
        variables: ["VITE_STORE_PHONE"],
        blocking: false,
      },
      {
        id: "bol",
        label: "bol.com-koppeling",
        ok: Boolean(process.env.BOL_CLIENT_ID && process.env.BOL_CLIENT_SECRET),
        detail:
          "Optioneel. Zonder sleutels blijft de koppeling uit staan; de eigen winkel werkt volledig zonder.",
        variables: ["BOL_CLIENT_ID", "BOL_CLIENT_SECRET"],
        blocking: false,
      },
    ];

    return {
      checks,
      readyToTrade: checks.every((check) => !check.blocking || check.ok),
    };
  });
