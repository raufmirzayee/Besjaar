/**
 * The staff pool.
 *
 * Staff accounts are a separate population from customers, and the database
 * enforces it: a non-customer role cannot exist for an account outside
 * staff_accounts, and an order cannot belong to one inside it. These functions
 * are the only supported way to move an account into or out of that pool.
 *
 * Public sign-up has no path here — a staff account is created by a super
 * admin, with its own password, and the person receives an invitation.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { StaffAccount } from "./staff";

export type { StaffAccount };

/** Whether an account belongs to the staff pool and is still active. */
export async function isStaffAccount(admin: any, userId: string): Promise<boolean> {
  const { data, error } = await admin
    .from("staff_accounts")
    .select("user_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data);
}

export async function listStaffAccounts(admin: any): Promise<StaffAccount[]> {
  const { data, error } = await admin
    .from("staff_accounts")
    .select("user_id, email, full_name, is_active, created_at, deactivated_at")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as any[];
  if (rows.length === 0) return [];

  const { data: roleRows } = await admin
    .from("user_roles")
    .select("user_id, role")
    .in(
      "user_id",
      rows.map((row) => row.user_id),
    );

  const byUser = new Map<string, string[]>();
  for (const row of (roleRows ?? []) as any[]) {
    if (row.role === "customer") continue;
    byUser.set(row.user_id, [...(byUser.get(row.user_id) ?? []), row.role]);
  }

  return rows.map((row) => ({ ...row, roles: byUser.get(row.user_id) ?? [] }));
}

export type CreateStaffInput = {
  email: string;
  fullName: string;
  role: string;
  /** Set by the creator and given to the new colleague to change on first use. */
  password: string;
};

/**
 * Creates a staff account: an auth user, its staff_accounts row, then the
 * role. Order matters — the database refuses the role until the account is in
 * the pool.
 */
export async function createStaffAccount(
  admin: any,
  input: CreateStaffInput,
  actorId: string,
): Promise<{ userId: string }> {
  const email = input.email.trim().toLowerCase();

  // A customer account must never be quietly converted: the two pools stay
  // distinct, so an existing shopper's address is refused outright.
  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existingProfile) {
    throw new Error(
      "Dit e-mailadres hoort al bij een klantaccount. Gebruik een apart adres voor medewerkers.",
    );
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.fullName, staff: true },
  });
  if (createError) throw new Error(createError.message);

  const userId = created?.user?.id as string | undefined;
  if (!userId) throw new Error("Aanmaken van het account is mislukt.");

  const { error: poolError } = await admin.from("staff_accounts").insert({
    user_id: userId,
    email,
    full_name: input.fullName,
    created_by: actorId,
  });
  if (poolError) {
    // Do not leave an orphaned auth user behind if the pool insert fails.
    await admin.auth.admin.deleteUser(userId).catch(() => undefined);
    throw new Error(poolError.message);
  }

  const { error: roleError } = await admin
    .from("user_roles")
    .insert({ user_id: userId, role: input.role });
  if (roleError) throw new Error(roleError.message);

  return { userId };
}

/**
 * Deactivates a staff account. The database trigger strips its staff roles, so
 * access ends immediately while the audit trail keeps the name.
 */
export async function setStaffActive(
  admin: any,
  userId: string,
  active: boolean,
): Promise<{ ok: true }> {
  const { error } = await admin
    .from("staff_accounts")
    .update({
      is_active: active,
      deactivated_at: active ? null : new Date().toISOString(),
    })
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return { ok: true };
}
