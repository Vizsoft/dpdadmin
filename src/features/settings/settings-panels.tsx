"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function SettingsPanels() {
  const t = useTranslations("pages.settings");

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("localeLabel")}</CardTitle>
        </CardHeader>
        <CardContent>
          <LocaleSwitcher />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("themeLabel")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ThemeToggle />
        </CardContent>
      </Card>
    </div>
  );
}
