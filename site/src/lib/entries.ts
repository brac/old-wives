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

let cache: Map<string, LoadedEntry> | undefined;

/** Load and validate every data/entries/*.json. Throws (failing the build) on any error. */
function load(): Map<string, LoadedEntry> {
  if (cache) return cache;
  const files = readdirSync(ENTRIES_DIR).filter((f) => f.endsWith(".json")).sort();
  const errors: string[] = [];
  const byId = new Map<string, LoadedEntry>();
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
    byId.set(basename, { entry: obj as Entry, raw });
  }
  const order = new Set<string>(CONTENTS_ORDER);
  for (const id of byId.keys()) if (!order.has(id)) errors.push(`${id}: on disk but missing from CONTENTS_ORDER`);
  for (const id of order) if (!byId.has(id)) errors.push(`${id}: in CONTENTS_ORDER but not in data/entries/`);
  if (errors.length > 0) {
    throw new Error(`entry validation failed (${errors.length} error(s)):\n  ${errors.join("\n  ")}`);
  }
  cache = byId;
  return byId;
}

/** Every entry, in contents order. */
export function getEntries(): Entry[] {
  const byId = load();
  return CONTENTS_ORDER.map((id) => byId.get(id)!.entry);
}

/** Every entry id, in contents order. */
export function getEntryIds(): string[] {
  load();
  return [...CONTENTS_ORDER];
}

/** One entry by id. Throws on an unknown id. */
export function getEntry(id: string): Entry {
  return getLoaded(id).entry;
}

/** One entry with its verbatim file text. Throws on an unknown id. */
export function getLoaded(id: string): LoadedEntry {
  const hit = load().get(id);
  if (!hit) throw new Error(`unknown entry id "${id}"`);
  return hit;
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
