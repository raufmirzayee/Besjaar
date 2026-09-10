import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireRoles } from "./admin.server";
import { validateBulkRows } from "./bulk-products";
import { applyBulkProducts } from "./bulk.server";

export const importProductsCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { records: Record<string, string>[] }) => {
    if (!input || !Array.isArray(input.records)) throw new Error("Geen rijen ontvangen");
    if (input.records.length > 2000) throw new Error("Maximaal 2000 regels per import");
    return input;
  })
  .handler(async ({ context, data }) => {
    await requireRoles(context, ["super_admin", "store_manager", "warehouse"]);

    const { rows, errors } = validateBulkRows(data.records);
    if (errors.length > 0) {
      return { applied: false as const, errors, updated: 0, skipped: [], stockChanges: 0 };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const result = await applyBulkProducts(supabaseAdmin, rows, context.userId);
    return { applied: true as const, errors, ...result };
  });
