"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { AppModalFooter } from "@/components/app/app-modal-footer";
import {
  Dialog,
  DialogContent,
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
import { TabBar } from "@/components/dashboard/tab-bar";
import { cn } from "@/lib/utils";
import { selectOptionsFrom } from "@/lib/select-items";
import { queryKeys } from "@/lib/query/query-keys";
import { useRealtimeInvalidator } from "@/lib/realtime/use-realtime-invalidator";
import { DeliveryGpsAuditPanel } from "./delivery-gps-audit-panel";
import {
  DeliveryLocationMap,
  deliveryMapPointsFromRow,
} from "./delivery-location-map";
import { fetchLiveDriverLocationForDelivery } from "./deliveries-actions";
import {
  cancelReasonMessageKey,
  parseCancelReason,
} from "./parse-cancel-reason";
import { useDeleteDelivery, useUpdateDeliveryStatus } from "./use-deliveries";
import { resolveStatusVariant } from "@/lib/ui/resolve-status-variant";
import type { DeliveryListRow, DeliveryMapPoint, DeliveryStatus } from "./types";
import { REVIEWABLE_DELIVERY_STATUSES, type ReviewableDeliveryStatus } from "./types";

type ProofTab = "pickup" | "delivered" | "cancelled";

function statusMessageKey(status: DeliveryStatus) {
  switch (status) {
    case "verified":
      return "statusVerified";
    case "rejected":
      return "statusRejected";
    case "under_review":
      return "statusUnderReview";
    case "in_transit":
      return "statusInTransit";
    case "cancelled":
      return "statusCancelled";
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

function formatCoords(lat: number | null, lng: number | null): string {
  if (lat == null || lng == null) return "—";
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-border py-2.5 last:border-b-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-end text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

function DeliveryProofPanel({
  proofUrl,
  contentType,
  objectKey,
  sectionLabel,
}: {
  proofUrl: string | null;
  contentType: string | null;
  objectKey: string | null;
  sectionLabel: string;
}) {
  const t = useTranslations("pages.deliveries");
  const [imgError, setImgError] = useState(false);

  const filename = proofFilenameFromKey(objectKey) ?? t("proofImage");
  const isImage = contentType?.startsWith("image/") || (!contentType && proofUrl);
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
            {sectionLabel}
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

function defaultProofTab(delivery: DeliveryListRow): ProofTab {
  if (delivery.cancel_proof_display_url) return "cancelled";
  if (delivery.proof_display_url) return "delivered";
  if (delivery.pickup_proof_display_url) return "pickup";
  if (delivery.status === "cancelled") return "cancelled";
  if (delivery.status === "in_transit") return "pickup";
  return "delivered";
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

  const [statusDraft, setStatusDraft] = useState<ReviewableDeliveryStatus>("pending");
  const [rejectReason, setRejectReason] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [proofTab, setProofTab] = useState<ProofTab>("delivered");

  const isInTransit = delivery?.status === "in_transit";

  useRealtimeInvalidator({
    channel: `admin-delivery-live-${delivery?.id ?? "none"}`,
    tables: [
      {
        table: "driver_locations",
        filter: delivery?.id ? `active_delivery_id=eq.${delivery.id}` : undefined,
      },
    ],
    invalidateKeys: [queryKeys.deliveries.deliveryLiveLocation(delivery?.id ?? "")],
    enabled: open && isInTransit && Boolean(delivery?.id),
  });

  const { data: liveLocation } = useQuery({
    queryKey: queryKeys.deliveries.deliveryLiveLocation(delivery?.id ?? ""),
    queryFn: () =>
      fetchLiveDriverLocationForDelivery(delivery!.id, delivery!.driver_id),
    enabled: open && isInTransit && Boolean(delivery?.id),
    refetchInterval: isInTransit ? 15_000 : false,
  });

  useEffect(() => {
    if (!delivery || !open) return;
    const reviewable = REVIEWABLE_DELIVERY_STATUSES.includes(
      delivery.status as ReviewableDeliveryStatus,
    )
      ? (delivery.status as ReviewableDeliveryStatus)
      : "pending";
    setStatusDraft(reviewable);
    setRejectReason(delivery.rejection_reason ?? "");
    setProofTab(defaultProofTab(delivery));
  }, [delivery, open]);

  const statusSelectItems = useMemo(
    () =>
      selectOptionsFrom(REVIEWABLE_DELIVERY_STATUSES, (status) => status, (status) =>
        t(statusMessageKey(status)),
      ),
    [t],
  );

  const proofTabs = useMemo(() => {
    if (!delivery) return [];
    const tabs: Array<{ id: ProofTab; label: string; visible: boolean }> = [
      {
        id: "pickup",
        label: t("pickupProof"),
        visible: Boolean(delivery.pickup_proof_url || delivery.pickup_at),
      },
      {
        id: "delivered",
        label: t("sectionProof"),
        visible: Boolean(
          delivery.order_proof_url || delivery.delivered_at || delivery.status === "pending",
        ),
      },
      {
        id: "cancelled",
        label: t("cancelProof"),
        visible: Boolean(delivery.cancel_proof_url || delivery.cancelled_at),
      },
    ];
    return tabs.filter((tab) => tab.visible);
  }, [delivery, t]);

  const mapPoints = useMemo((): DeliveryMapPoint[] => {
    if (!delivery) return [];
    const points = deliveryMapPointsFromRow(delivery);
    if (isInTransit && liveLocation) {
      points.push({
        lat: liveLocation.latitude,
        lng: liveLocation.longitude,
        kind: "live",
      });
    }
    return points;
  }, [delivery, isInTransit, liveLocation]);

  if (!delivery) return null;

  const parsedCancel = parseCancelReason(delivery.cancel_reason);
  const isReadOnlyStatus =
    delivery.status === "in_transit" || delivery.status === "cancelled";
  const statusLabel = t(statusMessageKey(delivery.status));
  const isBusy = statusMutation.isPending || deleteMutation.isPending;

  const statusUnchanged = statusDraft === delivery.status;
  const rejectReasonUnchanged =
    statusDraft !== "rejected" ||
    rejectReason.trim() === (delivery.rejection_reason ?? "").trim();
  const canSaveStatus =
    canManage &&
    !isReadOnlyStatus &&
    (!statusUnchanged ||
      (statusDraft === "rejected" && !rejectReasonUnchanged));

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
          : result.error === "invalid_status"
            ? t("invalidStatusChange")
          : result.error === "not_authorized"
            ? t("noPermission")
            : t("statusChangeFailed");
      toast.error(msg, {
        description: result.errorDetail,
        duration: result.errorDetail ? 9000 : undefined,
      });
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
        {
          description: result.errorDetail,
          duration: result.errorDetail ? 9000 : undefined,
        },
      );
      return;
    }
    toast.success(t("deleteSuccess"));
    setDeleteOpen(false);
    onUpdated?.();
    onClose();
  };

  const activeProof =
    proofTab === "pickup"
      ? {
          url: delivery.pickup_proof_display_url,
          type: delivery.pickup_proof_content_type,
          key: delivery.pickup_proof_url,
          label: t("pickupProof"),
        }
      : proofTab === "cancelled"
        ? {
            url: delivery.cancel_proof_display_url,
            type: delivery.cancel_proof_content_type,
            key: delivery.cancel_proof_url,
            label: t("cancelProof"),
          }
        : {
            url: delivery.proof_display_url,
            type: delivery.proof_content_type,
            key: delivery.order_proof_url,
            label: t("sectionProof"),
          };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton
        closeOutside
        className="flex max-h-[min(92vh,900px)] flex-col gap-0 overflow-visible p-0 sm:max-w-5xl"
      >
        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <div className="order-2 flex min-h-0 w-full shrink-0 flex-col lg:order-1 lg:w-[min(420px,42%)] lg:max-w-[420px]">
            <div className="flex-1 space-y-5 overflow-y-auto px-6 pt-4 pb-4">
              <section>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("sectionDelivery")}
                </h4>
                <dl className="rounded-lg border border-border px-3">
                  <DetailRow label={t("colDeliveryId")} value={`#${delivery.short_id}`} />
                  <DetailRow
                    label={t("colStatus")}
                    value={
                      <StatusPill variant={resolveStatusVariant(delivery.status)} dot>
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

              {delivery.pickup_at ? (
                <section>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("sectionPickup")}
                  </h4>
                  <dl className="rounded-lg border border-border px-3">
                    <DetailRow
                      label={t("pickupAt")}
                      value={formatDateTime(delivery.pickup_at)}
                    />
                    <DetailRow
                      label={t("pickupCoords")}
                      value={
                        <span className="font-mono text-xs">
                          {formatCoords(delivery.pickup_lat, delivery.pickup_lng)}
                        </span>
                      }
                    />
                  </dl>
                </section>
              ) : null}

              {delivery.delivered_at ? (
                <section>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("sectionDeliveryFinish")}
                  </h4>
                  <dl className="rounded-lg border border-border px-3">
                    <DetailRow
                      label={t("colDeliveredAt")}
                      value={formatDateTime(delivery.delivered_at)}
                    />
                    <DetailRow
                      label={t("deliveryCoords")}
                      value={
                        <span className="font-mono text-xs">
                          {formatCoords(delivery.delivered_lat, delivery.delivered_lng)}
                        </span>
                      }
                    />
                  </dl>
                </section>
              ) : null}

              {delivery.cancelled_at ? (
                <section>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("sectionCancellation")}
                  </h4>
                  <dl className="rounded-lg border border-border px-3">
                    <DetailRow
                      label={t("cancelledAt")}
                      value={formatDateTime(delivery.cancelled_at)}
                    />
                    <DetailRow
                      label={t("cancelCoords")}
                      value={
                        <span className="font-mono text-xs">
                          {formatCoords(delivery.cancel_lat, delivery.cancel_lng)}
                        </span>
                      }
                    />
                    {parsedCancel ? (
                      <>
                        <DetailRow
                          label={t("cancelReasonLabel")}
                          value={
                            <StatusPill variant="danger">
                              {t(cancelReasonMessageKey(parsedCancel.code))}
                            </StatusPill>
                          }
                        />
                        {parsedCancel.note ? (
                          <DetailRow
                            label={t("cancelReasonNote")}
                            value={
                              <span className="max-w-[200px] text-end text-sm">
                                {parsedCancel.note}
                              </span>
                            }
                          />
                        ) : null}
                      </>
                    ) : null}
                  </dl>
                </section>
              ) : null}

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

              {canManage && !isReadOnlyStatus ? (
                <section className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("changeStatus")}
                  </h4>
                  <div className="space-y-1.5">
                    <Label htmlFor="delivery-status-select" className="text-sm">
                      {t("colStatus")}
                    </Label>
                    <Select
                      items={statusSelectItems}
                      value={statusDraft}
                      onValueChange={(v) =>
                        setStatusDraft(v as ReviewableDeliveryStatus)
                      }
                    >
                      <SelectTrigger
                        id="delivery-status-select"
                        className="w-full cursor-pointer rounded-lg"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {REVIEWABLE_DELIVERY_STATUSES.map((status) => (
                          <SelectItem
                            key={status}
                            value={status}
                            label={t(statusMessageKey(status))}
                          >
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
              ) : isReadOnlyStatus ? (
                <p className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                  {t("readOnlyStatusHint")}
                </p>
              ) : null}
            </div>

            {canManage || isSuperAdmin ? (
              <AppModalFooter
                title={t("detailTitle")}
                subtitle={`#${delivery.short_id}`}
                meta={
                  <StatusPill variant={resolveStatusVariant(delivery.status)} dot>
                    {statusLabel}
                  </StatusPill>
                }
              >
                {isSuperAdmin ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 cursor-pointer rounded-lg border-destructive/40 text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteOpen(true)}
                    disabled={isBusy}
                  >
                    <Trash2 className="me-2 h-3.5 w-3.5" />
                    {t("deleteDelivery")}
                  </Button>
                ) : null}
                {canManage && !isReadOnlyStatus ? (
                  <Button
                    type="button"
                    size="sm"
                    className="h-9 cursor-pointer rounded-lg"
                    onClick={() => void handleSaveStatus()}
                    disabled={
                      isBusy ||
                      !canSaveStatus ||
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
              </AppModalFooter>
            ) : null}
          </div>

          <div
            className={cn(
              "order-1 flex min-h-[45vh] min-w-0 flex-1 flex-col border-b border-border lg:order-2 lg:min-h-0 lg:border-b-0 lg:border-l",
            )}
          >
            <div className="flex min-h-0 flex-1 flex-col">
              {proofTabs.length > 1 ? (
                <div className="shrink-0 border-b border-border px-4 pt-3">
                  <TabBar
                    items={proofTabs.map((tab) => ({ id: tab.id, label: tab.label }))}
                    activeId={proofTab}
                    onSelect={(id) => setProofTab(id as ProofTab)}
                    className="border-b-0"
                  />
                </div>
              ) : null}
              <div className="flex min-h-[55%] flex-1 flex-col">
                <DeliveryProofPanel
                  proofUrl={activeProof.url}
                  contentType={activeProof.type}
                  objectKey={activeProof.key}
                  sectionLabel={activeProof.label}
                />
              </div>
              <div className="grid shrink-0 gap-3 border-t border-border p-4 md:grid-cols-2">
                <DeliveryGpsAuditPanel
                  deliveryId={delivery.id}
                  deliveredLat={delivery.delivered_lat}
                  deliveredLng={delivery.delivered_lng}
                  cancelLat={delivery.cancel_lat}
                  cancelLng={delivery.cancel_lng}
                />
                {mapPoints.length > 0 ? (
                  <DeliveryLocationMap
                    points={mapPoints}
                    mapHeightClass="h-44 md:h-56"
                  />
                ) : (
                  <div className="flex h-44 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-4 text-center text-sm text-muted-foreground md:h-56">
                    {t("locationUnavailable")}
                  </div>
                )}
              </div>
              {isInTransit && liveLocation ? (
                <p className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
                  {t("liveLocationUpdated", {
                    time: formatDateTime(liveLocation.lastSeenAt),
                  })}
                </p>
              ) : null}
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
