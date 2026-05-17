import { getTranslations, setRequestLocale } from "next-intl/server";
import { requirePermission } from "@/lib/auth/require-permission";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requirePermission(locale, "orders.view");
  const t = await getTranslations("pages.orders");

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <Card>
        <CardContent className="space-y-4 pt-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-48 w-full" />
          <p className="text-sm text-muted-foreground">{t("placeholder")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
