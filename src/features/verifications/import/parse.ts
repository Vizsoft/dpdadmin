import type { ImportMappedRow, ImportTargetField } from "../types";

export type ParsedSheet = {
  headers: string[];
  rows: string[][];
  headerSignature: string;
};

const ZERO_WIDTH = /[\u200B-\u200D\uFEFF]/g;

export function cleanCell(value: unknown): string {
  if (value == null) return "";
  let s = String(value).replace(ZERO_WIDTH, "");
  s = s.replace(/\s+/g, " ").trim();
  return normalizeDigits(s);
}

function normalizeDigits(s: string): string {
  const arabicIndic = "٠١٢٣٤٥٦٧٨٩";
  const easternArabic = "۰۱۲۳۴۵۶۷۸۹";
  return s
    .split("")
    .map((ch) => {
      const a = arabicIndic.indexOf(ch);
      if (a >= 0) return String(a);
      const e = easternArabic.indexOf(ch);
      if (e >= 0) return String(e);
      return ch;
    })
    .join("");
}

/**
 * Normalise common spreadsheet date inputs (dd/mm/yyyy, dd-mm-yyyy, yyyy-mm-dd,
 * mm/dd/yyyy, dd.mm.yyyy, Excel serial numbers) to an ISO `YYYY-MM-DD` string.
 * If the input cannot be parsed confidently, returns the original string so the
 * caller can flag it and show a clear error.
 */
export function normalizeDateToIso(value: string | null | undefined): string | null {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const serial = Number(raw);
  if (Number.isFinite(serial) && /^\d{4,6}(\.\d+)?$/.test(raw)) {
    const epoch = Date.UTC(1899, 11, 30);
    const d = new Date(epoch + Math.round(serial) * 86_400_000);
    if (!Number.isNaN(d.getTime())) {
      return d.toISOString().slice(0, 10);
    }
  }

  const parts = raw.split(/[/\-.]/).map((p) => p.trim()).filter(Boolean);
  if (parts.length === 3 && parts.every((p) => /^\d{1,4}$/.test(p))) {
    let day: number;
    let month: number;
    let year: number;
    if (parts[0]!.length === 4) {
      year = Number(parts[0]);
      month = Number(parts[1]);
      day = Number(parts[2]);
    } else {
      const a = Number(parts[0]);
      const b = Number(parts[1]);
      const c = Number(parts[2]);
      year = c < 100 ? 2000 + c : c;
      if (a > 12 && b <= 12) {
        day = a;
        month = b;
      } else if (b > 12 && a <= 12) {
        month = a;
        day = b;
      } else {
        day = a;
        month = b;
      }
    }
    if (
      Number.isFinite(day) &&
      Number.isFinite(month) &&
      Number.isFinite(year) &&
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= 31
    ) {
      const iso = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const d = new Date(`${iso}T00:00:00Z`);
      if (!Number.isNaN(d.getTime())) return iso;
    }
  }

  const fallback = new Date(raw);
  if (!Number.isNaN(fallback.getTime())) {
    return fallback.toISOString().slice(0, 10);
  }

  return raw;
}

export function headerSignature(headers: string[]): string {
  return headers.map((h) => cleanCell(h).toLowerCase()).sort().join("|");
}

const DATE_HEADER =
  /^\d{1,2}[-/]\w{3,9}$|^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$|^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i;

export function isWideDateLayout(headers: string[]): boolean {
  let dateCols = 0;
  for (const h of headers) {
    if (DATE_HEADER.test(cleanCell(h))) dateCols += 1;
  }
  return dateCols >= 3;
}

function parseExcelDateHeader(header: string, defaultYear = 2026): string | null {
  const h = cleanCell(header).toLowerCase();
  const m = h.match(/^(\d{1,2})[-/](\w{3,9})$/);
  if (m) {
    const day = Number(m[1]);
    const monStr = m[2].slice(0, 3);
    const months: Record<string, number> = {
      jan: 0,
      feb: 1,
      mar: 2,
      apr: 3,
      may: 4,
      jun: 5,
      jul: 6,
      aug: 7,
      sep: 8,
      oct: 9,
      nov: 10,
      dec: 11,
    };
    const month = months[monStr];
    if (month == null || !Number.isFinite(day)) return null;
    const d = new Date(Date.UTC(defaultYear, month, day));
    return d.toISOString().slice(0, 10);
  }
  return null;
}

export function unpivotWideRows(
  headers: string[],
  rows: string[][],
  mapping: Partial<Record<ImportTargetField, string>>,
  defaultYear = 2026,
): ImportMappedRow[] {
  const staticTargets: ImportTargetField[] = [
    "employee_id",
    "driver_code",
    "restaurant_external_id",
    "restaurant_name",
    "partner_name",
    "notes",
  ];

  const headerIndex = new Map(headers.map((h, i) => [cleanCell(h), i]));
  const dateColumns: { header: string; index: number; iso: string }[] = [];

  headers.forEach((h, i) => {
    const iso = parseExcelDateHeader(h, defaultYear);
    if (iso) dateColumns.push({ header: h, index: i, iso });
  });

  const out: ImportMappedRow[] = [];
  let rowIndex = 0;

  for (const row of rows) {
    const staticVals: Partial<Record<ImportTargetField, string | null>> = {};
    for (const field of staticTargets) {
      const src = mapping[field];
      if (!src) continue;
      const idx = headerIndex.get(cleanCell(src));
      staticVals[field] =
        idx != null ? cleanCell(row[idx]) || null : null;
    }

    for (const col of dateColumns) {
      const raw = row[col.index];
      const count = parseInt(cleanCell(raw), 10);
      if (!Number.isFinite(count) || count <= 0) continue;

      out.push({
        rowIndex: rowIndex++,
        employee_id: staticVals.employee_id ?? null,
        driver_code: staticVals.driver_code ?? null,
        restaurant_external_id: staticVals.restaurant_external_id ?? null,
        restaurant_name: staticVals.restaurant_name ?? null,
        partner_name: staticVals.partner_name ?? null,
        service_date: col.iso,
        reported_count: count,
        notes: staticVals.notes ?? null,
      });
    }
  }

  return out;
}

export function mapRowsFromSheet(
  headers: string[],
  rows: string[][],
  mapping: Partial<Record<ImportTargetField, string>>,
): ImportMappedRow[] {
  const headerIndex = new Map(headers.map((h, i) => [cleanCell(h), i]));

  return rows
    .map((row, rowIndex) => {
      const get = (field: ImportTargetField): string | null => {
        const src = mapping[field];
        if (!src) return null;
        const idx = headerIndex.get(cleanCell(src));
        if (idx == null) return null;
        const v = cleanCell(row[idx]);
        return v || null;
      };

      const countRaw = get("reported_count");
      const reported = countRaw != null ? parseInt(countRaw, 10) : null;

      return {
        rowIndex,
        employee_id: get("employee_id"),
        driver_code: get("driver_code"),
        restaurant_external_id: get("restaurant_external_id"),
        restaurant_name: get("restaurant_name"),
        partner_name: get("partner_name"),
        service_date: normalizeDateToIso(get("service_date")),
        reported_count: Number.isFinite(reported as number) ? reported : null,
        notes: get("notes"),
      };
    })
    .filter(
      (r) =>
        r.employee_id ||
        r.driver_code ||
        r.restaurant_name ||
        r.restaurant_external_id,
    );
}

export function guessColumnMapping(
  headers: string[],
): Partial<Record<ImportTargetField, string>> {
  const lower = headers.map((h) => ({ raw: h, key: cleanCell(h).toLowerCase() }));
  const find = (...needles: string[]) => {
    const hit = lower.find((h) => needles.some((n) => h.key.includes(n)));
    return hit?.raw;
  };

  return {
    employee_id: find("emp id", "emp_id", "employee"),
    driver_code: find("driver id", "driver_code"),
    restaurant_external_id: find("cc", "store code", "merchant"),
    restaurant_name: find("store name", "restaurant"),
    partner_name: find("company", "partner"),
    service_date: find("date", "service date"),
    reported_count: find("count", "deliveries", "orders"),
    notes: find("notes", "remark"),
  };
}

export const MAPPING_STORAGE_PREFIX = "dpd-verification-mapping:";

export function loadStoredMapping(
  signature: string,
): Partial<Record<ImportTargetField, string>> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${MAPPING_STORAGE_PREFIX}${signature}`);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<Record<ImportTargetField, string>>;
  } catch {
    return null;
  }
}

export function saveStoredMapping(
  signature: string,
  mapping: Partial<Record<ImportTargetField, string>>,
) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `${MAPPING_STORAGE_PREFIX}${signature}`,
      JSON.stringify(mapping),
    );
  } catch {
    /* ignore */
  }
}

export async function parseSpreadsheetFile(file: File): Promise<ParsedSheet> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array", cellDates: false });
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    defval: null,
    raw: false,
  }) as (string | number | null)[][];

  if (matrix.length < 2) {
    return { headers: [], rows: [], headerSignature: "" };
  }

  const headers = (matrix[0] ?? []).map((c) => cleanCell(c));
  const rows = matrix.slice(1).map((r) => (r ?? []).map((c) => cleanCell(c)));
  return {
    headers,
    rows,
    headerSignature: headerSignature(headers),
  };
}
