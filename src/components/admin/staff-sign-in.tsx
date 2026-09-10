import { useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";

/**
 * Staff sign-in.
 *
 * Deliberately bare: no storefront header, footer, language switcher, cart or
 * "create an account" link. Staff accounts are created by a super admin, never
 * by signing up here, so there is nothing to offer but the two fields.
 *
 * It carries no branding beyond the shop name and never says whether an
 * address exists or which half of a wrong pair was wrong.
 */
export function StaffSignIn() {
  const { signIn } = useAuth();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
      // The gate re-reads the roles; a customer who signs in here still gets
      // the 404, because the pool check happens server-side.
      await queryClient.invalidateQueries({ queryKey: ["admin-access"] });
    } catch {
      // One message for every failure. Naming the cause would tell an attacker
      // which addresses are staff.
      setError("Inloggen mislukt. Controleer je gegevens.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2 text-muted-foreground">
          <ShieldCheck className="size-5" aria-hidden="true" />
          <span className="text-sm font-semibold uppercase tracking-widest">Besjaar beheer</span>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border bg-card p-6 shadow-soft">
          <h1 className="text-lg font-semibold">Inloggen</h1>
          <p className="mt-1 text-sm text-muted-foreground">Alleen voor medewerkersaccounts.</p>

          <div className="mt-5 space-y-4">
            <div>
              <Label htmlFor="staff-email" className="mb-1.5 block">
                E-mailadres
              </Label>
              <Input
                id="staff-email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="staff-password" className="mb-1.5 block">
                Wachtwoord
              </Label>
              <Input
                id="staff-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
          </div>

          {error ? (
            <p role="alert" className="mt-4 text-sm text-sale">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="mt-5 w-full" disabled={busy}>
            {busy ? "Bezig…" : "Inloggen"}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Geen toegang meer? Vraag een super admin om je account te herstellen.
        </p>
      </div>
    </div>
  );
}
