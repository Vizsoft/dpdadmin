import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { getAllAdminRoles } from "@/lib/auth/get-role-permissions";
import { PageHeader } from "@/components/dashboard/page-header";
import { MenuEditorPanel } from "@/features/menu-editor/menu-editor-panel";

export default async function MenuEditorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireSuperAdmin(locale);
  const t = await getTranslations("pages.settings.menuEditor");
  const roles = await getAllAdminRoles();

  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <MenuEditorPanel roles={roles} />
    </>
  );
}
