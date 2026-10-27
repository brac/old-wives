// Mechanical plate prompt builder (Phase 2a).
//
// The prompt is built only from an entry's verified clauses plus fixed style tokens, so
// every word in it is either in the entry or in the constants below. Nothing here
// paraphrases, summarises or adds description.

// Style tokens are assembled from fixed fragments. Two switches (Phase 2c test grid) each
// own one part of the wording: --guides owns the construction-line fragment, --paper owns
// every mention of the paper (the medium's "on prepared paper" and the ground). A switch
// that is not passed keeps the original bake-off wording, so with neither switch the
// tokens are byte-identical to STYLE_TOKENS below and the bake-off stays reproducible.

export type Guides = "on" | "off";
export type Paper = "plain" | "prepared";
export interface StyleOpts {
  guides?: Guides;
  paper?: Paper;
}

/** Fragments shared by every style variant. */
export const STYLE_LEAD = "silverpoint study";
export const STYLE_SKETCH = "Renaissance sketch";
export const STYLE_BODY = "hatching and cross-hatching, fine line, high contrast, sharp focus, monochrome";
export const STYLE_TAIL = "study sheet";

/** Original bake-off wording, used for a switch that is not passed. */
export const LEGACY_GUIDES = "visible construction lines";
export const LEGACY_MEDIUM = "metalpoint drawing on prepared paper";
export const LEGACY_GROUND = "blank paper ground";

/** --guides on|off. */
export const GUIDES_TOKENS: Record<Guides, string> = {
  on: "proportion lines, faint construction grid and measuring marks around the figure, as on a study sheet",
  off: "no construction grid, no measuring marks",
};

/** --paper plain|prepared. The medium drops "on prepared paper" so only the ground speaks. */
export const PAPER_MEDIUM = "metalpoint drawing";
export const PAPER_TOKENS: Record<Paper, string> = {
  plain: "clean light paper ground",
  prepared: "lightly prepared paper, pale warm tint, faint paper tooth",
};

export function styleTokens(opts: StyleOpts = {}): string {
  const guides = opts.guides ? GUIDES_TOKENS[opts.guides] : LEGACY_GUIDES;
  const medium = opts.paper ? PAPER_MEDIUM : LEGACY_MEDIUM;
  const ground = opts.paper ? PAPER_TOKENS[opts.paper] : LEGACY_GROUND;
  if (guides === undefined || ground === undefined) throw new Error(`unknown style option ${JSON.stringify(opts)}`);
  return [STYLE_LEAD, medium, STYLE_SKETCH, guides, STYLE_BODY, ground, STYLE_TAIL].join(", ");
}

/** Positive style tokens, brainstorm C1, as used in the 2b bake-off (no switches). */
export const STYLE_TOKENS = styleTokens();

/** Negative tokens, brainstorm C4. */
export const NEGATIVE_TOKENS =
  "no painterly fantasy concept art, no 3D render, no digital painting, no colour, no smooth shading, no anime, no comic book inking, no photograph, no text, no watermark, no border";

/** Prefix used when an endpoint has no negative_prompt field. */
export const AVOID_PREFIX = "Avoid:";

/** At most this many clauses go into one prompt. */
export const CLAUSE_CAP = 10;

export interface Clause {
  text: string;
  cites: string[];
}

export interface RankedClause extends Clause {
  /** Distinct source authors behind the clause (from sources/manifest.json). */
  authors: number;
  /** Distinct cited pages behind the clause. */
  pages: number;
}

export interface PlatePrompt {
  prompt: string;
  negative: string;
  /** Which entry field the clauses came from. */
  field: "appearance" | "scene";
  form: string | null;
  /** Style switches as passed; null when not passed (bake-off wording). */
  guides: Guides | null;
  paper: Paper | null;
  clauses_used: RankedClause[];
  clauses_dropped: RankedClause[];
}

/** Map of source id (the part of a cite before ':') to author. */
export type AuthorIndex = Record<string, string>;

export function authorIndex(manifest: Array<{ id: string; author: string }>): AuthorIndex {
  return Object.fromEntries(manifest.map((s) => [s.id, s.author]));
}

// The only code that knows the entry shape. v1: `appearance`, `scene`, and per-variant
// `appearance`, where --form selects a variant id. The v2 schema (Phase 1d) adds
// `appearance_forms` and a per-clause `form`; extend this function, and nothing else.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function readClauses(entry: any, form?: string): { field: "appearance" | "scene"; clauses: Clause[] } {
  if (form) {
    const variant = (entry.variants ?? []).find((v: { id: string }) => v.id === form);
    if (!variant) throw new Error(`entry ${entry.id} has no variant or form "${form}"`);
    const appearance: Clause[] = variant.appearance ?? [];
    if (appearance.length === 0) throw new Error(`variant "${form}" of ${entry.id} has no appearance clauses`);
    return { field: "appearance", clauses: appearance };
  }
  const appearance: Clause[] = entry.appearance ?? [];
  if (appearance.length > 0) return { field: "appearance", clauses: appearance };
  const scene: Clause[] = entry.scene ?? [];
  if (scene.length > 0) return { field: "scene", clauses: scene };
  throw new Error(`entry ${entry.id} has neither appearance nor scene clauses`);
}

export function rankClause(clause: Clause, authors: AuthorIndex): RankedClause {
  const sourceIds = clause.cites.map((c) => c.split(":")[0]);
  const unknown = sourceIds.filter((id) => !(id in authors));
  if (unknown.length) throw new Error(`unknown source id(s) in cites: ${unknown.join(", ")}`);
  return {
    text: clause.text,
    cites: clause.cites,
    authors: new Set(sourceIds.map((id) => authors[id])).size,
    pages: new Set(clause.cites).size,
  };
}

/**
 * Keep the `cap` best-supported clauses: more distinct authors first, then more distinct
 * pages, then entry order. The kept clauses are emitted in entry order.
 */
export function capClauses(clauses: RankedClause[], cap = CLAUSE_CAP): { used: RankedClause[]; dropped: RankedClause[] } {
  const order = clauses
    .map((c, i) => ({ c, i }))
    .sort((a, b) => b.c.authors - a.c.authors || b.c.pages - a.c.pages || a.i - b.i);
  const keep = new Set(order.slice(0, cap).map((o) => o.i));
  return {
    used: clauses.filter((_, i) => keep.has(i)),
    dropped: clauses.filter((_, i) => !keep.has(i)),
  };
}

export function buildPrompt(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entry: any,
  authors: AuthorIndex,
  opts: { form?: string; negativeInline?: boolean; cap?: number } & StyleOpts = {},
): PlatePrompt {
  const { field, clauses } = readClauses(entry, opts.form);
  const { used, dropped } = capClauses(
    clauses.map((c) => rankClause(c, authors)),
    opts.cap ?? CLAUSE_CAP,
  );
  const parts = [...used.map((c) => c.text.trim()), styleTokens({ guides: opts.guides, paper: opts.paper })];
  if (opts.negativeInline) parts.push(`${AVOID_PREFIX} ${NEGATIVE_TOKENS}`);
  return {
    prompt: parts.join(" "),
    negative: opts.negativeInline ? "" : NEGATIVE_TOKENS,
    field,
    form: opts.form ?? null,
    guides: opts.guides ?? null,
    paper: opts.paper ?? null,
    clauses_used: used,
    clauses_dropped: dropped,
  };
}
