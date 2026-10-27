// npm run cite -- <tag>: prints source, page and text; exit 1 with the reason on failure.
import { resolve } from "./resolve.js";

const tag = process.argv[2];
if (!tag) {
  console.error("usage: npm run cite -- <tag>");
  process.exit(1);
}
const r = resolve(tag);
if (!r.ok) {
  console.error(`${tag}: ${r.reason}`);
  process.exit(1);
}
console.log(`source: ${r.source.id} (${r.source.author}, ${r.source.title}, ${r.source.year})`);
if (r.via === "override") console.log("resolved via: headword override table");
for (const p of r.pages) {
  console.log(`--- page ${p.page ?? "(unnumbered)"} (leaf ${p.leaf})`);
  console.log(p.text);
}
