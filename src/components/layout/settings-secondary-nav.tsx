"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { LayoutDashboard, User } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { ICON_MAP, SETTINGS_SUB_ITEMS } from "@/lib/menu/menu-registry";
import { cn } from "@/lib/utils";

function NavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? LayoutDashboard;
  return <Icon className={className} />;
}

export function SettingsSecondaryNav() {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const { can, isSuperAdmin } = useAuth();

  const visibleSubs = SETTINGS_SUB_ITEMS.filter((sub) => {
    if (sub.superAdminOnly && !isSuperAdmin) return false;
    if (sub.permission && !can(sub.permission)) return false;
    return true;
  });

  const items: { id: string; label: string; href: string; icon: React.ReactNode }[] = [
    {
      id: "profile",
      label: t("profile"),
      href: "/settings",
      icon: <User className="h-3.5 w-3.5" />,
    },
    ...visibleSubs.map((sub) => ({
      id: sub.id,
      label: t(sub.labelKey),
      href: sub.href,
      icon: <NavIcon name={sub.icon} className="h-3.5 w-3.5" />,
    })),
  ];

  return (
    <aside className="hidden w-52 shrink-0 flex-col border-r border-border bg-muted/30 md:flex">
      <div className="flex h-12 items-center border-b border-border px-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          {tCommon("settings")}
        </span>
      </div>
      <nav className="flex-1 overflow-auto px-2 py-2">
        <ul className="flex flex-col gap-0.5">
          {items.map((item) => {
            const isActive =
              item.href === "/settings"
                ? pathname === "/settings"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  prefetch
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
                    isActive
                      ? "bg-background font-medium text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
                  )}
                >
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
