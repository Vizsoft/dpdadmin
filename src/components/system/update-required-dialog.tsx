"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function UpdateRequiredDialog() {
  const t = useTranslations("system.update");

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="update-required-title"
    >
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle id="update-required-title">{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t("body")}</p>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full cursor-pointer rounded-lg"
            onClick={() => window.location.reload()}
          >
            {t("refresh")}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
