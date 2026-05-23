"use client";

import { useTranslations } from "next-intl";
import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
export function HistoryPlaybackControls({
  playing,
  onTogglePlay,
  speed,
  onSpeedChange,
  index,
  maxIndex,
  onIndexChange,
  currentLabel,
  durationLabel,
}: {
  playing: boolean;
  onTogglePlay: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  index: number;
  maxIndex: number;
  onIndexChange: (index: number) => void;
  currentLabel: string;
  durationLabel: string;
}) {
  const t = useTranslations("pages.liveTracking");

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="cursor-pointer gap-1.5 rounded-lg"
          onClick={onTogglePlay}
          disabled={maxIndex < 0}
        >
          {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          {playing ? t("playbackPause") : t("playbackPlay")}
        </Button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{t("playbackSpeed")}</span>
          <Select
            value={String(speed)}
            onValueChange={(v) => onSpeedChange(Number(v))}
          >
            <SelectTrigger className="h-8 w-20 cursor-pointer rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1×</SelectItem>
              <SelectItem value="2">2×</SelectItem>
              <SelectItem value="4">4×</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="ms-auto flex flex-col text-end text-xs text-muted-foreground">
          <span>
            {t("playbackCurrent")}: {currentLabel}
          </span>
          <span>
            {t("playbackDuration")}: {durationLabel}
          </span>
        </div>
      </div>

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
    </div>
  );
}
