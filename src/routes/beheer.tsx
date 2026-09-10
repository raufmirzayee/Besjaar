import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { AdminAccessProvider, AdminShell } from "@/components/admin/admin-shell";
import { LoadingState } from "@/components/admin/admin-ui";
import { useAuth } from "@/lib/auth";
import { claimFirstAdmin } from "@/lib/admin.functions";
import { getMyAccess } from "@/lib/admin-core.functions";
import type { AdminAccess } from "@/lib/admin-access";

export const Route = createFileRoute("/beheer")({
  head: () => ({
    meta: [
      { title: "Beheer — Besjaar" },
      { name: "description", content: "Beheer producten, voorraad, bestellingen en gebruikers." },
      { property: "og:title", content: "Beheer — Besjaar" },
      {
        property: "og:description",
        content: "Backoffice voor de Besjaar webshop en het magazijn.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: BeheerLayout,
});

function BeheerLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchAccess = useServerFn(getMyAccess);
  const claim = useServerFn(claimFirstAdmin);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/inloggen", replace: true });
  }, [loading, user, navigate]);

  const accessQuery = useQuery({
    queryKey: ["admin-access", user?.id],
    enabled: Boolean(user),
    queryFn: () => fetchAccess({}) as Promise<AdminAccess>,
  });

  const claimMutation = useMutation({
    mutationFn: () => claim({}),
    onSuccess: () => {
      toast.success("Je bent nu super admin");
      queryClient.invalidateQueries({ queryKey: ["admin-access"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (loading || !user || accessQuery.isPending) {
    return (
      <div className="container-page py-20">
        <LoadingState label="Beheeromgeving laden…" />
      </div>
    );
  }

  const access = accessQuery.data ?? { roles: [], permissions: [] };
  const isStaff = access.roles.some((r) => r !== "customer");

  if (!isStaff) {
    return (
      <div className="container-page py-20">
        <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8 text-center">
          <h1 className="text-xl font-semibold">Geen toegang tot het beheer</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Je account heeft geen medewerkersrol. Bij een nieuwe webshop kan één account zichzelf
            eenmalig als beheerder instellen — maar alleen het adres dat in{" "}
            <code>ADMIN_BOOTSTRAP_EMAIL</code> staat. Staat dat er niet, ken de rol dan toe via SQL.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Button onClick={() => claimMutation.mutate()} disabled={claimMutation.isPending}>
              {claimMutation.isPending ? "Bezig…" : "Eerste beheerder worden"}
            </Button>
            <Button variant="outline" asChild>
              <Link to="/account">Naar mijn account</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminAccessProvider access={access}>
      <AdminShell>
        <Outlet />
      </AdminShell>
    </AdminAccessProvider>
  );
}
