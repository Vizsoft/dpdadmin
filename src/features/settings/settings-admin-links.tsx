"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Languages, ListTree } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function SettingsAdminLinks() {
  const t = useTranslations("pages.settings.adminTools");
  const { isSuperAdmin } = useAuth();

  if (!isSuperAdmin) return null;

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle className="text-base">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          className="gap-2"
          render={
            <Link href="/settings/menu-editor">
              <ListTree className="h-4 w-4" />
              {t("menuEditor")}
            </Link>
          }
        />
        <Button
          variant="outline"
          className="gap-2"
          render={
            <Link href="/settings/languages">
              <Languages className="h-4 w-4" />
              {t("languages")}
            </Link>
          }
        />
      </CardContent>
    </Card>
  );
}
