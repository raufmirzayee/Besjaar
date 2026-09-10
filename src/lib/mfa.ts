/**
 * Two-factor authentication for staff.
 *
 * A stolen or reused staff password is the attack that actually happens to
 * small shops, and separating the staff pool does nothing against it: the
 * credentials are genuine, they are just in the wrong hands. So every staff
 * session must reach assurance level 2 — password *and* a time-based code —
 * before it can touch a single admin function.
 *
 * The rules live here, apart from Supabase and from React, so they are covered
 * by tests rather than only by clicking through the screens.
 */

/** Supabase's authenticator assurance levels. aal1 is password only. */
export type AssuranceLevel = "aal1" | "aal2";

/** The claim shape this reads. Anything else in the token is ignored. */
export type SessionClaims = {
  aal?: string | null;
  [key: string]: unknown;
};

export function assuranceLevel(claims: SessionClaims | null | undefined): AssuranceLevel {
  // Anything that is not explicitly aal2 is treated as aal1. A missing or
  // unrecognised claim must never be read as "second factor satisfied".
  return claims?.aal === "aal2" ? "aal2" : "aal1";
}

export type StaffFactor = {
  id: string;
  status: string;
  friendly_name?: string | null;
};

/** What the admin gate should put on screen for a staff member. */
export type StaffGateState =
  | "enrol" // no authenticator yet: set one up before anything else
  | "challenge" // enrolled, but this session has not proved it yet
  | "ready"; // password and code both satisfied

export function staffGateState(input: {
  factors: StaffFactor[];
  claims: SessionClaims | null | undefined;
}): StaffGateState {
  if (!hasVerifiedFactor(input.factors)) return "enrol";
  return assuranceLevel(input.claims) === "aal2" ? "ready" : "challenge";
}

export function hasVerifiedFactor(factors: StaffFactor[] | null | undefined): boolean {
  return (factors ?? []).some((factor) => factor.status === "verified");
}

/**
 * Whether a staff session may act. Enrolment is not an excuse: an account with
 * no authenticator can reach the enrolment screen and nothing else, so a
 * password alone never carries out an admin action.
 */
export function staffSessionMayAct(claims: SessionClaims | null | undefined): boolean {
  return assuranceLevel(claims) === "aal2";
}

export const MFA_REQUIRED_MESSAGE =
  "Tweestapsverificatie is vereist voor beheeraccounts. Log opnieuw in en voer je code in.";

/** A TOTP code is six digits; anything else is not worth sending onward. */
export function isValidTotpCode(code: string): boolean {
  return /^\d{6}$/.test(code.trim());
}
