"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { History, MapPinned, Package, Siren } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
    <TrackingGlassCard className="border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        {t("quickActions")}
      </h3>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {actions.map((action) => {
          const content = (
            <>
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-200">
                <action.icon className="h-3.5 w-3.5 shrink-0" />
              </span>
              <span className="text-center text-[10px] leading-tight text-slate-700 dark:text-slate-200">
                {action.label}
              </span>
              {!action.enabled ? (
                <Badge variant="secondary" className="h-4 rounded-full px-1.5 text-[9px]">
                  Soon
                </Badge>
              ) : null}
            </>
          );
          if (action.enabled && action.href) {
            return (
              <Button
                key={action.id}
                variant="outline"
                size="sm"
                className="h-auto min-h-[4.5rem] cursor-pointer flex-col items-center gap-1 rounded-lg border-slate-200 bg-slate-50 px-2 py-2 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:bg-slate-800"
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
              className="h-auto min-h-[4.5rem] flex-col items-center gap-1 rounded-lg border-slate-200 bg-slate-50 px-2 py-2 dark:border-slate-700 dark:bg-slate-800/60"
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
