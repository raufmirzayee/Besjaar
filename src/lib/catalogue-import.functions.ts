import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import * as v from "./validation";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requirePermission } from "./admin-core.server";

/**
 * Catalogue import endpoint.
 *
 * Authorisation is enforced server-side: the caller must present a valid
 * session and hold a catalogue-managing role. Hiding the admin link is never
 * the control.
 */
export const importCatalogueCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(v.validator(z.object({ csv: v.csvPayload })))
  .handler(async ({ context, data }) => {
    await requirePermission(context, "products", "create");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { runCatalogueImport } = await import("./catalogue-import.server");
    return runCatalogueImport(supabaseAdmin, data.csv);
  });

/**
 * Validates a file without writing anything, so an admin can check a file
 * before committing it to the catalogue.
 */
export const validateCatalogueCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(v.validator(z.object({ csv: v.csvPayload })))
  .handler(async ({ context, data }) => {
    await requirePermission(context, "products", "create");

    const { parseCatalogueImport } = await import("./catalogue-import");
    const parsed = parseCatalogueImport(data.csv);
    return {
      valid: parsed.rows.length,
      duplicates: parsed.duplicates,
      errors: parsed.errors,
      totalLines: parsed.totalLines,
    };
  });
