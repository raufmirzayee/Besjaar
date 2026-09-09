import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { joinNewsletter } from "@/lib/reviews.functions";
import { useI18n } from "@/lib/i18n";

export function NewsletterSignup({ compact = false }: { compact?: boolean }) {
  const subscribe = useServerFn(joinNewsletter);
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");

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
      {!compact ? (
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Mail className="h-4 w-4 text-primary" /> {t("news.title")}
        </p>
      ) : null}
      <p className="text-sm text-muted-foreground">{t("news.text")}</p>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate();
        }}
      >
        <Input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t("news.placeholder")}
          aria-label={t("news.placeholder")}
        />
        <div className="hidden" aria-hidden="true">
          <input
            tabIndex={-1}
            autoComplete="off"
            name="company"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
          />
        </div>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "…" : t("news.submit")}
        </Button>
      </form>
      <p className="mt-2 text-xs text-muted-foreground">{t("news.optOut")}</p>
    </div>
  );
}
