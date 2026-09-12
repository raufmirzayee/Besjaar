import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Mail } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { joinNewsletter } from "@/lib/reviews.functions";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Newsletter sign-up.
 *
 * `footer` renders on the dark band; `page` and `compact` render on light
 * surfaces. A hidden honeypot field catches the simplest bots without adding a
 * captcha for real customers.
 */
export function NewsletterSignup({
  variant = "page",
  compact = false,
}: {
  variant?: "page" | "footer";
  compact?: boolean;
}) {
  const subscribe = useServerFn(joinNewsletter);
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const inputId = useId();
  const onDark = variant === "footer";

  const mutation = useMutation({
    mutationFn: () => subscribe({ data: { email, company } }),
    onSuccess: () => {
      toast.success(t("news.success"));
      setEmail("");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div>
      {!compact && !onDark ? (
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <Mail className="size-4 text-primary" aria-hidden="true" /> {t("news.title")}
        </p>
      ) : null}
      {!onDark ? <p className="text-sm text-muted-foreground">{t("news.text")}</p> : null}

      <form
        className="mt-3 flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate();
        }}
      >
        <label htmlFor={inputId} className="sr-only">
          {t("news.placeholder")}
        </label>
        <Input
          id={inputId}
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t("news.placeholder")}
          className={cn(
            "h-11",
            onDark &&
              "border-white/25 bg-white/10 text-white placeholder:text-white/50 focus-visible:border-white",
          )}
        />
        {/* Honeypot: hidden from people, tempting to bots. */}
        <div className="hidden" aria-hidden="true">
          <input
            tabIndex={-1}
            autoComplete="off"
            name="company"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
          />
        </div>
        <Button
          type="submit"
          disabled={mutation.isPending}
          className={cn("h-11 shrink-0", onDark && "bg-white text-navy-deep hover:bg-white/90")}
        >
          {mutation.isPending ? t("common.loading") : t("news.submit")}
        </Button>
      </form>

      <p className={cn("mt-2 text-xs", onDark ? "text-white/50" : "text-muted-foreground")}>
        {t("news.optOut")}
      </p>
    </div>
  );
}
