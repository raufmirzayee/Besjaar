import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getContactMessages, setContactMessageStatus } from "@/lib/contact.functions";
import type { ContactMessage } from "@/lib/contact.server";

export const Route = createFileRoute("/beheer/berichten")({
  component: ContactMessagesPage,
});

const FILTERS = [
  { value: "new", label: "Nieuw" },
  { value: "in_progress", label: "In behandeling" },
  { value: "closed", label: "Afgehandeld" },
  { value: "all", label: "Alles" },
];

const STATUS_LABELS: Record<string, string> = {
  new: "Nieuw",
  in_progress: "In behandeling",
  closed: "Afgehandeld",
};

function ContactMessagesPage() {
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
      toast.success("Bericht bijgewerkt");
      queryClient.invalidateQueries({ queryKey: ["admin-contact-messages"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold">Klantberichten</h1>
        <p className="text-sm text-muted-foreground">
          Berichten uit het contactformulier op de website.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <Button
            key={item.value}
            size="sm"
            variant={filter === item.value ? "default" : "outline"}
            onClick={() => setFilter(item.value)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {isPending ? <p className="text-sm text-muted-foreground">Laden…</p> : null}
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
              <Badge variant="outline">{STATUS_LABELS[message.status] ?? message.status}</Badge>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm">{message.message}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <a
                href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject}`)}`}
                className="text-sm text-primary underline-offset-4 hover:underline"
              >
                Beantwoorden
              </a>
              {message.status !== "in_progress" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => mutation.mutate({ id: message.id, status: "in_progress" })}
                >
                  In behandeling
                </Button>
              ) : null}
              {message.status !== "closed" ? (
                <Button
                  size="sm"
                  onClick={() => mutation.mutate({ id: message.id, status: "closed" })}
                >
                  Afgehandeld
                </Button>
              ) : null}
              <span className="text-xs text-muted-foreground">
                {new Date(message.created_at).toLocaleString("nl-NL")}
              </span>
            </div>
          </article>
        ))}
        {!isPending && (data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Geen berichten in deze weergave.</p>
        ) : null}
      </div>
    </div>
  );
}
