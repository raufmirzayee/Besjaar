import { useQueryClient } from "@tanstack/react-query";
import { KeyRound, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { isValidTotpCode } from "@/lib/mfa";

/** Frame shared by both steps, so the two screens read as one flow. */
function MfaFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2 text-muted-foreground">
          <ShieldCheck className="size-5" aria-hidden="true" />
          <span className="text-sm font-semibold uppercase tracking-widest">Besjaar beheer</span>
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
        setError(caught instanceof Error ? caught.message : "Instellen is niet gelukt.");
      }
    })();
  }, []);

  async function verify(event: React.FormEvent) {
    event.preventDefault();
    if (!factorId || !isValidTotpCode(code)) {
      setError("Vul de zes cijfers uit je app in.");
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
      setError("Die code klopt niet. Controleer de tijd op je telefoon en probeer opnieuw.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <MfaFrame>
      <h1 className="text-lg font-semibold">Tweestapsverificatie instellen</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Beheeraccounts hebben een authenticator-app nodig. Scan de code met Google Authenticator,
        1Password, Bitwarden of een vergelijkbare app.
      </p>

      {qr ? (
        <div className="mt-5 flex justify-center rounded-xl border bg-white p-3">
          <img src={qr} alt="QR-code voor je authenticator-app" className="size-44" />
        </div>
      ) : (
        <p className="mt-5 text-sm text-muted-foreground">Code laden…</p>
      )}

      {secret ? (
        <div className="mt-3">
          <p className="text-xs text-muted-foreground">
            Kun je niet scannen? Voer deze sleutel handmatig in:
          </p>
          <code className="mt-1 block break-all rounded-lg bg-surface px-3 py-2 font-mono text-xs">
            {secret}
          </code>
        </div>
      ) : null}

      <form onSubmit={verify} className="mt-5">
        <Label htmlFor="mfa-enrol-code" className="mb-1.5 block">
          Code uit de app
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
          {busy ? "Controleren…" : "Instellen afronden"}
        </Button>
      </form>

      <p className="mt-4 text-xs text-muted-foreground">
        Bewaar de sleutel op een veilige plek. Ben je je telefoon kwijt, dan kan een super admin je
        tweestapsverificatie opnieuw instellen.
      </p>
    </MfaFrame>
  );
}

/** Every later sign-in: the password is in, the code still has to be. */
export function StaffMfaChallenge({ onDone }: { onDone: () => void }) {
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!isValidTotpCode(code)) {
      setError("Vul de zes cijfers uit je app in.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError) throw listError;
      const factor = (factors?.totp ?? []).find((item) => item.status === "verified");
      if (!factor) throw new Error("Geen authenticator gevonden.");

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
      setError("Die code klopt niet. Probeer het opnieuw.");
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
        <KeyRound className="size-4" aria-hidden="true" /> Verificatiecode
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Vul de code uit je authenticator-app in om verder te gaan.
      </p>

      <form onSubmit={submit} className="mt-5">
        <Label htmlFor="mfa-code" className="mb-1.5 block">
          Zescijferige code
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
          {busy ? "Controleren…" : "Bevestigen"}
        </Button>
      </form>

      <button
        type="button"
        onClick={signOut}
        className="mt-4 w-full text-center text-xs text-muted-foreground underline underline-offset-4"
      >
        Uitloggen
      </button>
    </MfaFrame>
  );
}
