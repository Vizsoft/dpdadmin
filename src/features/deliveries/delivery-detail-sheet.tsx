"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Check,
  Download,
  ExternalLink,
  FileImage,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { hasPermissionInSet } from "@/lib/auth/permissions";
import { proofFilenameFromKey } from "@/lib/storage/order-proof-url";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/dashboard/status-pill";
import { cn } from "@/lib/utils";
import { DeliveryLocationMap } from "./delivery-location-map";
import { useRejectDelivery, useVerifyDelivery } from "./use-deliveries";
import type { DeliveryListRow, DeliveryStatus } from "./types";

function deliveryStatusVariant(
  status: DeliveryStatus,
): "success" | "warning" | "danger" {
  switch (status) {
    case "verified":
      return "success";
    case "rejected":
      return "danger";
    case "pending":
    default:
      return "warning";
  }
}

function formatDateTime(iso: string, locale?: string): string {
  try {
    return new Intl.DateTimeFormat(locale ?? "en", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kuwait",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-border py-2.5 last:border-b-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-end text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

function DeliveryProofPanel({ delivery }: { delivery: DeliveryListRow }) {
  const t = useTranslations("pages.deliveries");
  const [imgError, setImgError] = useState(false);

  const proofUrl = delivery.proof_display_url;
  const contentType = delivery.proof_content_type ?? "";
  const filename =
    proofFilenameFromKey(delivery.order_proof_url) ?? t("proofImage");
  const isImage = contentType.startsWith("image/") || (!contentType && proofUrl);
  const isPdf = contentType === "application/pdf";

  if (!proofUrl) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 bg-muted/30 p-8 text-center">
        <FileImage className="h-10 w-10 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">{t("proofUnavailable")}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/20 px-4 py-2.5">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("sectionProof")}
          </p>
          <p className="truncate font-mono text-xs text-foreground">{filename}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <a
            href={proofUrl}
            download={filename}
            target="_blank"
            rel="noopener noreferrer"
            className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-8 cursor-pointer items-center rounded-lg border px-3 text-xs font-medium"
          >
            <Download className="me-1.5 h-3.5 w-3.5" />
            {t("proofDownload")}
          </a>
          <a
            href={proofUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-8 cursor-pointer items-center rounded-lg border px-3 text-xs font-medium"
          >
            <ExternalLink className="me-1.5 h-3.5 w-3.5" />
            {t("proofOpenNew")}
          </a>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 bg-zinc-950">
        {isPdf ? (
          <iframe
            src={proofUrl}
            title={t("proofPdf")}
            className="absolute inset-0 h-full w-full border-0"
          />
        ) : isImage && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={proofUrl}
            alt={t("proofImage")}
            className="absolute inset-0 h-full w-full object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              {imgError ? t("proofExpired") : t("proofUnavailable")}
            </p>
            <a
              href={proofUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80 inline-flex h-8 cursor-pointer items-center rounded-lg px-3 text-xs font-medium"
            >
              <ExternalLink className="me-1.5 h-3.5 w-3.5" />
              {t("proofOpenNew")}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export function DeliveryDetailSheet({
  delivery,
  open,
  onClose,
  onUpdated,
}: {
  delivery: DeliveryListRow | null;
  open: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}) {
  const t = useTranslations("pages.deliveries");
  const { permissions, isSuperAdmin } = useAuth();
  const canManage = hasPermissionInSet(
    new Set(permissions),
    "deliveries.manage",
    isSuperAdmin,
  );

  const verifyMutation = useVerifyDelivery();
  const rejectMutation = useRejectDelivery();

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  if (!delivery) return null;

  const statusLabel = t(
    `status${delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1)}` as "statusPending",
  );
  const isPending = delivery.status === "pending";
  const isBusy = verifyMutation.isPending || rejectMutation.isPending;
  const hasCoords =
    delivery.delivered_lat != null && delivery.delivered_lng != null;

  const handleVerify = async () => {
    if (!canManage) {
      toast.error(t("noPermission"));
      return;
    }
    const result = await verifyMutation.mutateAsync(delivery.id);
    if ("error" in result) {
      const msg =
        result.error === "invalid_status"
          ? t("verifyFailed")
          : result.error === "not_authorized"
            ? t("noPermission")
            : t("verifyFailed");
      toast.error(msg);
      return;
    }
    toast.success(t("verifySuccess"));
    onUpdated?.();
    onClose();
  };

  const handleReject = async () => {
    if (!canManage) {
      toast.error(t("noPermission"));
      return;
    }
    if (!rejectReason.trim()) {
      toast.error(t("rejectReasonRequired"));
      return;
    }
    const result = await rejectMutation.mutateAsync({
      deliveryId: delivery.id,
      reason: rejectReason,
    });
    if ("error" in result) {
      const msg =
        result.error === "reason_required"
          ? t("rejectReasonRequired")
          : result.error === "invalid_status"
            ? t("rejectFailed")
            : result.error === "not_authorized"
              ? t("noPermission")
              : t("rejectFailed");
      toast.error(msg);
      return;
    }
    toast.success(t("rejectSuccess"));
    setRejectOpen(false);
    setRejectReason("");
    onUpdated?.();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton
        className="flex max-h-[min(92vh,900px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl"
      >
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {/* Left: details */}
          <div className="order-2 flex min-h-0 w-full shrink-0 flex-col lg:order-1 lg:w-[min(420px,42%)] lg:max-w-[420px]">
            <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pe-14">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <DialogTitle className="text-lg">{t("detailTitle")}</DialogTitle>
                <StatusPill variant={deliveryStatusVariant(delivery.status)} dot>
                  {statusLabel}
                </StatusPill>
              </div>
              <p className="mt-1 font-mono text-sm text-muted-foreground">
                #{delivery.short_id}
              </p>
            </DialogHeader>

            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-4">
              <section>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("sectionDelivery")}
                </h4>
                <dl className="rounded-lg border border-border px-3">
                  <DetailRow label={t("colDeliveryId")} value={`#${delivery.short_id}`} />
                  <DetailRow
                    label={t("colStatus")}
                    value={
                      <StatusPill variant={deliveryStatusVariant(delivery.status)} dot>
                        {statusLabel}
                      </StatusPill>
                    }
                  />
                  {delivery.external_order_id ? (
                    <DetailRow
                      label={t("colOrderId")}
                      value={
                        <span className="font-mono tabular-nums">
                          {delivery.external_order_id}
                        </span>
                      }
                    />
                  ) : null}
                  <DetailRow
                    label={t("colDeliveredAt")}
                    value={formatDateTime(delivery.delivered_at)}
                  />
                  {delivery.rejection_reason ? (
                    <DetailRow
                      label={t("rejectionReason")}
                      value={
                        <span className="max-w-[200px] text-end text-destructive">
                          {delivery.rejection_reason}
                        </span>
                      }
                    />
                  ) : null}
                </dl>
              </section>

              <section>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("sectionDriver")}
                </h4>
                <dl className="rounded-lg border border-border px-3">
                  <DetailRow label={t("driverName")} value={delivery.driver_name} />
                  <DetailRow
                    label={t("driverCode")}
                    value={
                      <span className="font-mono tabular-nums">#{delivery.driver_code}</span>
                    }
                  />
                  <DetailRow
                    label={t("driverPhone")}
                    value={
                      delivery.driver_phone !== "—" ? (
                        <a
                          href={`tel:${delivery.driver_phone}`}
                          className="text-primary hover:underline"
                        >
                          {delivery.driver_phone}
                        </a>
                      ) : (
                        "—"
                      )
                    }
                  />
                  <DetailRow label={t("colPartner")} value={delivery.partner_name} />
                  <DetailRow label={t("colZone")} value={delivery.zone_name} />
                </dl>
              </section>

              {rejectOpen && isPending && canManage ? (
                <section className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                  <label
                    htmlFor="reject-reason"
                    className="text-xs font-semibold uppercase tracking-wider text-destructive"
                  >
                    {t("rejectReasonLabel")}
                  </label>
                  <textarea
                    id="reject-reason"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder={t("rejectReasonLabel")}
                    rows={3}
                    className="border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full resize-none rounded-lg border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="cursor-pointer rounded-lg"
                      onClick={() => {
                        setRejectOpen(false);
                        setRejectReason("");
                      }}
                      disabled={isBusy}
                    >
                      {t("cancelReject")}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="cursor-pointer rounded-lg"
                      onClick={() => void handleReject()}
                      disabled={isBusy || !rejectReason.trim()}
                    >
                      {rejectMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        t("verifyConfirmReject")
                      )}
                    </Button>
                  </div>
                </section>
              ) : null}
            </div>

            {isPending && canManage ? (
              <DialogFooter className="shrink-0 flex-row items-center justify-end gap-2 border-t border-border px-6 py-4">
                {!rejectOpen ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className="cursor-pointer rounded-lg border-destructive/40 text-destructive hover:bg-destructive/10"
                      onClick={() => setRejectOpen(true)}
                      disabled={isBusy}
                    >
                      <X className="me-2 h-3.5 w-3.5" />
                      {t("actionsReject")}
                    </Button>
                    <Button
                      type="button"
                      className="cursor-pointer rounded-lg"
                      onClick={() => void handleVerify()}
                      disabled={isBusy}
                    >
                      {verifyMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="me-2 h-3.5 w-3.5" />
                          {t("actionsVerify")}
                        </>
                      )}
                    </Button>
                  </>
                ) : null}
              </DialogFooter>
            ) : null}
          </div>

          {/* Right: proof + map */}
          <div
            className={cn(
              "order-1 flex min-h-[45vh] min-w-0 flex-1 flex-col border-b border-border lg:order-2 lg:min-h-0 lg:border-b-0 lg:border-l",
            )}
          >
            <DeliveryProofPanel delivery={delivery} />
            <div className="shrink-0 p-4">
              {hasCoords ? (
                <DeliveryLocationMap
                  lat={delivery.delivered_lat!}
                  lng={delivery.delivered_lng!}
                />
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
                  {t("locationUnavailable")}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
