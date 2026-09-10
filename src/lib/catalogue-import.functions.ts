import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireRoles } from "./admin.server";

/**
 * Catalogue import endpoint.
 *
 * Authorisation is enforced server-side: the caller must present a valid
 * session and hold a catalogue-managing role. Hiding the admin link is never
 * the control.
 */
export const importCatalogueCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { csv: string }) => {
    if (!input || typeof input.csv !== "string") throw new Error("Geen bestand ontvangen");
    if (input.csv.length > 5_000_000) throw new Error("Bestand is te groot (max 5 MB)");
    return { csv: input.csv };
  })
  .handler(async ({ context, data }) => {
    await requireRoles(context, ["super_admin", "store_manager", "content_editor"]);

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
  .inputValidator((input: { csv: string }) => {
    if (!input || typeof input.csv !== "string") throw new Error("Geen bestand ontvangen");
    if (input.csv.length > 5_000_000) throw new Error("Bestand is te groot (max 5 MB)");
    return { csv: input.csv };
  })
  .handler(async ({ context, data }) => {
    await requireRoles(context, ["super_admin", "store_manager", "content_editor"]);

    const { parseCatalogueImport } = await import("./catalogue-import");
    const parsed = parseCatalogueImport(data.csv);
    return {
      valid: parsed.rows.length,
      duplicates: parsed.duplicates,
      errors: parsed.errors,
      totalLines: parsed.totalLines,
    };
  });
