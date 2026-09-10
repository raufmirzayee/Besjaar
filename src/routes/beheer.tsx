import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { AdminAccessProvider, AdminShell } from "@/components/admin/admin-shell";
import { LoadingState } from "@/components/admin/admin-ui";
import { NotFound } from "@/components/not-found";
import { StaffSignIn } from "@/components/admin/staff-sign-in";
import { useAuth } from "@/lib/auth";
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

/**
 * The admin gate.
 *
 * A visitor who is not staff gets the site's ordinary 404 — the same response
 * a URL that does not exist would give. The admin is not announced, not
 * explained, and not distinguishable from a typo, which is the point: nobody
 * browsing the shop should learn that a backoffice is here.
 *
 * This is presentation only. Every admin server function re-checks the role
 * server-side and the database enforces it again through RLS, so hiding the
 * screen is the last layer, never the control.
 */
function BeheerLayout() {
  const { user, loading } = useAuth();
  const fetchAccess = useServerFn(getMyAccess);

  const accessQuery = useQuery({
    queryKey: ["admin-access", user?.id],
    enabled: Boolean(user),
    queryFn: () => fetchAccess({}) as Promise<AdminAccess>,
    retry: false,
  });

  if (loading || (user && accessQuery.isPending)) {
    return (
      <div className="container-page py-20">
        <LoadingState label="Laden…" />
      </div>
    );
  }

  // Signed out: the staff sign-in, with no storefront chrome around it. It
  // gives nothing away that the 404 below does not, because reaching it means
  // already knowing the address.
  if (!user) return <StaffSignIn />;

  const access = accessQuery.data ?? { roles: [], permissions: [] };
  const isStaff = access.roles.some((role) => role !== "customer");

  // Signed in as a customer: identical to any unknown URL. No "no access"
  // message, because that message is itself a disclosure.
  if (!isStaff) return <NotFound />;

  return (
    <AdminAccessProvider access={access}>
      <AdminShell>
        <Outlet />
      </AdminShell>
    </AdminAccessProvider>
  );
}
