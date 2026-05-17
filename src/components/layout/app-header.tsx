"use client";

import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/contexts/auth-context";
import { usePageHeaderState } from "@/contexts/page-header-context";
import { signOut } from "@/features/auth/actions";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function AppHeader() {
  const t = useTranslations("common");
  const locale = useLocale();
  const { email, fullName } = useAuth();
  const { state } = usePageHeaderState();
  const initials = (fullName ?? email ?? "A").slice(0, 2).toUpperCase();

  return (
    <header className="flex min-h-16 shrink-0 flex-col border-b border-border">
      <div className="flex items-center gap-4 px-6 py-4">
        <SidebarTrigger className="cursor-pointer md:hidden" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          {state.title ? (
            <h1 className="truncate text-xl font-semibold tracking-tight text-foreground">
              {state.title}
            </h1>
          ) : null}
          {state.subtitle ? (
            <p className="truncate text-sm text-muted-foreground">{state.subtitle}</p>
          ) : null}
        </div>
        {state.actions ? (
          <div className="flex shrink-0 items-center gap-2">{state.actions}</div>
        ) : null}
        <Separator orientation="vertical" className="mx-1 hidden h-6 sm:block" />
        <div className="flex shrink-0 items-center gap-1">
          <LocaleSwitcher />
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost" className="cursor-pointer gap-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">{fullName ?? "Admin"}</p>
                  <p className="text-xs text-muted-foreground">{email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => signOut(locale)}
              >
                {t("logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {state.tabs ? <div className="px-6">{state.tabs}</div> : null}
    </header>
  );
}
