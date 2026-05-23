"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { History, MapPinned, Package, Siren } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrackingGlassCard } from "./tracking-shell";

export function TrackingQuickActions() {
  const t = useTranslations("pages.liveTracking");

  const actions = [
    {
      id: "geofence",
      icon: MapPinned,
      label: t("actionCreateGeofence"),
      href: "/zones",
      enabled: true,
    },
    {
      id: "playback",
      icon: History,
      label: t("actionPlayback"),
      href: null,
      enabled: false,
      hint: t("actionPlaybackHint"),
    },
    {
      id: "dispatch",
      icon: Package,
      label: t("actionDispatch"),
      href: "/deliveries",
      enabled: true,
    },
    {
      id: "sos",
      icon: Siren,
      label: t("actionSos"),
      href: null,
      enabled: false,
    },
  ] as const;

  return (
    <TrackingGlassCard className="p-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t("quickActions")}
      </h3>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {actions.map((action) => {
          const content = (
            <>
              <action.icon className="h-4 w-4 shrink-0" />
              <span className="text-left text-[11px] leading-tight">{action.label}</span>
            </>
          );
          if (action.enabled && action.href) {
            return (
              <Button
                key={action.id}
                variant="outline"
                size="sm"
                className="h-auto min-h-14 flex-col items-start gap-1 border-border/80 bg-background/70 px-2.5 py-2 transition-all hover:-translate-y-0.5 hover:bg-background hover:shadow-sm"
                render={<Link href={action.href} />}
              >
                {content}
              </Button>
            );
          }
          return (
            <Button
              key={action.id}
              variant="outline"
              size="sm"
              className="h-auto min-h-14 flex-col items-start gap-1 border-border/80 bg-background/70 px-2.5 py-2"
              disabled
              title={"hint" in action ? action.hint : undefined}
            >
              {content}
            </Button>
          );
        })}
      </div>
    </TrackingGlassCard>
  );
}
