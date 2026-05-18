"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { ChevronDown } from "lucide-react";
import { BrandMark } from "@/components/brand/brand-mark";
import { useSidebarMenu } from "@/hooks/use-sidebar-menu";
import { APP_NAV_KEY_BY_ID, ICON_MAP } from "@/lib/menu/menu-registry";
import { LayoutDashboard } from "lucide-react";

function MenuIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? LayoutDashboard;
  return <Icon className={className} />;
}
import type { ResolvedMenuNode } from "@/lib/menu/menu-merge";
import { cn } from "@/lib/utils";
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

function useItemLabel() {
  const t = useTranslations();
  return (node: ResolvedMenuNode) => {
    const navKey = APP_NAV_KEY_BY_ID[node.id];
    if (navKey) return t(`nav.${navKey}`);
    return node.label;
  };
}

const GROUP_LABEL_KEYS: Record<string, string> = {
  Overview: "overview",
  Operations: "operations",
  System: "system",
  "Unassigned (new)": "unassigned",
};

function useGroupLabel() {
  const t = useTranslations("appNavGroups");
  return (label: string) => {
    const slug = GROUP_LABEL_KEYS[label];
    return slug ? t(slug) : label;
  };
}

function NavItemLink({
  node,
  label,
}: {
  node: ResolvedMenuNode;
  label: string;
}) {
  const pathname = usePathname();
  if (!node.href) return null;
  const isActive =
    pathname === node.href || pathname.startsWith(`${node.href}/`);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        className="h-10 cursor-pointer rounded-lg px-3 text-sidebar-foreground hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground"
        render={
          <Link href={node.href} prefetch>
            <MenuIcon name={node.icon} className="h-4 w-4 shrink-0" />
            <span>{label}</span>
          </Link>
        }
      />
    </SidebarMenuItem>
  );
}

function NavGroup({
  node,
  tItemLabel,
  tGroupLabel,
}: {
  node: ResolvedMenuNode;
  tItemLabel: (n: ResolvedMenuNode) => string;
  tGroupLabel: (label: string) => string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const children = node.children ?? [];

  if (node.displayMode === "panel") {
    return (
      <>
        {children.map((child) => (
          <NavItemLink
            key={child.id}
            node={child}
            label={tItemLabel(child)}
          />
        ))}
      </>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="h-9 cursor-pointer rounded-lg px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-sidebar-accent/50"
      >
        <MenuIcon name={node.icon} className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-start">{tGroupLabel(node.label)}</span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
        />
      </SidebarMenuButton>
      {open && (
        <SidebarMenuSub>
          {children.map((child) => {
            const isActive =
              child.href &&
              (pathname === child.href || pathname.startsWith(`${child.href}/`));
            return (
              <SidebarMenuSubItem key={child.id}>
                <SidebarMenuSubButton
                  isActive={!!isActive}
                  render={
                    child.href ? (
                      <Link href={child.href} prefetch>
                        <MenuIcon name={child.icon} className="h-4 w-4" />
                        <span>{tItemLabel(child)}</span>
                      </Link>
                    ) : (
                      <span>{tItemLabel(child)}</span>
                    )
                  }
                />
              </SidebarMenuSubItem>
            );
          })}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
}

function NavTree({ nodes }: { nodes: ResolvedMenuNode[] }) {
  const tItemLabel = useItemLabel();
  const tGroupLabel = useGroupLabel();

  const main: ResolvedMenuNode[] = [];
  const footer: ResolvedMenuNode[] = [];

  for (const n of nodes) {
    if (n.type === "item" && n.footer) footer.push(n);
    else if (n.type === "group") {
      const groupFooter = n.children?.every((c) => c.footer);
      if (groupFooter) footer.push(n);
      else main.push(n);
    } else if (n.footer) footer.push(n);
    else main.push(n);
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {main.map((node) =>
              node.type === "group" ? (
                <NavGroup
                  key={node.id}
                  node={node}
                  tItemLabel={tItemLabel}
                  tGroupLabel={tGroupLabel}
                />
              ) : (
                <NavItemLink
                  key={node.id}
                  node={node}
                  label={tItemLabel(node)}
                />
              ),
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      {footer.length > 0 && (
        <SidebarFooter className="border-t border-sidebar-border px-2 py-3">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {footer.map((node) =>
                  node.type === "group" ? (
                    <NavGroup
                      key={node.id}
                      node={node}
                      tItemLabel={tItemLabel}
                      tGroupLabel={tGroupLabel}
                    />
                  ) : (
                    <NavItemLink
                      key={node.id}
                      node={node}
                      label={tItemLabel(node)}
                    />
                  ),
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarFooter>
      )}
    </>
  );
}

export function AppSidebar() {
  const { tree } = useSidebarMenu();

  return (
    <Sidebar className="border-sidebar-border bg-sidebar">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-5">
        <Link href="/dashboard">
          <BrandMark size="md" variant="sidebar" />
        </Link>
      </SidebarHeader>
      <SidebarContent className="flex-1 px-2 py-3">
        <NavTree nodes={tree} />
      </SidebarContent>
    </Sidebar>
  );
}
