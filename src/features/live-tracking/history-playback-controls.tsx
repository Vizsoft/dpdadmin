"use client";

import { useTranslations } from "next-intl";
import { Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SegmentOption } from "@/components/app/toggle-chip";
import { cn } from "@/lib/utils";
import { TrackingGlassCard } from "./tracking-shell";
export function HistoryPlaybackControls({
  playing,
  onTogglePlay,
  onRestart,
  speed,
  onSpeedChange,
  index,
  maxIndex,
  onIndexChange,
  currentLabel,
  durationLabel,
  deliverySubmitIndices = [],
}: {
  playing: boolean;
  onTogglePlay: () => void;
  onRestart: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  index: number;
  maxIndex: number;
  onIndexChange: (index: number) => void;
  currentLabel: string;
  durationLabel: string;
  deliverySubmitIndices?: number[];
}) {
  const t = useTranslations("pages.liveTracking");

  return (
    <TrackingGlassCard className="space-y-3 border-border bg-background/90 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" className="cursor-pointer gap-1.5 rounded-lg" onClick={onTogglePlay} disabled={maxIndex < 0}>
          {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          {playing ? t("playbackPause") : t("playbackPlay")}
        </Button>
        <Button type="button" size="sm" variant="outline" className="cursor-pointer gap-1.5 rounded-lg" onClick={onRestart} disabled={maxIndex < 0}>
          <RotateCcw className="size-3.5" />
          {t("historyRestart")}
        </Button>
        <div className="ms-1 inline-flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-1">
          <SegmentOption selected={speed === 1} onClick={() => onSpeedChange(1)}>
            1x
          </SegmentOption>
          <SegmentOption selected={speed === 2} onClick={() => onSpeedChange(2)}>
            2x
          </SegmentOption>
          <SegmentOption selected={speed === 4} onClick={() => onSpeedChange(4)}>
            4x
          </SegmentOption>
        </div>

        <div className="ms-auto flex flex-col text-end text-xs text-muted-foreground">
          <span>
            {t("playbackCurrent")}: {currentLabel}
          </span>
          <span>
            {t("playbackDuration")}: {durationLabel}
          </span>
          <span>
            {Math.min(index + 1, Math.max(maxIndex + 1, 0))}/{Math.max(maxIndex + 1, 0)}
          </span>
        </div>
      </div>

      <div className="relative">
        <input
          type="range"
          min={0}
          max={Math.max(0, maxIndex)}
          step={1}
          value={index}
          disabled={maxIndex < 0}
          onChange={(e) => onIndexChange(Number(e.target.value))}
          className="h-2 w-full cursor-pointer accent-primary"
        />
        {maxIndex > 0 ? (
          <div className="pointer-events-none absolute -top-1 left-0 right-0 h-2">
            {deliverySubmitIndices.map((eventIndex) => {
              const leftPercent = (eventIndex / maxIndex) * 100;
              return (
                <span
                  key={eventIndex}
                  className={cn(
                    "absolute top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-blue-500 shadow",
                  )}
                  style={{ left: `${leftPercent}%` }}
                  title={t("deliverySubmitMarker")}
                />
              );
            })}
          </div>
        ) : null}
      </div>
    </TrackingGlassCard>
  );
}
