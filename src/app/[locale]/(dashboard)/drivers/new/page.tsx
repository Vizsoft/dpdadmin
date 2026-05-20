import { getTranslations, setRequestLocale } from "next-intl/server";
import { requirePermission } from "@/lib/auth/require-permission";
import { PageContentHeader } from "@/components/dashboard/page-content-header";
import { Card, CardContent } from "@/components/ui/card";

export default async function NewDriverPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requirePermission(locale, "drivers.manage");
  const t = await getTranslations("pages.driverNew");

  return (
    <>
      <PageContentHeader title={t("title")} subtitle={t("subtitle")} />
      <Card className="rounded-xl border-border shadow-sm">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">{t("emptyTitle")}</p>
        </CardContent>
      </Card>
    </>
  );
}
