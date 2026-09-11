import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Client = SupabaseClient<any, any, any>;

export type ReviewStatus = "pending" | "approved" | "rejected";

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: "In afwachting",
  approved: "Goedgekeurd",
  rejected: "Afgewezen",
};

export type PublicReview = {
  id: string;
  author_name: string;
  rating: number;
  title: string | null;
  body: string;
  verified_purchase: boolean;
  created_at: string;
};

export type AdminReview = PublicReview & {
  status: ReviewStatus;
  product_id: string;
  product_name: string | null;
  product_slug: string | null;
  moderator_note: string | null;
};

function publicClient(): Client {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

/**
 * Approved reviews are publicly readable, so we never store a full legal name.
 * "Sanne de Vries" is stored as "Sanne d." — enough for social proof, no PII.
 */
export function displayName(raw: string): string {
  const parts = raw.trim().replace(/\s+/g, " ").split(" ").filter(Boolean);
  if (parts.length === 0) return "Klant";
  const first = parts[0].slice(0, 30);
  if (parts.length === 1) return first;
  return `${first} ${parts[parts.length - 1][0].toLowerCase()}.`;
}

export async function fetchProductReviews(productSlug: string): Promise<PublicReview[]> {
  const supabase = publicClient();
  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("slug", productSlug)
    .maybeSingle();
  const productId = (product as any)?.id;
  if (!productId) return [];

  const { data, error } = await supabase
    .from("product_reviews")
    .select("id, author_name, rating, title, body, verified_purchase, created_at")
    .eq("product_id", productId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []) as PublicReview[];
}

export async function insertReview(
  supabase: Client,
  userId: string,
  input: {
    productSlug: string;
    rating: number;
    title?: string | null;
    body: string;
    authorName: string;
  },
): Promise<{ ok: true }> {
  const rating = Math.round(input.rating);
  if (rating < 1 || rating > 5) throw new Error("Geef een score tussen 1 en 5 sterren.");
  const body = input.body.trim();
  if (body.length < 10) throw new Error("Schrijf minimaal 10 tekens in je beoordeling.");

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id")
    .eq("slug", input.productSlug)
    .maybeSingle();
  if (productError) throw new Error(productError.message);
  const productId = (product as any)?.id;
  if (!productId) throw new Error("Product niet gevonden.");

  const { data: existing } = await supabase
    .from("product_reviews")
    .select("id")
    .eq("product_id", productId)
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) throw new Error("Je hebt dit product al beoordeeld.");

  // Verified purchase: the customer has a paid order containing this product.
  //
  // Both filters belong in the query. This used to take the first matching
  // order item for the product and *then* check in JavaScript whether it
  // happened to be this customer's and happened to be paid — so a customer
  // with an unpaid order for the product alongside a paid one could have the
  // unpaid row come back and lose their verified badge.
  const { data: purchased } = await supabase
    .from("order_items")
    .select("id, orders!inner ( user_id, payment_status )")
    .eq("product_id", productId)
    .eq("orders.user_id", userId)
    .eq("orders.payment_status", "paid")
    .limit(1);
  const verified = ((purchased ?? []) as any[]).length > 0;

  const { error } = await supabase.from("product_reviews").insert({
    product_id: productId,
    user_id: userId,
    author_name: displayName(input.authorName),
    rating,
    title: input.title?.trim() ? input.title.trim().slice(0, 120) : null,
    body: body.slice(0, 4000),
    verified_purchase: verified,
    status: "pending",
  });
  if (error) {
    // The SELECT above and this INSERT are two statements, so two submissions
    // in flight together both read "no review yet". The unique index is what
    // decides; this turns its error into the same message the check gives.
    if (error.code === "23505" || error.message.toLowerCase().includes("duplicate key")) {
      throw new Error("Je hebt dit product al beoordeeld.");
    }
    throw new Error(error.message);
  }
  return { ok: true };
}

export async function fetchAdminReviews(
  supabase: Client,
  status?: ReviewStatus,
): Promise<AdminReview[]> {
  let query = supabase
    .from("product_reviews")
    .select(
      "id, product_id, author_name, rating, title, body, verified_purchase, created_at, status, moderator_note, products ( name, slug )",
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as any[]).map((row) => ({
    id: row.id,
    product_id: row.product_id,
    product_name: row.products?.name ?? null,
    product_slug: row.products?.slug ?? null,
    author_name: row.author_name,
    rating: row.rating,
    title: row.title,
    body: row.body,
    verified_purchase: !!row.verified_purchase,
    created_at: row.created_at,
    status: row.status as ReviewStatus,
    moderator_note: row.moderator_note ?? null,
  }));
}

export async function moderateReview(
  supabase: Client,
  input: { id: string; status: ReviewStatus; moderatorNote?: string },
): Promise<{ ok: true }> {
  const { error } = await supabase
    .from("product_reviews")
    .update({
      status: input.status,
      moderator_note: input.moderatorNote?.trim() || null,
    })
    .eq("id", input.id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function removeReview(supabase: Client, id: string): Promise<{ ok: true }> {
  const { error } = await supabase.from("product_reviews").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function subscribeNewsletter(email: string): Promise<{ ok: true }> {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalized)) {
    throw new Error("Vul een geldig e-mailadres in.");
  }
  const { error } = await publicClient()
    .from("newsletter_subscribers")
    .insert({ email: normalized, source: "website" });
  // A duplicate signup is not an error for the visitor.
  if (error && !error.message.toLowerCase().includes("duplicate")) {
    throw new Error(error.message);
  }
  return { ok: true };
}
