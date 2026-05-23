"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Minimize2, Radio } from "lucide-react";
import { AppPage } from "@/components/app/app-page";
import { AppPageHeader } from "@/components/app/app-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { LiveTrackingLiveView } from "./live-tracking-live-view";
import { LiveTrackingHistoryView } from "./live-tracking-history-view";

export function LiveTrackingPageShell() {
  const t = useTranslations("pages.liveTracking");
  const [isCommandFullscreen, setIsCommandFullscreen] = useState(false);

  useEffect(() => {
    if (!isCommandFullscreen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsCommandFullscreen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isCommandFullscreen]);

  const tabs = (
    <Tabs defaultValue="live" className="flex min-h-0 flex-1 flex-col gap-4">
      <TabsList className="w-fit rounded-lg">
        <TabsTrigger value="live" className="cursor-pointer rounded-md">
          {t("tabLive")}
        </TabsTrigger>
        <TabsTrigger value="history" className="cursor-pointer rounded-md">
          {t("tabHistory")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="live" className="mt-0 min-h-0 flex-1 data-[state=inactive]:hidden">
        <LiveTrackingLiveView fullscreen={isCommandFullscreen} />
      </TabsContent>

      <TabsContent value="history" className="mt-0 data-[state=inactive]:hidden">
        <LiveTrackingHistoryView />
      </TabsContent>
    </Tabs>
  );

  if (isCommandFullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <h1 className="truncate text-sm font-semibold">{t("commandCenter")}</h1>
            <Badge variant="secondary" className="gap-1 text-[10px]">
              <Radio className="h-3 w-3 text-emerald-500" />
              {t("tabLive")}
            </Badge>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {t("autoRefresh")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={() => setIsCommandFullscreen(false)}
            >
              <Minimize2 className="me-1.5 h-4 w-4" />
              {t("exitFullscreen")}
            </Button>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-hidden p-3">{tabs}</div>
      </div>
    );
  }

  return (
    <AppPage>
      <AppPageHeader
        title={t("title")}
        description={t("subtitle")}
      />

      <div className={cn("flex flex-col")}>{tabs}</div>
    </AppPage>
  );
}
