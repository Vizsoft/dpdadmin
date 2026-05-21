import { getTranslations, setRequestLocale } from "next-intl/server";
import { requirePermission } from "@/lib/auth/require-permission";
import { AppPage } from "@/components/app/app-page";
import { AppPageHeader } from "@/components/app/app-page-header";
import { StatusPill } from "@/components/dashboard/status-pill";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export default async function UsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requirePermission(locale, "users.manage");
  const t = await getTranslations("pages.users");

  const placeholderRows = [
    { status: "success" as const, label: "Active" },
    { status: "warning" as const, label: "Pending" },
    { status: "danger" as const, label: "Suspended" },
  ];

  return (
    <AppPage>
      <AppPageHeader title={t("title")} description={t("subtitle")} />
      <Card className="overflow-hidden rounded-xl border-border shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="text-xs font-semibold text-accent">Name</TableHead>
                <TableHead className="text-xs font-semibold text-accent">Role</TableHead>
                <TableHead className="text-xs font-semibold text-accent">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {placeholderRows.map((row, i) => (
                <TableRow key={i} className="hover:bg-muted/40">
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <StatusPill variant={row.status}>{row.label}</StatusPill>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="border-t border-border px-6 py-4 text-sm text-muted-foreground">
            {t("placeholder")}
          </p>
        </CardContent>
      </Card>
    </AppPage>
  );
}
