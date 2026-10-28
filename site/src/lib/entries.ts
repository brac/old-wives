// Build-time data layer. Reads the dataset from the repo root (never a copy inside
// site/), validates every entry with the repo's own validator, and fails the build on
// any error.
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateEntry } from "../../../src/validate/validate.ts";
import { CONTENTS_ORDER } from "./contents.ts";

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

/** The fields the site reads. The full entry is kept as-is; see schema/entry.schema.json. */
export interface Entry {
  id: string;
  schema_version: string;
  names: { primary: { romanized: string; [k: string]: unknown }; [k: string]: unknown };
  family: { value: string } & Cited;
  peoples_regions: ({ people: string; region?: string } & Cited)[];
  attestation: { grade: string; rationale: ({ text: string } & Cited)[]; [k: string]: unknown };
  sources: { source_id: string; author: string; title: string; year: number; url: string }[];
  image: { file: string; thumb: string; interpretive?: boolean; [k: string]: unknown };
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
}

let sources: Map<string, SourceInfo> | undefined;

/** Every source in sources/manifest.json, by id. */
export function getSources(): Map<string, SourceInfo> {
  if (sources) return sources;
  const rows = JSON.parse(readFileSync(SOURCES_MANIFEST_PATH, "utf8")) as ManifestRow[];
  sources = new Map(
    rows.map((r) => [
      r.id,
      {
        id: r.id,
        author: r.author,
        year: r.year,
        title: r.title,
        url: r.origin?.type === "ia" && r.origin.item ? `https://archive.org/details/${r.origin.item}` : undefined,
      },
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
