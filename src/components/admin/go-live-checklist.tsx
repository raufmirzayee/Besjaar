import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Check, ChevronDown, CircleAlert } from "lucide-react";
import { useState } from "react";

import { getReadiness } from "@/lib/readiness.functions";

/**
 * What still stands between this installation and taking real orders.
 *
 * The shop runs without payment, email or company details configured — it just
 * refuses to fake them. That is the safe default, but it means the owner needs
 * somewhere that says plainly what is still switched off. This is that place.
 */
export function GoLiveChecklist() {
  const fetchReadiness = useServerFn(getReadiness);
  const [open, setOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ["admin-readiness"],
    queryFn: () => fetchReadiness(),
    staleTime: 5 * 60 * 1000,
  });

  if (!data) return null;

  const blocking = data.checks.filter((check) => check.blocking && !check.ok);
  const optional = data.checks.filter((check) => !check.blocking && !check.ok);

  if (data.readyToTrade && optional.length === 0) return null;

  return (
    <section
      className={`rounded-xl border p-4 ${
        blocking.length ? "border-sale/40 bg-sale/5" : "border-border bg-surface"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 text-left"
      >
        {blocking.length ? (
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-sale" aria-hidden="true" />
        ) : (
          <CircleAlert
            className="mt-0.5 size-5 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        )}
        <span className="flex-1">
          <span className="block text-sm font-semibold">
            {blocking.length
              ? `Nog ${blocking.length} ${blocking.length === 1 ? "instelling" : "instellingen"} nodig voordat je echt kunt verkopen`
              : "Klaar om te verkopen · een paar optionele punten open"}
          </span>
          <span className="mt-0.5 block text-sm text-muted-foreground">
            {blocking.length
              ? blocking.map((check) => check.label).join(" · ")
              : optional.map((check) => check.label).join(" · ")}
          </span>
        </span>
        <ChevronDown
          className={`mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <ul className="mt-4 space-y-3 border-t pt-4">
          {data.checks.map((check) => (
            <li key={check.id} className="flex items-start gap-3 text-sm">
              {check.ok ? (
                <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" />
              ) : (
                <span
                  aria-hidden="true"
                  className={`mt-1.5 size-2 shrink-0 rounded-full ${check.blocking ? "bg-sale" : "bg-muted-foreground"}`}
                />
              )}
              <span>
                <span className="font-medium">
                  {check.label}
                  <span className="sr-only">: {check.ok ? "ingesteld" : "nog niet ingesteld"}</span>
                </span>
                {!check.blocking ? (
                  <span className="ml-2 text-xs text-muted-foreground">optioneel</span>
                ) : null}
                {!check.ok ? (
                  <>
                    <span className="mt-0.5 block text-muted-foreground">{check.detail}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      Zet in je omgeving:{" "}
                      {check.variables.map((variable, index) => (
                        <span key={variable}>
                          {index > 0 ? ", " : ""}
                          <code>{variable}</code>
                        </span>
                      ))}
                    </span>
                  </>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
