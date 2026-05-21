"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppPage } from "@/components/app/app-page";
import { AppPageHeader } from "@/components/app/app-page-header";
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
import {
  isDpdErrorKey,
  runPreviewEarnings,
  runRecalculateEarnings,
  runValidateDelivery,
} from "./dpd-actions";
import type { DeliveryValidationResult, EarningsPreviewResult } from "./types";

export function EarningsCalculationPageShell() {
  const t = useTranslations("pages.dpd");
  const tPage = useTranslations("pages.earningsCalculation");
  const { can } = useAuth();
  const canManage = can("earnings.manage");

  const [earnDate, setEarnDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [deliveryTestId, setDeliveryTestId] = useState("");
  const [preview, setPreview] = useState<EarningsPreviewResult | null>(null);
  const [validation, setValidation] = useState<DeliveryValidationResult | null>(
    null,
  );
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

  const handleRecalculate = () => {
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

  return (
    <AppPage>
      <AppPageHeader title={tPage("title")} description={tPage("subtitle")} />

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
                disabled={isPending}
              >
                {isPending ? (
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
                  disabled={isPending}
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
    </AppPage>
  );
}
