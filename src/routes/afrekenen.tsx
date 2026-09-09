import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { cloneElement, isValidElement, useId, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getPaymentAvailability, getShippingMethods, placeOrder } from "@/lib/checkout.functions";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/afrekenen")({
  head: () => ({
    meta: [
      { title: "Afrekenen — Besjaar" },
      {
        name: "description",
        content: "Rond je bestelling bij Besjaar veilig af: adres, verzending en betaling.",
      },
      { property: "og:title", content: "Afrekenen — Besjaar" },
      { property: "og:description", content: "Rond je Besjaar bestelling veilig af." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

const addressSchema = z.object({
  email: z.string().email("checkout.errEmail"),
  first_name: z.string().min(2, "checkout.errFirstName"),
  last_name: z.string().min(2, "checkout.errLastName"),
  company_name: z.string().optional(),
  street: z.string().min(2, "checkout.errStreet"),
  house_number: z.string().min(1, "checkout.errHouseNumber"),
  house_number_addition: z.string().optional(),
  postal_code: z.string().min(4, "checkout.errPostalCode"),
  city: z.string().min(2, "checkout.errCity"),
  country: z.enum(["NL", "BE", "DE"]),
  phone: z.string().optional(),
  customer_note: z.string().optional(),
});

type FormState = z.input<typeof addressSchema>;

const PAYMENT_METHODS = [
  { id: "ideal", label: "iDEAL", hint: "checkout.idealHint" },
  { id: "bancontact", label: "Bancontact", hint: "checkout.bancontactHint" },
  { id: "creditcard", label: "Creditcard", hint: "checkout.creditcardHint" },
] as const;

function CheckoutPage() {
  const navigate = useNavigate();
  const { lines, subtotal, clear } = useCart();
  const { user } = useAuth();
  const { t } = useI18n();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [methodId, setMethodId] = useState<string | null>(null);
  const [payment, setPayment] = useState("ideal");
  // Reports whether a payment provider is connected, so the customer is told
  // up front when placing the order will not take a payment.
  const { data: paymentAvailability } = useQuery({
    queryKey: ["payment-availability"],
    queryFn: () => getPaymentAvailability(),
    staleTime: 10 * 60 * 1000,
  });
  const paymentsConfigured = paymentAvailability?.configured;
  const [form, setForm] = useState<FormState>({
    email: user?.email ?? "",
    first_name: "",
    last_name: "",
    company_name: "",
    street: "",
    house_number: "",
    house_number_addition: "",
    postal_code: "",
    city: "",
    country: "NL",
    phone: "",
    customer_note: "",
  });

  const { data: methods } = useQuery({
    queryKey: ["shipping-methods"],
    queryFn: () => getShippingMethods(),
    staleTime: 5 * 60 * 1000,
  });

  const selected = (methods ?? []).find((m) => m.id === methodId) ?? (methods ?? [])[0] ?? null;
  const shippingCost =
    selected && selected.free_above !== null && subtotal >= selected.free_above
      ? 0
      : (selected?.price ?? 0);
  const total = subtotal + shippingCost;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function validateAddress() {
    const result = addressSchema.safeParse(form);
    if (!result.success) {
      const next: Record<string, string> = {};
      for (const issue of result.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return false;
    }
    setErrors({});
    return true;
  }

  async function submit() {
    if (!validateAddress() || !selected) return;
    setSubmitting(true);
    try {
      const parsed = addressSchema.parse(form);
      const result = await placeOrder({
        data: {
          email: parsed.email,
          phone: parsed.phone ?? null,
          shipping: {
            first_name: parsed.first_name,
            last_name: parsed.last_name,
            company_name: parsed.company_name ?? null,
            street: parsed.street,
            house_number: parsed.house_number,
            house_number_addition: parsed.house_number_addition ?? null,
            postal_code: parsed.postal_code,
            city: parsed.city,
            country: parsed.country,
            phone: parsed.phone ?? null,
          },
          billing: null,
          shippingMethodId: selected.id,
          customerNote: parsed.customer_note ?? null,
          paymentMethod: payment,
          idempotencyKey: crypto.randomUUID(),
          userId: user?.id ?? null,
          lines: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        },
      });
      clear();

      // With a payment provider connected the customer completes payment on
      // the provider's page; the order stays unpaid until its webhook confirms.
      if (result.checkoutUrl) {
        window.location.assign(result.checkoutUrl);
        return;
      }

      navigate({
        to: "/bestelling/$orderNumber",
        params: { orderNumber: result.order_number },
        search: { email: parsed.email },
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("checkout.failed"));
    } finally {
      setSubmitting(false);
    }
  }

  if (lines.length === 0) {
    return (
      <div className="container-page py-16">
        <div className="mx-auto max-w-lg rounded-2xl border bg-card p-8 text-center shadow-soft">
          <h1 className="text-2xl font-bold">{t("checkout.title")}</h1>
          <p className="mt-3 text-muted-foreground">{t("checkout.emptyCart")}</p>
          <Button className="mt-6" asChild>
            <Link to="/winkel">{t("checkout.toShop")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold sm:text-4xl">{t("checkout.title")}</h1>
      <ol className="mt-4 flex flex-wrap gap-4 text-sm">
        {(["checkout.step1", "checkout.step2", "checkout.step3"] as const).map((label, index) => (
          <li
            key={label}
            className={step === index + 1 ? "font-semibold text-primary" : "text-muted-foreground"}
          >
            {index + 1}. {t(label)}
          </li>
        ))}
      </ol>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          {step === 1 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={t("checkout.email")}
                error={errors.email ? t(errors.email as never) : undefined}
                className="sm:col-span-2"
              >
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </Field>
              <Field
                label={t("checkout.firstName")}
                error={errors.first_name ? t(errors.first_name as never) : undefined}
              >
                <Input
                  value={form.first_name}
                  onChange={(e) => set("first_name", e.target.value)}
                />
              </Field>
              <Field
                label={t("checkout.lastName")}
                error={errors.last_name ? t(errors.last_name as never) : undefined}
              >
                <Input value={form.last_name} onChange={(e) => set("last_name", e.target.value)} />
              </Field>
              <Field label={t("checkout.company")} className="sm:col-span-2">
                <Input
                  value={form.company_name}
                  onChange={(e) => set("company_name", e.target.value)}
                />
              </Field>
              <Field
                label={t("checkout.street")}
                error={errors.street ? t(errors.street as never) : undefined}
              >
                <Input value={form.street} onChange={(e) => set("street", e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label={t("checkout.houseNumber")}
                  error={errors.house_number ? t(errors.house_number as never) : undefined}
                >
                  <Input
                    value={form.house_number}
                    onChange={(e) => set("house_number", e.target.value)}
                  />
                </Field>
                <Field label={t("checkout.addition")}>
                  <Input
                    value={form.house_number_addition}
                    onChange={(e) => set("house_number_addition", e.target.value)}
                  />
                </Field>
              </div>
              <Field
                label={t("checkout.postalCode")}
                error={errors.postal_code ? t(errors.postal_code as never) : undefined}
              >
                <Input
                  value={form.postal_code}
                  onChange={(e) => set("postal_code", e.target.value)}
                />
              </Field>
              <Field
                label={t("checkout.city")}
                error={errors.city ? t(errors.city as never) : undefined}
              >
                <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
              </Field>
              <Field label={t("checkout.country")}>
                <select
                  className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                  value={form.country}
                  onChange={(e) => set("country", e.target.value as FormState["country"])}
                >
                  <option value="NL">{t("checkout.countryNL")}</option>
                  <option value="BE">{t("checkout.countryBE")}</option>
                  <option value="DE">{t("checkout.countryDE")}</option>
                </select>
              </Field>
              <Field label={t("checkout.phone")}>
                <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              </Field>
              <Field label={t("checkout.note")} className="sm:col-span-2">
                <Textarea
                  value={form.customer_note}
                  onChange={(e) => set("customer_note", e.target.value)}
                  rows={3}
                />
              </Field>
              <div className="sm:col-span-2">
                <Button
                  onClick={() => {
                    if (validateAddress()) setStep(2);
                  }}
                >
                  {t("checkout.toShipping")}
                </Button>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <RadioGroup
                value={selected?.id ?? ""}
                onValueChange={setMethodId}
                className="space-y-3"
              >
                {(methods ?? []).map((m) => (
                  <label
                    key={m.id}
                    className="flex cursor-pointer items-start gap-3 rounded-xl border p-4 hover:bg-muted/50"
                  >
                    <RadioGroupItem value={m.id} className="mt-1" />
                    <span className="flex-1">
                      <span className="flex justify-between font-medium">
                        <span>{m.name}</span>
                        <span>
                          {m.free_above !== null && subtotal >= m.free_above
                            ? t("checkout.free")
                            : formatPrice(m.price)}
                        </span>
                      </span>
                      <span className="block text-sm text-muted-foreground">
                        {m.description} · {m.delivery_time}
                      </span>
                    </span>
                  </label>
                ))}
              </RadioGroup>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  {t("checkout.back")}
                </Button>
                <Button onClick={() => setStep(3)} disabled={!selected}>
                  {t("checkout.toPayment")}
                </Button>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              {paymentsConfigured === false ? (
                <p className="rounded-lg border border-sale/30 bg-sale/5 p-3 text-sm text-foreground">
                  {t("checkout.testMode")}
                </p>
              ) : null}
              <RadioGroup value={payment} onValueChange={setPayment} className="space-y-3">
                {PAYMENT_METHODS.map((m) => (
                  <label
                    key={m.id}
                    className="flex cursor-pointer items-start gap-3 rounded-xl border p-4 hover:bg-muted/50"
                  >
                    <RadioGroupItem value={m.id} className="mt-1" />
                    <span>
                      <span className="block font-medium">{m.label}</span>
                      <span className="block text-sm text-muted-foreground">{t(m.hint)}</span>
                    </span>
                  </label>
                ))}
              </RadioGroup>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)}>
                  {t("checkout.back")}
                </Button>
                <Button onClick={submit} disabled={submitting}>
                  {submitting
                    ? t("checkout.placing")
                    : t("checkout.placeOrder", { total: formatPrice(total) })}
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="h-fit rounded-2xl border bg-card p-6 shadow-soft">
          <h2 className="text-lg font-semibold">{t("checkout.yourOrder")}</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {lines.map((l) => (
              <li key={l.productId} className="flex justify-between gap-3">
                <span className="text-muted-foreground">
                  {l.quantity}× {l.name}
                </span>
                <span>{formatPrice(l.price * l.quantity)}</span>
              </li>
            ))}
          </ul>
          <Separator className="my-4" />
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("checkout.subtotal")}</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("checkout.shippingCost")}</dt>
              <dd>{shippingCost === 0 ? t("checkout.free") : formatPrice(shippingCost)}</dd>
            </div>
          </dl>
          <Separator className="my-4" />
          <div className="flex justify-between text-base font-semibold">
            <span>{t("checkout.total")}</span>
            <span>{formatPrice(total)}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{t("checkout.vatIncluded")}</p>
        </aside>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactElement<{ id?: string }>;
}) {
  const id = useId();
  return (
    <div className={className}>
      <Label htmlFor={id} className="mb-1.5 block text-sm">
        {label}
      </Label>
      {isValidElement(children) ? cloneElement(children, { id }) : children}
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
