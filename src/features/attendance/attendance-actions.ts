"use server";

import { logAdminMutation, logAdminRead } from "@/lib/audit/log-admin-activity";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/get-session";
import { hasPermissionInSet } from "@/lib/auth/permissions";
import type {
  AttendanceActionError,
  AttendanceCorrectionInput,
  AttendanceKpis,
  AttendanceListRow,
  AttendanceStatus,
  AttendanceTabFilter,
} from "./types";

const KUWAIT_TZ = "Asia/Kuwait";

function kuwaitToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: KUWAIT_TZ }).format(new Date());
}

function relProfileName(
  profiles:
    | { full_name: string | null; phone: string | null }
    | { full_name: string | null; phone: string | null }[]
    | null
    | undefined,
): { name: string; phone: string } {
  if (!profiles) return { name: "—", phone: "—" };
  const row = Array.isArray(profiles) ? profiles[0] : profiles;
  return {
    name: row?.full_name?.trim() || "—",
    phone: row?.phone?.trim() || "—",
  };
}

async function requireAttendanceView() {
  const session = await getSessionUser();
  if (
    !session ||
    !hasPermissionInSet(session.permissions, "attendance.view", session.isSuperAdmin)
  ) {
    throw new Error("not_authorized");
  }
  return session;
}

async function requireAttendanceManage() {
  const session = await getSessionUser();
  if (
    !session ||
    !hasPermissionInSet(session.permissions, "attendance.manage", session.isSuperAdmin)
  ) {
    return null;
  }
  return session;
}

type DriverRow = {
  id: string;
  driver_code: string;
  is_on_duty: boolean;
  status: string;
  archived_at: string | null;
  profiles:
    | { full_name: string | null; phone: string | null }
    | { full_name: string | null; phone: string | null }[]
    | null;
};

type AttendanceLogRow = {
  id: string;
  driver_id: string;
  log_date: string;
  check_in_at: string | null;
  check_out_at: string | null;
  distance_meters: number | null;
  status: AttendanceStatus;
  zone_compliance: "inside" | "outside" | null;
  admin_note: string | null;
};

function buildListRow(
  driver: DriverRow,
  log: AttendanceLogRow | null,
  logDate: string,
): AttendanceListRow {
  const { name, phone } = relProfileName(driver.profiles);
  const status: AttendanceStatus = log?.status ?? "absent";
  const checkIn = log?.check_in_at ?? null;
  const checkOut = log?.check_out_at ?? null;
  const isActiveNow = Boolean(checkIn && !checkOut && driver.is_on_duty);
  const isException =
    Boolean(checkIn && !checkOut && !driver.is_on_duty) ||
    log?.zone_compliance === "outside";

  return {
    id: log?.id ?? null,
    driver_id: driver.id,
    driver_name: name,
    driver_code: driver.driver_code,
    driver_phone: phone,
    log_date: logDate,
    check_in_at: checkIn,
    check_out_at: checkOut,
    distance_meters: log?.distance_meters ?? null,
    status,
    zone_compliance: log?.zone_compliance ?? null,
    admin_note: log?.admin_note ?? null,
    is_on_duty: driver.is_on_duty,
    is_active_now: isActiveNow,
    is_exception: isException,
  };
}

function computeKpis(rows: AttendanceListRow[]): AttendanceKpis {
  return {
    present: rows.filter((r) => r.status === "present").length,
    late: rows.filter((r) => r.status === "late").length,
    absent: rows.filter((r) => r.status === "absent").length,
    on_leave: rows.filter((r) => r.status === "on_leave").length,
    active_now: rows.filter((r) => r.is_active_now).length,
    outside_zone: rows.filter((r) => r.zone_compliance === "outside").length,
  };
}

async function fetchActiveDrivers(): Promise<DriverRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("drivers")
    .select("id, driver_code, is_on_duty, status, archived_at")
    .eq("status", "active")
    .is("archived_at", null)
    .order("driver_code", { ascending: true });

  if (error) throw error;
  const drivers = (data ?? []) as Omit<DriverRow, "profiles">[];
  if (drivers.length === 0) return [];

  const ids = drivers.map((d) => d.id);
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, phone")
    .in("id", ids);

  if (profileError) throw profileError;

  const profileById = new Map(
    (profiles ?? []).map((p) => [p.id, { full_name: p.full_name, phone: p.phone }]),
  );

  return drivers.map((d) => ({
    ...d,
    profiles: profileById.get(d.id) ?? null,
  }));
}

async function fetchLogsForDateRange(
  fromDate: string,
  toDate: string,
): Promise<AttendanceLogRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attendance_logs")
    .select(
      "id, driver_id, log_date, check_in_at, check_out_at, distance_meters, status, zone_compliance, admin_note",
    )
    .gte("log_date", fromDate)
    .lte("log_date", toDate)
    .order("log_date", { ascending: false });

  if (error) throw error;
  return (data ?? []) as AttendanceLogRow[];
}

async function fetchLogsForDate(logDate: string): Promise<AttendanceLogRow[]> {
  return fetchLogsForDateRange(logDate, logDate);
}

export async function fetchAttendanceLive(): Promise<{
  rows: AttendanceListRow[];
  kpis: AttendanceKpis;
}> {
  await requireAttendanceView();
  void logAdminRead("attendance", "fetchAttendanceLive");
  const today = kuwaitToday();
  const [drivers, logs] = await Promise.all([
    fetchActiveDrivers(),
    fetchLogsForDate(today),
  ]);

  const logByDriver = new Map(logs.map((l) => [l.driver_id, l]));
  const rows = drivers.map((d) => buildListRow(d, logByDriver.get(d.id) ?? null, today));

  return { rows, kpis: computeKpis(rows) };
}

export async function fetchAttendanceLogs(
  fromDate: string,
  toDate: string,
): Promise<AttendanceListRow[]> {
  await requireAttendanceView();
  void logAdminRead("attendance", "fetchAttendanceLogs");
  const [drivers, logs] = await Promise.all([
    fetchActiveDrivers(),
    fetchLogsForDateRange(fromDate, toDate),
  ]);

  const driverById = new Map(drivers.map((d) => [d.id, d]));

  return logs
    .map((log) => {
      const driver = driverById.get(log.driver_id);
      if (!driver) return null;
      return buildListRow(driver, log, log.log_date);
    })
    .filter((r): r is AttendanceListRow => r !== null);
}

export async function fetchAttendanceExceptions(): Promise<AttendanceListRow[]> {
  const { rows } = await fetchAttendanceLive();
  return rows.filter((r) => r.is_exception);
}

export async function fetchAttendanceForTab(
  tab: AttendanceTabFilter,
  fromDate?: string,
  toDate?: string,
): Promise<{ rows: AttendanceListRow[]; kpis?: AttendanceKpis }> {
  if (tab === "live") {
    return fetchAttendanceLive();
  }
  if (tab === "exceptions") {
    const rows = await fetchAttendanceExceptions();
    return { rows, kpis: computeKpis(rows) };
  }
  const today = kuwaitToday();
  const from = fromDate ?? addDays(today, -6);
  const to = toDate ?? today;
  const rows = await fetchAttendanceLogs(from, to);
  return { rows };
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function correctAttendanceLog(
  input: AttendanceCorrectionInput,
): Promise<{ error?: AttendanceActionError; success?: boolean; id?: string }> {
  const session = await requireAttendanceManage();
  if (!session) return { error: "not_authorized" };

  const note = input.note.trim();
  if (!note) return { error: "note_required" };

  const supabase = await createClient();

  let before: Record<string, unknown> | null = null;
  if (input.log_id) {
    const { data: existing } = await supabase
      .from("attendance_logs")
      .select("*")
      .eq("id", input.log_id)
      .maybeSingle();
    before = existing as Record<string, unknown> | null;
  }

  const { data, error } = await supabase.rpc("admin_correct_attendance", {
    p_log_id: input.log_id ?? undefined,
    p_driver_id: input.driver_id,
    p_log_date: input.log_date,
    p_check_in_at: input.check_in_at ?? undefined,
    p_check_out_at: input.check_out_at ?? undefined,
    p_status: input.status,
    p_note: note,
  });

  if (error) {
    const msg = error.message ?? "";
    if (msg.includes("note_required")) return { error: "note_required" };
    if (msg.includes("missing_fields")) return { error: "missing_fields" };
    if (msg.includes("invalid_times")) return { error: "invalid_times" };
    if (msg.includes("future_date")) return { error: "future_date" };
    if (msg.includes("log_not_found")) return { error: "log_not_found" };
    if (msg.includes("driver_not_found")) return { error: "driver_not_found" };
    if (msg.includes("not_authorized")) return { error: "not_authorized" };
    return { error: "save_failed" };
  }

  const after = data as Record<string, unknown> | null;
  const entityId = String(after?.id ?? input.log_id ?? input.driver_id);

  await logAdminMutation({
    action: input.log_id ? "update" : "create",
    entityType: "attendance_log",
    entityId,
    routeName: "attendance",
    before,
    after,
    context: { driver_id: input.driver_id, log_date: input.log_date },
  });

  return { success: true, id: entityId };
}

export async function exportAttendanceCsv(rows: AttendanceListRow[]): Promise<string> {
  await requireAttendanceView();
  void logAdminRead("attendance", "exportAttendanceCsv");
  const header = [
    "driver_code",
    "driver_name",
    "log_date",
    "check_in",
    "check_out",
    "status",
    "distance_meters",
    "on_duty",
    "zone_compliance",
    "admin_note",
  ];
  const escape = (v: string | number | boolean | null) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [
        r.driver_code,
        r.driver_name,
        r.log_date,
        r.check_in_at ?? "",
        r.check_out_at ?? "",
        r.status,
        r.distance_meters ?? "",
        r.is_on_duty,
        r.zone_compliance ?? "",
        r.admin_note ?? "",
      ]
        .map(escape)
        .join(","),
    ),
  ];
  return "\uFEFF" + lines.join("\n");
}
