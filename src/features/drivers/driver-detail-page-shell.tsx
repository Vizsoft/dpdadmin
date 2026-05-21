"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, Check, Loader2, Minus } from "lucide-react";
import { toast } from "sonner";
import { TabBar, type TabItem } from "@/components/dashboard/tab-bar";
import { AppPage } from "@/components/app/app-page";
import { TABLE_HEAD_CLASS } from "@/components/app/constants";
import { AppEmptyState } from "@/components/app/app-empty-state";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { cn } from "@/lib/utils";
import { DriverEditSheet } from "./driver-edit-sheet";
import { LinkedBadge, WorkflowStatusPill } from "./driver-workflow-ui";
import { formatPhoneDisplay } from "./driver-phone";
import { ASSET_TYPES, type DriverWorkflowStatus } from "./types";
import { useDriverDetail } from "./use-drivers";

type DetailTabId =
  | "attendance"
  | "documents"
  | "assets"
  | "earnings"
  | "deductions"
  | "loan"
  | "complaint"
  | "wrong-actions";

function DetailSkeleton() {
  return (
    <div className="flex h-48 items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

function DriverDetailContent({ id }: { id: string }) {
  const t = useTranslations("pages.driverDetail");
  const tNew = useTranslations("pages.driverNew");
  const tList = useTranslations("pages.drivers");
  const { can } = useAuth();
  const canManage = can("drivers.manage");
  const { data: driver, isLoading, isError } = useDriverDetail(id);
  const [activeTab, setActiveTab] = useState<DetailTabId>("assets");
  const [editOpen, setEditOpen] = useState(false);

  const workflowLabel = (status: DriverWorkflowStatus) => {
    switch (status) {
      case "draft":
        return tList("statusDraft");
      case "pending":
        return tList("statusPending");
      case "approved":
        return tList("statusApproved");
      default:
        return status ?? "";
    }
  };

  const tabs: TabItem[] = [
    { id: "attendance", label: t("tabAttendance") },
    { id: "documents", label: t("tabDocuments") },
    { id: "assets", label: t("tabAssets") },
    { id: "earnings", label: t("tabEarnings") },
    { id: "deductions", label: t("tabDeductions") },
    { id: "loan", label: t("tabLoan") },
    { id: "complaint", label: t("tabComplaint") },
    { id: "wrong-actions", label: t("tabWrongActions") },
  ];

  if (isLoading) return <DetailSkeleton />;
  if (isError || !driver) {
    return (
      <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
        <p className="text-sm font-medium text-foreground">{t("notFoundTitle")}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t("notFoundDescription")}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4 cursor-pointer rounded-lg"
          nativeButton={false}
          render={<Link href="/drivers" />}
        >
          {t("backToList")}
        </Button>
      </div>
    );
  }

  const initials = driver.full_name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const metaFields: { label: string; value: string }[] = [
    { label: t("fieldPhone"), value: formatPhoneDisplay(driver.phone) },
    {
      label: t("fieldLinked"),
      value: driver.linked ? tList("linkedYes") : tList("linkedNo"),
    },
    { label: t("fieldEmail"), value: driver.email ?? "—" },
    { label: t("fieldCivilId"), value: driver.civil_id },
    { label: t("fieldZone"), value: driver.zone_label },
    {
      label: t("fieldBaseEarnings"),
      value:
        driver.base_earnings_kwd != null
          ? `${driver.base_earnings_kwd} KD`
          : "—",
    },
    { label: t("fieldPartner"), value: driver.partner_name },
    { label: t("fieldBike"), value: driver.vehicle_label ?? "—" },
    { label: t("fieldJoined"), value: driver.joined_at ?? "—" },
  ];

  const renderTabPanel = () => {
    if (activeTab === "assets") {
      return (
        <Card className="rounded-xl border-border shadow-sm">
          <CardHeader className="border-b border-border py-4">
            <CardTitle className="text-base font-semibold">{t("assetsTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  {ASSET_TYPES.map((asset) => (
                    <TableHead key={asset} className={cn("text-center", TABLE_HEAD_CLASS)}>
                      {tNew(`assets.${asset}`)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="hover:bg-muted/40">
                  {ASSET_TYPES.map((asset) => {
                    const issued = Boolean(driver.assets_issued[asset]);
                    return (
                      <TableCell key={asset} className="text-center">
                        {issued ? (
                          <Check className="mx-auto h-4 w-4 text-success" aria-label={t("issued")} />
                        ) : (
                          <Minus
                            className="mx-auto h-4 w-4 text-muted-foreground"
                            aria-label={t("notIssued")}
                          />
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="rounded-xl border-border shadow-sm">
        <CardContent className="py-12">
          <AppEmptyState
            title={t("emptyTitle")}
            description={t("emptyTabDescription")}
          />
        </CardContent>
      </Card>
    );
  };

  return (
    <AppPage>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="cursor-pointer shrink-0"
          nativeButton={false}
          render={<Link href="/drivers" />}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="sr-only">{t("backToList")}</span>
      </div>

      <Card className="rounded-xl border-border shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/30">
                {driver.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={driver.avatar_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-semibold text-muted-foreground">
                    {initials}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-semibold text-foreground">
                    {driver.full_name}
                  </h1>
                  <WorkflowStatusPill
                    status={driver.workflow_status}
                    label={workflowLabel(driver.workflow_status)}
                  />
                  <LinkedBadge
                    linked={driver.linked}
                    yesLabel={tList("linkedYes")}
                    noLabel={tList("linkedNo")}
                  />
                </div>
                <p className="mt-1 font-mono text-sm text-muted-foreground">
                  {driver.driver_code}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {driver.zone_label} · {driver.partner_name}
                </p>
              </div>
            </div>
            {canManage && driver.intake_id ? (
              <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:items-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="cursor-pointer rounded-lg"
                  onClick={() => setEditOpen(true)}
                >
                  {t("editDriver")}
                </Button>
                <DriverEditSheet
                  driver={driver}
                  intakeId={driver.intake_id}
                  open={editOpen}
                  onOpenChange={setEditOpen}
                />
              </div>
            ) : null}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metaFields.map((field) => (
              <div key={field.label} className="min-w-0">
                <p className="text-xs text-muted-foreground">{field.label}</p>
                <p className="mt-0.5 text-sm text-foreground">{field.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="min-w-0 space-y-4">
          <TabBar
            items={tabs}
            activeId={activeTab}
            className="gap-4 sm:gap-6"
            onSelect={(id) => setActiveTab(id as DetailTabId)}
          />
          <div
            role="tabpanel"
            id={`tabpanel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
          >
            {renderTabPanel()}
          </div>
        </div>

        <aside className="space-y-4">
          <Card className="rounded-xl border-border shadow-sm">
            <CardHeader className="border-b border-border py-4">
              <CardTitle className="text-sm font-semibold">{t("quickStats")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 py-4">
              {[
                { label: t("statAttendance"), value: "—" },
                { label: t("statDeliveriesToday"), value: "—" },
                { label: t("statDeliveriesWeek"), value: "—" },
                { label: t("statEarnings"), value: "—" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="text-muted-foreground">{stat.label}</span>
                  <span className="tabular-nums font-medium text-foreground">
                    {stat.value}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="rounded-xl border-border shadow-sm">
            <CardHeader className="border-b border-border py-4">
              <CardTitle className="text-sm font-semibold">{t("earningsTrend")}</CardTitle>
            </CardHeader>
            <CardContent className="py-8">
              <p className="text-center text-sm text-muted-foreground">
                {t("chartPlaceholder")}
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </AppPage>
  );
}

export function DriverDetailPageShell({ id }: { id: string }) {
  const mounted = useHasMounted();
  if (!mounted) return <DetailSkeleton />;
  return <DriverDetailContent id={id} />;
}
