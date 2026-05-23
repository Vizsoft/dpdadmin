"use client";

import { useTranslations } from "next-intl";
import type { PartnerHealthCard } from "../types";
import { DashboardWidget } from "./dashboard-widget";

export function PartnerHealthWidget({
  cards,
  locale,
}: {
  cards: PartnerHealthCard[];
  locale: string;
}) {
  const t = useTranslations("pages.dashboard");

  return (
    <DashboardWidget title={t("widgetPartnerHealth")} href={`/${locale}/partners`}>
      {cards.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="space-y-3 p-4">
          {cards.slice(0, 4).map((card) => (
            <div key={card.partnerId} className="rounded-lg border border-border bg-muted/20 p-3">
              <p className="text-sm font-semibold">{card.partnerName}</p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                <div>
                  <p className="text-muted-foreground">{t("partnerAssigned")}</p>
                  <p className="font-medium tabular-nums">{card.assignedRiders}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("partnerActiveToday")}</p>
                  <p className="font-medium tabular-nums">{card.activeToday}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("partnerMissingAttendance")}</p>
                  <p className="font-medium tabular-nums">{card.missingAttendance}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("partnerPendingVerification")}</p>
                  <p className="font-medium tabular-nums">{card.pendingVerification}</p>
                </div>
              </div>
              {card.restaurants.length > 0 ? (
                <ul className="mt-2 space-y-1 border-t border-border pt-2">
                  {card.restaurants.slice(0, 3).map((r) => (
                    <li
                      key={`${card.partnerId}-${r.restaurantName}`}
                      className="flex items-center justify-between text-[11px] text-muted-foreground"
                    >
                      <span>{r.restaurantName}</span>
                      <span className="tabular-nums">
                        {r.riderCount} {t("riders")}
                        {r.understaffed ? ` · ${t("understaffed")}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </DashboardWidget>
  );
}
