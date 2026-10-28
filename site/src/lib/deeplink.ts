// Page-level deep links for cite chips (plan phase-3, 3c stretch). Pure: no file reads,
// so the mapping is unit-testable. entries.ts feeds it the corpus pages at build time.
//
// The archive.org viewer opens `https://archive.org/details/<item>/page/<label>` at the
// first leaf whose page label (from the item's _page_numbers.json) equals <label>. A
// corpus pages file built with the default label source ("ia") carries those same
// labels, so a label that occurs exactly once in the pages file names exactly one leaf:
// the leaf whose text the cite tag was checked against. A pages file built with the
// "header" label source keeps IA's own label in `ia_page` wherever the printed header
// differs (phase 4a), so a header label that names exactly one leaf is linked by that
// leaf's IA label, provided the IA label is itself unique. Anything else (a repeated
// label on either side, a headword tag, a non-archive.org source) gets no deep link, and
// the chip keeps the item link.

import type { ParsedCite } from "./cite.ts";

/** How a source's chips may link. */
export type DeepLinkMode =
  /** Page labels are IA's own; link by label when the label is unique in the corpus. */
  | "ia-label"
  /** Labels come from printed headers; link by the cited leaf's IA label when both are unique. */
  | "header-ia-label"
  /** No exact page mapping is known; keep the item link. */
  | "item";

/** The fields of a corpus page record the mapping needs. */
export interface PageLabelRow {
  leaf: number;
  page: string | null;
  /** IA's own label, present only when a header-labelled pages file differs from it. */
  iaPage?: string | null;
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
  return (s.pageLabelSource ?? "ia") === "ia" ? "ia-label" : "header-ia-label";
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
  if (!item || mode === "item") return undefined;
  if (cite.kind === "sv") return undefined;
  const label = cite.kind === "p" ? cite.locus : cite.locus.split("-")[0]!;
  const hits = pages.filter((r) => r.page === label);
  if (hits.length !== 1) return undefined;
  const iaLabel = (r: PageLabelRow) => (mode === "header-ia-label" && r.iaPage !== undefined ? r.iaPage : r.page);
  const target = iaLabel(hits[0]!);
  if (target === null) return undefined;
  // The viewer opens the first leaf with this IA label, so it must name only the cited leaf.
  if (pages.filter((r) => iaLabel(r) === target).length !== 1) return undefined;
  return `https://archive.org/details/${encodeURIComponent(item)}/page/${encodeURIComponent(target)}`;
}
