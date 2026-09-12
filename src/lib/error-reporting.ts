/**
 * Client-side error reporting.
 *
 * The root error boundary catches render failures, but production React does
 * not rethrow them to window.onerror, so without this they vanish silently —
 * a shop would have no idea a page was broken for its customers.
 *
 * There is no error service wired up, and none is invented here. Errors go to
 * the console, which at least surfaces them in a browser session and in most
 * hosting platforms' log drains. To send them somewhere real, call your
 * provider's capture function inside `reportClientError` — it is the single
 * place every boundary already reports to.
 */

export function reportClientError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  // A loader or server function commonly throws a raw Response; String(it)
  // gives the opaque "[object Response]", so pull out something readable.
  const message =
    error instanceof Response
      ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`
      : error instanceof Error
        ? error.message
        : String(error);

  console.error("[besjaar] client error:", message, {
    route: window.location.pathname,
    ...context,
    stack: error instanceof Error ? error.stack : undefined,
  });
}
