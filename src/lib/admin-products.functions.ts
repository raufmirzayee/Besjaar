import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import * as v from "./validation";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { logAudit, requirePermission } from "./admin-core.server";
import {
  addProductImage,
  bulkUpdateProducts,
  deleteListing,
  deleteProductImage,
  deleteVariant,
  duplicateProduct,
  exportProductsCsvRows,
  fetchProductDetail,
  fetchProductOptions,
  fetchProductsAdmin,
  moveProductImage,
  saveListing,
  saveProductFull,
  saveVariant,
  setMainImage,
  setProductStatus,
  type BulkAction,
  type ImageInput,
  type ListingInput,
  type ProductFilters,
  type ProductInput,
  type VariantInput,
} from "./admin-products.server";

export const listProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(v.validator(v.productFilters))
  .handler(async ({ context, data }) => {
    await requirePermission(context, "products", "view");
    return fetchProductsAdmin(context.supabase, data ?? {});
  });

export const getProductOptions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requirePermission(context, "products", "view");
    return fetchProductOptions(context.supabase);
  });

export const getProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(v.validator(v.idOnly))
  .handler(async ({ context, data }) => {
    await requirePermission(context, "products", "view");
    return fetchProductDetail(context.supabase, data.id);
  });

export const upsertProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(v.validator(v.productInput))
  .handler(async ({ context, data }) => {
    await requirePermission(context, "products", data.id ? "edit" : "create");
    const result = await saveProductFull(context.supabase, data, context.userId);
    await logAudit({
      userId: context.userId,
      userEmail: (context.claims as { email?: string } | undefined)?.email ?? null,
      action: data.id ? "product.update" : "product.create",
      module: "products",
      entityType: "product",
      entityId: result.id,
      newValue: data,
    });
    return result;
  });

export const changeProductStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(v.validator(z.object({ id: v.uuid, status: v.productStatus })))
  .handler(async ({ context, data }) => {
    await requirePermission(context, "products", data.status === "archived" ? "archive" : "edit");
    const result = await setProductStatus(context.supabase, data.id, data.status);
    await logAudit({
      userId: context.userId,
      action: data.status === "archived" ? "product.archive" : "product.status",
      module: "products",
      entityType: "product",
      entityId: data.id,
      newValue: { status: data.status },
    });
    return result;
  });

export const copyProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(v.validator(v.idOnly))
  .handler(async ({ context, data }) => {
    await requirePermission(context, "products", "create");
    const result = await duplicateProduct(context.supabase, data.id);
    await logAudit({
      userId: context.userId,
      action: "product.duplicate",
      module: "products",
      entityType: "product",
      entityId: result.id,
      oldValue: { source: data.id },
    });
    return result;
  });

export const upsertVariant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(v.validator(v.variantInput))
  .handler(async ({ context, data }) => {
    await requirePermission(context, "products", "edit");
    const result = await saveVariant(context.supabase, data, context.userId);
    await logAudit({
      userId: context.userId,
      action: data.id ? "variant.update" : "variant.create",
      module: "products",
      entityType: "product_variant",
      entityId: result.id,
      newValue: data,
    });
    return result;
  });

export const removeVariant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(v.validator(v.idOnly))
  .handler(async ({ context, data }) => {
    await requirePermission(context, "products", "archive");
    const result = await deleteVariant(context.supabase, data.id);
    await logAudit({
      userId: context.userId,
      action: "variant.delete",
      module: "products",
      entityType: "product_variant",
      entityId: data.id,
    });
    return result;
  });

export const createProductImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(v.validator(v.imageInput))
  .handler(async ({ context, data }) => {
    await requirePermission(context, "products", "edit");
    return addProductImage(context.supabase, data);
  });

export const makeMainImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(v.validator(z.object({ productId: v.uuid, imageId: v.uuid })))
  .handler(async ({ context, data }) => {
    await requirePermission(context, "products", "edit");
    return setMainImage(context.supabase, data.productId, data.imageId);
  });

export const reorderProductImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    v.validator(z.object({ imageId: v.uuid, sortOrder: z.number().int().min(0).max(999) })),
  )
  .handler(async ({ context, data }) => {
    await requirePermission(context, "products", "edit");
    return moveProductImage(context.supabase, data.imageId, data.sortOrder);
  });

export const removeProductImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(v.validator(z.object({ imageId: v.uuid })))
  .handler(async ({ context, data }) => {
    await requirePermission(context, "products", "edit");
    return deleteProductImage(context.supabase, data.imageId);
  });

export const upsertListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(v.validator(v.listingInput))
  .handler(async ({ context, data }) => {
    await requirePermission(context, "bol", "edit");
    const result = await saveListing(context.supabase, data);
    await logAudit({
      userId: context.userId,
      action: data.id ? "listing.update" : "listing.create",
      module: "bol",
      entityType: "channel_listing",
      entityId: result.id,
      newValue: data,
    });
    return result;
  });

export const removeListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(v.validator(v.idOnly))
  .handler(async ({ context, data }) => {
    await requirePermission(context, "bol", "edit");
    const result = await deleteListing(context.supabase, data.id);
    await logAudit({
      userId: context.userId,
      action: "listing.delete",
      module: "bol",
      entityType: "channel_listing",
      entityId: data.id,
    });
    return result;
  });

export const bulkProductAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(v.validator(v.bulkAction))
  .handler(async ({ context, data }) => {
    if (data.kind === "mapping") {
      await requirePermission(context, "bol", "edit");
    } else {
      await requirePermission(
        context,
        "products",
        data.kind === "status" && data.status === "archived" ? "archive" : "edit",
      );
    }
    const result = await bulkUpdateProducts(context.supabase, data);
    await logAudit({
      userId: context.userId,
      userEmail: (context.claims as { email?: string } | undefined)?.email ?? null,
      action: `products.bulk.${data.kind}`,
      module: data.kind === "mapping" ? "bol" : "products",
      entityType: "product",
      entityId: `${data.ids.length} producten`,
      newValue: { ...data, result },
    });
    return result;
  });

export const exportProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(v.validator(v.idsOnly))
  .handler(async ({ context, data }) => {
    await requirePermission(context, "products", "view");
    const rows = await exportProductsCsvRows(context.supabase, data.ids);
    await logAudit({
      userId: context.userId,
      userEmail: (context.claims as { email?: string } | undefined)?.email ?? null,
      action: "products.export",
      module: "products",
      entityType: "product",
      entityId: `${data.ids.length} producten`,
    });
    return { rows };
  });

export const listImportRuns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requirePermission(context, "products", "view");
    const { fetchImportRuns } = await import("./admin-products.server");
    return fetchImportRuns(context.supabase, 25);
  });

export const importProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    v.validator(
      z.object({
        csv: v.csvPayload,
        ids: z.array(v.uuid).max(5000),
        fileName: v.optionalText(200),
      }),
    ),
  )
  .handler(async ({ context, data }) => {
    await requirePermission(context, "products", "edit");
    const { parseProductImport } = await import("./product-import");
    const { applyProductImport } = await import("./admin-products.server");

    const parsed = parseProductImport(data.csv ?? "", data.ids ?? []);
    let applied = {
      productsUpdated: 0,
      variantsUpdated: 0,
      listingsUpdated: 0,
      stockMutations: 0,
      processed: 0,
      errors: [] as typeof parsed.errors,
    };

    if (parsed.rows.length) {
      const hasMapping = parsed.rows.some((row) =>
        [
          row.data.bol_offer_id,
          row.data.bol_product_id,
          row.data.bol_prijs,
          row.data.bol_actief,
          row.data.bol_prijssync,
          row.data.bol_voorraadsync,
        ].some((v) => v !== undefined),
      );
      if (hasMapping) {
        await requirePermission(context, "bol", "edit");
      }
      // Permission is verified above; writes run through the service-role client so the
      // tables stay closed to direct client-side inserts/updates (RLS write policies absent by design).
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      applied = await applyProductImport(supabaseAdmin, parsed.rows, context.userId);
    }

    const errors = [...parsed.errors, ...applied.errors].sort((a, b) => a.line - b.line);
    const fileName = (data.fileName ?? "").trim() || "import.csv";

    const { recordImportRun } = await import("./admin-products.server");
    await recordImportRun({
      userId: context.userId,
      userEmail: (context.claims as { email?: string } | undefined)?.email ?? null,
      fileName,
      totalLines: parsed.totalLines,
      processed: applied.processed,
      productsUpdated: applied.productsUpdated,
      variantsUpdated: applied.variantsUpdated,
      listingsUpdated: applied.listingsUpdated,
      stockMutations: applied.stockMutations,
      errors,
    });

    await logAudit({
      userId: context.userId,
      userEmail: (context.claims as { email?: string } | undefined)?.email ?? null,
      action: "product.import",
      module: "products",
      entityType: "product",
      newValue: {
        bestand: fileName,
        regels: parsed.totalLines,
        verwerkt: applied.processed,
        producten: applied.productsUpdated,
        varianten: applied.variantsUpdated,
        koppelingen: applied.listingsUpdated,
        mutaties: applied.stockMutations,
        fouten: errors.length,
      },
    });

    return {
      totalLines: parsed.totalLines,
      processed: applied.processed,
      productsUpdated: applied.productsUpdated,
      variantsUpdated: applied.variantsUpdated,
      listingsUpdated: applied.listingsUpdated,
      stockMutations: applied.stockMutations,
      errors,
    };
  });
