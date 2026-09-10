import { Link } from "@tanstack/react-router";

/**
 * The site's 404.
 *
 * Shared rather than local to the root route, because the admin gate renders
 * exactly this for a visitor who is not staff. An admin area that answers
 * differently from a non-existent URL announces itself; this one does not.
 */
export function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Pagina niet gevonden</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Deze pagina bestaat niet (meer). Bekijk ons assortiment via de winkel.
        </p>
        <div className="mt-6">
          <Link
            to="/winkel"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Naar de winkel
          </Link>
        </div>
      </div>
    </div>
  );
}
