import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAdminUsers, setUserRole } from "@/lib/admin.functions";
import { ROLE_LABELS, STAFF_ROLES, type AdminUserRow, type AppRole } from "@/lib/admin.server";

export const Route = createFileRoute("/beheer/gebruikers")({
  component: UsersPage,
});

function UsersPage() {
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
      toast.success("Rollen bijgewerkt");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["my-roles"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isPending) return <p className="text-sm text-muted-foreground">Gebruikers laden…</p>;
  if (error) return <p className="text-sm text-destructive">{(error as Error).message}</p>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-bold">Gebruikers & rollen</h2>
        <p className="text-sm text-muted-foreground">
          Alleen een super admin kan rollen toekennen of intrekken.
        </p>
      </div>

      <div className="space-y-3">
        {(data ?? []).map((user) => (
          <div key={user.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">
                  {[user.first_name, user.last_name].filter(Boolean).join(" ") || "Naamloos"}
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
                  <Badge variant="outline">Geen rol</Badge>
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
            Nog geen gebruikers.
          </p>
        ) : null}
      </div>
    </div>
  );
}
