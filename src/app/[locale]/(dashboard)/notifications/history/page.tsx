import { setRequestLocale } from "next-intl/server";
import { requirePermission } from "@/lib/auth/require-permission";
import { NotificationHistoryPageShell } from "@/features/notifications/history-page-shell";

export default async function NotificationHistoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requirePermission(locale, "notifications.view");
  return <NotificationHistoryPageShell />;
}
