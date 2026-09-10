import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TranslationKey } from "@/lib/translations";
import { useI18n } from "@/lib/i18n";
import { getContactMessages, setContactMessageStatus } from "@/lib/contact.functions";
import type { ContactMessage } from "@/lib/contact.server";

export const Route = createFileRoute("/beheer/berichten")({
  component: ContactMessagesPage,
});

/** Keys, not labels: a module constant cannot call t(). */
const FILTERS: { value: string; label: TranslationKey }[] = [
  { value: "new", label: "admin.messages.new" },
  { value: "in_progress", label: "admin.messages.inProgress" },
  { value: "closed", label: "admin.messages.handled" },
  { value: "all", label: "admin.common.all" },
];

/** Keys, not labels: a module constant cannot call t(). */
const STATUS_LABELS: Record<string, TranslationKey> = {
  new: "admin.messages.new",
  in_progress: "admin.messages.inProgress",
  closed: "admin.messages.handled",
};

function ContactMessagesPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const fetchMessages = useServerFn(getContactMessages);
  const updateStatus = useServerFn(setContactMessageStatus);
  const [filter, setFilter] = useState("new");

  const { data, isPending, error } = useQuery({
    queryKey: ["admin-contact-messages", filter],
    queryFn: () => fetchMessages({ data: { status: filter } }) as Promise<ContactMessage[]>,
  });

  const mutation = useMutation({
    mutationFn: (input: { id: string; status: string }) => updateStatus({ data: input }),
    onSuccess: () => {
      toast.success(t("admin.messages.updated"));
      queryClient.invalidateQueries({ queryKey: ["admin-contact-messages"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold">{t("admin.messages.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("admin.messages.subtitle")}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <Button
            key={item.value}
            size="sm"
            variant={filter === item.value ? "default" : "outline"}
            onClick={() => setFilter(item.value)}
          >
            {t(item.label)}
          </Button>
        ))}
      </div>

      {isPending ? (
        <p className="text-sm text-muted-foreground">{t("admin.common.loading")}</p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{(error as Error).message}</p> : null}

      <div className="space-y-3">
        {(data ?? []).map((message) => (
          <article key={message.id} className="rounded-xl border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{message.subject}</p>
                <p className="text-sm text-muted-foreground">
                  {message.name} · {message.email}
                  {message.phone ? ` · ${message.phone}` : ""}
                  {message.order_number ? ` · order ${message.order_number}` : ""}
                </p>
              </div>
              <Badge variant="outline">
                {STATUS_LABELS[message.status] ? t(STATUS_LABELS[message.status]) : message.status}
              </Badge>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm">{message.message}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <a
                href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject}`)}`}
                className="text-sm text-primary underline underline-offset-4 hover:text-primary-hover"
              >
                {t("admin.messages.reply")}
              </a>
              {message.status !== "in_progress" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => mutation.mutate({ id: message.id, status: "in_progress" })}
                >
                  {t("admin.messages.inProgress")}
                </Button>
              ) : null}
              {message.status !== "closed" ? (
                <Button
                  size="sm"
                  onClick={() => mutation.mutate({ id: message.id, status: "closed" })}
                >
                  {t("admin.messages.handled")}
                </Button>
              ) : null}
              <span className="text-xs text-muted-foreground">
                {new Date(message.created_at).toLocaleString("nl-NL")}
              </span>
            </div>
          </article>
        ))}
        {!isPending && (data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("admin.messages.empty")}</p>
        ) : null}
      </div>
    </div>
  );
}
