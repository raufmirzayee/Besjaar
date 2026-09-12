import { useQueryClient } from "@tanstack/react-query";
import { KeyRound, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { isValidTotpCode } from "@/lib/mfa";

/** Frame shared by both steps, so the two screens read as one flow. */
function MfaFrame({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2 text-muted-foreground">
          <ShieldCheck className="size-5" aria-hidden="true" />
          <span className="text-sm font-semibold uppercase tracking-widest">
            {t("admin.signIn.eyebrow")}
          </span>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-soft">{children}</div>
      </div>
    </div>
  );
}

/**
 * First-time enrolment.
 *
 * Supabase returns the shared secret as a QR code and as text; both are shown,
 * because a phone camera is not always to hand. Nothing here is stored by the
 * app — the secret lives in Supabase and in the staff member's authenticator.
 */
export function StaffMfaEnrol({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    // Enrol once per mount; a second call would leave an orphan factor behind.
    if (started.current) return;
    started.current = true;

    (async () => {
      try {
        // Clear any half-finished attempt from an earlier visit, or Supabase
        // refuses a second enrolment with the same friendly name.
        const { data: existing } = await supabase.auth.mfa.listFactors();
        for (const factor of existing?.all ?? []) {
          if (factor.status !== "verified") {
            await supabase.auth.mfa.unenroll({ factorId: factor.id });
          }
        }

        const { data, error: enrolError } = await supabase.auth.mfa.enroll({
          factorType: "totp",
          friendlyName: "Besjaar beheer",
        });
        if (enrolError) throw enrolError;
        setFactorId(data.id);
        setQr(data.totp.qr_code);
        setSecret(data.totp.secret);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : t("admin.mfa.setupFailed"));
      }
    })();
  }, []);

  async function verify(event: React.FormEvent) {
    event.preventDefault();
    if (!factorId || !isValidTotpCode(code)) {
      setError(t("admin.mfa.enterSix"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: code.trim(),
      });
      if (verifyError) throw verifyError;

      onDone();
    } catch {
      // Wrong code, or the phone's clock has drifted. Either way, retry.
      setError(t("admin.mfa.wrongCodeClock"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <MfaFrame>
      <h1 className="text-lg font-semibold">{t("admin.mfa.enrolTitle")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("admin.mfa.enrolIntro")}</p>

      {qr ? (
        <div className="mt-5 flex justify-center rounded-xl border bg-white p-3">
          <img src={qr} alt={t("admin.mfa.qrAlt")} className="size-44" />
        </div>
      ) : (
        <p className="mt-5 text-sm text-muted-foreground">{t("admin.mfa.loadingCode")}</p>
      )}

      {secret ? (
        <div className="mt-3">
          <p className="text-xs text-muted-foreground">{t("admin.mfa.manualIntro")}</p>
          <code className="mt-1 block break-all rounded-lg bg-surface px-3 py-2 font-mono text-xs">
            {secret}
          </code>
        </div>
      ) : null}

      <form onSubmit={verify} className="mt-5">
        <Label htmlFor="mfa-enrol-code" className="mb-1.5 block">
          {t("admin.mfa.codeLabel")}
        </Label>
        <Input
          id="mfa-enrol-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
          className="text-center font-mono text-lg tracking-[0.4em]"
        />
        {error ? (
          <p role="alert" className="mt-2 text-sm text-sale">
            {error}
          </p>
        ) : null}
        <Button type="submit" className="mt-4 w-full" disabled={busy || !factorId}>
          {busy ? t("admin.mfa.checking") : t("admin.mfa.finish")}
        </Button>
      </form>

      <p className="mt-4 text-xs text-muted-foreground">{t("admin.mfa.keepSafe")}</p>
    </MfaFrame>
  );
}

/** Every later sign-in: the password is in, the code still has to be. */
export function StaffMfaChallenge({ onDone }: { onDone: () => void }) {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!isValidTotpCode(code)) {
      setError(t("admin.mfa.enterSix"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError) throw listError;
      const factor = (factors?.totp ?? []).find((item) => item.status === "verified");
      if (!factor) throw new Error(t("admin.mfa.noAuthenticator"));

      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: factor.id,
      });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: factor.id,
        challengeId: challenge.id,
        code: code.trim(),
      });
      if (verifyError) throw verifyError;

      // The session is now aal2; the gate and every admin call re-read it.
      await queryClient.invalidateQueries();
      onDone();
    } catch {
      setError(t("admin.mfa.wrongCode"));
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  return (
    <MfaFrame>
      <h1 className="flex items-center gap-2 text-lg font-semibold">
        <KeyRound className="size-4" aria-hidden="true" /> {t("admin.mfa.challengeTitle")}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("admin.mfa.challengeIntro")}</p>

      <form onSubmit={submit} className="mt-5">
        <Label htmlFor="mfa-code" className="mb-1.5 block">
          {t("admin.mfa.sixDigits")}
        </Label>
        <Input
          id="mfa-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          maxLength={6}
          placeholder="000000"
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
          className="text-center font-mono text-lg tracking-[0.4em]"
        />
        {error ? (
          <p role="alert" className="mt-2 text-sm text-sale">
            {error}
          </p>
        ) : null}
        <Button type="submit" className="mt-4 w-full" disabled={busy}>
          {busy ? t("admin.mfa.checking") : t("admin.mfa.confirm")}
        </Button>
      </form>

      <button
        type="button"
        onClick={signOut}
        className="mt-4 w-full text-center text-xs text-muted-foreground underline underline-offset-4"
      >
        {t("admin.mfa.signOut")}
      </button>
    </MfaFrame>
  );
}
