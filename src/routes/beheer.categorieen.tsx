import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  NoAccessState,
  PageHeader,
  Pager,
  StatusBadge,
} from "@/components/admin/admin-ui";
import { useCan } from "@/components/admin/admin-shell";
import { archiveCategoryFn, getAdminCategories, upsertCategory } from "@/lib/admin-extra.functions";
import type { AdminCategory } from "@/lib/admin-extra.server";

export const Route = createFileRoute("/beheer/categorieen")({
  component: CategoriesPage,
});

const PAGE_SIZE = 15;

type FormState = Partial<AdminCategory> & { name?: string };

function CategoriesPage() {
  const allow = useCan();
  const queryClient = useQueryClient();
  const fetchCategories = useServerFn(getAdminCategories);
  const save = useServerFn(upsertCategory);
  const archive = useServerFn(archiveCategoryFn);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"sort_order" | "name" | "product_count" | "updated_at">(
    "sort_order",
  );
  const [showArchived, setShowArchived] = useState(false);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<FormState | null>(null);
  const [archiveId, setArchiveId] = useState<string | null>(null);

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => fetchCategories({}) as Promise<AdminCategory[]>,
    enabled: allow("categories", "view"),
  });

  const mutation = useMutation({
    mutationFn: (input: FormState) =>
      save({
        data: {
          id: input.id,
          name: input.name ?? "",
          slug: input.slug ?? "",
          parent_id: input.parent_id ?? null,
          description: input.description ?? null,
          image_url: input.image_url ?? null,
          sort_order: Number(input.sort_order ?? 0),
          is_visible: input.is_visible ?? true,
          is_featured: input.is_featured ?? false,
          seo_title: input.seo_title ?? null,
          seo_description: input.seo_description ?? null,
        },
      }),
    onSuccess: () => {
      toast.success("Categorie opgeslagen");
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => archive({ data: { id } }),
    onSuccess: () => {
      toast.success("Categorie gearchiveerd");
      setArchiveId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = (data ?? [])
      .filter((c) => (showArchived ? true : !c.is_archived))
      .filter((c) => (term ? c.name.toLowerCase().includes(term) || c.slug.includes(term) : true));
    const sorted = [...list].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "product_count") return b.product_count - a.product_count;
      if (sort === "updated_at") return a.updated_at < b.updated_at ? 1 : -1;
      return a.sort_order - b.sort_order;
    });
    return sorted;
  }, [data, search, sort, showArchived]);

  if (!allow("categories", "view")) return <NoAccessState module="categorieën" />;

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const parents = (data ?? []).filter((c) => !c.parent_id && !c.is_archived);

  return (
    <div>
      <PageHeader
        title="Categorieën"
        description="Beheer de categorieboom, weergave-orde, afbeeldingen en SEO."
        actions={
          allow("categories", "create") ? (
            <Button onClick={() => setEditing({ is_visible: true, sort_order: 0 })}>
              Categorie toevoegen
            </Button>
          ) : null
        }
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Zoek op naam of slug"
          className="max-w-xs"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          aria-label="Sorteren"
        >
          <option value="sort_order">Weergave-orde</option>
          <option value="name">Naam</option>
          <option value="product_count">Aantal producten</option>
          <option value="updated_at">Laatst bijgewerkt</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={showArchived} onCheckedChange={setShowArchived} />
          Gearchiveerd tonen
        </label>
      </div>

      {isPending ? <LoadingState /> : null}
      {error ? <ErrorState message={(error as Error).message} onRetry={() => refetch()} /> : null}

      {data && rows.length === 0 ? (
        <EmptyState title="Geen categorieën" description="Voeg je eerste categorie toe." />
      ) : null}

      {pageRows.length ? (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Naam</th>
                <th className="p-3">Bovenliggend</th>
                <th className="p-3">Producten</th>
                <th className="p-3">Status</th>
                <th className="p-3">Orde</th>
                <th className="p-3">Bijgewerkt</th>
                <th className="p-3 text-right">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageRows.map((c) => (
                <tr key={c.id}>
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="p-3 text-muted-foreground">{c.parent_name ?? "—"}</td>
                  <td className="p-3">{c.product_count}</td>
                  <td className="p-3">
                    <StatusBadge
                      tone={c.is_archived ? "muted" : c.is_visible ? "success" : "warning"}
                      label={
                        c.is_archived ? "Gearchiveerd" : c.is_visible ? "Zichtbaar" : "Verborgen"
                      }
                    />
                  </td>
                  <td className="p-3">{c.sort_order}</td>
                  <td className="p-3 text-muted-foreground">
                    {new Date(c.updated_at).toLocaleDateString("nl-NL")}
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      {allow("categories", "edit") ? (
                        <Button size="sm" variant="outline" onClick={() => setEditing(c)}>
                          Wijzigen
                        </Button>
                      ) : null}
                      {allow("categories", "archive") && !c.is_archived ? (
                        <Button size="sm" variant="ghost" onClick={() => setArchiveId(c.id)}>
                          Archiveren
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <Pager page={page} pageCount={pageCount} total={rows.length} onPage={setPage} />

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Categorie wijzigen" : "Nieuwe categorie"}</DialogTitle>
          </DialogHeader>
          {editing ? (
            <div className="space-y-3">
              <div>
                <Label htmlFor="cat-name">Naam *</Label>
                <Input
                  id="cat-name"
                  value={editing.name ?? ""}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="cat-slug">Slug</Label>
                <Input
                  id="cat-slug"
                  value={editing.slug ?? ""}
                  placeholder="wordt automatisch gemaakt"
                  onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="cat-parent">Bovenliggende categorie</Label>
                <select
                  id="cat-parent"
                  value={editing.parent_id ?? ""}
                  onChange={(e) => setEditing({ ...editing, parent_id: e.target.value || null })}
                  className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                >
                  <option value="">Geen (hoofdcategorie)</option>
                  {parents
                    .filter((p) => p.id !== editing.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <Label htmlFor="cat-desc">Beschrijving</Label>
                <Textarea
                  id="cat-desc"
                  value={editing.description ?? ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="cat-image">Afbeelding (pad of URL)</Label>
                <Input
                  id="cat-image"
                  value={editing.image_url ?? ""}
                  onChange={(e) => setEditing({ ...editing, image_url: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="cat-order">Weergave-orde</Label>
                  <Input
                    id="cat-order"
                    type="number"
                    value={editing.sort_order ?? 0}
                    onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })}
                  />
                </div>
                <div className="flex items-end gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={editing.is_visible ?? true}
                      onCheckedChange={(v) => setEditing({ ...editing, is_visible: v })}
                    />
                    Zichtbaar
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={editing.is_featured ?? false}
                      onCheckedChange={(v) => setEditing({ ...editing, is_featured: v })}
                    />
                    Uitgelicht
                  </label>
                </div>
              </div>
              <div>
                <Label htmlFor="cat-seo-title">SEO titel</Label>
                <Input
                  id="cat-seo-title"
                  value={editing.seo_title ?? ""}
                  onChange={(e) => setEditing({ ...editing, seo_title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="cat-seo-desc">SEO omschrijving</Label>
                <Textarea
                  id="cat-seo-desc"
                  value={editing.seo_description ?? ""}
                  onChange={(e) => setEditing({ ...editing, seo_description: e.target.value })}
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Annuleren
            </Button>
            <Button
              disabled={mutation.isPending || !editing?.name?.trim()}
              onClick={() => editing && mutation.mutate(editing)}
            >
              {mutation.isPending ? "Opslaan…" : "Opslaan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(archiveId)} onOpenChange={(open) => !open && setArchiveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Categorie archiveren?</AlertDialogTitle>
            <AlertDialogDescription>
              De categorie verdwijnt uit de winkel maar blijft bewaard. Dit kan alleen als er geen
              actieve producten meer aan hangen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={() => archiveId && archiveMutation.mutate(archiveId)}>
              Archiveren
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
