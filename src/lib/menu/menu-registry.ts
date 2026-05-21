import {
  AlertTriangle,
  Bell,
  Bike,
  ClipboardCheck,
  Folder,
  Handshake,
  Inbox,
  Languages,
  LayoutDashboard,
  LifeBuoy,
  ListTree,
  MapPin,
  Package,
  Paintbrush,
  Settings as SettingsIcon,
  Shield,
  ToggleLeft,
  UserCheck,
  Users,
  Wallet,
  Cloud,
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
  Handshake,
  MapPin,
  Paintbrush,
  Shield,
  ToggleLeft,
  UserCheck,
  Cloud,
};

export const ICON_NAMES = Object.keys(ICON_MAP);

export function resolveIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? LayoutDashboard;
}

export const DEFAULT_GROUPS = ["Overview", "Operations", "System", "Unorganised"];

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
    id: "partners",
    defaultLabel: "Partners",
    defaultIcon: "Handshake",
    href: "/partners",
    defaultGroup: "Operations",
    defaultOrder: 1,
    permission: "partners.view",
  },
  {
    id: "deliveries",
    defaultLabel: "Live Deliveries",
    defaultIcon: "Package",
    href: "/deliveries",
    defaultGroup: "Operations",
    defaultOrder: 2,
    permission: "deliveries.view",
  },
  {
    id: "vehicles",
    defaultLabel: "Vehicles",
    defaultIcon: "Bike",
    href: "/vehicles",
    defaultGroup: "Operations",
    defaultOrder: 3,
    permission: "vehicles.view",
  },
  {
    id: "attendance",
    defaultLabel: "Attendance",
    defaultIcon: "ClipboardCheck",
    href: "/attendance",
    defaultGroup: "Operations",
    defaultOrder: 4,
    permission: "attendance.view",
  },
  {
    id: "requests",
    defaultLabel: "Requests",
    defaultIcon: "Inbox",
    href: "/requests",
    defaultGroup: "Operations",
    defaultOrder: 5,
    permission: "requests.view",
  },
  {
    id: "wrong-actions",
    defaultLabel: "Wrong Actions",
    defaultIcon: "AlertTriangle",
    href: "/wrong-actions",
    defaultGroup: "Operations",
    defaultOrder: 6,
    permission: "wrong_actions.view",
  },
  {
    id: "earnings",
    defaultLabel: "Earnings & Incentives",
    defaultIcon: "Wallet",
    href: "/earnings",
    defaultGroup: "Operations",
    defaultOrder: 7,
    permission: "earnings.view",
  },
  {
    id: "dpd",
    defaultLabel: "DPD",
    defaultIcon: "ToggleLeft",
    href: "/dpd",
    defaultGroup: "Operations",
    defaultOrder: 75,
    permission: "earnings.view",
  },
  {
    id: "notifications",
    defaultLabel: "Notifications",
    defaultIcon: "Bell",
    href: "/notifications",
    defaultGroup: "Operations",
    defaultOrder: 8,
    permission: "notifications.view",
  },
  {
    id: "support",
    defaultLabel: "Support",
    defaultIcon: "LifeBuoy",
    href: "/support",
    defaultGroup: "Operations",
    defaultOrder: 9,
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
  },
  {
    id: "zones",
    defaultLabel: "Zones",
    defaultIcon: "MapPin",
    href: "/zones",
    defaultGroup: "Unorganised",
    defaultOrder: 0,
    permission: "zones.view",
  },
];

/** Map menu item id → next-intl nav key (without `nav.` prefix). */
export const APP_NAV_KEY_BY_ID: Record<string, string> = {
  dashboard: "dashboard",
  drivers: "drivers",
  partners: "partners",
  deliveries: "deliveries",
  vehicles: "vehicles",
  attendance: "attendance",
  requests: "requests",
  "wrong-actions": "wrongActions",
  earnings: "earnings",
  dpd: "dpd",
  notifications: "notifications",
  support: "support",
  settings: "settings",
  zones: "zones",
};

export type SettingsSubItem = {
  id: string;
  labelKey: string;
  icon: string;
  href: string;
  permission?: Permission;
  superAdminOnly?: boolean;
};

export const SETTINGS_SUB_ITEMS: SettingsSubItem[] = [
  { id: "branding", labelKey: "branding", icon: "Paintbrush", href: "/settings/branding", permission: "settings.manage" },
  { id: "storage", labelKey: "storage", icon: "Cloud", href: "/settings/storage", superAdminOnly: true },
  { id: "roles", labelKey: "roles", icon: "Shield", href: "/settings/roles", superAdminOnly: true },
  { id: "access-requests", labelKey: "accessRequests", icon: "UserCheck", href: "/settings/access-requests", superAdminOnly: true },
  { id: "maintenance", labelKey: "maintenance", icon: "ToggleLeft", href: "/settings/maintenance", superAdminOnly: true },
  { id: "menu-editor", labelKey: "menuEditor", icon: "ListTree", href: "/settings/menu-editor", superAdminOnly: true },
  { id: "languages", labelKey: "languages", icon: "Languages", href: "/settings/languages", superAdminOnly: true },
];
