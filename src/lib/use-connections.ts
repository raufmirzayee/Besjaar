/**
 * Connection status and the test buttons.
 *
 * Tests are deliberately not run on page load. They cost a call to somebody
 * else's API, they are rate limited, and a dashboard that silently burns a
 * DeepL allowance every time somebody opens it is a dashboard nobody should
 * have shipped. Opening a page reads status; pressing a button runs a test.
 */

import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import {
  getConnectionOverview,
  testConnection as testConnectionFn,
  testSupabaseArea as testSupabaseAreaFn,
} from "./connections.functions";
import type { IntegrationId, IntegrationStatus, TestResult } from "./integrations/types";
import type { SecretStatus, SecretStoreCapability } from "./secrets";

export type ConnectionOverview = {
  integrations: IntegrationStatus[];
  secrets: SecretStatus[];
  capability: SecretStoreCapability;
};

export const CONNECTIONS_QUERY_KEY = ["admin-connections"];

export function useConnections() {
  const fetchOverview = useServerFn(getConnectionOverview);
  return useQuery({
    queryKey: CONNECTIONS_QUERY_KEY,
    queryFn: () => fetchOverview({}) as Promise<ConnectionOverview>,
  });
}

/** Runs one integration's test and keeps the result beside its card. */
export function useConnectionTest() {
  const run = useServerFn(testConnectionFn);
  const [results, setResults] = useState<Partial<Record<IntegrationId, TestResult>>>({});
  const [running, setRunning] = useState<IntegrationId | null>(null);

  const mutation = useMutation({
    mutationFn: async (integration: IntegrationId) => {
      setRunning(integration);
      const result = (await run({ data: { integration } })) as TestResult;
      return { integration, result };
    },
    onSuccess: ({ integration, result }) => {
      setResults((current) => ({ ...current, [integration]: result }));
      setRunning(null);
    },
    onError: (error: Error) => {
      setRunning(null);
      toast.error(error.message);
    },
  });

  return { results, running, test: (id: IntegrationId) => mutation.mutate(id) };
}

export type SupabaseArea = "database" | "auth" | "storage" | "rls" | "admins";

export function useSupabaseChecks() {
  const run = useServerFn(testSupabaseAreaFn);
  const [results, setResults] = useState<Partial<Record<SupabaseArea, TestResult>>>({});
  const [running, setRunning] = useState<SupabaseArea | null>(null);

  const mutation = useMutation({
    mutationFn: async (area: SupabaseArea) => {
      setRunning(area);
      const result = (await run({ data: { area } })) as TestResult;
      return { area, result };
    },
    onSuccess: ({ area, result }) => {
      setResults((current) => ({ ...current, [area]: result }));
      setRunning(null);
    },
    onError: (error: Error) => {
      setRunning(null);
      toast.error(error.message);
    },
  });

  return { results, running, check: (area: SupabaseArea) => mutation.mutate(area) };
}
