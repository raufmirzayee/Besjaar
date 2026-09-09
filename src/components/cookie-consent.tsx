import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { readConsent, writeConsent } from "@/lib/consent";
import { useI18n } from "@/lib/i18n";

export function CookieConsent() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const [details, setDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (!readConsent()) setVisible(true);
  }, []);

  function save(next: { analytics: boolean; marketing: boolean }) {
    writeConsent(next);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label={t("cookie.title")}
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-border bg-card p-4 shadow-soft sm:p-5"
    >
      <div className="container-page flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <h2 className="font-display text-base font-bold">{t("cookie.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("cookie.text")}</p>

          {details ? (
            <div className="mt-3 space-y-3 rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{t("cookie.necessary")}</p>
                  <p className="text-xs text-muted-foreground">{t("cookie.necessaryText")}</p>
                </div>
                <Switch checked disabled aria-label={t("cookie.necessary")} />
              </div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{t("cookie.analytics")}</p>
                  <p className="text-xs text-muted-foreground">{t("cookie.analyticsText")}</p>
                </div>
                <Switch
                  checked={analytics}
                  onCheckedChange={setAnalytics}
                  aria-label={t("cookie.analytics")}
                />
              </div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{t("cookie.marketing")}</p>
                  <p className="text-xs text-muted-foreground">{t("cookie.marketingText")}</p>
                </div>
                <Switch
                  checked={marketing}
                  onCheckedChange={setMarketing}
                  aria-label={t("cookie.marketing")}
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => setDetails((v) => !v)}>
            {details ? t("cookie.hideOptions") : t("cookie.settings")}
          </Button>
          <Button variant="outline" onClick={() => save({ analytics: false, marketing: false })}>
            {t("cookie.rejectAll")}
          </Button>
          {details ? (
            <Button variant="outline" onClick={() => save({ analytics, marketing })}>
              {t("cookie.acceptSelection")}
            </Button>
          ) : null}
          <Button onClick={() => save({ analytics: true, marketing: true })}>
            {t("cookie.acceptAll")}
          </Button>
        </div>
      </div>
    </div>
  );
}
