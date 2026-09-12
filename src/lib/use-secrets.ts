/**
 * Saving and removing credentials.
 *
 * The one place in the client that sends a credential anywhere, and it sends it
 * to our own server function over the same authenticated channel as everything
 * else. It never stores one: not in state beyond the keystroke, not in
 * localStorage, not in a query cache.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { useI18n } from "./i18n";
import { removeSecret, saveSecret } from "./settings.functions";
import { CONNECTIONS_QUERY_KEY } from "./use-connections";
import { SETTINGS_QUERY_KEY } from "./use-settings";
import type { ManagedSecret } from "./secrets";

export function useSecretActions() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const save = useServerFn(saveSecret);
  const remove = useServerFn(removeSecret);
  const [pending, setPending] = useState<ManagedSecret | null>(null);

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: CONNECTIONS_QUERY_KEY });
  }

  const saveMutation = useMutation({
    mutationFn: async (input: { name: ManagedSecret; value: string }) => {
      setPending(input.name);
      return (await save({ data: input })) as {
        stored: boolean;
        variable?: string;
        message?: string;
      };
    },
    onSuccess: (result) => {
      setPending(null);
      // A store that could not write says so, rather than reporting a save that
      // did not happen. The screen repeats that verbatim.
      if (result.stored) toast.success(t("admin.secret.stored"));
      else toast.warning(result.message ?? t("admin.secret.noStoreHelp"));
      refresh();
    },
    onError: (error: Error) => {
      setPending(null);
      toast.error(error.message);
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (name: ManagedSecret) => {
      setPending(name);
      return (await remove({ data: { name } })) as {
        removed: boolean;
        environmentRemains: boolean;
      };
    },
    onSuccess: (result) => {
      setPending(null);
      toast.success(t("admin.secret.removed"));
      if (result.environmentRemains) toast.warning(t("admin.secret.stillInEnvironment"));
      refresh();
    },
    onError: (error: Error) => {
      setPending(null);
      toast.error(error.message);
    },
  });

  return {
    pending,
    save: (name: ManagedSecret, value: string) => saveMutation.mutate({ name, value }),
    remove: (name: ManagedSecret) => removeMutation.mutate(name),
  };
}
