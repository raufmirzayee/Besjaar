import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  NoAccessState,
  PageHeader,
  StatusBadge,
} from "@/components/admin/admin-ui";
import { useCan } from "@/components/admin/admin-shell";
import { useI18n } from "@/lib/i18n";
import { getAdminBrands, upsertBrand } from "@/lib/admin-extra.functions";
import type { AdminBrand } from "@/lib/admin-extra.server";

export const Route = createFileRoute("/beheer/merken")({
  component: BrandsPage,
});

type FormState = Partial<AdminBrand> & { name?: string };

function BrandsPage() {
  const { t } = useI18n();
  const allow = useCan();
  const queryClient = useQueryClient();
  const fetchBrands = useServerFn(getAdminBrands);
  const save = useServerFn(upsertBrand);

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<FormState | null>(null);

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ["admin-brands"],
    queryFn: () => fetchBrands({}) as Promise<AdminBrand[]>,
    enabled: allow("brands", "view"),
  });

  const mutation = useMutation({
    mutationFn: (input: FormState) =>
      save({
        data: {
          id: input.id,
          name: input.name ?? "",
          slug: input.slug ?? "",
          description: input.description ?? null,
          logo_url: input.logo_url ?? null,
          sort_order: Number(input.sort_order ?? 0),
          is_active: input.is_active ?? true,
          seo_title: input.seo_title ?? null,
          seo_description: input.seo_description ?? null,
        },
      }),
    onSuccess: () => {
      toast.success(t("admin.brand.saved"));
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["admin-brands"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data ?? []).filter((b) => (term ? b.name.toLowerCase().includes(term) : true));
  }, [data, search]);

  if (!allow("brands", "view")) return <NoAccessState module="merken" />;

  return (
    <div>
      <PageHeader
        title={t("admin.brand.title")}
        description={t("admin.brand.subtitle")}
        actions={
          allow("brands", "create") ? (
            <Button onClick={() => setEditing({ is_active: true, sort_order: 0 })}>
              {t("admin.brand.add")}
            </Button>
          ) : null
        }
      />

      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t("admin.brand.search")}
        className="mb-3 max-w-xs"
      />

      {isPending ? <LoadingState /> : null}
      {error ? <ErrorState message={(error as Error).message} onRetry={() => refetch()} /> : null}
      {data && rows.length === 0 ? <EmptyState title={t("admin.brand.empty")} /> : null}

      {rows.length ? (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">{t("admin.brand.brand")}</th>
                <th className="p-3">Slug</th>
                <th className="p-3">{t("admin.common.products")}</th>
                <th className="p-3">{t("admin.common.status")}</th>
                <th className="p-3">Orde</th>
                <th className="p-3 text-right">{t("admin.common.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((b) => (
                <tr key={b.id}>
                  <td className="p-3 font-medium">{b.name}</td>
                  <td className="p-3 text-muted-foreground">{b.slug}</td>
                  <td className="p-3">{b.product_count}</td>
                  <td className="p-3">
                    <StatusBadge
                      tone={b.is_active ? "success" : "muted"}
                      label={b.is_active ? t("admin.brand.active") : t("admin.brand.inactive")}
                    />
                  </td>
                  <td className="p-3">{b.sort_order}</td>
                  <td className="p-3 text-right">
                    {allow("brands", "edit") ? (
                      <Button size="sm" variant="outline" onClick={() => setEditing(b)}>
                        {t("admin.brand.change")}
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing?.id ? t("admin.brand.editTitle") : t("admin.brand.new")}
            </DialogTitle>
          </DialogHeader>
          {editing ? (
            <div className="space-y-3">
              <div>
                <Label htmlFor="brand-name">{t("admin.common.nameRequired")}</Label>
                <Input
                  id="brand-name"
                  value={editing.name ?? ""}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="brand-slug">Slug</Label>
                <Input
                  id="brand-slug"
                  value={editing.slug ?? ""}
                  onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="brand-logo">{t("admin.brand.logo")}</Label>
                <Input
                  id="brand-logo"
                  value={editing.logo_url ?? ""}
                  onChange={(e) => setEditing({ ...editing, logo_url: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="brand-desc">{t("admin.common.description")}</Label>
                <Textarea
                  id="brand-desc"
                  value={editing.description ?? ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="brand-order">{t("admin.brand.displayOrder")}</Label>
                  <Input
                    id="brand-order"
                    type="number"
                    value={editing.sort_order ?? 0}
                    onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })}
                  />
                </div>
                <label className="flex items-end gap-2 text-sm">
                  <Switch
                    checked={editing.is_active ?? true}
                    onCheckedChange={(v) => setEditing({ ...editing, is_active: v })}
                  />
                  {t("admin.brand.active")}
                </label>
              </div>
              <div>
                <Label htmlFor="brand-seo-title">SEO titel</Label>
                <Input
                  id="brand-seo-title"
                  value={editing.seo_title ?? ""}
                  onChange={(e) => setEditing({ ...editing, seo_title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="brand-seo-desc">SEO omschrijving</Label>
                <Textarea
                  id="brand-seo-desc"
                  value={editing.seo_description ?? ""}
                  onChange={(e) => setEditing({ ...editing, seo_description: e.target.value })}
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              {t("admin.common.cancel")}
            </Button>
            <Button
              disabled={mutation.isPending || !editing?.name?.trim()}
              onClick={() => editing && mutation.mutate(editing)}
            >
              {mutation.isPending ? t("admin.common.saving") : t("admin.common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
