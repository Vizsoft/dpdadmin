import type { Permission } from "@/lib/auth/permissions";

export type NavIcon =
  | "LayoutDashboard"
  | "Users"
  | "Package"
  | "BarChart3"
  | "Settings";

export type NavItem = {
  href: string;
  labelKey: string;
  icon: NavIcon;
  permission: Permission;
};

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    labelKey: "nav.dashboard",
    icon: "LayoutDashboard",
    permission: "dashboard.view",
  },
  {
    href: "/users",
    labelKey: "nav.users",
    icon: "Users",
    permission: "users.view",
  },
  {
    href: "/orders",
    labelKey: "nav.orders",
    icon: "Package",
    permission: "orders.view",
  },
  {
    href: "/reports",
    labelKey: "nav.reports",
    icon: "BarChart3",
    permission: "reports.view",
  },
  {
    href: "/settings",
    labelKey: "nav.settings",
    icon: "Settings",
    permission: "settings.view",
  },
];
