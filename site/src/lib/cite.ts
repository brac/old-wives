// Pure cite-chip formatting. No imports, so it is unit-testable without loading entries.
//
// Cite tag grammar (schema/entry.schema.json, $defs.CiteTag):
//   <source_id>:p.<n>        one page
//   <source_id>:pp.<a>-<b>   a page range
//   <source_id>:s.v.<word>   a dictionary headword (sub verbo)

export interface ParsedCite {
  sourceId: string;
  kind: "p" | "pp" | "sv";
  /** The page, the "a-b" range, or the headword. */
  locus: string;
}

const TAG = /^([a-z0-9]+):(?:p\.([0-9ivxlcdm]+)|pp\.([0-9ivxlcdm]+-[0-9ivxlcdm]+)|s\.v\.(.+))$/;

/** Parse a cite tag. Throws on a tag that does not match the schema grammar. */
export function parseCite(tag: string): ParsedCite {
  const m = TAG.exec(tag);
  if (!m) throw new Error(`malformed cite tag "${tag}"`);
  const sourceId = m[1]!;
  if (m[2] !== undefined) return { sourceId, kind: "p", locus: m[2] };
  if (m[3] !== undefined) return { sourceId, kind: "pp", locus: m[3] };
  return { sourceId, kind: "sv", locus: m[4]! };
}

/**
 * The surname to show on a chip. A parenthesised romanisation wins
 * ("А. Н. Афанасьев (A. N. Afanasyev)" -> "Afanasyev"); anything after a comma is dropped
 * ("Augustin Calmet, trans. Henry Christmas" -> "Calmet"); then the last word.
 */
export function surname(author: string): string {
  const paren = /\(([^)]+)\)/.exec(author);
  const name = (paren ? paren[1]! : author).split(",")[0]!.trim();
  const words = name.split(/\s+/);
  return words[words.length - 1]!;
}

/** The locus as printed: "p. 240", "pp. 254–255" (en dash), "s.v. Дрекавац". */
export function formatLocus(c: ParsedCite): string {
  if (c.kind === "p") return `p. ${c.locus}`;
  if (c.kind === "pp") return `pp. ${c.locus.replace("-", "–")}`;
  return `s.v. ${c.locus}`;
}

/** The chip text for a tag: "Máchal 1918, p. 240". */
export function chipLabel(tag: string, author: string, year: number): string {
  return `${surname(author)} ${year}, ${formatLocus(parseCite(tag))}`;
}

export interface Chip {
  tag: string;
  label: string;
  href: string | undefined;
}

/**
 * A full chip. `manifestUrl` (the archive.org item from sources/manifest.json) wins;
 * `entryUrl` (the entry's own sources[].url) is the fallback when it is undefined.
 */
export function chip(
  tag: string,
  source: { author: string; year: number; url: string | undefined },
  entryUrl?: string,
): Chip {
  return { tag, label: chipLabel(tag, source.author, source.year), href: source.url ?? entryUrl };
}
