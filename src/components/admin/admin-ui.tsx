import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Clock, Inbox, Loader2, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumb?: ReactNode;
}) {
  return (
    <header className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:flex sm:flex-wrap sm:justify-between">
      <div className="min-w-0">
        {breadcrumb}
        <h1 className="truncate font-display text-xl font-bold sm:text-2xl">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

type Tone = "success" | "warning" | "danger" | "muted" | "info";

const TONE_CLASS: Record<Tone, string> = {
  success: "border-emerald-600/30 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  danger: "border-destructive/30 bg-destructive/10 text-destructive",
  muted: "border-border bg-muted text-muted-foreground",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
};

const TONE_ICON: Record<Tone, typeof CheckCircle2> = {
  success: CheckCircle2,
  warning: Clock,
  danger: XCircle,
  muted: Inbox,
  info: Loader2,
};

export function StatusBadge({ tone, label }: { tone: Tone; label: string }) {
  const Icon = TONE_ICON[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        TONE_CLASS[tone],
      )}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {label}
    </span>
  );
}

const ORDER_TONE: Record<string, Tone> = {
  pending: "warning",
  paid: "success",
  processing: "info",
  packed: "info",
  shipped: "info",
  delivered: "success",
  cancelled: "danger",
  refunded: "danger",
  open: "warning",
  failed: "danger",
  expired: "danger",
  active: "success",
  draft: "muted",
  archived: "muted",
  discontinued: "muted",
  out_of_stock: "warning",
  requested: "warning",
  approved: "success",
  rejected: "danger",
  received: "info",
  new: "warning",
  resolved: "success",
  closed: "muted",
  running: "info",
  success: "success",
};

export function statusTone(status: string): Tone {
  return ORDER_TONE[status] ?? "muted";
}

export function LoadingState({ label = "Laden…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card p-10 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      {label}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
      <AlertCircle className="mx-auto h-5 w-5 text-destructive" aria-hidden />
      <p className="mt-2 text-sm text-destructive">{message}</p>
      {onRetry ? (
        <Button className="mt-3" size="sm" variant="outline" onClick={onRetry}>
          Opnieuw proberen
        </Button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
      <Inbox className="mx-auto h-6 w-6 text-muted-foreground" aria-hidden />
      <p className="mt-2 font-medium">{title}</p>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function NoAccessState({ module }: { module: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-10 text-center">
      <p className="font-medium">Geen toegang tot {module}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Je rol geeft geen rechten voor deze pagina. Vraag een super admin om toegang.
      </p>
      <Button className="mt-4" variant="outline" asChild>
        <Link to="/beheer">Terug naar dashboard</Link>
      </Button>
    </div>
  );
}

export function Pager({
  page,
  pageCount,
  total,
  onPage,
}: {
  page: number;
  pageCount: number;
  total: number;
  onPage: (page: number) => void;
}) {
  if (pageCount <= 1) {
    return <p className="mt-3 text-xs text-muted-foreground">{total} resultaten</p>;
  }
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
      <p className="text-xs text-muted-foreground">
        {total} resultaten · pagina {page} van {pageCount}
      </p>
      <div className="flex gap-1">
        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Vorige
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={page >= pageCount}
          onClick={() => onPage(page + 1)}
        >
          Volgende
        </Button>
      </div>
    </div>
  );
}

export function MetricCard({
  label,
  value,
  change,
  hint,
  to,
}: {
  label: string;
  value: string;
  change?: number | null;
  hint?: string;
  to?: string;
}) {
  const body = (
    <div className="h-full rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold">{value}</p>
      <div className="mt-1 flex items-center gap-2 text-xs">
        {change === null || change === undefined ? (
          hint ? (
            <span className="text-muted-foreground">{hint}</span>
          ) : null
        ) : (
          <>
            <Badge
              variant="outline"
              className={cn(
                change >= 0
                  ? "border-emerald-600/30 text-emerald-700 dark:text-emerald-400"
                  : "border-destructive/30 text-destructive",
              )}
            >
              {change >= 0 ? "+" : ""}
              {change.toFixed(1)}%
            </Badge>
            <span className="text-muted-foreground">{hint ?? "vs vorige periode"}</span>
          </>
        )}
      </div>
    </div>
  );
  return to ? (
    <Link to={to} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}
