import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getIsStaffAccount } from "@/lib/staff.functions";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/inloggen")({
  head: () => ({
    meta: [
      { title: "Inloggen of registreren — Besjaar" },
      {
        name: "description",
        content:
          "Log in op je Besjaar account of maak een nieuw account aan om je bestellingen te volgen.",
      },
      { property: "og:title", content: "Inloggen of registreren — Besjaar" },
      { property: "og:description", content: "Log in of maak een Besjaar account aan." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { signIn, signUp, signOut, requestPasswordReset } = useAuth();
  const checkStaff = useServerFn(getIsStaffAccount);
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [login, setLogin] = useState({ email: "", password: "" });
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [register, setRegister] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await signIn(login.email, login.password);

      // Staff and customers are separate pools. A staff account signing in
      // here would get a customer session it cannot use — it cannot order, and
      // has no order history — so send it back out with an explanation rather
      // than leaving someone stuck on a broken account page.
      const { staff } = (await checkStaff({})) as { staff: boolean };
      if (staff) {
        await signOut();
        toast.error(t("auth.staffUseAdminLogin"));
        return;
      }

      toast.success(t("auth.welcomeBack"));
      navigate({ to: "/account" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("auth.signInFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function handleReset(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await requestPasswordReset(resetEmail);
      // Always the same confirmation, whether or not the address is known:
      // a different message would let anyone test which e-mails have accounts.
      setResetSent(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("auth.resetFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function handleRegister(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const { needsConfirmation } = await signUp(register);
      if (needsConfirmation) {
        toast.success(t("auth.confirmEmail"));
      } else {
        toast.success(t("auth.accountCreated"));
        navigate({ to: "/account" });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("auth.registerFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-md rounded-2xl border bg-card p-8 shadow-soft">
        <h1 className="text-2xl font-bold">{t("auth.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("auth.subtitle")}</p>

        <Tabs defaultValue="login" className="mt-6">
          <TabsList className="w-full">
            <TabsTrigger value="login" className="flex-1">
              {t("auth.signIn")}
            </TabsTrigger>
            <TabsTrigger value="register" className="flex-1">
              {t("auth.register")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleLogin} className="mt-4 space-y-4">
              <div>
                <Label htmlFor="login-email" className="mb-1.5 block">
                  {t("auth.email")}
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={login.email}
                  onChange={(e) => setLogin({ ...login, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="login-password" className="mb-1.5 block">
                  {t("auth.password")}
                </Label>
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={login.password}
                  onChange={(e) => setLogin({ ...login, password: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? t("auth.busy") : t("auth.signIn")}
              </Button>
            </form>

            {/* Without this a customer who forgets their password is locked
                out of their order history for good. */}
            {resetSent ? (
              <p className="mt-4 rounded-lg border bg-surface p-3 text-sm text-muted-foreground">
                {t("auth.resetSent")}
              </p>
            ) : resetOpen ? (
              <form
                onSubmit={handleReset}
                className="mt-4 space-y-3 rounded-lg border bg-surface p-4"
              >
                <div>
                  <Label htmlFor="reset-email" className="mb-1.5 block">
                    {t("auth.email")}
                  </Label>
                  <Input
                    id="reset-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                  />
                  <p className="mt-1.5 text-xs text-muted-foreground">{t("auth.resetHint")}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" size="sm" disabled={busy}>
                    {busy ? t("auth.busy") : t("auth.resetSubmit")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setResetOpen(false)}
                  >
                    {t("auth.cancel")}
                  </Button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setResetEmail(login.email);
                  setResetOpen(true);
                }}
                className="mt-3 text-sm text-primary underline underline-offset-4 hover:text-primary-hover"
              >
                {t("auth.forgotPassword")}
              </button>
            )}
          </TabsContent>

          <TabsContent value="register">
            <form onSubmit={handleRegister} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="register-first-name" className="mb-1.5 block">
                    {t("auth.firstName")}
                  </Label>
                  <Input
                    id="register-first-name"
                    autoComplete="given-name"
                    required
                    value={register.firstName}
                    onChange={(e) => setRegister({ ...register, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="register-last-name" className="mb-1.5 block">
                    {t("auth.lastName")}
                  </Label>
                  <Input
                    id="register-last-name"
                    autoComplete="family-name"
                    required
                    value={register.lastName}
                    onChange={(e) => setRegister({ ...register, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="register-email" className="mb-1.5 block">
                  {t("auth.email")}
                </Label>
                <Input
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={register.email}
                  onChange={(e) => setRegister({ ...register, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="register-password" className="mb-1.5 block">
                  {t("auth.password")}
                </Label>
                <Input
                  id="register-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={register.password}
                  onChange={(e) => setRegister({ ...register, password: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? t("auth.busy") : t("auth.createAccount")}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {t("auth.guestPrefix")}
          <Link to="/afrekenen" className="underline">
            {t("auth.guestLink")}
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
