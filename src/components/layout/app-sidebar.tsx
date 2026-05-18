"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { FOOTER_NAV_ITEMS, MAIN_NAV_ITEMS } from "@/config/navigation";
import { BrandMark } from "@/components/brand/brand-mark";
import { useAuth } from "@/contexts/auth-context";
import { NAV_ICON_MAP } from "@/components/layout/nav-icons";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

function NavList({ items }: { items: typeof MAIN_NAV_ITEMS }) {
  const t = useTranslations();
  const pathname = usePathname();
  const { can } = useAuth();

  const visibleItems = items.filter((item) => can(item.permission));

  return (
    <SidebarMenu>
      {visibleItems.map((item) => {
        const Icon = NAV_ICON_MAP[item.icon];
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              isActive={isActive}
              className="h-10 cursor-pointer rounded-lg px-3 text-sidebar-foreground hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground"
              render={
                <Link href={item.href} prefetch>
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{t(item.labelKey)}</span>
                </Link>
              }
            />
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

export function AppSidebar() {
  return (
    <Sidebar className="border-sidebar-border bg-sidebar">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-5">
        <Link href="/dashboard">
          <BrandMark size="md" variant="sidebar" />
        </Link>
      </SidebarHeader>
      <SidebarContent className="flex-1 px-2 py-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <NavList items={MAIN_NAV_ITEMS} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border px-2 py-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <NavList items={FOOTER_NAV_ITEMS} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}
