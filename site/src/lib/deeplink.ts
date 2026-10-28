// Page-level deep links for cite chips (plan phase-3, 3c stretch). Pure: no file reads,
// so the mapping is unit-testable. entries.ts feeds it the corpus pages at build time.
//
// The archive.org viewer opens `https://archive.org/details/<item>/page/<label>` at the
// first leaf whose page label (from the item's _page_numbers.json) equals <label>. A
// corpus pages file built with the default label source ("ia") carries those same
// labels, so a label that occurs exactly once in the pages file names exactly one leaf:
// the leaf whose text the cite tag was checked against. Anything else (a header-derived
// label source, a repeated label, a headword tag, a non-archive.org source) gets no deep
// link, and the chip keeps the item link.

import type { ParsedCite } from "./cite.ts";

/** How a source's chips may link. */
export type DeepLinkMode =
  /** Page labels are IA's own; link by label when the label is unique in the corpus. */
  | "ia-label"
  /** No exact page mapping is known; keep the item link. */
  | "item";

/** The fields of a corpus page record the mapping needs. */
export interface PageLabelRow {
  leaf: number;
  page: string | null;
}

/** The facts about one source that decide its mode. */
export interface SourceFacts {
  /** The archive.org item id, when the source is on archive.org. */
  iaItem: string | undefined;
  locator: "page" | "headword";
  /** The manifest's page_label_source; absent means "ia". */
  pageLabelSource: "ia" | "header" | undefined;
}

/**
 * The mode for a source. Only archive.org page sources whose labels came from IA's own
 * page numbers can deep-link: the viewer resolves /page/<label> against those labels.
 */
export function deepLinkMode(s: SourceFacts): DeepLinkMode {
  if (!s.iaItem) return "item";
  if (s.locator !== "page") return "item";
  if ((s.pageLabelSource ?? "ia") !== "ia") return "item";
  return "ia-label";
}

/**
 * The page-viewer URL for one parsed cite, or undefined to keep the item link.
 * `p.` links its page; `pp.` links the first page of the range; `s.v.` never links
 * (no headword leaf is mapped to a viewer index exactly). The label must occur exactly
 * once in `pages`, or the viewer could open a different leaf with the same label.
 */
export function deepLink(
  item: string | undefined,
  mode: DeepLinkMode,
  cite: ParsedCite,
  pages: readonly PageLabelRow[],
): string | undefined {
  if (!item || mode !== "ia-label") return undefined;
  if (cite.kind === "sv") return undefined;
  const label = cite.kind === "p" ? cite.locus : cite.locus.split("-")[0]!;
  const hits = pages.filter((r) => r.page === label);
  if (hits.length !== 1) return undefined;
  return `https://archive.org/details/${encodeURIComponent(item)}/page/${encodeURIComponent(label)}`;
}
