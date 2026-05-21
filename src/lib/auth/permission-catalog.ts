/**
 * Canonical permission catalog — single source of truth for RBAC.
 *
 * When adding a new admin page:
 * 1. Add view/manage entries here (slug, label, category)
 * 2. Set the same slug on MENU_REGISTRY item `permission`
 * 3. Call requirePermission(locale, slug) on the page
 * 4. Optional: document in app_page_registry migration
 *
 * Opening Roles & Permissions syncs this catalog into admin_permissions.
 */

export type PermissionCatalogEntry = {
  slug: string;
  label: string;
  category: string;
};

export const PERMISSION_CATALOG: readonly PermissionCatalogEntry[] = [
  { slug: "dashboard.view", label: "View dashboard", category: "dashboard" },
  { slug: "drivers.view", label: "View drivers", category: "drivers" },
  { slug: "drivers.manage", label: "Manage drivers", category: "drivers" },
  { slug: "partners.view", label: "View partners", category: "partners" },
  { slug: "partners.manage", label: "Manage partners", category: "partners" },
  { slug: "restaurants.view", label: "View restaurants", category: "restaurants" },
  { slug: "restaurants.manage", label: "Manage restaurants", category: "restaurants" },
  { slug: "vehicles.view", label: "View vehicles", category: "vehicles" },
  { slug: "vehicles.manage", label: "Manage vehicles", category: "vehicles" },
  { slug: "deliveries.view", label: "View deliveries", category: "deliveries" },
  { slug: "deliveries.manage", label: "Manage deliveries", category: "deliveries" },
  { slug: "zones.view", label: "View zones", category: "zones" },
  { slug: "zones.manage", label: "Manage zones", category: "zones" },
  { slug: "attendance.view", label: "View attendance", category: "attendance" },
  { slug: "requests.view", label: "View requests", category: "requests" },
  { slug: "requests.manage", label: "Manage requests", category: "requests" },
  {
    slug: "wrong_actions.view",
    label: "View wrong actions",
    category: "compliance",
  },
  {
    slug: "wrong_actions.manage",
    label: "Manage wrong actions",
    category: "compliance",
  },
  { slug: "earnings.view", label: "View earnings", category: "earnings" },
  { slug: "earnings.manage", label: "Manage earnings", category: "earnings" },
  {
    slug: "notifications.view",
    label: "View notifications",
    category: "notifications",
  },
  {
    slug: "notifications.manage",
    label: "Manage notifications",
    category: "notifications",
  },
  { slug: "support.view", label: "View support", category: "support" },
  { slug: "support.manage", label: "Manage support", category: "support" },
  { slug: "settings.view", label: "View settings", category: "settings" },
  { slug: "settings.manage", label: "Manage settings", category: "settings" },
  {
    slug: "users.manage",
    label: "Manage users and approvals",
    category: "admin",
  },
  {
    slug: "roles.manage",
    label: "Manage roles and permissions",
    category: "admin",
  },
] as const;

export const CATALOG_SLUGS = PERMISSION_CATALOG.map((e) => e.slug);

export const CATALOG_SLUG_SET = new Set<string>(CATALOG_SLUGS);

export function slugifyRoleName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
}

export function isValidRoleSlug(slug: string): boolean {
  return /^[a-z][a-z0-9_]{0,47}$/.test(slug);
}
