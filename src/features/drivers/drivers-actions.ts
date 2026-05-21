"use server";

import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/get-session";
import { hasPermissionInSet } from "@/lib/auth/permissions";
import { parseDriverCodeNumber, suggestDriverCode } from "./driver-code";
import { normalizeCivilId, normalizeKuwaitPhone } from "./driver-phone";
import { mapDriverDbError } from "./driver-errors";
import {
  allIntakeDocumentKeys,
  buildIntakeDocumentKey,
  extensionFromMime,
} from "@/lib/storage/r2-keys";
import { isR2Configured } from "@/lib/storage/r2-config";
import { deleteObjects, putObject } from "@/lib/storage/r2-client";
import {
  DOCUMENT_TYPES,
  type DriverAssetType,
  type DriverDetailModel,
  type DriverDocumentType,
  type DriverListRow,
  type DriverWorkflowStatus,
} from "./types";

const MAX_DOCUMENT_BYTES = 16 * 1024 * 1024;
const ALLOWED_DOC_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
]);

const ASSET_TYPES: DriverAssetType[] = [
  "gps",
  "sim",
  "phone",
  "delivery_bag",
  "helmet",
  "uniform",
];

async function requireDriversManager() {
  const session = await getSessionUser();
  if (
    !session ||
    !hasPermissionInSet(session.permissions, "drivers.manage", session.isSuperAdmin)
  ) {
    return { error: "not_authorized" as const };
  }
  return { session };
}

async function requireDriversView() {
  const session = await getSessionUser();
  if (
    !session ||
    !hasPermissionInSet(session.permissions, "drivers.view", session.isSuperAdmin)
  ) {
    throw new Error("not_authorized");
  }
  return session;
}

function parseAssetsIssued(raw: unknown): Record<string, boolean> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as Record<string, boolean>;
}

export type DriverMutationResult = {
  error?: string;
  success?: boolean;
  id?: string;
};

async function nextDriverCodeNumber(): Promise<number> {
  const supabase = await createClient();
  const codes: string[] = [];

  const { data: intakes } = await supabase.from("driver_intakes").select("driver_code");
  for (const row of intakes ?? []) {
    if (row.driver_code) codes.push(row.driver_code);
  }

  const { data: drivers } = await supabase.from("drivers").select("driver_code");
  for (const row of drivers ?? []) {
    if (row.driver_code) codes.push(row.driver_code);
  }

  let max = 1000;
  for (const code of codes) {
    const n = parseDriverCodeNumber(code);
    if (n !== null && n >= max) max = n + 1;
  }
  return max;
}

export async function generateDriverCode(): Promise<{ code: string } | { error: string }> {
  const auth = await requireDriversManager();
  if (auth.error) return { error: auth.error };
  const seq = await nextDriverCodeNumber();
  return { code: suggestDriverCode(seq) };
}

function buildAssetsMap(
  assetsEnabled: boolean,
  raw: FormData,
): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  for (const asset of ASSET_TYPES) {
    map[asset] = assetsEnabled && raw.get(`asset_${asset}`) === "true";
  }
  return map;
}

async function phoneExists(phone: string, excludeIntakeId?: string): Promise<boolean> {
  const supabase = await createClient();

  let intakeQuery = supabase
    .from("driver_intakes")
    .select("id")
    .eq("phone", phone)
    .neq("status", "cancelled");
  if (excludeIntakeId) intakeQuery = intakeQuery.neq("id", excludeIntakeId);

  const { data: intake } = await intakeQuery.maybeSingle();
  if (intake) return true;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();

  if (!profile) return false;
  if (excludeIntakeId) {
    const { data: linkedIntake } = await supabase
      .from("driver_intakes")
      .select("id")
      .eq("linked_profile_id", profile.id)
      .maybeSingle();
    if (linkedIntake?.id === excludeIntakeId) return false;
  }
  return true;
}

async function driverCodeExists(
  code: string,
  excludeIntakeId?: string,
): Promise<boolean> {
  const supabase = await createClient();
  const normalized = code.trim().toUpperCase();

  let intakeQuery = supabase
    .from("driver_intakes")
    .select("id")
    .eq("driver_code", normalized);
  if (excludeIntakeId) intakeQuery = intakeQuery.neq("id", excludeIntakeId);

  const { data: intake } = await intakeQuery.maybeSingle();
  if (intake) return true;

  const { data: driver } = await supabase
    .from("drivers")
    .select("id")
    .eq("driver_code", normalized)
    .maybeSingle();

  return Boolean(driver);
}

async function uploadIntakeDocument(
  intakeId: string,
  docType: DriverDocumentType,
  file: File,
): Promise<{ error?: string; path?: string }> {
  if (file.size > MAX_DOCUMENT_BYTES) return { error: "file_too_large" };
  if (!ALLOWED_DOC_MIME.has(file.type)) return { error: "invalid_file_type" };

  const ext = extensionFromMime(file.type);
  const key = buildIntakeDocumentKey(intakeId, docType, ext);
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    await putObject(key, buffer, file.type);
  } catch {
    return { error: "upload_failed" };
  }

  return { path: key };
}

export async function createDriverIntake(
  formData: FormData,
): Promise<DriverMutationResult> {
  const auth = await requireDriversManager();
  if (auth.error) return { error: auth.error };

  const fullName = String(formData.get("fullName") ?? "").trim();
  const phoneRaw = String(formData.get("phone") ?? "").trim();
  const civilId = String(formData.get("civilId") ?? "").trim();
  const driverCode = String(formData.get("driverCode") ?? "").trim().toUpperCase();
  const partnerId = String(formData.get("partnerId") ?? "").trim();
  const zoneId = String(formData.get("zoneId") ?? "").trim();
  const vehicleId = String(formData.get("vehicleId") ?? "").trim();
  const assetsEnabled = formData.get("assetsEnabled") === "true";

  if (!fullName || !phoneRaw || !civilId || !driverCode || !partnerId || !zoneId) {
    return { error: "missing_fields" };
  }

  const phone = normalizeKuwaitPhone(phoneRaw);
  if (!phone) return { error: "invalid_phone" };

  const civilIdNormalized = normalizeCivilId(civilId);
  if (!civilIdNormalized) return { error: "invalid_civil_id" };

  if (parseDriverCodeNumber(driverCode) === null) {
    return { error: "invalid_driver_code" };
  }

  if (await phoneExists(phone)) return { error: "phone_exists" };
  if (await driverCodeExists(driverCode)) return { error: "driver_code_exists" };

  const supabase = await createClient();
  const intakeId = crypto.randomUUID();
  const assetsIssued = buildAssetsMap(assetsEnabled, formData);

  const docsToUpload: { docType: DriverDocumentType; file: File }[] = [];
  for (const docType of DOCUMENT_TYPES) {
    const file = formData.get(`doc_${docType}`);
    if (file instanceof File && file.size > 0) {
      docsToUpload.push({ docType, file });
    }
  }

  if (docsToUpload.length > 0 && !(await isR2Configured())) {
    return { error: "r2_not_configured" };
  }

  for (const { docType, file } of docsToUpload) {
    const upload = await uploadIntakeDocument(intakeId, docType, file);
    if (upload.error) {
      try {
        await deleteObjects(allIntakeDocumentKeys(intakeId));
      } catch {
        /* best-effort */
      }
      return { error: upload.error };
    }
  }

  const { data, error } = await supabase
    .from("driver_intakes")
    .insert({
      id: intakeId,
      phone,
      full_name: fullName,
      civil_id: civilIdNormalized,
      driver_code: driverCode,
      partner_id: partnerId,
      zone_id: zoneId,
      vehicle_id: vehicleId || null,
      assets_issued: assetsIssued,
      status: "awaiting_app_link",
      workflow_status: "draft",
      linked: false,
    })
    .select("id")
    .single();

  if (error) {
    try {
      await deleteObjects(allIntakeDocumentKeys(intakeId));
    } catch {
      /* best-effort rollback */
    }
    return { error: mapDriverDbError(error) };
  }

  return { success: true, id: data.id };
}

type IntakeListRow = {
  id: string;
  full_name: string;
  phone: string;
  driver_code: string;
  workflow_status: DriverWorkflowStatus;
  linked: boolean;
  partners: { name: string } | { name: string }[] | null;
  zones: { name: string; code: string } | { name: string; code: string }[] | null;
};

function relName<T extends { name: string }>(
  rel: T | T[] | null | undefined,
): string {
  if (!rel) return "—";
  const row = Array.isArray(rel) ? rel[0] : rel;
  return row?.name ?? "—";
}

function relZone(
  rel: { name: string; code: string } | { name: string; code: string }[] | null | undefined,
): string {
  if (!rel) return "—";
  const row = Array.isArray(rel) ? rel[0] : rel;
  if (!row) return "—";
  return `${row.name} (${row.code})`;
}

export async function fetchDriversForAdmin(): Promise<DriverListRow[]> {
  await requireDriversView();
  const supabase = await createClient();

  const { data: intakes, error } = await supabase
    .from("driver_intakes")
    .select(
      `
      id,
      full_name,
      phone,
      driver_code,
      workflow_status,
      linked,
      partners (name),
      zones (name, code)
    `,
    )
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = (intakes ?? []) as IntakeListRow[];

  return rows.map((row) => ({
    id: row.id,
    driver_code: row.driver_code,
    full_name: row.full_name,
    phone: row.phone,
    partner_name: relName(row.partners),
    zone_label: relZone(row.zones),
    workflow_status: row.workflow_status,
    linked: row.linked,
    deliveries_display: "—",
    earnings_display: "—",
  }));
}

export async function updateDriverWorkflowStatus(
  intakeId: string,
  workflowStatus: DriverWorkflowStatus,
): Promise<DriverMutationResult> {
  const auth = await requireDriversManager();
  if (auth.error) return { error: auth.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("driver_intakes")
    .update({
      workflow_status: workflowStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", intakeId)
    .neq("status", "cancelled");

  if (error) return { error: mapDriverDbError(error) };
  return { success: true };
}

export async function updateDriverIntake(
  formData: FormData,
): Promise<DriverMutationResult> {
  const auth = await requireDriversManager();
  if (auth.error) return { error: auth.error };

  const intakeId = String(formData.get("intakeId") ?? "").trim();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const phoneRaw = String(formData.get("phone") ?? "").trim();
  const civilId = String(formData.get("civilId") ?? "").trim();
  const driverCode = String(formData.get("driverCode") ?? "").trim().toUpperCase();
  const partnerId = String(formData.get("partnerId") ?? "").trim();
  const zoneId = String(formData.get("zoneId") ?? "").trim();
  const vehicleId = String(formData.get("vehicleId") ?? "").trim();
  const assetsEnabled = formData.get("assetsEnabled") === "true";
  const workflowStatus = String(formData.get("workflowStatus") ?? "").trim() as DriverWorkflowStatus;

  if (!intakeId || !fullName || !phoneRaw || !civilId || !driverCode || !partnerId || !zoneId) {
    return { error: "missing_fields" };
  }

  if (!["draft", "pending", "approved"].includes(workflowStatus)) {
    return { error: "missing_fields" };
  }

  const phone = normalizeKuwaitPhone(phoneRaw);
  if (!phone) return { error: "invalid_phone" };

  const civilIdNormalized = normalizeCivilId(civilId);
  if (!civilIdNormalized) return { error: "invalid_civil_id" };

  if (parseDriverCodeNumber(driverCode) === null) {
    return { error: "invalid_driver_code" };
  }

  if (await phoneExists(phone, intakeId)) return { error: "phone_exists" };
  if (await driverCodeExists(driverCode, intakeId)) {
    return { error: "driver_code_exists" };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("driver_intakes")
    .select("id, linked_profile_id")
    .eq("id", intakeId)
    .neq("status", "cancelled")
    .maybeSingle();

  if (!existing) return { error: "save_failed" };

  const assetsIssued = buildAssetsMap(assetsEnabled, formData);

  const { error } = await supabase
    .from("driver_intakes")
    .update({
      full_name: fullName,
      phone,
      civil_id: civilIdNormalized,
      driver_code: driverCode,
      partner_id: partnerId,
      zone_id: zoneId,
      vehicle_id: vehicleId || null,
      assets_issued: assetsIssued,
      workflow_status: workflowStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", intakeId);

  if (error) return { error: mapDriverDbError(error) };

  if (existing.linked_profile_id) {
    await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        phone,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.linked_profile_id);

    await supabase
      .from("drivers")
      .update({
        driver_code: driverCode,
        partner_id: partnerId,
        zone_id: zoneId,
        vehicle_id: vehicleId || null,
        civil_id: civilIdNormalized,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.linked_profile_id);
  }

  return { success: true, id: intakeId };
}

export async function fetchDriverDetail(
  id: string,
): Promise<DriverDetailModel | null> {
  await requireDriversView();
  const supabase = await createClient();

  const { data: intake } = await supabase
    .from("driver_intakes")
    .select(
      `
      id,
      full_name,
      phone,
      civil_id,
      driver_code,
      workflow_status,
      linked,
      linked_profile_id,
      partner_id,
      zone_id,
      vehicle_id,
      assets_issued,
      created_at,
      partners (name),
      zones (name, code),
      vehicles (bike_id, reg_number)
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (intake) {
    const linkedId = intake.linked_profile_id;
    let profile: {
      email: string | null;
      avatar_url: string | null;
      full_name: string | null;
      phone: string | null;
    } | null = null;
    if (linkedId) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("email, avatar_url, full_name, phone")
        .eq("id", linkedId)
        .maybeSingle();
      profile = prof;
    }

    const vehicle = intake.vehicles as
      | { bike_id: string; reg_number: string | null }
      | { bike_id: string; reg_number: string | null }[]
      | null;
    const vehicleRow = Array.isArray(vehicle) ? vehicle[0] : vehicle;
    const vehicle_label = vehicleRow
      ? `${vehicleRow.bike_id}${vehicleRow.reg_number ? ` · ${vehicleRow.reg_number}` : ""}`
      : null;

    return {
      id: intake.id,
      intake_id: intake.id,
      source: "intake",
      driver_code: intake.driver_code,
      full_name: profile?.full_name ?? intake.full_name,
      phone: profile?.phone ?? intake.phone,
      email: profile?.email ?? null,
      civil_id: intake.civil_id,
      avatar_url: profile?.avatar_url ?? null,
      partner_name: relName(
        intake.partners as IntakeListRow["partners"],
      ),
      zone_label: relZone(intake.zones as IntakeListRow["zones"]),
      vehicle_label,
      partner_id: intake.partner_id,
      zone_id: intake.zone_id,
      vehicle_id: intake.vehicle_id,
      workflow_status: intake.workflow_status as DriverWorkflowStatus,
      linked: intake.linked,
      linked_profile_id: intake.linked_profile_id,
      base_earnings_kwd: null,
      joined_at: intake.created_at.slice(0, 10),
      assets_issued: parseAssetsIssued(intake.assets_issued),
    };
  }

  const { data: driverRow } = await supabase
    .from("drivers")
    .select(
      `
      id,
      driver_code,
      civil_id,
      status,
      base_earnings_kwd,
      joined_at,
      is_on_duty,
      vehicle_id,
      partner_id,
      zone_id,
      partners (name),
      zones (name, code)
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (!driverRow) return null;

  const { data: prof } = await supabase
    .from("profiles")
    .select("email, avatar_url, full_name, phone")
    .eq("id", id)
    .maybeSingle();

  let vehicleRow: { bike_id: string; reg_number: string | null } | null = null;
  if (driverRow.vehicle_id) {
    const { data: v } = await supabase
      .from("vehicles")
      .select("bike_id, reg_number")
      .eq("id", driverRow.vehicle_id)
      .maybeSingle();
    vehicleRow = v;
  }

  const { data: intakeForDriver } = await supabase
    .from("driver_intakes")
    .select(
      "id, assets_issued, workflow_status, linked, partner_id, zone_id, vehicle_id",
    )
    .eq("linked_profile_id", id)
    .maybeSingle();

  return {
    id: driverRow.id,
    intake_id: intakeForDriver?.id ?? null,
    source: intakeForDriver ? "intake" : "driver",
    driver_code: driverRow.driver_code,
    full_name: prof?.full_name ?? "—",
    phone: prof?.phone ?? "—",
    email: prof?.email ?? null,
    civil_id: driverRow.civil_id ?? "—",
    avatar_url: prof?.avatar_url ?? null,
    partner_name: relName(driverRow.partners as IntakeListRow["partners"]),
    zone_label: relZone(driverRow.zones as IntakeListRow["zones"]),
    vehicle_label: vehicleRow
      ? `${vehicleRow.bike_id}${vehicleRow.reg_number ? ` · ${vehicleRow.reg_number}` : ""}`
      : null,
    partner_id: intakeForDriver?.partner_id ?? driverRow.partner_id ?? "",
    zone_id: intakeForDriver?.zone_id ?? driverRow.zone_id ?? "",
    vehicle_id: intakeForDriver?.vehicle_id ?? driverRow.vehicle_id,
    workflow_status:
      (intakeForDriver?.workflow_status as DriverWorkflowStatus) ?? "pending",
    linked: intakeForDriver?.linked ?? true,
    linked_profile_id: id,
    base_earnings_kwd: driverRow.base_earnings_kwd,
    joined_at: driverRow.joined_at,
    assets_issued: parseAssetsIssued(intakeForDriver?.assets_issued),
  };
}
