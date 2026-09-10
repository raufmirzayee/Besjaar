import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import * as v from "./validation";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requirePermission } from "./admin-core.server";
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
  .inputValidator(v.validator(z.object({ slug: v.text(140).min(1) })))
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
  .inputValidator(v.validator(z.object({ status: v.reviewStatus.optional() }).strict()))
  .handler(async ({ context, data }) => {
    await requirePermission(context, "reviews", "view");
    return fetchAdminReviews(context.supabase, data?.status);
  });

export const setReviewStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    v.validator(
      z.object({
        id: v.uuid,
        status: v.reviewStatus,
        // The downstream helper takes undefined, not null.
        moderatorNote: v.text(1000).optional(),
      }),
    ),
  )
  .handler(async ({ context, data }) => {
    await requirePermission(context, "reviews", "approve");
    return moderateReview(context.supabase, data);
  });

export const deleteReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(v.validator(z.object({ id: v.uuid })))
  .handler(async ({ context, data }) => {
    await requirePermission(context, "reviews", "archive");
    return removeReview(context.supabase, data.id);
  });

export const joinNewsletter = createServerFn({ method: "POST" })
  .inputValidator(v.validator(z.object({ email: v.email, company: v.optionalText(120) })))
  .handler(async ({ data }) => {
    // Honeypot: hidden field must stay empty for real visitors.
    if (data.company) throw new Error("Inschrijving geweigerd.");

    // The honeypot only catches a bot that fills every field it finds. Signing
    // strangers up to a mailing list is a way to use the shop to harass them,
    // and the shop's sending reputation pays for it.
    const { enforceRateLimit, callerKey } = await import("./rate-limit.server");
    await enforceRateLimit(`newsletter:${callerKey()}`, {
      limit: 3,
      windowSeconds: 3600,
      blockSeconds: 3600,
    });

    return subscribeNewsletter(data.email);
  });
