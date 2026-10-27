// Resolves a citation tag to the corpus text it points at.
// Grammar: <sourceId>:p.<page> | <sourceId>:pp.<first>-<last> | <sourceId>:s.v.<headword>
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { HEADWORDS_DIR, loadManifest, parsePages, REPO_ROOT, type PageRecord, type SourceEntry } from "./manifest.js";
import { normalize } from "./normalize.js";

export interface HeadwordOverride {
  headword: string;
  leaf: number;
  ocr_spelling: string;
}

export type ParsedTag =
  | { source: string; kind: "p"; page: string }
  | { source: string; kind: "pp"; first: string; last: string }
  | { source: string; kind: "sv"; headword: string };

export type ResolveResult =
  | { ok: true; source: SourceEntry; pages: PageRecord[]; via?: "match" | "override" }
  | { ok: false; reason: string };

export interface Corpus {
  sources: SourceEntry[];
  pages(id: string): PageRecord[];
  headwords(id: string): HeadwordOverride[];
}

const TAG_RE = /^([a-z0-9]+):(?:p\.([0-9ivxlcdm]+)|pp\.([0-9ivxlcdm]+)-([0-9ivxlcdm]+)|s\.v\.(.+))$/;

export function parseTag(tag: string): ParsedTag | null {
  const m = TAG_RE.exec(tag);
  if (!m) return null;
  const source = m[1]!;
  if (m[2] !== undefined) return { source, kind: "p", page: m[2] };
  if (m[3] !== undefined) return { source, kind: "pp", first: m[3], last: m[4]! };
  return { source, kind: "sv", headword: m[5]! };
}

/** True when normalised `line` starts with normalised `head` followed by a non-letter or the end. */
function startsWithHeadword(line: string, head: string): boolean {
  const n = normalize(line);
  if (!n.startsWith(head)) return false;
  const next = n.slice(head.length, head.length + 2);
  return next.length === 0 || !/^\p{L}/u.test(next);
}

export function createResolver(corpus: Corpus): (tag: string) => ResolveResult {
  return (tag: string): ResolveResult => {
    const parsed = parseTag(tag);
    if (!parsed) return { ok: false, reason: `bad tag grammar: ${tag}` };
    const source = corpus.sources.find((s) => s.id === parsed.source);
    if (!source) return { ok: false, reason: `unknown source: ${parsed.source}` };
    // Headword sources have unreliable IA page numbers (Karadžić 1818 counts columns), so pages never anchor them.
    if (parsed.kind !== "sv" && source.locator === "headword") {
      return { ok: false, reason: `${source.id} is a headword source; cite it as s.v.<headword>, not by page` };
    }
    const pages = corpus.pages(source.id);

    if (parsed.kind === "p") {
      const hits = pages.filter((r) => r.page === parsed.page);
      return hits.length > 0 ? { ok: true, source, pages: hits } : { ok: false, reason: "page not found" };
    }

    if (parsed.kind === "pp") {
      const firstIdx = pages.findIndex((r) => r.page === parsed.first);
      let lastIdx = -1;
      for (let i = pages.length - 1; i >= 0; i--) if (pages[i]!.page === parsed.last) { lastIdx = i; break; }
      if (firstIdx < 0 || lastIdx < 0) return { ok: false, reason: "page not found" };
      if (lastIdx < firstIdx) return { ok: false, reason: "range ends before it starts" };
      return { ok: true, source, pages: pages.slice(firstIdx, lastIdx + 1) };
    }

    if (source.locator !== "headword") return { ok: false, reason: `s.v. is only for headword sources; ${source.id} is cited by page` };
    const head = normalize(parsed.headword);
    if (head.length === 0) return { ok: false, reason: "empty headword" };
    for (const r of pages) {
      if (r.text.split("\n").some((line) => startsWithHeadword(line, head))) return { ok: true, source, pages: [r], via: "match" };
    }
    const override = corpus.headwords(source.id).find((h) => normalize(h.headword) === head);
    if (override) {
      const r = pages.find((p) => p.leaf === override.leaf);
      if (r) return { ok: true, source, pages: [r], via: "override" };
      return { ok: false, reason: `override leaf ${override.leaf} not in corpus` };
    }
    return { ok: false, reason: "headword not found" };
  };
}

/** The real corpus on disk, with pages files loaded lazily and cached. */
export function diskCorpus(): Corpus {
  const sources = loadManifest();
  const pageCache = new Map<string, PageRecord[]>();
  const hwCache = new Map<string, HeadwordOverride[]>();
  return {
    sources,
    pages(id) {
      let p = pageCache.get(id);
      if (!p) {
        const s = sources.find((x) => x.id === id);
        p = s ? parsePages(readFileSync(join(REPO_ROOT, s.pages_file), "utf8")) : [];
        pageCache.set(id, p);
      }
      return p;
    },
    headwords(id) {
      let h = hwCache.get(id);
      if (!h) {
        const path = join(HEADWORDS_DIR, `${id}.json`);
        h = existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as HeadwordOverride[]) : [];
        hwCache.set(id, h);
      }
      return h;
    },
  };
}

let defaultResolver: ((tag: string) => ResolveResult) | null = null;

export function resolve(tag: string): ResolveResult {
  defaultResolver ??= createResolver(diskCorpus());
  return defaultResolver(tag);
}
