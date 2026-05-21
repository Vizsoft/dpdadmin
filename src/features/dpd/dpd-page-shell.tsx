"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { TabBar, type TabItem } from "@/components/dashboard/tab-bar";
import { AppPage } from "@/components/app/app-page";
import { AppPageHeader } from "@/components/app/app-page-header";
import { AppEmptyState } from "@/components/app/app-empty-state";
import { AppListCard } from "@/components/app/app-list-card";
import { TABLE_HEAD_CLASS } from "@/components/app/constants";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  isDpdErrorKey,
  runPreviewEarnings,
  runRecalculateEarnings,
  runValidateDelivery,
} from "./dpd-actions";
import { RestaurantFormSheet } from "./restaurant-form-sheet";
import { RuleFormSheet } from "./rule-form-sheet";
import type {
  DeliveryRuleRow,
  DeliveryValidationResult,
  EarningsPreviewResult,
  IncentiveRuleRow,
  RestaurantRow,
} from "./types";
import {
  useDeliveryRules,
  useDpdScopeOptions,
  useIncentiveRules,
  useRestaurants,
} from "./use-dpd";

type DpdTabId = "restaurants" | "delivery-rules" | "incentive-rules" | "calculation";

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("pages.dpd");
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
        status === "active" && "bg-success/15 text-success",
        status === "draft" && "bg-muted text-muted-foreground",
        status === "ended" && "bg-destructive/10 text-destructive",
      )}
    >
      {t(`status.${status as "draft" | "active" | "ended"}`)}
    </span>
  );
}

export function DpdPageShell() {
  const t = useTranslations("pages.dpd");
  const { can } = useAuth();
  const canManage = can("earnings.manage");
  const [activeTab, setActiveTab] = useState<DpdTabId>("restaurants");
  const [search, setSearch] = useState("");
  const [earnDate, setEarnDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [deliveryTestId, setDeliveryTestId] = useState("");
  const [preview, setPreview] = useState<EarningsPreviewResult | null>(null);
  const [validation, setValidation] = useState<DeliveryValidationResult | null>(
    null,
  );
  const [isCalcPending, startCalcTransition] = useTransition();

  const { data: scopeOptions } = useDpdScopeOptions();
  const { data: restaurants, isLoading: restaurantsLoading } = useRestaurants();
  const { data: deliveryRules, isLoading: deliveryLoading } = useDeliveryRules();
  const { data: incentiveRules, isLoading: incentiveLoading } =
    useIncentiveRules();

  const [restaurantSheet, setRestaurantSheet] = useState<{
    open: boolean;
    row: RestaurantRow | null;
  }>({ open: false, row: null });
  const [deliverySheet, setDeliverySheet] = useState<{
    open: boolean;
    row: DeliveryRuleRow | null;
  }>({ open: false, row: null });
  const [incentiveSheet, setIncentiveSheet] = useState<{
    open: boolean;
    row: IncentiveRuleRow | null;
  }>({ open: false, row: null });

  const tabs: TabItem[] = [
    { id: "restaurants", label: t("tabRestaurants") },
    { id: "delivery-rules", label: t("tabDeliveryRules") },
    { id: "incentive-rules", label: t("tabIncentiveRules") },
    { id: "calculation", label: t("tabCalculation") },
  ];

  const filteredRestaurants = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return restaurants ?? [];
    return (restaurants ?? []).filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.partner_name.toLowerCase().includes(q),
    );
  }, [restaurants, search]);

  const errorToast = (error?: string) => {
    if (error && isDpdErrorKey(error)) return t(`errors.${error}`);
    return t("errors.save_failed");
  };

  const handlePreview = () => {
    startCalcTransition(async () => {
      const result = await runPreviewEarnings(earnDate);
      if ("error" in result && result.error) {
        toast.error(errorToast(result.error));
        return;
      }
      setPreview(result as EarningsPreviewResult);
      toast.success(t("previewDone"));
    });
  };

  const handleRecalculate = () => {
    if (!canManage) return;
    startCalcTransition(async () => {
      const result = await runRecalculateEarnings(earnDate);
      if ("error" in result && result.error) {
        toast.error(errorToast(result.error));
        return;
      }
      if ("count" in result) {
        toast.success(t("recalculateDone", { count: result.count }));
      }
    });
  };

  const handleValidateDelivery = () => {
    startCalcTransition(async () => {
      const result = await runValidateDelivery(deliveryTestId.trim());
      if ("error" in result && result.error) {
        toast.error(errorToast(result.error));
        return;
      }
      setValidation(result as DeliveryValidationResult);
    });
  };

  return (
    <AppPage>
      <AppPageHeader title={t("title")} description={t("subtitle")} />

      <TabBar
        items={tabs}
        activeId={activeTab}
        onSelect={(id) => setActiveTab(id as DpdTabId)}
        className="gap-4 sm:gap-6"
      />

      {activeTab === "restaurants" ? (
        <AppListCard
          toolbar={
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchRestaurants")}
              className="max-w-xs rounded-lg"
            />
          }
          headerActions={
            canManage ? (
              <Button
                type="button"
                size="sm"
                className="cursor-pointer rounded-lg"
                onClick={() => setRestaurantSheet({ open: true, row: null })}
              >
                <Plus className="h-4 w-4" />
                {t("addRestaurant")}
              </Button>
            ) : null
          }
        >
          {restaurantsLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <AppEmptyState title={t("emptyRestaurants")} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className={TABLE_HEAD_CLASS}>{t("colName")}</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>{t("colPartner")}</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>
                    {t("colExternalId")}
                  </TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>{t("colActive")}</TableHead>
                  {canManage ? (
                    <TableHead className={cn(TABLE_HEAD_CLASS, "w-24 text-end")}>
                      {t("edit")}
                    </TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRestaurants.map((row) => (
                  <TableRow key={row.id} className="hover:bg-muted/40">
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.partner_name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {row.external_merchant_id ?? "—"}
                    </TableCell>
                    <TableCell>{row.is_active ? "✓" : "—"}</TableCell>
                    {canManage ? (
                      <TableCell className="text-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="cursor-pointer"
                          onClick={() =>
                            setRestaurantSheet({ open: true, row })
                          }
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </AppListCard>
      ) : null}

      {activeTab === "delivery-rules" ? (
        <AppListCard
          headerActions={
            canManage ? (
              <Button
                type="button"
                size="sm"
                className="cursor-pointer rounded-lg"
                onClick={() => setDeliverySheet({ open: true, row: null })}
              >
                <Plus className="h-4 w-4" />
                {t("addDeliveryRule")}
              </Button>
            ) : null
          }
        >
          {deliveryLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (deliveryRules?.length ?? 0) === 0 ? (
            <AppEmptyState title={t("emptyDeliveryRules")} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className={TABLE_HEAD_CLASS}>{t("colName")}</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>{t("colScope")}</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>{t("colDates")}</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>{t("colStatus")}</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>{t("colPriority")}</TableHead>
                  {canManage ? (
                    <TableHead className={cn(TABLE_HEAD_CLASS, "w-24 text-end")}>
                      {t("edit")}
                    </TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(deliveryRules ?? []).map((row) => (
                  <TableRow key={row.id} className="hover:bg-muted/40">
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.scope_label}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.start_date} → {row.end_date}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={row.status} />
                    </TableCell>
                    <TableCell>{row.priority}</TableCell>
                    {canManage ? (
                      <TableCell className="text-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="cursor-pointer"
                          onClick={() => setDeliverySheet({ open: true, row })}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </AppListCard>
      ) : null}

      {activeTab === "incentive-rules" ? (
        <AppListCard
          headerActions={
            canManage ? (
              <Button
                type="button"
                size="sm"
                className="cursor-pointer rounded-lg"
                onClick={() => setIncentiveSheet({ open: true, row: null })}
              >
                <Plus className="h-4 w-4" />
                {t("addIncentiveRule")}
              </Button>
            ) : null
          }
        >
          {incentiveLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (incentiveRules?.length ?? 0) === 0 ? (
            <AppEmptyState title={t("emptyIncentiveRules")} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className={TABLE_HEAD_CLASS}>{t("colName")}</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>{t("colScope")}</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>{t("colPeriod")}</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>{t("colTarget")}</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>{t("colReward")}</TableHead>
                  <TableHead className={TABLE_HEAD_CLASS}>{t("colStatus")}</TableHead>
                  {canManage ? (
                    <TableHead className={cn(TABLE_HEAD_CLASS, "w-24 text-end")}>
                      {t("edit")}
                    </TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(incentiveRules ?? []).map((row) => (
                  <TableRow key={row.id} className="hover:bg-muted/40">
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.scope_label}</TableCell>
                    <TableCell>{t(`period.${row.period}`)}</TableCell>
                    <TableCell>{row.target_deliveries}</TableCell>
                    <TableCell className="tabular-nums">{row.reward_kwd}</TableCell>
                    <TableCell>
                      <StatusBadge status={row.status} />
                    </TableCell>
                    {canManage ? (
                      <TableCell className="text-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="cursor-pointer"
                          onClick={() => setIncentiveSheet({ open: true, row })}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </AppListCard>
      ) : null}

      {activeTab === "calculation" ? (
        <div className="space-y-4">
          <Card className="rounded-xl border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">{t("calcTitle")}</CardTitle>
              <CardDescription>{t("calcDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="earn-date">{t("earnDate")}</Label>
                  <Input
                    id="earn-date"
                    type="date"
                    value={earnDate}
                    onChange={(e) => setEarnDate(e.target.value)}
                    className="w-44 rounded-lg"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer rounded-lg"
                  onClick={handlePreview}
                  disabled={isCalcPending}
                >
                  {isCalcPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t("preview")
                  )}
                </Button>
                {canManage ? (
                  <Button
                    type="button"
                    className="cursor-pointer rounded-lg"
                    onClick={handleRecalculate}
                    disabled={isCalcPending}
                  >
                    {t("recalculate")}
                  </Button>
                ) : null}
              </div>
              {preview && preview.drivers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className={TABLE_HEAD_CLASS}>Driver</TableHead>
                      <TableHead className={TABLE_HEAD_CLASS}>
                        {t("colTarget")}
                      </TableHead>
                      <TableHead className={TABLE_HEAD_CLASS}>
                        {t("colReward")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.drivers.map((row) => (
                      <TableRow key={row.driver_id}>
                        <TableCell className="font-mono text-xs">
                          {row.driver_id.slice(0, 8)}…
                        </TableCell>
                        <TableCell>{row.deliveries}</TableCell>
                        <TableCell className="tabular-nums">
                          {row.incentive_kwd}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : null}
            </CardContent>
          </Card>

          <Card className="rounded-xl border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">{t("testDeliveryTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="delivery-id">{t("testDeliveryId")}</Label>
                <Input
                  id="delivery-id"
                  value={deliveryTestId}
                  onChange={(e) => setDeliveryTestId(e.target.value)}
                  className="w-72 rounded-lg font-mono text-sm"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer rounded-lg"
                onClick={handleValidateDelivery}
                disabled={isCalcPending || !deliveryTestId.trim()}
              >
                {t("testValidate")}
              </Button>
              {validation ? (
                <div className="w-full text-sm">
                  <p className="font-medium">
                    {validation.eligible ? t("eligibleYes") : t("eligibleNo")}
                  </p>
                  <p className="text-muted-foreground">
                    {t("matchedRules", {
                      count: validation.matchedRuleIds.length,
                    })}
                  </p>
                  {validation.reasons.length > 0 ? (
                    <ul className="mt-1 list-disc ps-4 text-muted-foreground">
                      {validation.reasons.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}

      <RestaurantFormSheet
        restaurant={restaurantSheet.row}
        options={scopeOptions}
        open={restaurantSheet.open}
        onOpenChange={(open) => setRestaurantSheet((s) => ({ ...s, open }))}
      />
      <RuleFormSheet
        kind="delivery"
        rule={deliverySheet.row}
        options={scopeOptions}
        open={deliverySheet.open}
        onOpenChange={(open) => setDeliverySheet((s) => ({ ...s, open }))}
      />
      <RuleFormSheet
        kind="incentive"
        rule={incentiveSheet.row}
        options={scopeOptions}
        open={incentiveSheet.open}
        onOpenChange={(open) => setIncentiveSheet((s) => ({ ...s, open }))}
      />
    </AppPage>
  );
}
