"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { updateProfile } from "@/features/settings/profile-actions";
import { updatePassword } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export type ProfileData = {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  role: string;
};

export function ProfileSettingsPanel({ profile }: { profile: ProfileData }) {
  const t = useTranslations("pages.settings");
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();
  const [isChangingPw, startChangingPw] = useTransition();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("profile.title")}</CardTitle>
          <CardDescription>{t("profile.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 sm:grid-cols-2"
            action={(formData) => {
              startSaving(async () => {
                const result = await updateProfile(formData);
                if (result.error) {
                  toast.error(t("profile.errors.saveFailed"));
                  return;
                }
                toast.success(t("profile.saved"));
                router.refresh();
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="fullName">{t("profile.fullName")}</Label>
              <Input
                id="fullName"
                name="fullName"
                defaultValue={profile.fullName ?? ""}
                required
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("profile.email")}</Label>
              <Input
                id="email"
                value={profile.email ?? ""}
                disabled
                className="text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t("profile.phone")}</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={profile.phone ?? ""}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("profile.role")}</Label>
              <Input
                value={profile.role}
                disabled
                className="text-muted-foreground"
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={isSaving} className="cursor-pointer rounded-lg">
                {isSaving ? t("profile.saving") : t("profile.save")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("profile.changePassword")}</CardTitle>
          <CardDescription>{t("profile.changePasswordHint")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 sm:grid-cols-2"
            action={(formData) => {
              startChangingPw(async () => {
                const pw = String(formData.get("password") ?? "");
                const confirm = String(formData.get("confirmPassword") ?? "");
                if (pw !== confirm) {
                  toast.error(t("profile.errors.passwordMismatch"));
                  return;
                }
                const result = await updatePassword(formData);
                if (result.error) {
                  toast.error(
                    result.error === "weak_password"
                      ? t("profile.errors.weakPassword")
                      : t("profile.errors.passwordFailed"),
                  );
                  return;
                }
                toast.success(t("profile.passwordChanged"));
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="password">{t("profile.newPassword")}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                disabled={isChangingPw}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("profile.confirmPassword")}</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                disabled={isChangingPw}
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={isChangingPw} className="cursor-pointer rounded-lg">
                {isChangingPw ? t("profile.changingPassword") : t("profile.changePassword")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

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
    </div>
  );
}
