import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

/**
 * Where the password-reset e-mail lands.
 *
 * Supabase turns the link into a session before this page renders, so setting
 * a new password is a plain updateUser call. If someone opens the page without
 * a valid link there is no session, and the page says so instead of failing
 * silently on submit.
 */
export const Route = createFileRoute("/wachtwoord-herstellen")({
  head: () => ({
    meta: [
      { title: "Nieuw wachtwoord instellen — Besjaar" },
      {
        name: "description",
        content: "Stel een nieuw wachtwoord in voor je Besjaar account.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { session, loading, updatePassword } = useAuth();
  const { t } = useI18n();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirmation) {
      toast.error(t("auth.passwordMismatch"));
      return;
    }
    setBusy(true);
    try {
      await updatePassword(password);
      toast.success(t("auth.passwordUpdated"));
      navigate({ to: "/account" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("auth.resetFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-md rounded-2xl border bg-card p-8 shadow-soft">
        <h1 className="text-2xl font-bold">{t("auth.newPasswordTitle")}</h1>

        {loading ? (
          <p className="mt-4 text-sm text-muted-foreground">{t("auth.busy")}</p>
        ) : !session ? (
          <>
            <p className="mt-2 text-sm text-muted-foreground">{t("auth.resetLinkInvalid")}</p>
            <Button asChild className="mt-4 w-full">
              <Link to="/inloggen">{t("auth.signIn")}</Link>
            </Button>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="new-password" className="mb-1.5 block">
                {t("auth.newPassword")}
              </Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <p className="mt-1.5 text-xs text-muted-foreground">{t("auth.passwordRule")}</p>
            </div>
            <div>
              <Label htmlFor="confirm-password" className="mb-1.5 block">
                {t("auth.confirmPassword")}
              </Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? t("auth.busy") : t("auth.savePassword")}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
