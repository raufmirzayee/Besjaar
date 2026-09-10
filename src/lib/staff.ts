/**
 * Staff pool — the pure parts, safe for the browser bundle.
 * The database work lives in `staff.server.ts`.
 */

export type StaffAccount = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
  deactivated_at: string | null;
  roles: string[];
};

export type AppRole =
  | "super_admin"
  | "store_manager"
  | "warehouse"
  | "customer_service"
  | "content_editor"
  | "financial"
  | "customer";

/**
 * Roles a super admin can assign. "customer" is deliberately absent: staff and
 * customers are separate pools, so a staff account never carries a shopper
 * role and the two lists cannot drift into overlapping.
 */
export const STAFF_ROLE_OPTIONS = [
  "super_admin",
  "store_manager",
  "warehouse",
  "customer_service",
  "content_editor",
  "financial",
] as const satisfies readonly AppRole[];

export const STAFF_ROLES: AppRole[] = [...STAFF_ROLE_OPTIONS];

export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Super admin",
  store_manager: "Winkelmanager",
  warehouse: "Magazijn",
  customer_service: "Klantenservice",
  content_editor: "Content",
  financial: "Financieel",
  customer: "Klant",
};

/** Labels a role that arrives from the database as a plain string. */
export function roleLabel(role: string): string {
  return ROLE_LABELS[role as AppRole] ?? role;
}
