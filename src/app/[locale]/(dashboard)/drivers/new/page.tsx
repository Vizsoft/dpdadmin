import { setRequestLocale } from "next-intl/server";
import { requirePermission } from "@/lib/auth/require-permission";
import { AddDriverPageShell } from "@/features/drivers/add-driver-page-shell";

export default async function NewDriverPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requirePermission(locale, "drivers.manage");

  return <AddDriverPageShell />;
}
