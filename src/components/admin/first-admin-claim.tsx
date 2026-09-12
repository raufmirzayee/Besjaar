import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { claimFirstAdmin } from "@/lib/admin.functions";
import { useI18n } from "@/lib/i18n";

/**
 * The one-time claim on an empty shop.
 *
 * Shown only when the server has already said yes to `canClaimFirstAdmin`,
 * which means two things are both true: no staff account exists at all, and
 * this caller's verified address is the one the operator put in
 * ADMIN_BOOTSTRAP_EMAIL. Anyone else — including a signed-in customer, and
 * including the right address once a colleague has been added — gets the
 * ordinary 404 instead, so this never tells a stranger that a backoffice is
 * here.
 *
 * Deliberately bare: no storefront chrome, nothing that would make the page
 * worth finding.
 */
export function FirstAdminClaim({ onClaimed }: { onClaimed: () => void }) {
  const { t } = useI18n();
  const claim = useServerFn(claimFirstAdmin);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => claim({}),
    onSuccess: () => {
      setError(null);
      onClaimed();
    },
    onError: (cause: unknown) => {
      // The server decides again on submit, so this can legitimately refuse
      // even though the button was drawn — a colleague may have been added in
      // between. Show what it said rather than a generic failure.
      setError(cause instanceof Error ? cause.message : t("admin.bootstrap.failed"));
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-soft">
        <h1 className="font-display text-xl font-bold">{t("admin.bootstrap.title")}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {t("admin.bootstrap.body")}
        </p>

        {error ? (
          <p role="alert" className="mt-4 text-sm font-medium text-destructive">
            {error}
          </p>
        ) : null}

        <Button
          type="button"
          className="mt-6 w-full"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? t("admin.bootstrap.working") : t("admin.bootstrap.submit")}
        </Button>
      </div>
    </div>
  );
}
