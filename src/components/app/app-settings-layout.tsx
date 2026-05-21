"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { LayoutDashboard, User } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { ICON_MAP, SETTINGS_SUB_ITEMS } from "@/lib/menu/menu-registry";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";

function NavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? LayoutDashboard;
  return <Icon className={className} />;
}

function SettingsNav() {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const { can, isSuperAdmin } = useAuth();

  const visibleSubs = SETTINGS_SUB_ITEMS.filter((sub) => {
    if (sub.superAdminOnly && !isSuperAdmin) return false;
    if (sub.permission && !can(sub.permission)) return false;
    return true;
  });

  const items: { id: string; label: string; href: string; icon: ReactNode }[] = [
    {
      id: "profile",
      label: t("profile"),
      href: "/settings",
      icon: <User className="h-4 w-4" />,
    },
    ...visibleSubs.map((sub) => ({
      id: sub.id,
      label: t(sub.labelKey),
      href: sub.href,
      icon: <NavIcon name={sub.icon} className="h-4 w-4" />,
    })),
  ];

  return (
    <Sidebar
      collapsible="none"
      className="hidden w-56 shrink-0 border-e border-sidebar-border bg-sidebar md:flex"
    >
      <SidebarHeader className="h-11 justify-center border-b border-sidebar-border px-3">
        <SidebarGroupLabel className="px-0 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          {tCommon("settings")}
        </SidebarGroupLabel>
      </SidebarHeader>
      <SidebarContent className="px-2 py-2">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive =
                  item.href === "/settings"
                    ? pathname === "/settings"
                    : pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={isActive}
                      className="h-8 cursor-pointer rounded-md text-[13px] font-normal"
                      render={
                        <Link href={item.href} prefetch>
                          {item.icon}
                          <span className="truncate">{item.label}</span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export function AppSettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={cn(
        "flex h-full min-h-0 overflow-hidden rounded-xl border border-border bg-card shadow-sm",
      )}
    >
      <SidebarProvider className="min-h-0 w-auto shrink-0">
        <SettingsNav />
      </SidebarProvider>
      <div className="flex-1 space-y-6 overflow-auto p-6">{children}</div>
    </div>
  );
}
