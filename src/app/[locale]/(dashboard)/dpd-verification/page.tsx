import { setRequestLocale } from "next-intl/server";
import { requirePermission } from "@/lib/auth/require-permission";
import { VerificationsPageShell } from "@/features/verifications/verifications-page-shell";

export default async function DpdVerificationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requirePermission(locale, "verifications.view");

  return <VerificationsPageShell />;
}
