import { setRequestLocale } from "next-intl/server";
import { requirePermission } from "@/lib/auth/require-permission";
import { WorktimePageShell } from "@/features/worktime/worktime-page-shell";

export default async function WorktimePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requirePermission(locale, "attendance.view");

  return <WorktimePageShell />;
}
