import type { Database } from "@/types/database";

export type ShiftRow = Database["public"]["Tables"]["driver_daily_shifts"]["Row"];

function shiftSessionInstant(shiftDate: string, time: string, dayOffset: number): number {
  const base = addDaysIso(shiftDate, dayOffset);
  const t = time.length >= 8 ? time.slice(0, 8) : `${time.slice(0, 5)}:00`;
  return new Date(`${base}T${t}+03:00`).getTime();
}

function addDaysIso(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function computeShiftFlags(
  row: ShiftRow,
  nowMs: number = Date.now(),
): { isWithinWindow: boolean; isLocked: boolean; shiftEndMs: number } {
  const s1Start = shiftSessionInstant(row.shift_date, row.session1_start, 0);
  const s1End = shiftSessionInstant(
    row.shift_date,
    row.session1_end,
    row.session1_end_day_offset,
  );

  let shiftEndMs = s1End;
  let within = nowMs >= s1Start && nowMs < s1End;

  if (row.shift_type === "split" && row.session2_start && row.session2_end) {
    const s2Start = shiftSessionInstant(
      row.shift_date,
      row.session2_start,
      row.session2_start_day_offset,
    );
    const s2End = shiftSessionInstant(
      row.shift_date,
      row.session2_end,
      row.session2_end_day_offset,
    );
    shiftEndMs = Math.max(s1End, s2End);
    within =
      (nowMs >= s1Start && nowMs < s1End) || (nowMs >= s2Start && nowMs < s2End);
  }

  return {
    isWithinWindow: within,
    isLocked: nowMs < shiftEndMs,
    shiftEndMs,
  };
}

export function formatSessionRange(
  start: string,
  end: string,
  endOffset: number,
): string {
  const overnight = endOffset > 0 ? " (+1d)" : "";
  return `${start.slice(0, 5)}–${end.slice(0, 5)}${overnight}`;
}
