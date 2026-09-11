import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { StarRating } from "@/components/star-rating";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TranslationKey } from "@/lib/translations";
import { useI18n } from "@/lib/i18n";
import { deleteReview, getAdminReviews, setReviewStatus } from "@/lib/reviews.functions";
import { REVIEW_STATUS_LABELS, type ReviewStatus } from "@/lib/admin-labels";
import type { AdminReview } from "@/lib/reviews.server";

export const Route = createFileRoute("/beheer/beoordelingen")({
  component: ReviewsAdminPage,
});

/** Keys, not labels: a module constant cannot call t(). */
const FILTERS: { value: ReviewStatus | "all"; label: TranslationKey }[] = [
  { value: "pending", label: "admin.reviews.pending" },
  { value: "approved", label: "admin.reviews.approved" },
  { value: "rejected", label: "admin.reviews.rejected" },
  { value: "all", label: "admin.common.all" },
];

function ReviewsAdminPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const fetchReviews = useServerFn(getAdminReviews);
  const moderate = useServerFn(setReviewStatus);
  const remove = useServerFn(deleteReview);
  const [filter, setFilter] = useState<ReviewStatus | "all">("pending");

  const { data, isPending, error } = useQuery({
    queryKey: ["admin-reviews", filter],
    queryFn: () =>
      fetchReviews({
        data: filter === "all" ? {} : { status: filter },
      }) as Promise<AdminReview[]>,
  });

  const statusMutation = useMutation({
    mutationFn: (input: { id: string; status: ReviewStatus }) => moderate({ data: input }),
    onSuccess: () => {
      toast.success(t("admin.reviews.updated"));
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["product-reviews"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success(t("admin.reviews.deleted"));
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-bold">{t("admin.reviews.title")}</h2>
        <p className="text-sm text-muted-foreground">
          Keur beoordelingen goed of af. Alleen goedgekeurde beoordelingen zijn zichtbaar in de
          webshop en tellen mee in het gemiddelde.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <Button
            key={option.value}
            size="sm"
            variant={filter === option.value ? "default" : "outline"}
            onClick={() => setFilter(option.value)}
          >
            {t(option.label)}
          </Button>
        ))}
      </div>

      {isPending ? (
        <p className="text-sm text-muted-foreground">{t("admin.reviews.loading")}</p>
      ) : error ? (
        <p className="text-sm text-destructive">{(error as Error).message}</p>
      ) : (data ?? []).length === 0 ? (
        <p className="rounded-xl border border-border bg-card p-6 text-center text-muted-foreground">
          {t("admin.reviews.empty")}
        </p>
      ) : (
        <div className="space-y-3">
          {(data ?? []).map((review) => (
            <div key={review.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center gap-3">
                <StarRating value={review.rating} />
                <span className="font-medium">{review.author_name}</span>
                {review.verified_purchase ? (
                  <Badge variant="secondary">{t("admin.reviews.verifiedBuyer")}</Badge>
                ) : null}
                <Badge
                  variant={
                    review.status === "approved"
                      ? "default"
                      : review.status === "rejected"
                        ? "destructive"
                        : "outline"
                  }
                >
                  {REVIEW_STATUS_LABELS[review.status]}
                </Badge>
                <span className="ml-auto text-xs text-muted-foreground">
                  {new Date(review.created_at).toLocaleDateString("nl-NL")}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Product: {review.product_name ?? "onbekend"}
              </p>
              {review.title ? <p className="mt-2 font-semibold">{review.title}</p> : null}
              <p className="mt-1 whitespace-pre-line text-sm">{review.body}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={statusMutation.isPending || review.status === "approved"}
                  onClick={() => statusMutation.mutate({ id: review.id, status: "approved" })}
                >
                  {t("admin.reviews.approve")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={statusMutation.isPending || review.status === "rejected"}
                  onClick={() => statusMutation.mutate({ id: review.id, status: "rejected" })}
                >
                  {t("admin.reviews.reject")}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={deleteMutation.isPending}
                  onClick={() => {
                    if (confirm(t("admin.reviews.confirmDelete"))) {
                      deleteMutation.mutate(review.id);
                    }
                  }}
                >
                  {t("admin.common.delete")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
