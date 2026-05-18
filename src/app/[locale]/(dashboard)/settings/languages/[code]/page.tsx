import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { PageHeader } from "@/components/dashboard/page-header";
import { TranslationEditorPanel } from "@/features/languages/translation-editor-panel";

export default async function TranslationEditorPage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale, code } = await params;
  setRequestLocale(locale);
  await requireSuperAdmin(locale);
  const t = await getTranslations("pages.settings.translationEditor");

  return (
    <>
      <PageHeader
        title={t("title", { locale: code.toUpperCase() })}
        subtitle={t("subtitle")}
      />
      <TranslationEditorPanel localeCode={code} />
    </>
  );
}
