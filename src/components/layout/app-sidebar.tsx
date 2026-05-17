"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { NAV_ITEMS } from "@/config/navigation";
import { useAuth } from "@/contexts/auth-context";
import { NAV_ICON_MAP } from "@/components/layout/nav-icons";
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
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const t = useTranslations();
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const { can } = useAuth();

  const visibleItems = NAV_ITEMS.filter((item) => can(item.permission));

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-4">
        <Link href="/dashboard" className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold tracking-tight">
            {tCommon("appName")}
          </span>
          <span className="text-xs text-muted-foreground">Operations</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
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
                      className="cursor-pointer"
                      render={
                        <Link href={item.href}>
                          <Icon className="h-4 w-4" />
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
