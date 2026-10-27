import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export type Origin =
  | { type: "ia"; item: string; files: string[] }
  | { type: "wikisource"; page: string; revision_id: number };

export interface RawFile {
  name: string;
  sha256: string;
  bytes: number;
}

export interface SourceEntry {
  id: string;
  author: string;
  title: string;
  year: number;
  edition: string;
  language: string;
  kind: "folklore" | "literary" | "record";
  public_domain: true;
  pd_reason: string;
  locator: "page" | "headword";
  /**
   * Where page labels come from. "ia" (the default) takes IA's _page_numbers.json as is;
   * "header" takes the number printed in each leaf's running header (see audit.ts).
   */
  page_label_source?: "ia" | "header";
  origin: Origin;
  raw: RawFile[];
  pages_file: string;
  pages_sha256: string;
  notes: string;
}

export interface PageRecord {
  leaf: number;
  page: string | null;
  text: string;
  /** Set only when page_label_source is "header" and no header number was found on the leaf. */
  page_inferred?: true;
}

/** Repository root, resolved from this file's location (src/corpus/). */
export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const MANIFEST_PATH = join(REPO_ROOT, "sources", "manifest.json");
export const RAW_DIR = join(REPO_ROOT, "sources", "raw");
export const HEADWORDS_DIR = join(REPO_ROOT, "sources", "headwords");

export function loadManifest(path: string = MANIFEST_PATH): SourceEntry[] {
  return JSON.parse(readFileSync(path, "utf8")) as SourceEntry[];
}

export function saveManifest(entries: SourceEntry[], path: string = MANIFEST_PATH): void {
  writeFileSync(path, JSON.stringify(entries, null, 2) + "\n", "utf8");
}

export function sha256(data: Buffer | string): string {
  return createHash("sha256").update(data).digest("hex");
}

/** Wikisource raw wikitext URL pinned to a revision. */
export function wikisourceRawUrl(page: string, revisionId: number): string {
  const title = decodeURIComponent(page.replace(/^.*\/wiki\//, ""));
  const host = new URL(page).host;
  return `https://${host}/w/index.php?title=${encodeURIComponent(title)}&oldid=${revisionId}&action=raw`;
}

export function wikisourceRawName(revisionId: number): string {
  return `wikitext-${revisionId}.wiki`;
}

/** Parse a pages JSONL file's contents. */
export function parsePages(jsonl: string): PageRecord[] {
  return jsonl
    .split("\n")
    .filter((l) => l.length > 0)
    .map((l) => JSON.parse(l) as PageRecord);
}
