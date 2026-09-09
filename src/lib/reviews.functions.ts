import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireRoles } from "./admin.server";
import {
  fetchAdminReviews,
  fetchProductReviews,
  insertReview,
  moderateReview,
  removeReview,
  subscribeNewsletter,
  type ReviewStatus,
} from "./reviews.server";

export const getProductReviews = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => input)
  .handler(async ({ data }) => fetchProductReviews(data.slug));

export const submitReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      productSlug: string;
      rating: number;
      title?: string;
      body: string;
      authorName: string;
    }) => input,
  )
  .handler(async ({ context, data }) => insertReview(context.supabase, context.userId, data));

export const getAdminReviews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { status?: ReviewStatus }) => input ?? {})
  .handler(async ({ context, data }) => {
    await requireRoles(context.supabase, context.userId, [
      "super_admin",
      "store_manager",
      "customer_service",
      "content_editor",
    ]);
    return fetchAdminReviews(context.supabase, data?.status);
  });

export const setReviewStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; status: ReviewStatus; moderatorNote?: string }) => input)
  .handler(async ({ context, data }) => {
    await requireRoles(context.supabase, context.userId, [
      "super_admin",
      "store_manager",
      "customer_service",
    ]);
    return moderateReview(context.supabase, data);
  });

export const deleteReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ context, data }) => {
    await requireRoles(context.supabase, context.userId, ["super_admin", "store_manager"]);
    return removeReview(context.supabase, data.id);
  });

export const joinNewsletter = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; company?: string }) => input)
  .handler(async ({ data }) => {
    // Honeypot: hidden field must stay empty for real visitors.
    if (data.company) throw new Error("Inschrijving geweigerd.");
    return subscribeNewsletter(data.email);
  });
