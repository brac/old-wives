// Builds sources/pages/<id>.jsonl from sources/raw/ and writes each pages
// file's sha256 back into the manifest. Deterministic: same raw in, same bytes out.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { scanDjvuFile } from "./djvu.js";
import {
  loadManifest,
  RAW_DIR,
  REPO_ROOT,
  saveManifest,
  sha256,
  wikisourceRawName,
  type PageRecord,
  type SourceEntry,
} from "./manifest.js";

interface PageNumbers {
  pages: { leafNum: number; pageNumber: string }[];
}

export function serializePages(records: PageRecord[]): string {
  const sorted = [...records].sort((a, b) => a.leaf - b.leaf);
  return sorted.map((r) => JSON.stringify({ leaf: r.leaf, page: r.page, text: r.text })).join("\n") + "\n";
}

/** Strip the wiki markup used in the Frombald transcription to plain text. */
export function wikitextToPlain(s: string): string {
  let t = s;
  t = t.replace(/\[\[(?:Kategorie|Category):[^\]]*\]\]/g, "");
  t = t.replace(/<br\s*\/?>/gi, "\n");
  t = t.replace(/<\/?[a-zA-Z][^>]*>/g, "");
  t = t.replace(/'''|''/g, "");
  for (let i = 0; i < 5; i++) t = t.replace(/\{\{(?:center|right|left|Center|Right|Left)\|([^{}]*)\}\}/g, "$1");
  t = t.replace(/\{\{[^{}]*\}\}/g, "");
  t = t.replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g, "$1");
  t = t.replace(/\[\[([^\]]*)\]\]/g, "$1");
  const lines = t.split(/\r?\n/).map((l) => l.replace(/[ \t]+/g, " ").trim());
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** Split Wikisource wikitext on {{Seite|N...}} markers; text before the first marker is dropped. */
export function splitWikisourcePages(wikitext: string): PageRecord[] {
  const re = /\{\{Seite\|([^|}]+)[^}]*\}\}/g;
  const marks: { page: string; start: number; end: number }[] = [];
  for (const m of wikitext.matchAll(re)) marks.push({ page: m[1]!.trim().toLowerCase(), start: m.index!, end: m.index! + m[0].length });
  return marks.map((mk, i) => ({
    leaf: i + 1,
    page: mk.page,
    text: wikitextToPlain(wikitext.slice(mk.end, i + 1 < marks.length ? marks[i + 1]!.start : undefined)),
  }));
}

async function buildIa(source: SourceEntry): Promise<PageRecord[]> {
  if (source.origin.type !== "ia") throw new Error("not ia");
  const files = source.origin.files;
  const xmlName = files.find((f) => f.endsWith("_djvu.xml"));
  const pnName = files.find((f) => f.endsWith("_page_numbers.json"));
  if (!xmlName || !pnName) throw new Error(`${source.id}: origin.files must list _djvu.xml and _page_numbers.json`);
  const dir = join(RAW_DIR, source.id);
  const leaves = await scanDjvuFile(join(dir, xmlName));
  const pn = JSON.parse(readFileSync(join(dir, pnName), "utf8")) as PageNumbers;
  const pageOf = new Map<number, string>();
  for (const p of pn.pages) if (p.pageNumber && p.pageNumber.trim() !== "") pageOf.set(p.leafNum, p.pageNumber.trim().toLowerCase());
  return leaves.map((l) => ({ leaf: l.leaf, page: pageOf.get(l.leaf) ?? null, text: l.text }));
}

function buildWikisource(source: SourceEntry): PageRecord[] {
  if (source.origin.type !== "wikisource") throw new Error("not wikisource");
  const raw = readFileSync(join(RAW_DIR, source.id, wikisourceRawName(source.origin.revision_id)), "utf8");
  return splitWikisourcePages(raw);
}

async function main(): Promise<void> {
  const manifest = loadManifest();
  mkdirSync(join(REPO_ROOT, "sources", "pages"), { recursive: true });
  for (const source of manifest) {
    const rawDir = join(RAW_DIR, source.id);
    if (!existsSync(rawDir)) throw new Error(`${source.id}: no raw files; run npm run corpus:fetch`);
    const records = source.origin.type === "ia" ? await buildIa(source) : buildWikisource(source);
    const out = serializePages(records);
    writeFileSync(join(REPO_ROOT, source.pages_file), out, "utf8");
    source.pages_sha256 = sha256(out);
    const paged = records.filter((r) => r.page !== null).length;
    console.log(`${source.id}: ${records.length} leaves, ${paged} paged, sha256 ${source.pages_sha256}`);
  }
  saveManifest(manifest);
}

if (process.argv[1] && /build\.[tj]s$/.test(process.argv[1])) await main();
