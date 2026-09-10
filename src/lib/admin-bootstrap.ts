/**
 * Who may claim the first admin role.
 *
 * A deployed shop is reachable the moment it goes up, so "no admin exists yet"
 * is not on its own a safe condition to grant on — whoever signed up first
 * would be able to take the shop over. The claim therefore also requires the
 * caller to be the address the operator set in the deployment environment,
 * which only someone with access to that environment can do.
 *
 * The decision lives here, apart from the server function, so it is covered by
 * tests rather than only by inspection.
 */

export type ClaimContext = {
  /** ADMIN_BOOTSTRAP_EMAIL, as configured. Empty means self-claiming is off. */
  configuredEmail: string | undefined;
  /** The caller's address, taken from the verified session — never a request body. */
  callerEmail: string | null | undefined;
  /** Whether any non-customer role already exists. */
  staffExists: boolean;
};

export type ClaimDecision = { allowed: true } | { allowed: false; reason: string };

export function decideFirstAdminClaim(context: ClaimContext): ClaimDecision {
  const configured = (context.configuredEmail ?? "").trim().toLowerCase();
  if (!configured) {
    return {
      allowed: false,
      reason:
        "Zelf beheerder worden is uitgeschakeld. Stel ADMIN_BOOTSTRAP_EMAIL in, of ken de rol toe via SQL.",
    };
  }

  const caller = (context.callerEmail ?? "").trim().toLowerCase();
  if (!caller || caller !== configured) {
    return { allowed: false, reason: "Dit account mag zichzelf niet als beheerder instellen." };
  }

  if (context.staffExists) {
    return { allowed: false, reason: "Er is al een beheerder ingesteld." };
  }

  return { allowed: true };
}
