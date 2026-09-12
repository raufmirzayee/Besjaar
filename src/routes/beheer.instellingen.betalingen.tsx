import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorState, LoadingState, NoAccessState } from "@/components/admin/admin-ui";
import {
  ConnectionCard,
  DetailList,
  SecretGroup,
  SettingsForm,
  SettingsSection,
} from "@/components/admin/settings-ui";
import { useCan } from "@/components/admin/admin-shell";
import { useI18n } from "@/lib/i18n";
import { useSaveSettings, useSettings, valueMap } from "@/lib/use-settings";
import { useConnections, useConnectionTest } from "@/lib/use-connections";
import { useSecretActions } from "@/lib/use-secrets";
import { getLiveReadiness } from "@/lib/connections.functions";
import { approveLivePayments, disableLivePayments } from "@/lib/settings.functions";
import { SETTINGS_QUERY_KEY } from "@/lib/use-settings";
import { CONNECTIONS_QUERY_KEY } from "@/lib/use-connections";
import type { StatusDetail } from "@/lib/integrations/types";

export const Route = createFileRoute("/beheer/instellingen/betalingen")({
  component: PaymentSettingsPage,
});

function PaymentSettingsPage() {
  const { t } = useI18n();
  const can = useCan();
  const settings = useSettings();
  const connections = useConnections();
  const save = useSaveSettings();
  const secrets = useSecretActions();
  const { results, running, test } = useConnectionTest();

  if (!can("settings", "view")) return <NoAccessState module={t("admin.module.settings")} />;
  if (settings.isPending || connections.isPending) return <LoadingState />;
  if (settings.error) {
    return <ErrorState message={settings.error.message} onRetry={() => void settings.refetch()} />;
  }
  if (connections.error) {
    return (
      <ErrorState message={connections.error.message} onRetry={() => void connections.refetch()} />
    );
  }

  const mollie = connections.data.integrations.find((entry) => entry.id === "mollie");
  const values = valueMap(settings.data.settings);
  const mode = String(values["payments.mode"] ?? "disabled");

  return (
    <div className="space-y-5">
      <ModeBanner mode={mode} />

      {mollie ? (
        <ConnectionCard
          status={mollie}
          canTest={can("integrations", "view")}
          testing={running === "mollie"}
          result={results.mollie}
          onTest={() => test("mollie")}
        />
      ) : null}

      <SecretGroup
        title={t("admin.secret.title")}
        secrets={connections.data.secrets.filter((entry) => entry.name === "MOLLIE_API_KEY")}
        capability={connections.data.capability}
        canManage={can("secrets", "manage_settings")}
        savingName={secrets.pending}
        onSave={secrets.save}
        onRemove={secrets.remove}
      />

      <SettingsSection
        title={t("admin.page.payments.title")}
        description={t("admin.page.payments.body")}
      >
        <SettingsForm
          category="payments"
          resolved={settings.data.settings}
          canEdit={can("settings", "edit")}
          saving={save.isPending}
          errors={save.errors}
          // The mode is not an ordinary field here: going live runs its own
          // approval, and going back down is its own button below.
          omit={["payments.mode"]}
          onSave={(next) => save.mutate(next)}
        />
      </SettingsSection>

      <LiveApproval mode={mode} canApprove={can("secrets", "approve")} />
    </div>
  );
}

function ModeBanner({ mode }: { mode: string }) {
  const { t } = useI18n();
  if (mode === "live") return null;

  return (
    <div
      className={
        mode === "test"
          ? "rounded-xl border border-amber-500/30 bg-amber-500/5 p-4"
          : "rounded-xl border border-border bg-muted/40 p-4"
      }
    >
      <p className="flex items-center gap-2 text-sm font-medium">
        <AlertTriangle className="size-4 shrink-0 text-amber-600" aria-hidden />
        {t(mode === "test" ? "admin.pay.testBanner" : "admin.pay.offBanner")}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        {t(mode === "test" ? "admin.pay.testBannerBody" : "admin.pay.offBannerBody")}
      </p>
    </div>
  );
}

/**
 * The one way to switch on real payments.
 *
 * Everything it shows is recomputed on the server when the button is pressed:
 * this list is an explanation, not the check. And the shop's own name has to be
 * typed in, because a confirmation dialog is something people dismiss without
 * reading and this is the decision that starts charging real cards.
 */
function LiveApproval({ mode, canApprove }: { mode: string; canApprove: boolean }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const fetchReadiness = useServerFn(getLiveReadiness);
  const approve = useServerFn(approveLivePayments);
  const disable = useServerFn(disableLivePayments);
  const [confirmation, setConfirmation] = useState("");

  const readiness = useQuery({
    queryKey: ["live-readiness"],
    queryFn: () => fetchReadiness({}) as Promise<StatusDetail[]>,
  });

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: CONNECTIONS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: ["live-readiness"] });
  }

  const approveMutation = useMutation({
    mutationFn: () => approve({ data: { confirmation } }),
    onSuccess: (result) => {
      const outcome = result as { ok: boolean; blocking: string[] };
      if (!outcome.ok) {
        toast.error(outcome.blocking.join(" · ") || t("admin.pay.blocked"));
        return;
      }
      setConfirmation("");
      toast.success(t("admin.pay.nowLive"));
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const disableMutation = useMutation({
    mutationFn: (next: "disabled" | "test") => disable({ data: { mode: next } }),
    onSuccess: () => {
      toast.success(t("admin.pay.steppedDown"));
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const blocking = (readiness.data ?? []).filter((item) => item.level === "critical");

  return (
    <SettingsSection title={t("admin.pay.live.title")} description={t("admin.pay.live.body")}>
      {readiness.isPending ? <LoadingState /> : <DetailList details={readiness.data ?? []} />}

      {mode === "live" ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
          <Button
            variant="outline"
            onClick={() => disableMutation.mutate("test")}
            disabled={disableMutation.isPending}
          >
            {t("admin.pay.backToTest")}
          </Button>
          <Button
            variant="ghost"
            onClick={() => disableMutation.mutate("disabled")}
            disabled={disableMutation.isPending}
          >
            {t("admin.pay.turnOff")}
          </Button>
        </div>
      ) : !canApprove ? (
        <p className="mt-4 flex items-center gap-2 border-t border-border pt-4 text-sm text-muted-foreground">
          <ShieldAlert className="size-4 shrink-0" aria-hidden />
          {t("admin.pay.needsSuperAdmin")}
        </p>
      ) : (
        <div className="mt-4 border-t border-border pt-4">
          {blocking.length > 0 ? (
            <p className="mb-3 text-sm text-destructive">{t("admin.pay.stillBlocked")}</p>
          ) : null}
          <Label htmlFor="live-confirm" className="text-sm">
            {t("admin.pay.typeName")}
          </Label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            <Input
              id="live-confirm"
              className="max-w-xs"
              value={confirmation}
              autoComplete="off"
              onChange={(event) => setConfirmation(event.target.value)}
            />
            <Button
              variant="destructive"
              disabled={
                confirmation.trim().length === 0 || blocking.length > 0 || approveMutation.isPending
              }
              onClick={() => approveMutation.mutate()}
            >
              {t("admin.pay.goLive")}
            </Button>
          </div>
        </div>
      )}
    </SettingsSection>
  );
}
