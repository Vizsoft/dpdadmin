"use client";

import { Fragment, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppPage } from "@/components/app/app-page";
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
import { EarningsDetailSheet } from "@/features/dpd/earnings-detail-sheet";
import {
  isDpdErrorKey,
  runPreviewEarnings,
  runRecalculateEarnings,
  runRecalculateEarningsRange,
  runValidateDelivery,
} from "./dpd-actions";
import type { DeliveryValidationResult, EarningsPreviewResult } from "./types";

export function EarningsCalculationPageShell() {
  const t = useTranslations("pages.earningsCalculation");
  const { can } = useAuth();
  const canManage = can("earnings.manage");

  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  })();

  const [earnDate, setEarnDate] = useState(today);
  const [rangeStart, setRangeStart] = useState(weekAgo);
  const [rangeEnd, setRangeEnd] = useState(today);
  const [deliveryTestId, setDeliveryTestId] = useState("");
  const [preview, setPreview] = useState<EarningsPreviewResult | null>(null);
  const [validation, setValidation] = useState<DeliveryValidationResult | null>(null);
  const [expandedDriverId, setExpandedDriverId] = useState<string | null>(null);
  const [detailDriverId, setDetailDriverId] = useState<string | null>(null);
  const [detailEarnDate, setDetailEarnDate] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const errorToast = (error?: string) => {
    if (error && isDpdErrorKey(error)) return t(`errors.${error}`);
    return t("errors.save_failed");
  };

  const handlePreview = () => {
    startTransition(async () => {
      const result = await runPreviewEarnings(earnDate);
      if ("error" in result && result.error) {
        toast.error(errorToast(result.error));
        return;
      }
      setPreview(result as EarningsPreviewResult);
      toast.success(t("previewDone"));
    });
  };

  const handleRecalculateDay = () => {
    if (!canManage) return;
    startTransition(async () => {
      const result = await runRecalculateEarnings(earnDate);
      if ("error" in result && result.error) {
        toast.error(errorToast(result.error));
        return;
      }
      if ("count" in result) {
        toast.success(t("recalculateDone", { count: result.count }));
      }
      handlePreview();
    });
  };

  const handleRecalculateRange = () => {
    if (!canManage) return;
    startTransition(async () => {
      const result = await runRecalculateEarningsRange(rangeStart, rangeEnd);
      if ("error" in result && result.error) {
        toast.error(errorToast(result.error));
        return;
      }
      if ("count" in result) {
        toast.success(t("recalculateRangeDone", { count: result.count }));
      }
    });
  };

  const handleValidateDelivery = () => {
    startTransition(async () => {
      const result = await runValidateDelivery(deliveryTestId.trim());
      if ("error" in result && result.error) {
        toast.error(errorToast(result.error));
        return;
      }
      setValidation(result as DeliveryValidationResult);
    });
  };

  const openFullDetail = (driverId: string) => {
    setDetailDriverId(driverId);
    setDetailEarnDate(earnDate);
    setDetailOpen(true);
  };

  return (
    <AppPage>
      <div className="space-y-4">
        <Card className="rounded-xl border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">{t("calcTitle")}</CardTitle>
            <CardDescription>{t("calcDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-medium">{t("singleDateSection")}</p>
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
                  disabled={isPending}
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("preview")}
                </Button>
                {canManage ? (
                  <Button
                    type="button"
                    className="cursor-pointer rounded-lg"
                    onClick={handleRecalculateDay}
                    disabled={isPending}
                  >
                    {t("recalculate")}
                  </Button>
                ) : null}
              </div>
            </div>

            {canManage ? (
              <div className="space-y-3 border-t border-border pt-4">
                <p className="text-sm font-medium">{t("rangeSection")}</p>
                <div className="flex flex-wrap items-end gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="range-start">{t("startDate")}</Label>
                    <Input
                      id="range-start"
                      type="date"
                      value={rangeStart}
                      onChange={(e) => setRangeStart(e.target.value)}
                      className="w-44 rounded-lg"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="range-end">{t("endDate")}</Label>
                    <Input
                      id="range-end"
                      type="date"
                      value={rangeEnd}
                      onChange={(e) => setRangeEnd(e.target.value)}
                      className="w-44 rounded-lg"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    className="cursor-pointer rounded-lg"
                    onClick={handleRecalculateRange}
                    disabled={isPending}
                  >
                    {t("recalculateRange")}
                  </Button>
                </div>
              </div>
            ) : null}

            {preview && preview.drivers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className={TABLE_HEAD_CLASS} />
                    <TableHead className={TABLE_HEAD_CLASS}>{t("colDriver")}</TableHead>
                    <TableHead className={TABLE_HEAD_CLASS}>{t("colDeliveries")}</TableHead>
                    <TableHead className={TABLE_HEAD_CLASS}>{t("colIncentive")}</TableHead>
                    <TableHead className={TABLE_HEAD_CLASS} />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.drivers.map((row) => {
                    const expanded = expandedDriverId === row.driver_id;
                    return (
                      <Fragment key={row.driver_id}>
                        <TableRow
                          key={row.driver_id}
                          className="cursor-pointer hover:bg-muted/40"
                          onClick={() =>
                            setExpandedDriverId(expanded ? null : row.driver_id)
                          }
                        >
                          <TableCell className="w-8">
                            {expanded ? (
                              <ChevronDown className="size-4" />
                            ) : (
                              <ChevronRight className="size-4" />
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {row.driver_id.slice(0, 8)}…
                          </TableCell>
                          <TableCell className="tabular-nums">{row.deliveries}</TableCell>
                          <TableCell className="tabular-nums">{row.incentive_kwd}</TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7 cursor-pointer text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                openFullDetail(row.driver_id);
                              }}
                            >
                              {t("viewDetail")}
                            </Button>
                          </TableCell>
                        </TableRow>
                        {expanded ? (
                          <TableRow key={`${row.driver_id}-rules`}>
                            <TableCell colSpan={5} className="bg-muted/20 p-4">
                              <p className="mb-2 text-xs font-medium text-muted-foreground">
                                {t("rulesBreakdown")}
                              </p>
                              {row.rules.length === 0 ? (
                                <p className="text-sm text-muted-foreground">{t("noRules")}</p>
                              ) : (
                                <ul className="space-y-1 text-sm">
                                  {row.rules.map((rule, idx) => (
                                    <li
                                      key={rule.rule_id ?? `note-${idx}`}
                                      className={cn(
                                        rule.note === "override_applied" &&
                                          "font-medium text-amber-600 dark:text-amber-400",
                                      )}
                                    >
                                      {rule.note === "override_applied"
                                        ? t("overrideApplied")
                                        : `${rule.rule_name} · ${rule.eligible_count} → ${rule.amount_kwd ?? rule.reward_kwd} KWD`}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            ) : preview ? (
              <p className="text-sm text-muted-foreground">{t("previewEmpty")}</p>
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
              disabled={isPending || !deliveryTestId.trim()}
            >
              {t("testValidate")}
            </Button>
            {validation ? (
              <div className="w-full text-sm">
                <p className="font-medium">
                  {validation.eligible ? t("eligibleYes") : t("eligibleNo")}
                </p>
                <p className="text-muted-foreground">
                  {t("matchedRules", { count: validation.matchedRuleIds.length })}
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

      <EarningsDetailSheet
        open={detailOpen}
        onOpenChange={setDetailOpen}
        driverId={detailDriverId}
        earnDate={detailEarnDate}
      />
    </AppPage>
  );
}
