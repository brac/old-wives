// Build-time data layer. Reads the dataset from the repo root (never a copy inside
// site/), validates every entry with the repo's own validator, and fails the build on
// any error.
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateEntry } from "../../../src/validate/validate.ts";
import { CONTENTS_ORDER } from "./contents.ts";
import { chip, parseCite, type Chip } from "./cite.ts";
import { deepLink, deepLinkMode, type DeepLinkMode, type PageLabelRow } from "./deeplink.ts";
import { parsePages } from "../../../src/corpus/manifest.ts";

export { CONTENTS_ORDER };

/** The repo root (the parent of site/). */
export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
export const ENTRIES_DIR = join(REPO_ROOT, "data", "entries");
export const SCHEMA_PATH = join(REPO_ROOT, "schema", "entry.schema.json");
export const PLATES_DIR = join(REPO_ROOT, "plates", "slavic");
export const SOURCES_MANIFEST_PATH = join(REPO_ROOT, "sources", "manifest.json");

export interface Cited {
  cites: string[];
}

export interface Clause extends Cited {
  text: string;
}

export interface AppearanceClause extends Clause {
  /** The id of an appearance_forms row; absent means the clause describes every form. */
  form?: string;
}

export interface NativeName extends Cited {
  script: string;
  text: string;
  people: string;
}

export type Grade = "widely-attested" | "regional" | "literary" | "disputed";

/** The fields the site reads, typed from schema/entry.schema.json. */
export interface Entry {
  id: string;
  schema_version: string | number;
  names: {
    primary: { romanized: string; native: NativeName[] };
    variants: ({ romanized: string; native?: NativeName[]; peoples: string[] } & Cited)[];
    meaning: Clause[];
  };
  peoples_regions: ({ people: string; region?: string } & Cited)[];
  family: { value: string } & Cited;
  appearance_forms: { id: string; label: string }[];
  appearance: AppearanceClause[];
  scene: Clause[];
  variants: {
    id: string;
    label: string;
    peoples: string[];
    appearance: Clause[];
    behavior_habitat: Clause[];
    notes?: string;
  }[];
  behavior_habitat: Clause[];
  dealing_with_it: Clause[];
  origin: Clause[];
  related: { id: string; relation: "often-confused" | "related" | "class-of" | "instance-of" }[];
  attestation: { grade: Grade; rationale: Clause[]; [k: string]: unknown };
  sources: { source_id: string; author: string; title: string; year: number; url: string; [k: string]: unknown }[];
  image: { file: string; thumb: string; interpretive?: boolean; [k: string]: unknown };
  notes: ({ kind: "accretion" | "disputed" | "scope" | "empty-field" | "other"; text: string } & Partial<Cited>)[];
  [k: string]: unknown;
}

export interface LoadedEntry {
  entry: Entry;
  /** The file's text exactly as on disk, for the verbatim JSON API. */
  raw: string;
}

export interface SourceInfo {
  id: string;
  author: string;
  year: number;
  title: string;
  /** archive.org item page, or undefined for a source that is not an archive.org item. */
  url: string | undefined;
  /** The archive.org item id, or undefined. */
  iaItem: string | undefined;
  /** Whether chips for this source may deep-link to a page (see deeplink.ts). */
  deepLinkMode: DeepLinkMode;
  /** The corpus pages file, relative to the repo root. */
  pagesFile: string;
}

/**
 * The publication gate (plan phase-4, 4b/4e): an entry is published when its plate is
 * approved, meaning `plates:finalise` has filled its `image` field with the web and thumb
 * paths. A verified entry whose `image` is still null stays in data/entries/ and the site
 * skips it: not in the contents, no spread, not in /data/slavic/.
 */
export function isPublished(entry: unknown): boolean {
  if (typeof entry !== "object" || entry === null) return false;
  const image = (entry as { image?: unknown }).image;
  if (typeof image !== "object" || image === null) return false;
  const { file, thumb } = image as { file?: unknown; thumb?: unknown };
  return typeof file === "string" && file.length > 0 && typeof thumb === "string" && thumb.length > 0;
}

/**
 * The contents-order errors for a set of entries on disk: a published entry missing from
 * CONTENTS_ORDER, an id in CONTENTS_ORDER with no file, and an id in CONTENTS_ORDER whose
 * plate is not approved. An unpublished entry missing from CONTENTS_ORDER is not an error.
 */
export function contentsErrors(published: Iterable<string>, unpublished: Iterable<string>, order: readonly string[]): string[] {
  const errors: string[] = [];
  const pub = new Set(published);
  const unpub = new Set(unpublished);
  const inOrder = new Set(order);
  for (const id of pub) if (!inOrder.has(id)) errors.push(`${id}: on disk but missing from CONTENTS_ORDER`);
  for (const id of order) {
    if (unpub.has(id)) errors.push(`${id}: in CONTENTS_ORDER but its plate is not approved (image is empty)`);
    else if (!pub.has(id)) errors.push(`${id}: in CONTENTS_ORDER but not in data/entries/`);
  }
  return errors;
}

interface Loaded {
  /** Published entries, by id. */
  published: Map<string, LoadedEntry>;
  /** Verified entries on disk whose plate is not approved yet, by id. */
  unpublished: Map<string, LoadedEntry>;
}

let cache: Loaded | undefined;

/** Load and validate every data/entries/*.json. Throws (failing the build) on any error. */
function load(): Loaded {
  if (cache) return cache;
  const files = readdirSync(ENTRIES_DIR).filter((f) => f.endsWith(".json")).sort();
  const errors: string[] = [];
  const published = new Map<string, LoadedEntry>();
  const unpublished = new Map<string, LoadedEntry>();
  for (const file of files) {
    const basename = file.slice(0, -".json".length);
    const raw = readFileSync(join(ENTRIES_DIR, file), "utf8");
    let obj: unknown;
    try {
      obj = JSON.parse(raw);
    } catch (err) {
      errors.push(`${file}: invalid JSON: ${(err as Error).message}`);
      continue;
    }
    for (const issue of validateEntry(obj, { stage: "verified", basename })) {
      if (issue.severity === "error") errors.push(`${file} ${issue.path} [${issue.rule}] ${issue.message}`);
    }
    (isPublished(obj) ? published : unpublished).set(basename, { entry: obj as Entry, raw });
  }
  errors.push(...contentsErrors(published.keys(), unpublished.keys(), CONTENTS_ORDER));
  if (errors.length > 0) {
    throw new Error(`entry validation failed (${errors.length} error(s)):\n  ${errors.join("\n  ")}`);
  }
  cache = { published, unpublished };
  return cache;
}

/** Every published entry, in contents order. */
export function getEntries(): Entry[] {
  const { published } = load();
  return CONTENTS_ORDER.map((id) => published.get(id)!.entry);
}

/** Every published entry id, in contents order. */
export function getEntryIds(): string[] {
  load();
  return [...CONTENTS_ORDER];
}

/** The ids of verified entries on disk that are not published yet (no approved plate), sorted. */
export function getUnpublishedIds(): string[] {
  return [...load().unpublished.keys()].sort();
}

/** One published entry by id. Throws on an unknown or unpublished id. */
export function getEntry(id: string): Entry {
  return getLoaded(id).entry;
}

/** One published entry with its verbatim file text. Throws on an unknown or unpublished id. */
export function getLoaded(id: string): LoadedEntry {
  const { published, unpublished } = load();
  const hit = published.get(id);
  if (!hit) throw new Error(unpublished.has(id) ? `entry "${id}" is not published (no approved plate)` : `unknown entry id "${id}"`);
  return hit;
}

/**
 * How a spread shows one `related` id: a link when the id is a published entry, otherwise
 * plain text (an unpublished or not-yet-verified id). The site never emits a dead internal link.
 */
export function relatedTarget(id: string): { label: string; href?: string } {
  const { published } = load();
  const hit = published.get(id);
  return hit ? { label: primaryName(hit.entry), href: `/creatures/${id}/` } : { label: id };
}

/** The previous and next entries in contents order, wrapping at both ends. */
export function getNeighbours(id: string): { prev: Entry; next: Entry } {
  const entries = getEntries();
  const i = entries.findIndex((e) => e.id === id);
  if (i < 0) throw new Error(`unknown entry id "${id}"`);
  const n = entries.length;
  return { prev: entries[(i - 1 + n) % n]!, next: entries[(i + 1) % n]! };
}

/**
 * The display form of the primary name: `names.primary.romanized` with each word's first
 * letter capitalised ("leshy" -> "Leshy"; "Baba Yaga" unchanged). Derived, never stored.
 */
export function primaryName(entry: Entry): string {
  return entry.names.primary.romanized.replace(/(^|[\s-])(\p{Ll})/gu, (_, sep: string, c: string) => sep + c.toUpperCase());
}

/** The site path of an image field ("plates/slavic/x.web.webp" -> "/plates/slavic/x.web.webp"). */
export function imagePath(file: string): string {
  return "/" + file.replace(/^\/+/, "");
}

interface ManifestRow {
  id: string;
  author: string;
  year: number;
  title: string;
  origin?: { type: string; item?: string };
  locator: "page" | "headword";
  page_label_source?: "ia" | "header";
  pages_file: string;
}

let sources: Map<string, SourceInfo> | undefined;

/** Every source in sources/manifest.json, by id. */
export function getSources(): Map<string, SourceInfo> {
  if (sources) return sources;
  const rows = JSON.parse(readFileSync(SOURCES_MANIFEST_PATH, "utf8")) as ManifestRow[];
  sources = new Map(
    rows.map((r) => [
      r.id,
      ((iaItem) => ({
        id: r.id,
        author: r.author,
        year: r.year,
        title: r.title,
        url: iaItem ? `https://archive.org/details/${iaItem}` : undefined,
        iaItem,
        deepLinkMode: deepLinkMode({ iaItem, locator: r.locator, pageLabelSource: r.page_label_source }),
        pagesFile: r.pages_file,
      }))(r.origin?.type === "ia" && r.origin.item ? r.origin.item : undefined),
    ]),
  );
  return sources;
}

/** One source by id (the part of a cite tag before the colon). Throws on an unknown id. */
export function getSource(id: string): SourceInfo {
  const hit = getSources().get(id);
  if (!hit) throw new Error(`unknown source id "${id}"`);
  return hit;
}

/** The verbatim text of schema/entry.schema.json. */
export function schemaText(): string {
  return readFileSync(SCHEMA_PATH, "utf8");
}

/** One row of /data/slavic/index.json. */
export interface IndexRow {
  id: string;
  primary_name: string;
  family: string;
  peoples: string[];
  attestation_grade: string;
  thumb: string;
}

/** The rows of /data/slavic/index.json, in contents order. */
export function indexRows(): IndexRow[] {
  return getEntries().map((e) => ({
    id: e.id,
    primary_name: primaryName(e),
    family: e.family.value,
    peoples: [...new Set(e.peoples_regions.map((p) => p.people))],
    attestation_grade: e.attestation.grade,
    thumb: imagePath(e.image.thumb),
  }));
}

/**
 * The chip for one cite tag on one entry: the source's archive.org item from the
 * manifest, falling back to the entry's own sources[].url when the manifest has none.
 */
export function entryChip(entry: Entry, tag: string): Chip {
  const parsed = parseCite(tag);
  const own = entry.sources.find((s) => s.source_id === parsed.sourceId);
  const source = getSource(parsed.sourceId);
  const page = deepLink(source.iaItem, source.deepLinkMode, parsed, pageLabels(source));
  return chip(tag, { ...source, url: page ?? source.url }, own?.url);
}

const labelCache = new Map<string, PageLabelRow[]>();

/** The leaf and page label of every page in a source's corpus pages file (cached). */
function pageLabels(source: SourceInfo): PageLabelRow[] {
  if (source.deepLinkMode === "item") return [];
  let rows = labelCache.get(source.id);
  if (!rows) {
    rows = parsePages(readFileSync(join(REPO_ROOT, source.pagesFile), "utf8")).map((r) => ({ leaf: r.leaf, page: r.page, iaPage: r.ia_page }));
    labelCache.set(source.id, rows);
  }
  return rows;
}
