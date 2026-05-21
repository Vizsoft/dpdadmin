"use client";

import { useTranslations } from "next-intl";
import { ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusPill } from "@/components/dashboard/status-pill";
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

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="text-end text-sm font-medium text-foreground">
        {value}
      </span>
    </div>
  );
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

export function DeliveryDetailSheet({
  delivery,
  open,
  onClose,
}: {
  delivery: DeliveryListRow | null;
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("pages.deliveries");

  if (!delivery) return null;

  const statusLabel = t(`status${delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1)}` as "statusPending");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("detailTitle")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("sectionDelivery")}
            </h4>
            <div className="divide-y divide-border rounded-lg border border-border px-3">
              <InfoRow label={t("colDeliveryId")} value={`#${delivery.short_id}`} />
              <InfoRow
                label={t("colStatus")}
                value={
                  <StatusPill variant={deliveryStatusVariant(delivery.status)} dot>
                    {statusLabel}
                  </StatusPill>
                }
              />
              {delivery.external_order_id ? (
                <InfoRow label={t("colOrderId")} value={delivery.external_order_id} />
              ) : null}
              <InfoRow
                label={t("colDeliveredAt")}
                value={formatDateTime(delivery.delivered_at)}
              />
              {delivery.rejection_reason ? (
                <InfoRow label={t("rejectionReason")} value={delivery.rejection_reason} />
              ) : null}
            </div>
          </section>

          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("sectionDriver")}
            </h4>
            <div className="divide-y divide-border rounded-lg border border-border px-3">
              <InfoRow label={t("driverName")} value={delivery.driver_name} />
              <InfoRow label={t("driverCode")} value={`#${delivery.driver_code}`} />
              <InfoRow label={t("driverPhone")} value={delivery.driver_phone} />
              <InfoRow label={t("colPartner")} value={delivery.partner_name} />
              <InfoRow label={t("colZone")} value={delivery.zone_name} />
            </div>
          </section>

          {delivery.order_proof_url ? (
            <section>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("sectionProof")}
              </h4>
              <a
                href={delivery.order_proof_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                {t("viewProof")}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </section>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
