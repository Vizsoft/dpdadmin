"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCorrectAttendance } from "./use-attendance";
import { ATTENDANCE_STATUSES, type AttendanceListRow, type AttendanceStatus } from "./types";

function isoToDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

function datetimeLocalToIso(value: string): string | null {
  if (!value.trim()) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

type AttendanceCorrectionSheetProps = {
  row: AttendanceListRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  createMode?: boolean;
};

export function AttendanceCorrectionSheet({
  row,
  open,
  onOpenChange,
  createMode = false,
}: AttendanceCorrectionSheetProps) {
  const t = useTranslations("pages.attendance");
  const auth = useAuth();
  const canManage = auth.can("attendance.manage");
  const { mutateAsync, isPending } = useCorrectAttendance();

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [status, setStatus] = useState<AttendanceStatus>("present");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!row || !open) return;
    setCheckIn(isoToDatetimeLocal(row.check_in_at));
    setCheckOut(isoToDatetimeLocal(row.check_out_at));
    setStatus(row.status === "absent" && createMode ? "present" : row.status);
    setNote("");
  }, [row, open, createMode]);

  if (!row) return null;

  const handleSave = async () => {
    if (!canManage) {
      toast.error(t("errors.notAuthorized"));
      return;
    }
    if (!note.trim()) {
      toast.error(t("errors.noteRequired"));
      return;
    }

    const result = await mutateAsync({
      log_id: createMode || !row.id ? null : row.id,
      driver_id: row.driver_id,
      log_date: row.log_date,
      check_in_at: datetimeLocalToIso(checkIn),
      check_out_at: datetimeLocalToIso(checkOut),
      status,
      note: note.trim(),
    });

    if (result.error) {
      const key = `errors.${result.error}` as Parameters<typeof t>[0];
      toast.error(t.has(key) ? t(key) : t("errors.saveFailed"));
      return;
    }

    toast.success(createMode || !row.id ? t("created") : t("corrected"));
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {createMode || !row.id ? t("correctionCreateTitle") : t("correctionTitle")}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto py-4">
          <div className="space-y-1.5">
            <Label>{t("colDriver")}</Label>
            <p className="text-sm font-medium">
              {row.driver_name}{" "}
              <span className="text-muted-foreground">#{row.driver_code}</span>
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>{t("colDate")}</Label>
            <p className="text-sm font-medium">{row.log_date}</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="attendanceCheckIn">{t("colCheckIn")}</Label>
            <Input
              id="attendanceCheckIn"
              type="datetime-local"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              disabled={!canManage || isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="attendanceCheckOut">{t("colCheckOut")}</Label>
            <Input
              id="attendanceCheckOut"
              type="datetime-local"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              disabled={!canManage || isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="attendanceStatus">{t("colStatus")}</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as AttendanceStatus)}
              disabled={!canManage || isPending}
            >
              <SelectTrigger id="attendanceStatus">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ATTENDANCE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {t(`status.${s}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="attendanceNote">{t("correctionNote")}</Label>
            <textarea
              id="attendanceNote"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              required
              disabled={!canManage || isPending}
              placeholder={t("correctionNotePlaceholder")}
              className="flex min-h-[72px] w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
            />
          </div>
        </div>

        <SheetFooter className="mt-auto gap-2 sm:flex-col sm:space-x-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="cursor-pointer rounded-lg"
          >
            {t("cancel")}
          </Button>
          {canManage ? (
            <Button
              type="button"
              onClick={() => void handleSave()}
              disabled={isPending}
              className="cursor-pointer rounded-lg"
            >
              {isPending ? t("saving") : t("saveCorrection")}
            </Button>
          ) : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
