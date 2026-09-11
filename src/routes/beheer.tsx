import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { AdminAccessProvider, AdminShell } from "@/components/admin/admin-shell";
import { LoadingState } from "@/components/admin/admin-ui";
import { FirstAdminClaim } from "@/components/admin/first-admin-claim";
import { NotFound } from "@/components/not-found";
import { StaffSignIn } from "@/components/admin/staff-sign-in";
import { StaffMfaChallenge, StaffMfaEnrol } from "@/components/admin/staff-mfa";
import { supabase } from "@/integrations/supabase/client";
import { staffGateState } from "@/lib/mfa";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { canClaimFirstAdmin } from "@/lib/admin.functions";
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
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const fetchAccess = useServerFn(getMyAccess);

  const accessQuery = useQuery({
    queryKey: ["admin-access", user?.id],
    enabled: Boolean(user),
    queryFn: () => fetchAccess({}) as Promise<AdminAccess>,
    retry: false,
  });

  // Where this session stands on two-factor: enrol, prove it, or carry on.
  const mfaQuery = useQuery({
    queryKey: ["staff-mfa", user?.id],
    enabled: Boolean(user),
    retry: false,
    queryFn: async () => {
      const [{ data: factors }, { data: sessionData }] = await Promise.all([
        supabase.auth.mfa.listFactors(),
        supabase.auth.getSession(),
      ]);
      // The access token carries the assurance level the server will see, so
      // read it from there rather than trusting a separate client-side flag.
      const claims = decodeClaims(sessionData.session?.access_token);
      return staffGateState({ factors: factors?.all ?? [], claims });
    },
  });

  // Only asked once the access query has come back without a staff role: on a
  // shop that already has staff this never runs, so the usual case costs
  // nothing. The server answers a plain boolean and never says why not.
  const isStaffRole = (accessQuery.data?.roles ?? []).some((role) => role !== "customer");
  const mayClaim = useServerFn(canClaimFirstAdmin);
  const claimQuery = useQuery({
    queryKey: ["first-admin-claim", user?.id],
    enabled: Boolean(user) && accessQuery.isSuccess && !isStaffRole,
    retry: false,
    queryFn: () => mayClaim({}) as Promise<{ allowed: boolean }>,
  });

  /** After enrolling or answering the challenge, pick up the upgraded session. */
  async function refreshSession() {
    await supabase.auth.refreshSession();
    await queryClient.invalidateQueries();
  }

  if (loading || (user && accessQuery.isPending)) {
    return (
      <div className="container-page py-20">
        <LoadingState label={t("admin.gate.loading")} />
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
  //
  // The single exception is a shop with no staff at all, where the operator's
  // configured address is offered the one-time claim. That is not a
  // disclosure: on a shop in that state there is no backoffice to hide yet,
  // and every other address still gets the 404 below.
  if (!isStaff) {
    if (claimQuery.isPending) {
      return (
        <div className="container-page py-20">
          <LoadingState label={t("admin.gate.loading")} />
        </div>
      );
    }
    if (claimQuery.data?.allowed) {
      return <FirstAdminClaim onClaimed={() => void refreshSession()} />;
    }
    return <NotFound />;
  }

  // Staff, but the second factor is still outstanding. This only decides what
  // to draw; the server refuses every admin call on a password-only session
  // regardless of what this component does.
  if (mfaQuery.isPending) {
    return (
      <div className="container-page py-20">
        <LoadingState label={t("admin.gate.loading")} />
      </div>
    );
  }
  if (mfaQuery.data === "enrol") {
    return <StaffMfaEnrol onDone={() => void refreshSession()} />;
  }
  if (mfaQuery.data === "challenge") {
    return <StaffMfaChallenge onDone={() => void refreshSession()} />;
  }

  return (
    <AdminAccessProvider access={access}>
      <AdminShell>
        <Outlet />
      </AdminShell>
    </AdminAccessProvider>
  );
}

/**
 * Reads the payload of an access token Supabase already issued.
 *
 * Not a validation step and not treated as one: the server re-verifies the
 * same token on every call. This only decides which screen to draw.
 */
function decodeClaims(token: string | undefined): { aal?: string } | null {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as { aal?: string };
  } catch {
    return null;
  }
}
