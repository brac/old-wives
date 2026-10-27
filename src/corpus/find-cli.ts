// npm run find -- <term> [--source <id>] [--limit N]
// Prints "tag  snippet" lines, matching over normalised text.
// Leaves without a printed page, and leaves of headword-cited dictionaries,
// print a locator "<id>@leaf<n>" instead of a tag: open the leaf and cite the
// dictionary entry by s.v.<headword>.
import { diskCorpus } from "./resolve.js";
import { normalize } from "./normalize.js";
import type { PageRecord, SourceEntry } from "./manifest.js";

export interface Hit {
  tag: string;
  snippet: string;
}

export function locatorFor(source: SourceEntry, rec: PageRecord): string {
  if (source.locator === "page" && rec.page !== null) return `${source.id}:p.${rec.page}`;
  return `${source.id}@leaf${rec.leaf}`;
}

export function findIn(sources: SourceEntry[], pages: (id: string) => PageRecord[], term: string, limit: number): Hit[] {
  const needle = normalize(term);
  const hits: Hit[] = [];
  if (needle.length === 0) return hits;
  for (const s of sources) {
    for (const rec of pages(s.id)) {
      const n = normalize(rec.text);
      const at = n.indexOf(needle);
      if (at < 0) continue;
      const from = Math.max(0, at - 50);
      const snippet = (from > 0 ? "…" : "") + n.slice(from, at + needle.length + 50) + (at + needle.length + 50 < n.length ? "…" : "");
      hits.push({ tag: locatorFor(s, rec), snippet });
      if (hits.length >= limit) return hits;
    }
  }
  return hits;
}

function main(): void {
  const args = process.argv.slice(2);
  let source: string | undefined;
  let limit = 50;
  const terms: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    if (a === "--source") source = args[++i];
    else if (a === "--limit") limit = Number(args[++i]);
    else terms.push(a);
  }
  if (terms.length === 0 || !Number.isInteger(limit) || limit < 1) {
    console.error("usage: npm run find -- <term> [--source <id>] [--limit N]");
    process.exit(1);
  }
  const corpus = diskCorpus();
  const sources = source ? corpus.sources.filter((s) => s.id === source) : corpus.sources;
  if (source && sources.length === 0) {
    console.error(`unknown source: ${source}`);
    process.exit(1);
  }
  const hits = findIn(sources, (id) => corpus.pages(id), terms.join(" "), limit);
  for (const h of hits) console.log(`${h.tag}  ${h.snippet}`);
  console.error(`${hits.length} hits`);
}

if (process.argv[1] && /find-cli\.[tj]s$/.test(process.argv[1])) main();
