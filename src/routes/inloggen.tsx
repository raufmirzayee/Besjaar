import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const { signIn, signUp } = useAuth();
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [login, setLogin] = useState({ email: "", password: "" });
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
      toast.success(t("auth.welcomeBack"));
      navigate({ to: "/account" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("auth.signInFailed"));
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
                <Label className="mb-1.5 block">{t("auth.email")}</Label>
                <Input
                  type="email"
                  required
                  value={login.email}
                  onChange={(e) => setLogin({ ...login, email: e.target.value })}
                />
              </div>
              <div>
                <Label className="mb-1.5 block">{t("auth.password")}</Label>
                <Input
                  type="password"
                  required
                  value={login.password}
                  onChange={(e) => setLogin({ ...login, password: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? t("auth.busy") : t("auth.signIn")}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register">
            <form onSubmit={handleRegister} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="mb-1.5 block">{t("auth.firstName")}</Label>
                  <Input
                    required
                    value={register.firstName}
                    onChange={(e) => setRegister({ ...register, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block">{t("auth.lastName")}</Label>
                  <Input
                    required
                    value={register.lastName}
                    onChange={(e) => setRegister({ ...register, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block">{t("auth.email")}</Label>
                <Input
                  type="email"
                  required
                  value={register.email}
                  onChange={(e) => setRegister({ ...register, email: e.target.value })}
                />
              </div>
              <div>
                <Label className="mb-1.5 block">{t("auth.password")}</Label>
                <Input
                  type="password"
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
