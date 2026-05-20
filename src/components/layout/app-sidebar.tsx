"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { ChevronDown, LayoutDashboard, PanelLeftClose } from "lucide-react";
import { useLocale } from "next-intl";
import { BrandMark } from "@/components/brand/brand-mark";
import { useAuth } from "@/contexts/auth-context";
import { signOut } from "@/features/auth/actions";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { useSidebarMenu } from "@/hooks/use-sidebar-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buttonVariants } from "@/components/ui/button";
import { APP_NAV_KEY_BY_ID, ICON_MAP } from "@/lib/menu/menu-registry";
import type { ResolvedMenuNode } from "@/lib/menu/menu-merge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
  SidebarMenuSkeleton,
  useSidebar,
} from "@/components/ui/sidebar";

function MenuIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? LayoutDashboard;
  return <Icon className={className} />;
}

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
  Unorganised: "unorganised",
  "Unassigned (new)": "unorganised",
};

function useGroupLabel() {
  const t = useTranslations("appNavGroups");
  return (label: string) => {
    const slug = GROUP_LABEL_KEYS[label];
    return slug ? t(slug) : label;
  };
}

function SidebarCollapseTrigger({ className }: { className?: string }) {
  const t = useTranslations("common");
  const { state, toggleSidebar } = useSidebar();

  if (state !== "expanded") return null;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={cn(
        "hidden shrink-0 cursor-pointer text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground md:inline-flex",
        className,
      )}
      title={t("collapseSidebar")}
      onClick={toggleSidebar}
    >
      <PanelLeftClose className="h-4 w-4" />
      <span className="sr-only">{t("collapseSidebar")}</span>
    </Button>
  );
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
        tooltip={label}
        className="h-8 cursor-pointer rounded-md px-2.5 text-[13px] text-sidebar-foreground hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground"
        render={
          <Link href={node.href} prefetch>
            <MenuIcon name={node.icon} className="h-3.5 w-3.5 shrink-0" />
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
  const { state } = useSidebar();
  const [open, setOpen] = useState(true);
  const children = node.children ?? [];
  const groupLabel = tGroupLabel(node.label);
  const collapsed = state === "collapsed";

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

  if (collapsed) {
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
        tooltip={groupLabel}
        onClick={() => setOpen((o) => !o)}
        className="h-6 cursor-pointer rounded-md px-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground hover:bg-sidebar-accent/50"
      >
        <MenuIcon name={node.icon} className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1 text-start">{groupLabel}</span>
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
                        <MenuIcon name={child.icon} className="h-3.5 w-3.5" />
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
        <SidebarFooter className="border-t border-sidebar-border px-2 py-2">
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

function SidebarNavSkeleton() {
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {Array.from({ length: 6 }).map((_, i) => (
            <SidebarMenuSkeleton key={i} showIcon />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function SidebarBrand() {
  const t = useTranslations("common");
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={toggleSidebar}
        title={t("expandSidebar")}
        aria-label={t("expandSidebar")}
        className="mx-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-sidebar-accent"
      >
        <BrandMark
          size="md"
          variant="sidebar"
          className="[&>div:last-child]:hidden"
        />
      </button>
    );
  }

  return (
    <Link
      href="/dashboard"
      className="min-w-0 flex-1 overflow-hidden"
    >
      <BrandMark size="md" variant="sidebar" />
    </Link>
  );
}

function SidebarUserMenu() {
  const t = useTranslations("common");
  const locale = useLocale();
  const { state } = useSidebar();
  const { email, fullName, role } = useAuth();
  const collapsed = state === "collapsed";
  const initials = (fullName ?? email ?? "A").slice(0, 2).toUpperCase();

  return (
    <SidebarFooter className="mt-auto border-t border-sidebar-border p-2">
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "h-auto w-full cursor-pointer justify-start gap-2 rounded-md px-2 py-2 hover:bg-sidebar-accent",
            collapsed && "justify-center px-0",
          )}
        >
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarFallback className="bg-sidebar-accent text-[10px] font-semibold text-sidebar-accent-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1 text-start">
              <p className="truncate text-[13px] font-medium text-sidebar-foreground">
                {fullName ?? "Admin"}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">{email}</p>
              <p className="truncate text-[10px] capitalize text-muted-foreground/80">{role}</p>
            </div>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-medium">{fullName ?? "Admin"}</p>
              <p className="text-xs text-muted-foreground">{email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer"
            render={<Link href="/settings" />}
          >
            {t("settings")}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => signOut(locale)}
          >
            {t("logout")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarFooter>
  );
}

export function AppSidebar() {
  const mounted = useHasMounted();
  const { tree } = useSidebarMenu();

  return (
    <Sidebar collapsible="icon" className="border-sidebar-border bg-sidebar">
      <SidebarHeader className="flex flex-row items-center gap-2 border-b border-sidebar-border px-2 py-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
        <SidebarBrand />
        <SidebarCollapseTrigger />
      </SidebarHeader>
      <SidebarContent className="flex-1 px-1.5 py-2 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0">
        {mounted ? <NavTree nodes={tree} /> : <SidebarNavSkeleton />}
      </SidebarContent>
      <SidebarUserMenu />
    </Sidebar>
  );
}
