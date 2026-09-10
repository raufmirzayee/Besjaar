import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { localeFromHead, localisedSeo } from "@/lib/seo";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/account")({
  head: (ctx) =>
    localisedSeo("account", { path: "/account", locale: localeFromHead(ctx), noindex: true }),
  component: AccountPage,
});

type OrderRow = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total: number;
  created_at: string;
  email: string;
};

function AccountPage() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { t, locale } = useI18n();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/inloggen", replace: true });
  }, [loading, user, navigate]);

  const { data: orders, isPending } = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, status, payment_status, total, created_at, email")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as OrderRow[];
    },
  });

  if (loading || !user) {
    return (
      <div className="container-page py-16">
        <p className="text-center text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t("account.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("account.loggedInAs", { email: user.email ?? "" })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to="/retouren">{t("account.returns")}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/verlanglijst">{t("account.wishlist")}</Link>
          </Button>
          <Button variant="outline" onClick={() => signOut()}>
            {t("account.signOut")}
          </Button>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border bg-card p-6 shadow-soft">
        <h2 className="text-lg font-semibold">{t("account.myOrders")}</h2>
        <Separator className="my-4" />
        {isPending ? (
          <p className="text-sm text-muted-foreground">{t("account.ordersLoading")}</p>
        ) : (orders ?? []).length === 0 ? (
          <div className="text-sm text-muted-foreground">
            {t("account.noOrders")}
            <div className="mt-4">
              <Button asChild>
                <Link to="/winkel">{t("account.toShop")}</Link>
              </Button>
            </div>
          </div>
        ) : (
          <ul className="divide-y">
            {(orders ?? []).map((order) => (
              <li key={order.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="flex-1">
                  <p className="font-medium">{order.order_number}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString(locale)} ·{" "}
                    {order.payment_status === "paid" ? t("status.paid") : order.payment_status}
                  </p>
                </div>
                <p className="font-semibold">{formatPrice(order.total)}</p>
                <Button variant="outline" size="sm" asChild>
                  <Link
                    to="/bestelling/$orderNumber"
                    params={{ orderNumber: order.order_number }}
                    search={{ email: order.email }}
                  >
                    {t("account.view")}
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
