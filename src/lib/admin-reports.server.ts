/**
 * The operational reports, read through the service-role client.
 *
 * Each of these sits on a database view that used to be granted to
 * `authenticated` — meaning any signed-in shopper could read the shop's staff
 * directory, its stock reconciliation and its translation queue. The views are
 * server-only now, so this module is the only way in, and every function above
 * it names the permission it needs.
 *
 * Reads go through the service-role client on purpose: the views deliberately
 * cross rows that no single staff member's RLS would return, and the decision
 * about who may see them is made one layer up by requirePermission.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * The views are not in the generated Database type.
 *
 * `supabase gen types` emits views without Insert/Update shapes, and the
 * client's overload resolution then collapses `.insert()` on every *table* to
 * never — so adding them breaks unrelated code. The row shapes are declared
 * explicitly below instead, which is what the callers actually rely on.
 */
const reports = supabaseAdmin as any;

export type StaffRoleAuditRow = {
  user_id: string;
  email: string | null;
  role: string;
  granted_at: string;
  in_staff_pool: boolean;
};

/**
 * Every account holding a staff role.
 *
 * A row here that nobody recognises is a finding, and a row with
 * `in_staff_pool = false` is a stronger one: it means a role exists outside
 * the pool the database is meant to enforce.
 */
export async function fetchStaffRoleAudit(): Promise<StaffRoleAuditRow[]> {
  const { data, error } = await reports
    .from("staff_role_audit")
    .select("user_id, email, role, granted_at, in_staff_pool");
  if (error) throw new Error(error.message);
  return (data ?? []) as StaffRoleAuditRow[];
}

export type ReconciliationRow = {
  product_id: string;
  sku: string | null;
  name: string;
  on_hand: number;
  ledger_sum: number;
  movement_count: number;
  opening_balance_implied: number;
  assessment: string;
};

/**
 * Where the shelf and the ledger disagree.
 *
 * `onlyDiscrepancies` is the default because the interesting rows are the ones
 * that need a physical count; the full list is every product in the shop.
 */
export async function fetchInventoryReconciliation(
  onlyDiscrepancies = true,
): Promise<ReconciliationRow[]> {
  let query = reports
    .from("inventory_reconciliation")
    .select(
      "product_id, sku, name, on_hand, ledger_sum, movement_count, opening_balance_implied, assessment",
    )
    .order("name");
  if (onlyDiscrepancies) query = query.eq("assessment", "needs a physical count");

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as ReconciliationRow[];
}

export type TranslationQueueRow = {
  id: string;
  slug: string;
  name: string;
  status: string;
  source_locale: string;
  translation_status: string | null;
  translated_at: string | null;
  reason: string;
};

/** Products never translated, or edited since their last translation pass. */
export async function fetchTranslationQueue(limit = 200): Promise<TranslationQueueRow[]> {
  const { data, error } = await reports
    .from("products_awaiting_translation")
    .select("id, slug, name, status, source_locale, translation_status, translated_at, reason")
    .order("source_content_updated_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 500));
  if (error) throw new Error(error.message);
  return (data ?? []) as TranslationQueueRow[];
}
