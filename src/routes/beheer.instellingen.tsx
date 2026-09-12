import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";

import { PageHeader } from "@/components/admin/admin-ui";
import { useCan } from "@/components/admin/admin-shell";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/lib/translations";
import type { AdminModule } from "@/lib/admin-access";

export const Route = createFileRoute("/beheer/instellingen")({
  component: SettingsLayout,
});

type Tab = { to: string; label: TranslationKey; module: AdminModule; exact?: boolean };

/**
 * The tabs, in the order somebody setting up a shop needs them: what the shop
 * is, then what it sells and how, then the services behind it, then the parts
 * that only matter once it is running.
 */
const TABS: Tab[] = [
  { to: "/beheer/instellingen", label: "admin.set.nav.overview", module: "settings", exact: true },
  { to: "/beheer/instellingen/algemeen", label: "admin.set.nav.general", module: "settings" },
  { to: "/beheer/instellingen/winkel", label: "admin.set.nav.shop", module: "settings" },
  { to: "/beheer/instellingen/betalingen", label: "admin.set.nav.payments", module: "settings" },
  { to: "/beheer/instellingen/verzending", label: "admin.set.nav.shipping", module: "settings" },
  { to: "/beheer/instellingen/email", label: "admin.set.nav.email", module: "settings" },
  {
    to: "/beheer/instellingen/vertalingen",
    label: "admin.set.nav.translations",
    module: "settings",
  },
  { to: "/beheer/instellingen/seo", label: "admin.set.nav.seo", module: "settings" },
  { to: "/beheer/instellingen/bol", label: "admin.set.nav.bol", module: "integrations" },
  {
    to: "/beheer/instellingen/integraties",
    label: "admin.set.nav.integrations",
    module: "integrations",
  },
  { to: "/beheer/instellingen/supabase", label: "admin.set.nav.supabase", module: "integrations" },
  { to: "/beheer/instellingen/beveiliging", label: "admin.set.nav.security", module: "security" },
  { to: "/beheer/instellingen/systeem", label: "admin.set.nav.system", module: "settings" },
];

function SettingsLayout() {
  const { t } = useI18n();
  const can = useCan();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  // Hiding a tab is a courtesy, not a control: every screen behind one re-checks
  // the permission, and so does every server function it calls.
  const visible = TABS.filter((tab) => can(tab.module, "view"));

  return (
    <div>
      <PageHeader title={t("admin.set.title")} description={t("admin.set.subtitle")} />

      <nav className="-mx-1 mb-5 overflow-x-auto pb-1" aria-label={t("admin.set.title")}>
        <ul className="flex w-max gap-1">
          {visible.map((tab) => {
            const active = tab.exact ? pathname === tab.to : pathname.startsWith(tab.to);
            return (
              <li key={tab.to}>
                <Link
                  to={tab.to}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "block whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {t(tab.label)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <Outlet />
    </div>
  );
}
