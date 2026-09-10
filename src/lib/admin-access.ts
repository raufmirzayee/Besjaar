import type { AppRole } from "./admin.server";

export type AdminModule =
  | "dashboard"
  | "products"
  | "categories"
  | "brands"
  | "inventory"
  | "stock_movements"
  | "receipts"
  | "low_stock"
  | "orders"
  | "bol"
  | "shipments"
  | "returns"
  | "customers"
  | "reviews"
  | "promotions"
  | "coupons"
  | "content"
  | "reports"
  | "sync"
  | "support"
  | "users"
  | "settings"
  | "audit";

export type AdminAction =
  "view" | "create" | "edit" | "archive" | "export" | "approve" | "refund" | "manage_settings";

export const MODULE_LABELS: Record<AdminModule, string> = {
  dashboard: "Dashboard",
  products: "Producten",
  categories: "Categorieën",
  brands: "Merken",
  inventory: "Voorraad",
  stock_movements: "Voorraadmutaties",
  receipts: "Leveranciersontvangsten",
  low_stock: "Lage voorraad",
  orders: "Bestellingen",
  bol: "bol.com bestellingen",
  shipments: "Verzendingen",
  returns: "Retouren",
  customers: "Klanten",
  reviews: "Beoordelingen",
  promotions: "Promoties",
  coupons: "Kortingscodes",
  content: "Content",
  reports: "Rapporten",
  sync: "Synchronisatie",
  support: "Support",
  users: "Gebruikers & rollen",
  settings: "Instellingen",
  audit: "Audit logs",
};

export const ACTION_LABELS: Record<AdminAction, string> = {
  view: "Bekijken",
  create: "Aanmaken",
  edit: "Wijzigen",
  archive: "Archiveren",
  export: "Exporteren",
  approve: "Goedkeuren",
  refund: "Terugbetalen",
  manage_settings: "Instellingen beheren",
};

export type PermissionKey = `${AdminModule}:${AdminAction}`;

export type AdminAccess = {
  roles: AppRole[];
  permissions: PermissionKey[];
};

export function can(access: AdminAccess | undefined, module: AdminModule, action: AdminAction) {
  if (!access) return false;
  if (access.roles.includes("super_admin")) return true;
  return access.permissions.includes(`${module}:${action}`);
}

export type AdminNavItem = {
  to: string;
  label: string;
  module: AdminModule;
  icon: string;
  exact?: boolean;
  badge?: BadgeKey;
  group: string;
};

export type BadgeKey =
  | "newOrders"
  | "readyToShip"
  | "lowStock"
  | "pendingReturns"
  | "openSupport"
  | "failedPayments"
  | "syncErrors"
  | "pendingReviews";

export const ADMIN_NAV: AdminNavItem[] = [
  {
    to: "/beheer",
    label: "Dashboard",
    module: "dashboard",
    icon: "LayoutDashboard",
    exact: true,
    group: "Overzicht",
  },
  {
    to: "/beheer/producten",
    label: "Producten",
    module: "products",
    icon: "Package",
    group: "Catalogus",
  },
  {
    to: "/beheer/categorieen",
    label: "Categorieën",
    module: "categories",
    icon: "FolderTree",
    group: "Catalogus",
  },
  { to: "/beheer/merken", label: "Merken", module: "brands", icon: "Tags", group: "Catalogus" },
  {
    to: "/beheer/catalogus-import",
    label: "Catalogus importeren",
    module: "products",
    icon: "FileUp",
    group: "Catalogus",
  },
  {
    to: "/beheer/import",
    label: "Import & export",
    module: "products",
    icon: "FileSpreadsheet",
    group: "Catalogus",
  },
  {
    to: "/beheer/vertalingen",
    label: "Vertalingen",
    module: "products",
    icon: "Languages",
    group: "Catalogus",
  },
  {
    to: "/beheer/voorraad",
    label: "Voorraad",
    module: "inventory",
    icon: "Boxes",
    group: "Magazijn",
  },
  {
    to: "/beheer/mutaties",
    label: "Voorraadmutaties",
    module: "stock_movements",
    icon: "ArrowLeftRight",
    group: "Magazijn",
  },
  {
    to: "/beheer/lage-voorraad",
    label: "Lage voorraad",
    module: "low_stock",
    icon: "AlertTriangle",
    badge: "lowStock",
    group: "Magazijn",
  },
  {
    to: "/beheer/bestellingen",
    label: "Bestellingen",
    module: "orders",
    icon: "ShoppingBag",
    badge: "newOrders",
    group: "Verkoop",
  },
  {
    to: "/beheer/bolcom",
    label: "bol.com",
    module: "bol",
    icon: "Store",
    badge: "syncErrors",
    group: "Verkoop",
  },
  {
    to: "/beheer/retouren",
    label: "Retouren",
    module: "returns",
    icon: "RotateCcw",
    badge: "pendingReturns",
    group: "Verkoop",
  },
  {
    to: "/beheer/klanten",
    label: "Klanten",
    module: "customers",
    icon: "UserRound",
    group: "Klanten",
  },
  {
    to: "/beheer/beoordelingen",
    label: "Beoordelingen",
    module: "reviews",
    icon: "Star",
    badge: "pendingReviews",
    group: "Klanten",
  },
  {
    to: "/beheer/berichten",
    label: "Support",
    module: "support",
    icon: "MessageSquare",
    badge: "openSupport",
    group: "Klanten",
  },
  {
    to: "/beheer/rapporten",
    label: "Rapporten",
    module: "reports",
    icon: "BarChart3",
    group: "Analyse",
  },
  {
    to: "/beheer/medewerkers",
    label: "Medewerkers",
    module: "users",
    icon: "ShieldCheck",
    group: "Systeem",
  },
  {
    to: "/beheer/gebruikers",
    label: "Gebruikers & rollen",
    module: "users",
    icon: "Users",
    group: "Systeem",
  },
  {
    to: "/beheer/audit",
    label: "Audit logs",
    module: "audit",
    icon: "ScrollText",
    group: "Systeem",
  },
];

export const NAV_GROUPS = [
  "Overzicht",
  "Catalogus",
  "Magazijn",
  "Verkoop",
  "Klanten",
  "Analyse",
  "Systeem",
];

export type QuickAction = {
  label: string;
  to: string;
  module: AdminModule;
  action: AdminAction;
};

export const QUICK_ACTIONS: QuickAction[] = [
  { label: "Producten beheren", to: "/beheer/producten", module: "products", action: "create" },
  {
    label: "Categorie toevoegen",
    to: "/beheer/categorieen",
    module: "categories",
    action: "create",
  },
  { label: "Merk toevoegen", to: "/beheer/merken", module: "brands", action: "create" },
  { label: "Voorraad bijwerken", to: "/beheer/voorraad", module: "inventory", action: "edit" },
  {
    label: "Lage voorraad bekijken",
    to: "/beheer/lage-voorraad",
    module: "low_stock",
    action: "view",
  },
  { label: "bol.com synchroniseren", to: "/beheer/bolcom", module: "bol", action: "edit" },
  { label: "Bestellingen verwerken", to: "/beheer/bestellingen", module: "orders", action: "edit" },
];
