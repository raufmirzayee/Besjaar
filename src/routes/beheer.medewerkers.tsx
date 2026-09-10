import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ShieldAlert, ShieldCheck, SmartphoneNfc, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createStaff,
  getStaffAccounts,
  resetStaffMfaFactors,
  setStaffAccountActive,
} from "@/lib/staff.functions";
import { useI18n } from "@/lib/i18n";
import type { StaffAccount } from "@/lib/staff";
import { STAFF_ROLE_OPTIONS, roleLabel } from "@/lib/staff";

export const Route = createFileRoute("/beheer/medewerkers")({
  component: StaffPage,
});

/** A password nobody has to invent, long enough for the server's minimum. */
function suggestPassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint32Array(18));
  return Array.from(bytes, (n) => alphabet[n % alphabet.length]).join("");
}

function StaffPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const fetchStaff = useServerFn(getStaffAccounts);
  const create = useServerFn(createStaff);
  const setActive = useServerFn(setStaffAccountActive);
  const resetMfa = useServerFn(resetStaffMfaFactors);

  const [form, setForm] = useState({
    email: "",
    fullName: "",
    role: "store_manager",
    password: suggestPassword(),
  });

  const { data, isPending, error } = useQuery({
    queryKey: ["staff-accounts"],
    queryFn: () => fetchStaff({}) as Promise<StaffAccount[]>,
  });

  const createMutation = useMutation({
    mutationFn: () => create({ data: form }),
    onSuccess: () => {
      toast.success(`Medewerkersaccount aangemaakt voor ${form.email}`);
      setForm({ email: "", fullName: "", role: "store_manager", password: suggestPassword() });
      queryClient.invalidateQueries({ queryKey: ["staff-accounts"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const resetMfaMutation = useMutation({
    mutationFn: (userId: string) => resetMfa({ data: { userId } }),
    onSuccess: () => {
      toast.success(t("admin.staff.mfaCleared"));
      queryClient.invalidateQueries({ queryKey: ["staff-accounts"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const activeMutation = useMutation({
    mutationFn: (input: { userId: string; active: boolean }) => setActive({ data: input }),
    onSuccess: (_result, input) => {
      toast.success(input.active ? t("admin.staff.reactivated") : t("admin.staff.deactivated"));
      queryClient.invalidateQueries({ queryKey: ["staff-accounts"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold">{t("admin.staff.title")}</h2>
        <p className="text-sm text-muted-foreground">
          Medewerkersaccounts staan los van klantaccounts. Een klant kan geen medewerker worden en
          een medewerker kan niet bestellen — de database dwingt dat af, niet alleen dit scherm.
          Iedere medewerker heeft daarnaast tweestapsverificatie nodig; zonder code werkt geen
          enkele beheerhandeling, ook niet met het juiste wachtwoord.
        </p>
      </div>

      <section className="rounded-xl border border-border p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
          <UserPlus className="size-4" aria-hidden="true" />
          {t("admin.staff.newStaff")}
        </h3>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="staff-name" className="text-xs">
              {t("admin.common.name")}
            </Label>
            <Input
              id="staff-name"
              value={form.fullName}
              onChange={(event) => setForm({ ...form, fullName: event.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="staff-email" className="text-xs">
              E-mailadres
            </Label>
            <Input
              id="staff-email"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="naam@besjaar.nl"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="staff-role" className="text-xs">
              Rol
            </Label>
            <Select value={form.role} onValueChange={(role) => setForm({ ...form, role })}>
              <SelectTrigger id="staff-role" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAFF_ROLE_OPTIONS.map((role) => (
                  <SelectItem key={role} value={role}>
                    {roleLabel(role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="staff-password" className="text-xs">
              {t("admin.staff.startPassword")}
            </Label>
            <div className="mt-1 flex gap-2">
              <Input
                id="staff-password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                className="font-mono text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setForm({ ...form, password: suggestPassword() })}
              >
                {t("admin.staff.regenerate")}
              </Button>
            </div>
          </div>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Geef dit wachtwoord persoonlijk door en laat het bij de eerste keer inloggen wijzigen. Het
          is hierna niet meer op te vragen.
        </p>

        <Button
          className="mt-3"
          disabled={createMutation.isPending}
          onClick={() => createMutation.mutate()}
        >
          {createMutation.isPending ? t("admin.common.busy") : t("admin.staff.createAccount")}
        </Button>
      </section>

      <section>
        <h3 className="mb-2 flex items-center gap-2 text-sm font-bold">
          <ShieldCheck className="size-4" aria-hidden="true" />
          {t("admin.staff.existing")}
        </h3>

        {isPending ? (
          <p className="text-sm text-muted-foreground">{t("admin.common.loading")}</p>
        ) : error ? (
          <p className="text-sm text-destructive">{(error as Error).message}</p>
        ) : (data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("admin.staff.empty")}</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {(data ?? []).map((account) => (
              <li
                key={account.user_id}
                className="flex flex-wrap items-center justify-between gap-3 px-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{account.full_name ?? account.email}</p>
                  <p className="truncate text-xs text-muted-foreground">{account.email}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {account.roles.length === 0 ? (
                      <Badge variant="outline">{t("admin.staff.noRole")}</Badge>
                    ) : (
                      account.roles.map((role) => (
                        <Badge key={role} variant="secondary">
                          {roleLabel(role)}
                        </Badge>
                      ))
                    )}
                    {!account.is_active ? (
                      <Badge variant="outline">{t("admin.staff.deactivatedBadge")}</Badge>
                    ) : null}
                    {account.mfa_enrolled ? (
                      <Badge variant="stock" className="gap-1">
                        <ShieldCheck className="size-3" aria-hidden="true" /> 2FA actief
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <ShieldAlert className="size-3" aria-hidden="true" /> 2FA nog niet ingesteld
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {account.mfa_enrolled ? (
                    <Button
                      size="sm"
                      variant="subtle"
                      disabled={resetMfaMutation.isPending}
                      onClick={() => resetMfaMutation.mutate(account.user_id)}
                    >
                      <SmartphoneNfc className="mr-1 size-3.5" aria-hidden="true" />
                      2FA resetten
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant={account.is_active ? "outline" : "default"}
                    disabled={activeMutation.isPending}
                    onClick={() =>
                      activeMutation.mutate({
                        userId: account.user_id,
                        active: !account.is_active,
                      })
                    }
                  >
                    {account.is_active ? t("admin.staff.deactivate") : t("admin.staff.reactivate")}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          Deactiveren trekt alle rollen direct in — de toegang stopt meteen, de naam blijft in het
          auditlogboek staan. Telefoon kwijt? Reset de tweestapsverificatie; de medewerker stelt bij
          de volgende login een nieuwe authenticator in.
        </p>
      </section>
    </div>
  );
}
