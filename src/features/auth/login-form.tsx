"use client";

import { useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Package } from "lucide-react";
import { signInWithEmail } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function LoginForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const urlError = searchParams.get("error");
  const errorMessage =
    error === "invalid_credentials"
      ? t("invalidCredentials")
      : error === "not_authorized" || urlError === "not_authorized"
        ? t("notAuthorized")
        : urlError
          ? t("allowlistRequired")
          : null;

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sidebar-accent text-sidebar-accent-foreground">
          <Package className="h-6 w-6" />
        </div>
        <div>
          <p className="text-lg font-semibold text-foreground">DPD Admin</p>
          <p className="text-sm text-muted-foreground">Delivery Panel</p>
        </div>
      </div>
      <Card className="w-full border-border shadow-[0_4px_24px_rgba(15,15,15,0.08)]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl">{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            action={(formData) => {
              startTransition(async () => {
                const result = await signInWithEmail(locale, formData);
                if (result?.error) {
                  setError(result.error);
                }
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={isPending}
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={isPending}
                className="rounded-lg"
              />
            </div>
            {errorMessage ? (
              <p className="text-sm text-destructive" role="alert">
                {errorMessage}
              </p>
            ) : null}
            <Button
              type="submit"
              className="w-full cursor-pointer rounded-lg"
              disabled={isPending}
            >
              {isPending ? t("signingIn") : t("signIn")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
