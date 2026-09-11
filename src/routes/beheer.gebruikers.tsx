import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { getAdminUsers, setUserRole } from "@/lib/admin.functions";
import { ROLE_LABELS, STAFF_ROLES, type AppRole } from "@/lib/staff";
import type { AdminUserRow } from "@/lib/admin.server";

export const Route = createFileRoute("/beheer/gebruikers")({
  component: UsersPage,
});

function UsersPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const fetchUsers = useServerFn(getAdminUsers);
  const changeRole = useServerFn(setUserRole);

  const { data, isPending, error } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => fetchUsers({}) as Promise<AdminUserRow[]>,
  });

  const mutation = useMutation({
    mutationFn: (input: { userId: string; role: AppRole; grant: boolean }) =>
      changeRole({ data: input }),
    onSuccess: () => {
      toast.success(t("admin.users.rolesUpdated"));
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["my-roles"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isPending) return <p className="text-sm text-muted-foreground">{t("admin.users.loading")}</p>;
  if (error) return <p className="text-sm text-destructive">{(error as Error).message}</p>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-bold">{t("admin.users.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("admin.users.subtitle")}</p>
      </div>

      <div className="space-y-3">
        {(data ?? []).map((user) => (
          <div key={user.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">
                  {[user.first_name, user.last_name].filter(Boolean).join(" ") ||
                    t("admin.users.unnamed")}
                </p>
                <p className="text-sm text-muted-foreground">{user.email ?? "geen e-mailadres"}</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {user.roles.length ? (
                  user.roles.map((role) => (
                    <Badge key={role} variant="secondary">
                      {ROLE_LABELS[role] ?? role}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="outline">{t("admin.users.noRole")}</Badge>
                )}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {STAFF_ROLES.map((role) => {
                const has = user.roles.includes(role);
                return (
                  <Button
                    key={role}
                    size="sm"
                    variant={has ? "default" : "outline"}
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate({ userId: user.id, role, grant: !has })}
                  >
                    {ROLE_LABELS[role]}
                  </Button>
                );
              })}
            </div>
          </div>
        ))}
        {(data ?? []).length === 0 ? (
          <p className="rounded-xl border border-border bg-card p-6 text-center text-muted-foreground">
            {t("admin.users.empty")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
