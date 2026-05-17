"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Package } from "lucide-react";
import { NAV_ITEMS } from "@/config/navigation";
import { useAuth } from "@/contexts/auth-context";
import { NAV_ICON_MAP } from "@/components/layout/nav-icons";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const t = useTranslations();
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const { can } = useAuth();

  const visibleItems = NAV_ITEMS.filter((item) => can(item.permission));

  return (
    <Sidebar className="border-sidebar-border bg-sidebar">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-accent-foreground">
            <Package className="h-5 w-5" />
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-sm font-semibold tracking-tight text-foreground">
              {tCommon("appName")}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              Delivery Panel
            </span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => {
                const Icon = NAV_ICON_MAP[item.icon];
                const isActive =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      className="h-10 cursor-pointer rounded-lg px-3"
                      render={
                        <Link href={item.href}>
                          <Icon className="h-4 w-4 shrink-0" />
                          <span>{t(item.labelKey)}</span>
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
