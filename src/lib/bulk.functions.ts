import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import * as v from "./validation";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requirePermission } from "./admin-core.server";
import { validateBulkRows } from "./bulk-products";
import { applyBulkProducts } from "./bulk.server";

export const importProductsCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    v.validator(
      z.object({
        records: z
          .array(z.record(z.string().max(120), z.string().max(5000)))
          .min(1, "Geen rijen ontvangen")
          .max(2000, "Maximaal 2000 regels per import"),
      }),
    ),
  )
  .handler(async ({ context, data }) => {
    // The stock column is what this import is for, so inventory:edit is the
    // baseline. The same file can also carry name, price and status, and
    // warehouse staff hold inventory:edit without holding products:edit — so
    // a file that touches those columns is checked a second time. Without
    // this, the bulk importer was a way for the warehouse to change prices.
    await requirePermission(context, "inventory", "edit");

    const { rows, errors } = validateBulkRows(data.records);
    if (errors.length > 0) {
      return { applied: false as const, errors, updated: 0, skipped: [], stockChanges: 0 };
    }

    const touchesCatalogue = rows.some(
      (row) =>
        row.name !== null ||
        row.regular_price !== null ||
        row.sale_price !== null ||
        row.status !== null,
    );
    if (touchesCatalogue) await requirePermission(context, "products", "edit");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const result = await applyBulkProducts(supabaseAdmin, rows, context.userId);
    return { applied: true as const, errors, ...result };
  });
