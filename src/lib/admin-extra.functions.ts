import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { logAudit, requirePermission } from "./admin-core.server";
import {
  archiveCategory,
  fetchAdminBrands,
  fetchAdminCategories,
  fetchAuditLogs,
  fetchCustomerDetail,
  fetchCustomers,
  fetchLowStockAlerts,
  fetchMovements,
  saveBrand,
  saveCategory,
  type BrandInput,
  type CategoryInput,
  type MovementFilters,
} from "./admin-extra.server";

export const getAdminCategories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requirePermission(context, "categories", "view");
    return fetchAdminCategories(context.supabase);
  });

export const upsertCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: CategoryInput) => input)
  .handler(async ({ context, data }) => {
    await requirePermission(context, "categories", data.id ? "edit" : "create");
    const result = await saveCategory(context.supabase, data);
    await logAudit({
      userId: context.userId,
      userEmail: (context.claims as { email?: string } | undefined)?.email ?? null,
      action: data.id ? "category.update" : "category.create",
      module: "categories",
      entityType: "category",
      entityId: result.id,
      newValue: data,
    });
    return result;
  });

export const archiveCategoryFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ context, data }) => {
    await requirePermission(context, "categories", "archive");
    const result = await archiveCategory(context.supabase, data.id);
    await logAudit({
      userId: context.userId,
      action: "category.archive",
      module: "categories",
      entityType: "category",
      entityId: data.id,
    });
    return result;
  });

export const getAdminBrands = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requirePermission(context, "brands", "view");
    return fetchAdminBrands(context.supabase);
  });

export const upsertBrand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: BrandInput) => input)
  .handler(async ({ context, data }) => {
    await requirePermission(context, "brands", data.id ? "edit" : "create");
    const result = await saveBrand(context.supabase, data);
    await logAudit({
      userId: context.userId,
      action: data.id ? "brand.update" : "brand.create",
      module: "brands",
      entityType: "brand",
      entityId: result.id,
      newValue: data,
    });
    return result;
  });

export const getMovements = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: MovementFilters) => input ?? {})
  .handler(async ({ context, data }) => {
    await requirePermission(context, "stock_movements", "view");
    return fetchMovements(context.supabase, data ?? {});
  });

export const getLowStockAlerts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requirePermission(context, "low_stock", "view");
    return fetchLowStockAlerts(context.supabase);
  });

export const getCustomers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { search?: string | null }) => input ?? {})
  .handler(async ({ context, data }) => {
    await requirePermission(context, "customers", "view");
    return fetchCustomers(context.supabase, data?.search ?? null);
  });

export const getCustomerDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ context, data }) => {
    await requirePermission(context, "customers", "view");
    return fetchCustomerDetail(context.supabase, data.id);
  });

export const getAuditLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { module?: string | null; search?: string | null; page?: number }) => input ?? {},
  )
  .handler(async ({ context, data }) => {
    await requirePermission(context, "audit", "view");
    return fetchAuditLogs(context.supabase, data ?? {});
  });
