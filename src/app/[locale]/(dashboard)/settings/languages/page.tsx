import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { PageHeader } from "@/components/dashboard/page-header";
import { LanguagesPanel } from "@/features/languages/languages-panel";

export default async function LanguagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireSuperAdmin(locale);
  const t = await getTranslations("pages.settings.languages");

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <LanguagesPanel />
    </>
  );
}
