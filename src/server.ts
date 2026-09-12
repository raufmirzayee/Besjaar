import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { securityHeaders } from "./lib/security-headers";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

/**
 * Attaches the security headers to whatever the app produced.
 *
 * Here rather than in a `_headers` file because that file only means something
 * on Cloudflare Pages and Netlify — a Node deployment and a Workers deployment
 * both ignore it, and this shop supports all three. A response that already
 * carries a header keeps it, so a route that deliberately sets its own is not
 * overruled.
 */
function withSecurityHeaders(request: Request, response: Response): Response {
  const url = new URL(request.url);
  const secure = url.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";
  const html = (response.headers.get("content-type") ?? "").includes("text/html");

  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(
    securityHeaders({
      html,
      secure,
      supabaseUrl: process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL,
    }),
  )) {
    if (!headers.has(name)) headers.set(name, value);
  }

  // A 101 or a 204 has no body to rewrap, and constructing one with a body
  // throws.
  if (response.status === 101 || response.status === 204 || response.status === 304) {
    return new Response(null, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return withSecurityHeaders(request, await normalizeCatastrophicSsrResponse(response));
    } catch (error) {
      console.error(error);
      return withSecurityHeaders(
        request,
        new Response(renderErrorPage(), {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
      );
    }
  },
};
