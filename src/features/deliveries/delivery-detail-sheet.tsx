"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Download,
  ExternalLink,
  FileImage,
  Loader2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { hasPermissionInSet } from "@/lib/auth/permissions";
import { proofFilenameFromKey } from "@/lib/storage/order-proof-url";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusPill } from "@/components/dashboard/status-pill";
import { cn } from "@/lib/utils";
import { DeliveryGpsAuditPanel } from "./delivery-gps-audit-panel";
import { DeliveryLocationMap } from "./delivery-location-map";
import { useDeleteDelivery, useUpdateDeliveryStatus } from "./use-deliveries";
import type { DeliveryListRow, DeliveryStatus } from "./types";

const STATUS_OPTIONS: DeliveryStatus[] = [
  "pending",
  "verified",
  "under_review",
  "rejected",
];

function deliveryStatusVariant(
  status: DeliveryStatus,
): "success" | "warning" | "danger" | "neutral" {
  switch (status) {
    case "verified":
      return "success";
    case "rejected":
      return "danger";
    case "under_review":
      return "neutral";
    case "pending":
    default:
      return "warning";
  }
}

function statusMessageKey(status: DeliveryStatus) {
  switch (status) {
    case "verified":
      return "statusVerified";
    case "rejected":
      return "statusRejected";
    case "under_review":
      return "statusUnderReview";
    case "pending":
    default:
      return "statusPending";
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

  const statusMutation = useUpdateDeliveryStatus();
  const deleteMutation = useDeleteDelivery();

  const [statusDraft, setStatusDraft] = useState<DeliveryStatus>("pending");
  const [rejectReason, setRejectReason] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (!delivery || !open) return;
    setStatusDraft(delivery.status);
    setRejectReason(delivery.rejection_reason ?? "");
  }, [delivery, open]);

  if (!delivery) return null;

  const statusLabel = t(
    `status${delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1)}` as "statusPending",
  );
  const isBusy = statusMutation.isPending || deleteMutation.isPending;
  const hasCoords =
    delivery.delivered_lat != null && delivery.delivered_lng != null;

  const statusUnchanged = statusDraft === delivery.status;
  const rejectReasonUnchanged =
    statusDraft !== "rejected" ||
    rejectReason.trim() === (delivery.rejection_reason ?? "").trim();
  const canSaveStatus =
    !statusUnchanged ||
    (statusDraft === "rejected" && !rejectReasonUnchanged);

  const handleSaveStatus = async () => {
    if (!canManage) {
      toast.error(t("noPermission"));
      return;
    }
    if (statusDraft === "rejected" && !rejectReason.trim()) {
      toast.error(t("rejectReasonRequired"));
      return;
    }
    const result = await statusMutation.mutateAsync({
      deliveryId: delivery.id,
      status: statusDraft,
      rejectionReason: statusDraft === "rejected" ? rejectReason : undefined,
    });
    if ("error" in result) {
      const msg =
        result.error === "reason_required"
          ? t("rejectReasonRequired")
          : result.error === "not_authorized"
            ? t("noPermission")
            : t("statusChangeFailed");
      toast.error(msg);
      return;
    }
    toast.success(t("statusChangeSuccess"));
    onUpdated?.();
    onClose();
  };

  const handleDelete = async () => {
    const result = await deleteMutation.mutateAsync(delivery.id);
    if ("error" in result) {
      toast.error(
        result.error === "not_authorized" ? t("noPermission") : t("deleteFailed"),
      );
      return;
    }
    toast.success(t("deleteSuccess"));
    setDeleteOpen(false);
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

              {canManage ? (
                <section className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("changeStatus")}
                  </h4>
                  <div className="space-y-1.5">
                    <Label htmlFor="delivery-status-select" className="text-sm">
                      {t("colStatus")}
                    </Label>
                    <Select
                      value={statusDraft}
                      onValueChange={(v) => setStatusDraft(v as DeliveryStatus)}
                    >
                      <SelectTrigger
                        id="delivery-status-select"
                        className="w-full cursor-pointer rounded-lg"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status} value={status}>
                            {t(statusMessageKey(status))}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {statusDraft === "rejected" ? (
                    <div className="space-y-1.5">
                      <Label htmlFor="reject-reason" className="text-sm text-destructive">
                        {t("rejectReasonLabel")}
                      </Label>
                      <Textarea
                        id="reject-reason"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder={t("rejectReasonLabel")}
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                  ) : null}
                </section>
              ) : null}
            </div>

            {canManage || isSuperAdmin ? (
              <DialogFooter className="shrink-0 flex-row items-center justify-between gap-2 border-t border-border px-6 py-4">
                {isSuperAdmin ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="cursor-pointer rounded-lg border-destructive/40 text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteOpen(true)}
                    disabled={isBusy}
                  >
                    <Trash2 className="me-2 h-3.5 w-3.5" />
                    {t("deleteDelivery")}
                  </Button>
                ) : (
                  <span />
                )}
                {canManage ? (
                  <Button
                    type="button"
                    className="cursor-pointer rounded-lg"
                    onClick={() => void handleSaveStatus()}
                    disabled={
                      isBusy ||
                      (statusUnchanged && rejectReasonUnchanged) ||
                      (statusDraft === "rejected" && !rejectReason.trim())
                    }
                  >
                    {statusMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      t("saveStatus")
                    )}
                  </Button>
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
              <DeliveryGpsAuditPanel
                deliveryId={delivery.id}
                deliveredLat={delivery.delivered_lat}
                deliveredLng={delivery.delivered_lng}
              />
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

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        itemTitle={t("deleteDeliveryTitle")}
        itemName={`#${delivery.short_id}`}
        confirmText={delivery.short_id}
        warning={t("deleteDeliveryWarning")}
        onConfirm={handleDelete}
        isPending={deleteMutation.isPending}
      />
    </Dialog>
  );
}
