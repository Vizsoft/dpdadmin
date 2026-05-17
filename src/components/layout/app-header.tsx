"use client";

import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/contexts/auth-context";
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
  const initials = (fullName ?? email ?? "A").slice(0, 2).toUpperCase();

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="cursor-pointer" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <div className="flex flex-1 items-center justify-end gap-1">
        <LocaleSwitcher />
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="ghost" className="cursor-pointer gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{initials}</AvatarFallback>
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
    </header>
  );
}
