// Mechanical plate prompt builder (Phase 2a, v2 entries in 2d).
//
// The prompt is built only from an entry's verified clauses plus fixed style tokens and,
// for a scene plate, one fixed presence token, so every word in it is either in the entry
// or in the constants below. Nothing here paraphrases, summarises or adds description.

// Style tokens are assembled from fixed fragments. Two switches (Phase 2c test grid) each
// own one part of the wording: --guides owns the construction-line fragment, --paper owns
// the ground. Ben locked guides off and plain paper after the grid (2026-10-27), so those
// are the defaults. The bake-off and grid wording is no longer reproduced by default:
// their sidecars record the full prompts they were sent.

export type Guides = "on" | "off";
export type Paper = "plain" | "prepared";
export interface StyleOpts {
  guides?: Guides;
  paper?: Paper;
}

export const DEFAULT_GUIDES: Guides = "off";
export const DEFAULT_PAPER: Paper = "plain";

/**
 * Fragments shared by every style variant. "study sheet" was removed in 2d: together with
 * "Renaissance sketch" it pulled in Leonardo-style handwritten annotations.
 */
export const STYLE_LEAD = "silverpoint study";
export const STYLE_MEDIUM = "metalpoint drawing";
export const STYLE_SKETCH = "Renaissance sketch";
export const STYLE_BODY = "hatching and cross-hatching, fine line, high contrast, sharp focus, monochrome";

/** --guides on|off. */
export const GUIDES_TOKENS: Record<Guides, string> = {
  on: "proportion lines, faint construction grid and measuring marks around the figure",
  off: "no construction grid, no measuring marks",
};

/** --paper plain|prepared. */
export const PAPER_TOKENS: Record<Paper, string> = {
  plain: "clean light paper ground",
  prepared: "lightly prepared paper, pale warm tint, faint paper tooth",
};

export function styleTokens(opts: StyleOpts = {}): string {
  const guides = GUIDES_TOKENS[opts.guides ?? DEFAULT_GUIDES];
  const ground = PAPER_TOKENS[opts.paper ?? DEFAULT_PAPER];
  if (guides === undefined || ground === undefined) throw new Error(`unknown style option ${JSON.stringify(opts)}`);
  return [STYLE_LEAD, STYLE_MEDIUM, STYLE_SKETCH, guides, STYLE_BODY, ground].join(", ");
}

/** Positive style tokens with the default switches. */
export const STYLE_TOKENS = styleTokens();

/** Negative tokens: brainstorm C4, plus the 2d no-script negatives. */
export const NEGATIVE_TOKENS =
  "no painterly fantasy concept art, no 3D render, no digital painting, no colour, no smooth shading, no anime, no comic book inking, no photograph, no text, no watermark, no border, " +
  "no handwriting, no inscriptions, no annotations, no script, no lettering, no captions";

/**
 * Scene plates (unseen-rule amendment, 2026-10-27): one fixed, creature-neutral presence
 * token. A plate that carries it is interpretive.
 */
export const PRESENCE_TOKEN = "the creature itself only suggested as a dim, indistinct presence within the scene.";

/** Prefix used when an endpoint has no negative_prompt field. */
export const AVOID_PREFIX = "Avoid:";

/** At most this many clauses go into one prompt. */
export const CLAUSE_CAP = 10;

export interface Clause {
  text: string;
  cites: string[];
  form?: string;
}

export interface RankedClause extends Clause {
  /** Distinct source authors behind the clause (from sources/manifest.json). */
  authors: number;
  /** Distinct cited pages behind the clause. */
  pages: number;
}

/** One human edit, from plates/overrides.json. */
export interface HumanEdit {
  text: string;
  reason: string;
  by: string;
  date: string;
}

/** plates/overrides.json: creature id -> edits. */
export type Overrides = Record<string, { drop: HumanEdit[] }>;

export interface PlatePrompt {
  /** The prompt sent to the model: the clauses after sanitising, plus the tokens. */
  prompt: string;
  /** The same prompt built from the raw clause text, before sanitising. */
  prompt_raw: string;
  negative: string;
  /** Which entry field the main clauses came from. */
  field: "appearance" | "scene";
  form: string | null;
  variant: string | null;
  /** True when the presence token was added (scene plate with an invented presence). */
  interpretive: boolean;
  /** The behaviour clause added to a scene plate, else null (it is also in clauses_used). */
  behaviour_clause: string | null;
  guides: Guides;
  paper: Paper;
  clauses_used: RankedClause[];
  clauses_dropped: RankedClause[];
  /** Clauses a human removed from this prompt before the cap. */
  human_edits: HumanEdit[];
}

/** Map of source id (the part of a cite before ':') to author. */
export type AuthorIndex = Record<string, string>;

export function authorIndex(manifest: Array<{ id: string; author: string }>): AuthorIndex {
  return Object.fromEntries(manifest.map((s) => [s.id, s.author]));
}

export interface SelectOpts {
  /** v2: a form id from appearance_forms. v1: a variant id (legacy meaning). */
  form?: string;
  variant?: string;
  scenePresence?: boolean;
}

export interface Selection {
  field: "appearance" | "scene";
  clauses: Clause[];
  /** Behaviour candidates, set only for a scene plate with a presence. */
  behaviour?: Clause[];
}

// The only code that knows the entry shape.
// v1 (schema_version 1): `appearance`, `scene`, per-variant `appearance`; --form selects a
//   variant id. Kept so the bake-off copies still build.
// v2: `appearance_forms` plus a per-clause `form`. --form takes the clauses with no form
//   plus that form's; --variant takes a variant's appearance. An entry with formed clauses
//   must be given a form, so forms are never mixed into one composite figure.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function readClauses(entry: any, opts: SelectOpts = {}): Selection {
  const v2 = entry.schema_version === 2;
  if (opts.form && opts.variant) throw new Error(`pass --form or --variant, not both`);
  if (opts.scenePresence && (opts.form || opts.variant)) {
    throw new Error(`--scene-presence takes the scene clauses; it cannot be combined with --form or --variant`);
  }
  const variantId = opts.variant ?? (v2 ? undefined : opts.form);
  if (variantId) {
    const ids = (entry.variants ?? []).map((v: { id: string }) => v.id);
    const variant = (entry.variants ?? []).find((v: { id: string }) => v.id === variantId);
    if (!variant) throw new Error(`entry ${entry.id} has no variant or form "${variantId}" (variants: ${ids.join(", ") || "none"})`);
    const appearance: Clause[] = variant.appearance ?? [];
    if (appearance.length === 0) throw new Error(`variant "${variantId}" of ${entry.id} has no appearance clauses`);
    return { field: "appearance", clauses: appearance };
  }
  const appearance: Clause[] = entry.appearance ?? [];
  const scene: Clause[] = entry.scene ?? [];
  if (opts.scenePresence || (v2 && appearance.length === 0)) {
    if (scene.length === 0) throw new Error(`entry ${entry.id} has no scene clauses for a scene plate`);
    return { field: "scene", clauses: scene, behaviour: entry.behavior_habitat ?? [] };
  }
  if (v2) {
    const formIds: string[] = (entry.appearance_forms ?? []).map((f: { id: string }) => f.id);
    if (opts.form) {
      if (!formIds.includes(opts.form)) {
        throw new Error(`entry ${entry.id} has no form "${opts.form}" (forms: ${formIds.join(", ") || "none"})`);
      }
      return { field: "appearance", clauses: appearance.filter((c) => !c.form || c.form === opts.form) };
    }
    if (appearance.some((c) => c.form)) {
      throw new Error(`entry ${entry.id} has appearance forms; pass --form <id> (forms: ${formIds.join(", ")})`);
    }
    return { field: "appearance", clauses: appearance };
  }
  if (appearance.length > 0) return { field: "appearance", clauses: appearance };
  if (scene.length > 0) return { field: "scene", clauses: scene };
  throw new Error(`entry ${entry.id} has neither appearance nor scene clauses`);
}

/** Every clause text anywhere in the entry (any object with text and cites). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function allClauseTexts(node: any, out = new Set<string>()): Set<string> {
  if (Array.isArray(node)) for (const n of node) allClauseTexts(n, out);
  else if (node && typeof node === "object") {
    if (typeof node.text === "string" && Array.isArray(node.cites)) out.add(node.text.trim());
    for (const v of Object.values(node)) allClauseTexts(v, out);
  }
  return out;
}

/**
 * Check every human edit for this entry against the entry text; one that matches no clause
 * anywhere in the entry is an error, never a silent no-op.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function editsFor(entry: any, overrides: Overrides | undefined): HumanEdit[] {
  const edits = overrides?.[entry.id]?.drop ?? [];
  const texts = allClauseTexts(entry);
  for (const e of edits) {
    if (!e || typeof e.text !== "string" || !e.reason || !e.by || !e.date) {
      throw new Error(`override for ${entry.id} needs text, reason, by and date: ${JSON.stringify(e)}`);
    }
    if (!texts.has(e.text.trim())) throw new Error(`override for ${entry.id} matches no clause in the entry: "${e.text}"`);
  }
  return edits;
}

function applyEdits(clauses: Clause[], edits: HumanEdit[], applied: HumanEdit[]): Clause[] {
  return clauses.filter((c) => {
    const hit = edits.find((e) => e.text.trim() === c.text.trim());
    if (hit && !applied.includes(hit)) applied.push(hit);
    return !hit;
  });
}

export function rankClause(clause: Clause, authors: AuthorIndex): RankedClause {
  const sourceIds = clause.cites.map((c) => c.split(":")[0]);
  const unknown = sourceIds.filter((id) => !(id in authors));
  if (unknown.length) throw new Error(`unknown source id(s) in cites: ${unknown.join(", ")}`);
  return {
    ...clause,
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

// --- Prompt sanitiser (2d-b) -------------------------------------------------------------
// Qwen-Image letters quoted words and proper names into the plate. The sanitiser is applied
// only to the clause text sent to the model; the entry is never changed, and the sidecar
// keeps both the raw and the sent prompt.

/** Every name form of the creature: primary romanised and native, every variant's forms. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function nameForms(entry: any): string[] {
  const n = entry?.names ?? {};
  // The brief calls the native field `form`; the entries store it as `text`. Accept both.
  const native = (list: unknown): string[] =>
    Array.isArray(list) ? list.map((x: { text?: string; form?: string }) => x?.text ?? x?.form ?? "").filter(Boolean) : [];
  const out = [
    n.primary?.romanized,
    ...native(n.primary?.native),
    ...(Array.isArray(n.variants) ? n.variants : []).flatMap((v: { romanized?: string; native?: unknown }) => [v?.romanized, ...native(v?.native)]),
  ].filter((s): s is string => typeof s === "string" && s.trim().length > 0);
  // Longest first, so "Zmei Goruinuich" is replaced before "Goruinuich".
  return [...new Set(out.map((s) => s.trim()))].sort((a, b) => b.length - a.length);
}

/** The neutral noun that stands in for the creature's names, chosen from `family`. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function neutralNoun(entry: any): string {
  const family = typeof entry?.family === "string" ? entry.family : entry?.family?.value;
  return family === "monster" && entry?.id === "zmey-gorynych" ? "the serpent" : "the creature";
}

/** Quotation marks of every kind. ' and ’ count only when not between two letters. */
const QUOTES = /["“”„‟«»‹›‚]|(?<![\p{L}\p{N}])['‘’]|['‘’](?![\p{L}\p{N}])/gu;

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const L = "[\\p{L}\\p{N}]";

/** Phrases that only introduce a name, removed with the name so no stub is left. */
const NAME_INTRO = [
  "(?:who|which|that)\\s+(?:\\p{L}+\\s+){0,2}?(?:bears|bore|has|is\\s+called|is\\s+known\\s+as|is\\s+named|goes\\s+by)\\s+(?:the\\s+)?(?:patronymic|name|title|epithet|surname)?\\s*(?:of\\s+)?",
  "(?:often\\s+|also\\s+|sometimes\\s+|usually\\s+|commonly\\s+)?(?:known\\s+as|called|named|styled)\\s+",
];

export function removeQuotes(text: string): string {
  return text.replace(QUOTES, "");
}

export function removeParentheticals(text: string): string {
  let out = text;
  for (let prev = ""; prev !== out; ) {
    prev = out;
    out = out.replace(/\s*[([][^()[\]]*[)\]]/g, "");
  }
  return out;
}

export function replaceNames(text: string, names: string[], noun: string): string {
  let out = text;
  for (const name of names) {
    const nm = `(?<!${L})${escapeRe(name)}(?!${L})`;
    for (const intro of NAME_INTRO) {
      // ", who sometimes bears the patronymic X," and "known as X": drop the whole phrase.
      out = out.replace(new RegExp(`,\\s*${intro}${nm}\\s*,`, "giu"), "");
      out = out.replace(new RegExp(`\\s*,?\\s*${intro}${nm}`, "giu"), "");
    }
    // An article right before the name is absorbed into the noun phrase.
    out = out.replace(new RegExp(`(?<!${L})(?:(the|a|an)\\s+)?${nm}`, "giu"), (_m, article: string | undefined, offset: number, whole: string) => {
      const before = whole.slice(0, offset);
      const lead = article ?? "";
      const capital = lead ? lead[0] === lead[0].toUpperCase() : /(^|[.!?]\s+)$/.test(before);
      return capital ? noun[0].toUpperCase() + noun.slice(1) : noun;
    });
  }
  return out;
}

function tidy(text: string): string {
  return text
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/([,;:])(?=[.!?])/g, "")
    .replace(/,(\s*,)+/g, ",")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** The text sent for one clause: no quotes, no parentheticals, no name of the creature. */
export function sanitiseClause(text: string, names: string[], noun: string): string {
  return tidy(replaceNames(removeParentheticals(removeQuotes(text)), names, noun));
}

export function buildPrompt(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entry: any,
  authors: AuthorIndex,
  opts: SelectOpts & { negativeInline?: boolean; cap?: number; overrides?: Overrides } & StyleOpts = {},
): PlatePrompt {
  const sel = readClauses(entry, opts);
  const edits = editsFor(entry, opts.overrides);
  const applied: HumanEdit[] = [];
  const cap = opts.cap ?? CLAUSE_CAP;
  const main = applyEdits(sel.clauses, edits, applied).map((c) => rankClause(c, authors));

  let used: RankedClause[];
  let dropped: RankedClause[];
  let behaviour: RankedClause | null = null;
  if (sel.behaviour) {
    // Scene plate with a presence: one clause slot goes to the best-supported behaviour clause.
    ({ used, dropped } = capClauses(main, cap - 1));
    const candidates = applyEdits(sel.behaviour, edits, applied).map((c) => rankClause(c, authors));
    behaviour = capClauses(candidates, 1).used[0] ?? null;
    if (behaviour) used = [...used, behaviour];
  } else {
    ({ used, dropped } = capClauses(main, cap));
  }

  const guides = opts.guides ?? DEFAULT_GUIDES;
  const paper = opts.paper ?? DEFAULT_PAPER;
  const names = nameForms(entry);
  const noun = neutralNoun(entry);
  const tail: string[] = [];
  if (sel.behaviour) tail.push(PRESENCE_TOKEN);
  tail.push(styleTokens({ guides, paper }));
  if (opts.negativeInline) tail.push(`${AVOID_PREFIX} ${NEGATIVE_TOKENS}`);
  const raw = used.map((c) => c.text.trim());
  const sent = raw.map((t) => sanitiseClause(t, names, noun)).filter(Boolean);
  return {
    prompt: [...sent, ...tail].join(" "),
    prompt_raw: [...raw, ...tail].join(" "),
    negative: opts.negativeInline ? "" : NEGATIVE_TOKENS,
    field: sel.field,
    form: opts.form ?? null,
    variant: opts.variant ?? null,
    interpretive: Boolean(sel.behaviour),
    behaviour_clause: behaviour ? behaviour.text : null,
    guides,
    paper,
    clauses_used: used,
    clauses_dropped: dropped,
    human_edits: applied,
  };
}
