import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { StarRating } from "@/components/star-rating";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { getProductReviews, submitReview } from "@/lib/reviews.functions";
import { cn } from "@/lib/utils";

export function ProductReviews({
  slug,
  ratingAverage,
  ratingCount,
}: {
  slug: string;
  ratingAverage: number;
  ratingCount: number;
}) {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const fetchReviews = useServerFn(getProductReviews);
  const send = useServerFn(submitReview);

  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [name, setName] = useState("");

  const reviewsQuery = useQuery({
    queryKey: ["product-reviews", slug],
    queryFn: () => fetchReviews({ data: { slug } }),
  });

  const mutation = useMutation({
    mutationFn: () =>
      send({
        data: {
          productSlug: slug,
          rating,
          title,
          body,
          authorName: name || user?.email?.split("@")[0] || "Klant",
        },
      }),
    onSuccess: () => {
      toast.success(t("reviews.thanks"));
      setTitle("");
      setBody("");
      queryClient.invalidateQueries({ queryKey: ["product-reviews", slug] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const reviews = reviewsQuery.data ?? [];

  return (
    <section className="mt-14" id="beoordelingen">
      <h2 className="font-display text-2xl font-bold">{t("reviews.title")}</h2>
      <div className="mt-2 flex items-center gap-3">
        <StarRating value={ratingAverage} size="md" />
        <span className="text-sm text-muted-foreground">
          {ratingCount > 0
            ? t("reviews.avgOutOf", { average: ratingAverage.toFixed(1), count: ratingCount })
            : t("product.noReviewsYet")}
        </span>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div>
          {reviewsQuery.isPending ? (
            <p className="text-sm text-muted-foreground">{t("reviews.loading")}</p>
          ) : reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("reviews.beFirst")}</p>
          ) : (
            <ul className="space-y-6">
              {reviews.map((review) => (
                <li key={review.id} className="rounded-2xl border bg-card p-5 shadow-soft">
                  <div className="flex flex-wrap items-center gap-3">
                    <StarRating value={review.rating} />
                    <span className="text-sm font-medium">{review.author_name}</span>
                    {review.verified_purchase ? (
                      <Badge variant="secondary">{t("reviews.boughtAt")}</Badge>
                    ) : null}
                    <span className="ml-auto text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString(locale)}
                    </span>
                  </div>
                  {review.title ? <p className="mt-3 font-semibold">{review.title}</p> : null}
                  <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                    {review.body}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border bg-surface p-6 shadow-soft">
          <h3 className="font-semibold">{t("reviews.write")}</h3>
          {!user ? (
            <>
              <p className="mt-2 text-sm text-muted-foreground">{t("reviews.loginText")}</p>
              <Button asChild className="mt-4">
                <Link to="/inloggen">{t("reviews.loginCta")}</Link>
              </Button>
            </>
          ) : (
            <form
              className="mt-4 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                mutation.mutate();
              }}
            >
              <div>
                <Label>{t("reviews.yourScore")}</Label>
                <div className="mt-1 flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      aria-label={t("reviews.stars", { count: star })}
                      onClick={() => setRating(star)}
                    >
                      <Star
                        className={cn(
                          "h-6 w-6",
                          star <= rating ? "fill-accent text-accent" : "text-muted-foreground/40",
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="review-name">{t("reviews.name")}</Label>
                <Input
                  id="review-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("reviews.namePlaceholder")}
                />
              </div>
              <div>
                <Label htmlFor="review-title">{t("reviews.titleOptional")}</Label>
                <Input
                  id="review-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("reviews.titlePlaceholder")}
                />
              </div>
              <div>
                <Label htmlFor="review-body">{t("reviews.body")}</Label>
                <Textarea
                  id="review-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={5}
                  placeholder={t("reviews.bodyPlaceholder")}
                  required
                />
              </div>
              <Button type="submit" disabled={mutation.isPending} className="w-full">
                {mutation.isPending ? t("reviews.submitting") : t("reviews.place")}
              </Button>
              <p className="text-xs text-muted-foreground">{t("reviews.moderationNote")}</p>
            </form>
          )}
        </div>
      </div>
      <Separator className="mt-14" />
    </section>
  );
}
