// Page-label audit: compares each leaf's page label with the page number printed
// in the leaf's own running header (a standalone integer on the first or last
// OCR line). Used by the build for page_label_source "header" and by the tests.
import type { PageRecord } from "./manifest.js";

/** How far (in pages) a header number may sit from the IA label and still count as that leaf's header. */
export const HEADER_WINDOW = 6;

function lineIntegers(line: string): number[] {
  return line
    .split(/\s+/)
    .filter((tok) => /^\d{1,4}$/.test(tok))
    .map(Number);
}

/**
 * The printed page number on a leaf: the standalone integer on the first line,
 * else on the last line, that is within HEADER_WINDOW of `label`. When a line
 * holds several candidates the one closest to `label` wins (lowest on a tie).
 * Returns null when no line yields one.
 */
export function headerNumber(text: string, label: number): number | null {
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length === 0) return null;
  const candidates = lines.length === 1 ? [lines[0]!] : [lines[0]!, lines[lines.length - 1]!];
  for (const line of candidates) {
    const near = lineIntegers(line)
      .filter((n) => Math.abs(n - label) <= HEADER_WINDOW)
      .sort((a, b) => Math.abs(a - label) - Math.abs(b - label) || a - b);
    if (near.length > 0) return near[0]!;
  }
  return null;
}

export function isNumericLabel(page: string | null): page is string {
  return page !== null && /^\d+$/.test(page);
}

export interface AuditResult {
  /** Leaves with a numeric label. */
  numeric: number;
  /** Numeric-label leaves where a header number was found. */
  found: number;
  /** Found leaves whose header number equals the label. */
  agree: number;
  /** Most common (header - label) over found leaves; 0 when none found. */
  dominantOffset: number;
}

/** Most common value; ties go to the value of smallest magnitude, then the lower value. */
export function mode(values: number[]): number {
  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best = 0;
  let bestCount = 0;
  for (const [v, c] of [...counts.entries()].sort((a, b) => Math.abs(a[0]) - Math.abs(b[0]) || a[0] - b[0])) {
    if (c > bestCount) {
      best = v;
      bestCount = c;
    }
  }
  return best;
}

export function auditPages(records: PageRecord[]): AuditResult {
  let numeric = 0;
  let agree = 0;
  const offsets: number[] = [];
  for (const r of records) {
    if (!isNumericLabel(r.page)) continue;
    numeric++;
    const label = Number(r.page);
    const h = headerNumber(r.text, label);
    if (h === null) continue;
    offsets.push(h - label);
    if (h === label) agree++;
  }
  return { numeric, found: offsets.length, agree, dominantOffset: mode(offsets) };
}

/**
 * Relabel leaves from their printed headers. A leaf with a header number takes it.
 * A numeric-label leaf without one is marked page_inferred and takes label + offset,
 * where offset is the local one when the nearest header-found leaves on both sides
 * share it, and the source's dominant offset otherwise. (A pure dominant-offset rule
 * mislabels Afanasyev 1865 leaf 13: its neighbours agree with IA, so 9 + 2 = 11
 * would collide with leaf 15.) Null and non-numeric labels are left alone.
 */
export function relabelFromHeaders(records: PageRecord[]): PageRecord[] {
  const sorted = [...records].sort((a, b) => a.leaf - b.leaf);
  const { dominantOffset } = auditPages(sorted);
  const offsetAt: (number | null)[] = sorted.map((r) => {
    if (!isNumericLabel(r.page)) return null;
    const h = headerNumber(r.text, Number(r.page));
    return h === null ? null : h - Number(r.page);
  });
  const neighbour = (i: number, step: 1 | -1): number | null => {
    for (let j = i + step; j >= 0 && j < sorted.length; j += step) if (offsetAt[j] !== null) return offsetAt[j]!;
    return null;
  };
  return sorted.map((r, i) => {
    if (!isNumericLabel(r.page)) return r;
    const label = Number(r.page);
    const own = offsetAt[i];
    if (own !== null && own !== undefined) return { leaf: r.leaf, page: String(label + own), text: r.text };
    const before = neighbour(i, -1);
    const after = neighbour(i, 1);
    const offset = before !== null && before === after ? before : dominantOffset;
    return { leaf: r.leaf, page: String(label + offset), text: r.text, page_inferred: true };
  });
}
