import { cn } from "@/lib/utils";

/**
 * The Besjaar wordmark.
 *
 * Drawn as inline SVG so it stays crisp at any size and costs no request. The
 * "B" is knocked out of the rounded square with an even-odd fill rather than
 * painted in a second colour, so the mark works on any background — navy
 * chrome, the white header, or the dark footer — without needing a variant.
 */
export function BesjaarLogo({
  className,
  showTagline = false,
}: {
  className?: string;
  showTagline?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg
        viewBox="0 0 40 40"
        aria-hidden="true"
        focusable="false"
        className="h-8 w-8 shrink-0"
        fill="none"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M11 0h18a11 11 0 0 1 11 11v18a11 11 0 0 1-11 11H11A11 11 0 0 1 0 29V11A11 11 0 0 1 11 0Zm3 11h7.6c3.5 0 5.6 1.7 5.6 4.5 0 1.9-1 3.2-2.7 3.8 2.1.5 3.4 2 3.4 4.2 0 3.1-2.3 5-6 5H14V11Zm7 7.1c1.6 0 2.5-.7 2.5-2s-.9-2-2.5-2h-3.2v4h3.2Zm.4 7.4c1.7 0 2.7-.8 2.7-2.2s-1-2.2-2.7-2.2h-3.6v4.4h3.6Z"
          className="fill-current"
        />
      </svg>
      <span className="flex flex-col leading-none">
        <span className="font-display text-xl font-extrabold tracking-tight">Besjaar</span>
        {showTagline ? (
          <span className="mt-1 text-[11px] font-medium tracking-wide opacity-70">
            Praktisch. Doordacht.
          </span>
        ) : null}
      </span>
    </span>
  );
}
