import {
  AlertTriangle,
  Bell,
  Bike,
  ClipboardCheck,
  Folder,
  Inbox,
  Languages,
  LayoutDashboard,
  LifeBuoy,
  ListTree,
  Package,
  Settings as SettingsIcon,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { Permission } from "@/lib/auth/permissions";

export type MenuRegistryItem = {
  id: string;
  defaultLabel: string;
  defaultIcon: string;
  href: string;
  defaultGroup: string;
  defaultOrder: number;
  permission?: Permission;
  superAdminOnly?: boolean;
  footer?: boolean;
};

export const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  Package,
  Bike,
  ClipboardCheck,
  Inbox,
  AlertTriangle,
  Wallet,
  Bell,
  LifeBuoy,
  Settings: SettingsIcon,
  Languages,
  ListTree,
  Folder,
};

export const ICON_NAMES = Object.keys(ICON_MAP);

export function resolveIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? LayoutDashboard;
}

export const DEFAULT_GROUPS = ["Overview", "Operations", "System"];

export const MENU_REGISTRY: MenuRegistryItem[] = [
  {
    id: "dashboard",
    defaultLabel: "Dashboard",
    defaultIcon: "LayoutDashboard",
    href: "/dashboard",
    defaultGroup: "Overview",
    defaultOrder: 0,
    permission: "dashboard.view",
  },
  {
    id: "drivers",
    defaultLabel: "Drivers",
    defaultIcon: "Users",
    href: "/drivers",
    defaultGroup: "Operations",
    defaultOrder: 0,
    permission: "drivers.view",
  },
  {
    id: "deliveries",
    defaultLabel: "Live Deliveries",
    defaultIcon: "Package",
    href: "/deliveries",
    defaultGroup: "Operations",
    defaultOrder: 1,
    permission: "deliveries.view",
  },
  {
    id: "vehicles",
    defaultLabel: "Vehicles",
    defaultIcon: "Bike",
    href: "/vehicles",
    defaultGroup: "Operations",
    defaultOrder: 2,
    permission: "vehicles.view",
  },
  {
    id: "attendance",
    defaultLabel: "Attendance",
    defaultIcon: "ClipboardCheck",
    href: "/attendance",
    defaultGroup: "Operations",
    defaultOrder: 3,
    permission: "attendance.view",
  },
  {
    id: "requests",
    defaultLabel: "Requests",
    defaultIcon: "Inbox",
    href: "/requests",
    defaultGroup: "Operations",
    defaultOrder: 4,
    permission: "requests.view",
  },
  {
    id: "wrong-actions",
    defaultLabel: "Wrong Actions",
    defaultIcon: "AlertTriangle",
    href: "/wrong-actions",
    defaultGroup: "Operations",
    defaultOrder: 5,
    permission: "wrong_actions.view",
  },
  {
    id: "earnings",
    defaultLabel: "Earnings & Incentives",
    defaultIcon: "Wallet",
    href: "/earnings",
    defaultGroup: "Operations",
    defaultOrder: 6,
    permission: "earnings.view",
  },
  {
    id: "notifications",
    defaultLabel: "Notifications",
    defaultIcon: "Bell",
    href: "/notifications",
    defaultGroup: "Operations",
    defaultOrder: 7,
    permission: "notifications.view",
  },
  {
    id: "support",
    defaultLabel: "Support",
    defaultIcon: "LifeBuoy",
    href: "/support",
    defaultGroup: "Operations",
    defaultOrder: 8,
    permission: "support.view",
  },
  {
    id: "settings",
    defaultLabel: "Settings",
    defaultIcon: "Settings",
    href: "/settings",
    defaultGroup: "System",
    defaultOrder: 0,
    permission: "settings.view",
    footer: true,
  },
  {
    id: "menu-editor",
    defaultLabel: "Menu Editor",
    defaultIcon: "ListTree",
    href: "/settings/menu-editor",
    defaultGroup: "System",
    defaultOrder: 1,
    superAdminOnly: true,
    footer: true,
  },
  {
    id: "languages",
    defaultLabel: "Languages",
    defaultIcon: "Languages",
    href: "/settings/languages",
    defaultGroup: "System",
    defaultOrder: 2,
    superAdminOnly: true,
    footer: true,
  },
];

/** Map menu item id → next-intl nav key (without `nav.` prefix). */
export const APP_NAV_KEY_BY_ID: Record<string, string> = {
  dashboard: "dashboard",
  drivers: "drivers",
  deliveries: "deliveries",
  vehicles: "vehicles",
  attendance: "attendance",
  requests: "requests",
  "wrong-actions": "wrongActions",
  earnings: "earnings",
  notifications: "notifications",
  support: "support",
  settings: "settings",
  "menu-editor": "menuEditor",
  languages: "languages",
};
