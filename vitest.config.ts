import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync } from "node:fs";

/** Minimal .env reader so CI regression tests can reach the backend. */
function readEnvFile(): Record<string, string> {
  const path = fileURLToPath(new URL("./.env", import.meta.url));
  if (!existsSync(path)) return {};
  const out: Record<string, string> = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (match) out[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

const fileEnv = readEnvFile();

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    env: {
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ?? fileEnv.VITE_SUPABASE_URL ?? "",
      VITE_SUPABASE_PUBLISHABLE_KEY:
        process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? fileEnv.VITE_SUPABASE_PUBLISHABLE_KEY ?? "",
    },
  },
});
