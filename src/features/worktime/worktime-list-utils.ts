import type { WorktimeListRow } from "@/features/driver-tracking/tracking-read-actions";

export type WorktimeSortKey =
  | "date_desc"
  | "date_asc"
  | "name_asc"
  | "online_desc"
  | "log_duration_desc";

export const WORKTIME_SORT_KEYS: WorktimeSortKey[] = [
  "date_desc",
  "date_asc",
  "name_asc",
  "online_desc",
  "log_duration_desc",
];

export function filterWorktime(
  rows: WorktimeListRow[],
  search: string,
  validationStatus: "all" | "present" | "online_unvalidated" | "absent",
  onDuty: "all" | "yes" | "no",
  hasLog: "all" | "yes" | "no",
): WorktimeListRow[] {
  const q = search.trim().toLowerCase();
  return rows.filter((r) => {
    if (validationStatus !== "all" && r.attendance_status !== validationStatus) return false;
    if (onDuty === "yes" && !r.is_on_duty) return false;
    if (onDuty === "no" && r.is_on_duty) return false;
    if (hasLog === "yes" && !r.check_in_at) return false;
    if (hasLog === "no" && r.check_in_at) return false;
    if (!q) return true;
    return (
      r.driver_name.toLowerCase().includes(q) ||
      r.driver_code.toLowerCase().includes(q) ||
      r.driver_phone.toLowerCase().includes(q)
    );
  });
}

export function sortWorktime(rows: WorktimeListRow[], sortKey: WorktimeSortKey): WorktimeListRow[] {
  const copy = [...rows];
  copy.sort((a, b) => {
    switch (sortKey) {
      case "date_asc":
        return a.attendance_date.localeCompare(b.attendance_date);
      case "name_asc":
        return a.driver_name.localeCompare(b.driver_name);
      case "online_desc":
        return b.online_seconds - a.online_seconds;
      case "log_duration_desc":
        return (b.log_duration_seconds ?? 0) - (a.log_duration_seconds ?? 0);
      case "date_desc":
      default:
        return b.attendance_date.localeCompare(a.attendance_date);
    }
  });
  return copy;
}

export function exportWorktimeCsv(rows: WorktimeListRow[]): string {
  const header = [
    "driver_code",
    "driver_name",
    "date",
    "check_in",
    "check_out",
    "log_duration_seconds",
    "online_seconds",
    "sessions",
    "distance_meters",
    "idle_minutes",
    "moving_minutes",
    "attendance_status",
    "validated",
    "on_duty",
  ];
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [
        r.driver_code,
        r.driver_name,
        r.attendance_date,
        r.check_in_at ?? "",
        r.check_out_at ?? "",
        r.log_duration_seconds ?? "",
        r.online_seconds,
        r.session_count,
        r.distance_meters ?? "",
        r.idle_minutes ?? "",
        r.moving_minutes ?? "",
        r.attendance_status ?? "",
        r.is_validated,
        r.is_on_duty,
      ]
        .map((v) => {
          const s = String(v);
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    ),
  ];
  return "\uFEFF" + lines.join("\n");
}
