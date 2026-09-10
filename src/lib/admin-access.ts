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

/** Translation keys, not display text. Screens run these through `t()`. */
export const MODULE_LABELS: Record<AdminModule, string> = {
  dashboard: "admin.module.dashboard",
  products: "admin.module.products",
  categories: "admin.module.categories",
  brands: "admin.module.brands",
  inventory: "admin.module.inventory",
  stock_movements: "admin.module.stock_movements",
  receipts: "admin.module.receipts",
  low_stock: "admin.module.low_stock",
  orders: "admin.module.orders",
  bol: "admin.module.bol",
  shipments: "admin.module.shipments",
  returns: "admin.module.returns",
  customers: "admin.module.customers",
  reviews: "admin.module.reviews",
  promotions: "admin.module.promotions",
  coupons: "admin.module.coupons",
  content: "admin.module.content",
  reports: "admin.module.reports",
  sync: "admin.module.sync",
  support: "admin.module.support",
  users: "admin.module.users",
  settings: "admin.module.settings",
  audit: "admin.module.audit",
};

/** Translation keys, not display text. Screens run these through `t()`. */
export const ACTION_LABELS: Record<AdminAction, string> = {
  view: "admin.action.view",
  create: "admin.action.create",
  edit: "admin.action.edit",
  archive: "admin.action.archive",
  export: "admin.action.export",
  approve: "admin.action.approve",
  refund: "admin.action.refund",
  manage_settings: "admin.action.manage_settings",
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
    label: "admin.nav.dashboard",
    module: "dashboard",
    icon: "LayoutDashboard",
    exact: true,
    group: "admin.group.overview",
  },
  {
    to: "/beheer/producten",
    label: "admin.nav.products",
    module: "products",
    icon: "Package",
    group: "admin.group.catalogue",
  },
  {
    to: "/beheer/categorieen",
    label: "admin.nav.categories",
    module: "categories",
    icon: "FolderTree",
    group: "admin.group.catalogue",
  },
  {
    to: "/beheer/merken",
    label: "admin.nav.brands",
    module: "brands",
    icon: "Tags",
    group: "admin.group.catalogue",
  },
  {
    to: "/beheer/catalogus-import",
    label: "admin.nav.catalogueImport",
    module: "products",
    icon: "FileUp",
    group: "admin.group.catalogue",
  },
  {
    to: "/beheer/import",
    label: "admin.nav.importExport",
    module: "products",
    icon: "FileSpreadsheet",
    group: "admin.group.catalogue",
  },
  {
    to: "/beheer/vertalingen",
    label: "admin.nav.translations",
    module: "products",
    icon: "Languages",
    group: "admin.group.catalogue",
  },
  {
    to: "/beheer/voorraad",
    label: "admin.nav.inventory",
    module: "inventory",
    icon: "Boxes",
    group: "admin.group.warehouse",
  },
  {
    to: "/beheer/mutaties",
    label: "admin.nav.stockMovements",
    module: "stock_movements",
    icon: "ArrowLeftRight",
    group: "admin.group.warehouse",
  },
  {
    to: "/beheer/lage-voorraad",
    label: "admin.nav.lowStock",
    module: "low_stock",
    icon: "AlertTriangle",
    badge: "lowStock",
    group: "admin.group.warehouse",
  },
  {
    to: "/beheer/bestellingen",
    label: "admin.nav.orders",
    module: "orders",
    icon: "ShoppingBag",
    badge: "newOrders",
    group: "admin.group.sales",
  },
  {
    to: "/beheer/bolcom",
    label: "admin.nav.bol",
    module: "bol",
    icon: "Store",
    badge: "syncErrors",
    group: "admin.group.sales",
  },
  {
    to: "/beheer/retouren",
    label: "admin.nav.returns",
    module: "returns",
    icon: "RotateCcw",
    badge: "pendingReturns",
    group: "admin.group.sales",
  },
  {
    to: "/beheer/klanten",
    label: "admin.nav.customers",
    module: "customers",
    icon: "UserRound",
    group: "admin.group.customers",
  },
  {
    to: "/beheer/beoordelingen",
    label: "admin.nav.reviews",
    module: "reviews",
    icon: "Star",
    badge: "pendingReviews",
    group: "admin.group.customers",
  },
  {
    to: "/beheer/berichten",
    label: "admin.nav.support",
    module: "support",
    icon: "MessageSquare",
    badge: "openSupport",
    group: "admin.group.customers",
  },
  {
    to: "/beheer/rapporten",
    label: "admin.nav.reports",
    module: "reports",
    icon: "BarChart3",
    group: "admin.group.analysis",
  },
  {
    to: "/beheer/medewerkers",
    label: "admin.nav.staff",
    module: "users",
    icon: "ShieldCheck",
    group: "admin.group.system",
  },
  {
    to: "/beheer/gebruikers",
    label: "admin.nav.users",
    module: "users",
    icon: "Users",
    group: "admin.group.system",
  },
  {
    to: "/beheer/audit",
    label: "admin.nav.audit",
    module: "audit",
    icon: "ScrollText",
    group: "admin.group.system",
  },
];

/** Translation keys, in the order the sidebar shows them. */
export const NAV_GROUPS = [
  "admin.group.overview",
  "admin.group.catalogue",
  "admin.group.warehouse",
  "admin.group.sales",
  "admin.group.customers",
  "admin.group.analysis",
  "admin.group.system",
];

export type QuickAction = {
  label: string;
  to: string;
  module: AdminModule;
  action: AdminAction;
};

export const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "admin.quick.manageProducts",
    to: "/beheer/producten",
    module: "products",
    action: "create",
  },
  {
    label: "admin.quick.addCategory",
    to: "/beheer/categorieen",
    module: "categories",
    action: "create",
  },
  { label: "admin.quick.addBrand", to: "/beheer/merken", module: "brands", action: "create" },
  { label: "admin.quick.updateStock", to: "/beheer/voorraad", module: "inventory", action: "edit" },
  {
    label: "admin.quick.viewLowStock",
    to: "/beheer/lage-voorraad",
    module: "low_stock",
    action: "view",
  },
  { label: "admin.quick.syncBol", to: "/beheer/bolcom", module: "bol", action: "edit" },
  {
    label: "admin.quick.processOrders",
    to: "/beheer/bestellingen",
    module: "orders",
    action: "edit",
  },
];
