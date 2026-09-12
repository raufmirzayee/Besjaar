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
    // This used to be a pass-through `(input) => input`, which typed the body
    // without checking any of it: a non-numeric rating reached `Math.round`,
    // where `NaN < 1` and `NaN > 5` are both false and the bounds check waved
    // it past.
    v.validator(
      z
        .object({
          productSlug: v.text(140).min(1),
          rating: z.coerce.number().int().min(1).max(5),
          title: v.optionalText(120),
          body: v.text(4000).min(10, "Schrijf minimaal 10 tekens in je beoordeling."),
          authorName: v.text(80).min(1),
        })
        .strict(),
    ),
  )
  .handler(async ({ context, data }) => {
    // A review is public text attached to a product, so a flood of them is
    // both spam on the storefront and work for whoever moderates. The account
    // is the key here: reviews need a session, and one per product is already
    // enforced downstream, so this is about someone working through the
    // catalogue rather than about one product.
    const { enforceRateLimit } = await import("./rate-limit.server");
    await enforceRateLimit("review_submit", {
      limit: 10,
      windowSeconds: 3600,
      blockSeconds: 3600,
      identity: context.userId,
    });

    return insertReview(context.supabase, context.userId, data);
  });

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
    const { enforceRateLimit } = await import("./rate-limit.server");
    await enforceRateLimit("newsletter", {
      limit: 3,
      windowSeconds: 3600,
      blockSeconds: 3600,
    });

    return subscribeNewsletter(data.email);
  });
