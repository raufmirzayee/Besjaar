import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import * as Icons from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useI18n } from "@/lib/i18n";
import { ADMIN_LOCALES } from "@/lib/translations/admin";
import type { TranslationKey } from "@/lib/translations";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  ADMIN_NAV,
  NAV_GROUPS,
  QUICK_ACTIONS,
  can,
  type AdminAccess,
  type AdminAction,
  type AdminModule,
} from "@/lib/admin-access";
import {
  getAdminBadges,
  getAdminNotifications,
  readNotifications,
  searchAdmin,
} from "@/lib/admin-core.functions";
import type { AdminBadges, AdminNotification, GlobalSearchResult } from "@/lib/admin-core.server";

/* ------------------------------ access context ------------------------------ */

const AccessContext = createContext<AdminAccess | null>(null);

export function AdminAccessProvider({
  access,
  children,
}: {
  access: AdminAccess;
  children: ReactNode;
}) {
  return <AccessContext.Provider value={access}>{children}</AccessContext.Provider>;
}

export function useAdminAccess(): AdminAccess {
  return useContext(AccessContext) ?? { roles: [], permissions: [] };
}

export function useCan() {
  const access = useAdminAccess();
  return (module: AdminModule, action: AdminAction) => can(access, module, action);
}

/* --------------------------------- helpers --------------------------------- */

function Icon({ name, className }: { name: string; className?: string }) {
  const Cmp = (Icons as unknown as Record<string, typeof Icons.Package>)[name] ?? Icons.Circle;
  return <Cmp className={className} aria-hidden />;
}

function badgeValue(badges: AdminBadges | undefined, key?: string) {
  if (!badges || !key) return 0;
  return Number((badges as unknown as Record<string, number>)[key] ?? 0);
}

/* ---------------------------------- shell ---------------------------------- */

export function AdminShell({ children }: { children: ReactNode }) {
  const access = useAdminAccess();
  const { user, signOut } = useAuth();
  const { t, locale, setLocale } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [term, setTerm] = useState("");

  const fetchBadges = useServerFn(getAdminBadges);
  const fetchNotifications = useServerFn(getAdminNotifications);
  const markRead = useServerFn(readNotifications);
  const doSearch = useServerFn(searchAdmin);

  const badgesQuery = useQuery({
    queryKey: ["admin-badges"],
    queryFn: () => fetchBadges({}) as Promise<AdminBadges>,
    refetchInterval: 60_000,
  });

  const notificationsQuery = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: () => fetchNotifications({}) as Promise<AdminNotification[]>,
    refetchInterval: 120_000,
  });

  const searchQuery = useQuery({
    queryKey: ["admin-search", term],
    enabled: term.trim().length >= 2,
    queryFn: () => doSearch({ data: { term } }) as Promise<GlobalSearchResult[]>,
  });

  const visibleNav = useMemo(
    () => ADMIN_NAV.filter((item) => can(access, item.module, "view")),
    [access],
  );

  const activeItem = useMemo(() => {
    const matches = visibleNav
      .filter((item) => (item.exact ? pathname === item.to : pathname.startsWith(item.to)))
      .sort((a, b) => b.to.length - a.to.length);
    return matches[0];
  }, [visibleNav, pathname]);

  const quickActions = QUICK_ACTIONS.filter((a) => can(access, a.module, a.action));
  const unread = badgesQuery.data?.unreadNotifications ?? 0;

  const nav = (
    <nav className="flex flex-col gap-4">
      {NAV_GROUPS.map((group) => {
        const items = visibleNav.filter((i) => i.group === group);
        if (!items.length) return null;
        return (
          <div key={group}>
            {!collapsed ? (
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t(group as TranslationKey)}
              </p>
            ) : null}
            <div className="flex flex-col gap-0.5">
              {items.map((item) => {
                const active = activeItem?.to === item.to;
                const count = badgeValue(badgesQuery.data, item.badge);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    title={t(item.label as TranslationKey)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    <Icon name={item.icon} className="h-4 w-4 shrink-0" />
                    {!collapsed ? (
                      <span className="min-w-0 truncate">{t(item.label as TranslationKey)}</span>
                    ) : null}
                    {count > 0 ? (
                      <Badge
                        variant={active ? "secondary" : "outline"}
                        className="ml-auto shrink-0 px-1.5 py-0 text-[10px]"
                      >
                        {count}
                      </Badge>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    navigate({ to: "/inloggen", replace: true });
  }

  return (
    <div className="container-page py-6">
      <div className="flex gap-6">
        {/* Desktop sidebar */}
        <aside
          className={cn(
            "hidden shrink-0 rounded-xl border border-border bg-card p-2 lg:block",
            collapsed ? "w-16" : "w-60",
          )}
        >
          <div className="mb-2 flex items-center justify-between px-1">
            {!collapsed ? (
              <span className="px-2 font-display text-sm font-bold">
                {t("admin.signIn.eyebrow")}
              </span>
            ) : null}
            <Button
              size="icon"
              variant="ghost"
              aria-label={t("admin.shell.toggleSidebar")}
              onClick={() => setCollapsed((v) => !v)}
            >
              <Icons.PanelLeft className="h-4 w-4" aria-hidden />
            </Button>
          </div>
          {nav}
        </aside>

        <div className="min-w-0 flex-1">
          {/* Top bar */}
          <div className="mb-5 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-xl border border-border bg-card p-2">
            <div className="flex items-center gap-1">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="lg:hidden"
                    aria-label={t("admin.shell.menu")}
                  >
                    <Icons.Menu className="h-4 w-4" aria-hidden />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 overflow-y-auto">
                  <SheetTitle className="mb-3 font-display">{t("admin.signIn.eyebrow")}</SheetTitle>
                  {nav}
                </SheetContent>
              </Sheet>
            </div>

            {/* Global search */}
            <Popover open={term.trim().length >= 2}>
              <PopoverTrigger asChild>
                <div className="relative min-w-0">
                  <Icons.Search
                    className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    placeholder={t("admin.shell.searchPlaceholder")}
                    className="pl-8"
                    aria-label={t("admin.shell.globalSearch")}
                  />
                </div>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="w-80 p-1"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                {searchQuery.isPending ? (
                  <p className="p-3 text-sm text-muted-foreground">{t("admin.shell.searching")}</p>
                ) : (searchQuery.data ?? []).length === 0 ? (
                  <p className="p-3 text-sm text-muted-foreground">{t("admin.shell.noResults")}</p>
                ) : (
                  <ul className="max-h-72 overflow-y-auto">
                    {(searchQuery.data ?? []).map((r) => (
                      <li key={`${r.type}-${r.id}`}>
                        <button
                          type="button"
                          className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
                          onClick={() => {
                            setTerm("");
                            if (r.type === "product")
                              navigate({
                                to: "/beheer/producten",
                                search: { q: r.label } as never,
                              });
                            else if (r.type === "order") navigate({ to: "/beheer/bestellingen" });
                            else if (r.type === "return") navigate({ to: "/beheer/retouren" });
                            else navigate({ to: "/beheer/klanten" });
                          }}
                        >
                          <span className="min-w-0 truncate">{r.label}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">{r.hint}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </PopoverContent>
            </Popover>

            <div className="flex items-center gap-1">
              {quickActions.length ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" className="hidden sm:inline-flex">
                      <Icons.Plus className="mr-1 h-4 w-4" aria-hidden />
                      {t("admin.shell.quickAction")}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{t("admin.shell.quickActions")}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {quickActions.map((a) => (
                      <DropdownMenuItem
                        key={t(a.label as TranslationKey)}
                        onClick={() => navigate({ to: a.to.split("?")[0] })}
                      >
                        {t(a.label as TranslationKey)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}

              {/* Notifications */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="relative"
                    aria-label={t("admin.shell.notifications")}
                  >
                    <Icons.Bell className="h-4 w-4" aria-hidden />
                    {unread > 0 ? (
                      <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                        {unread}
                      </span>
                    ) : null}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-2">
                  <div className="flex items-center justify-between gap-2 pb-2">
                    <p className="text-sm font-semibold">{t("admin.shell.notifications")}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        await markRead({ data: { ids: null } });
                        toast.success(t("admin.shell.allRead"));
                        queryClient.invalidateQueries({ queryKey: ["admin-badges"] });
                        queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
                      }}
                    >
                      {t("admin.shell.allRead")}
                    </Button>
                  </div>
                  <div className="max-h-80 space-y-1 overflow-y-auto">
                    {(notificationsQuery.data ?? []).length === 0 ? (
                      <p className="p-3 text-sm text-muted-foreground">
                        {t("admin.shell.noNotifications")}
                      </p>
                    ) : (
                      (notificationsQuery.data ?? []).map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={async () => {
                            await markRead({ data: { ids: [n.id] } });
                            queryClient.invalidateQueries({ queryKey: ["admin-badges"] });
                            queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
                          }}
                          className={cn(
                            "block w-full rounded-md border p-2 text-left text-sm",
                            n.read ? "border-border" : "border-primary/40 bg-primary/5",
                          )}
                        >
                          <span className="font-medium">{n.title}</span>
                          {n.body ? (
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                              {n.body}
                            </span>
                          ) : null}
                          <span className="mt-0.5 block text-[10px] text-muted-foreground">
                            {new Date(n.created_at).toLocaleString(locale)}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              <div className="hidden sm:block">
                <LanguageSwitcher only={ADMIN_LOCALES} />
              </div>

              <Button size="icon" variant="ghost" asChild aria-label={t("admin.shell.help")}>
                <Link to="/veelgestelde-vragen">
                  <Icons.CircleHelp className="h-4 w-4" aria-hidden />
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" aria-label={t("admin.shell.profileMenu")}>
                    <Icons.UserRound className="h-4 w-4" aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="truncate">{user?.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="flex flex-wrap gap-1 px-2 pb-2">
                    {access.roles.map((r) => (
                      <Badge key={r} variant="secondary">
                        {t(`admin.role.${r}` as TranslationKey)}
                      </Badge>
                    ))}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate({ to: "/account" })}>
                    {t("admin.shell.myAccount")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ to: "/" })}>
                    {t("admin.shell.toShop")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    {t("admin.shell.signOut")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Breadcrumbs */}
          <p className="mb-3 flex items-center gap-1 text-xs text-muted-foreground">
            <Link to="/beheer" className="hover:text-foreground">
              {t("admin.shell.title")}
            </Link>
            {activeItem && !activeItem.exact ? (
              <>
                <Icons.ChevronRight className="h-3 w-3" aria-hidden />
                <span className="text-foreground">{activeItem.label}</span>
              </>
            ) : null}
          </p>

          {children}
        </div>
      </div>
    </div>
  );
}
