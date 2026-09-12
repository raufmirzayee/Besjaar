import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type Crumb = { name: string; to?: string; params?: Record<string, string> };

/**
 * Breadcrumb trail. The final entry is the current page and is not a link.
 * `tone="dark"` is for the navy brand bands, where the default muted grey
 * would not meet contrast.
 */
export function Breadcrumbs({
  trail,
  tone = "light",
}: {
  trail: Crumb[];
  tone?: "light" | "dark";
}) {
  const { t } = useI18n();
  const onDark = tone === "dark";

  return (
    <nav aria-label={t("pdp.breadcrumb")} className="mb-4">
      <ol
        className={cn(
          "flex flex-wrap items-center gap-1 text-sm",
          onDark ? "text-white/70" : "text-muted-foreground",
        )}
      >
        {trail.map((crumb, index) => {
          const isLast = index === trail.length - 1;
          return (
            <li key={`${crumb.name}-${index}`} className="flex items-center gap-1">
              {index > 0 ? (
                <ChevronRight className="size-3.5 shrink-0 opacity-60" aria-hidden="true" />
              ) : null}
              {isLast || !crumb.to ? (
                <span
                  aria-current="page"
                  className={cn("font-medium", onDark ? "text-white" : "text-foreground")}
                >
                  {crumb.name}
                </span>
              ) : (
                <Link
                  to={crumb.to}
                  params={crumb.params}
                  className={cn(
                    // -my-1 py-1 lifts the tap target to 24px without moving
                    // the text: a breadcrumb row is a line of adjacent links
                    // and 20px is awkward on a phone.
                    "-my-1 rounded py-1 transition-colors hover:underline",
                    onDark ? "hover:text-white" : "hover:text-primary",
                  )}
                >
                  {crumb.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
