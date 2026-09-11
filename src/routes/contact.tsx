import { useMutation } from "@tanstack/react-query";
import { localeFromHead, localisedSeo } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { CompanyDetails } from "@/components/company-details";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendContactMessage } from "@/lib/contact.functions";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/contact")({
  head: (ctx) => localisedSeo("contact", { path: "/contact", locale: localeFromHead(ctx) }),
  component: ContactPage,
});

function ContactPage() {
  const { t } = useI18n();
  // Built inside the component rather than at module scope: the labels, and
  // the opening hours, read differently in each language.
  const details = [
    { icon: Mail, label: t("contact.labelEmail"), value: "klantenservice@besjaar.nl" },
    { icon: Phone, label: t("contact.labelPhone"), value: "+31 (0)85 000 0000" },
    { icon: Clock, label: t("contact.labelHours"), value: t("contact.valueHours") },
    { icon: MapPin, label: t("contact.labelWarehouse"), value: t("contact.valueWarehouse") },
  ];
  const send = useServerFn(sendContactMessage);
  const mountedAt = useRef(Date.now());
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    orderNumber: "",
    subject: "",
    message: "",
    company: "",
  });
  const [sent, setSent] = useState(false);

  const mutation = useMutation({
    mutationFn: () => send({ data: { ...form, elapsedMs: Date.now() - mountedAt.current } }),
    onSuccess: () => {
      setSent(true);
      toast.success(t("contact.success"));
      setForm({
        name: "",
        email: "",
        phone: "",
        orderNumber: "",
        subject: "",
        message: "",
        company: "",
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="container-page py-12">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          {t("contact.eyebrow")}
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">{t("contact.title")}</h1>
        <p className="mt-3 text-muted-foreground">
          {t("contact.introPrefix")}{" "}
          <Link
            to="/retouren"
            className="text-primary underline underline-offset-4 hover:text-primary-hover"
          >
            {t("contact.introLink")}
          </Link>
          .
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {details.map((item) => (
            <div key={item.label} className="flex items-start gap-3 rounded-xl border bg-card p-4">
              <item.icon className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        <section className="mt-10 rounded-xl border bg-card p-6">
          <h2 className="font-display text-xl font-semibold">{t("contact.formTitle")}</h2>
          {sent ? (
            <p className="mt-3 rounded-lg bg-success/10 p-3 text-sm text-foreground">
              {t("contact.sentNotice")}
            </p>
          ) : null}
          <form
            className="mt-4 grid gap-4 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              mutation.mutate();
            }}
          >
            <div className="grid gap-1.5">
              <Label htmlFor="name">{t("contact.name")}</Label>
              <Input
                id="name"
                required
                maxLength={100}
                value={form.name}
                onChange={(e) => set("name")(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="email">{t("contact.email")}</Label>
              <Input
                id="email"
                type="email"
                required
                maxLength={255}
                value={form.email}
                onChange={(e) => set("email")(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="phone">{t("contact.phone")}</Label>
              <Input
                id="phone"
                maxLength={40}
                value={form.phone}
                onChange={(e) => set("phone")(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="orderNumber">{t("contact.orderNumber")}</Label>
              <Input
                id="orderNumber"
                maxLength={40}
                value={form.orderNumber}
                onChange={(e) => set("orderNumber")(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="subject">{t("contact.subject")}</Label>
              <Input
                id="subject"
                required
                maxLength={150}
                value={form.subject}
                onChange={(e) => set("subject")(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="message">{t("contact.message")}</Label>
              <Textarea
                id="message"
                required
                rows={6}
                maxLength={2000}
                value={form.message}
                onChange={(e) => set("message")(e.target.value)}
              />
            </div>

            {/* Honeypot — hidden from real visitors, filled by bots. */}
            <div className="hidden" aria-hidden="true">
              <label htmlFor="company">Bedrijf</label>
              <input
                id="company"
                name="company"
                tabIndex={-1}
                autoComplete="off"
                value={form.company}
                onChange={(e) => set("company")(e.target.value)}
              />
            </div>

            <div className="sm:col-span-2">
              <Button type="submit" size="lg" disabled={mutation.isPending}>
                {mutation.isPending ? t("contact.sending") : t("contact.submit")}
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">
                {t("contact.privacyPrefix")}
                <Link to="/privacy" className="underline underline-offset-4">
                  {t("contact.privacyLink")}
                </Link>
                .
              </p>
            </div>
          </form>
        </section>

        <CompanyDetails className="mt-8 rounded-xl border bg-surface p-6 text-sm text-muted-foreground" />
      </div>
    </div>
  );
}
