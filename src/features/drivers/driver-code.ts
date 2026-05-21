export function suggestDriverCode(seq = 1000): string {
  const n = Math.max(1000, seq);
  return `DR-${n}`;
}

export function parseDriverCodeNumber(code: string): number | null {
  const match = /^DR-(\d+)$/i.exec(code.trim());
  if (!match) return null;
  return Number.parseInt(match[1], 10);
}
