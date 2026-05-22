/** Plain numeric driver codes assigned by `driver_code_seq` (e.g. 100001). */
export function formatDriverCodeDisplay(code: string): string {
  const trimmed = code.trim();
  if (!trimmed) return "—";
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

export function parseDriverCodeNumber(code: string): number | null {
  const match = /^(\d{6,})$/.exec(code.trim());
  if (!match) return null;
  return Number.parseInt(match[1], 10);
}

export function isValidDriverCode(code: string): boolean {
  return parseDriverCodeNumber(code) !== null;
}
