// Recomputes every pages-file sha256 against the manifest, and every raw file's
// sha256 when the raw file is present. Prints "N sources ok" or exits 1.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { loadManifest, RAW_DIR, REPO_ROOT, sha256 } from "./manifest.js";

const manifest = loadManifest();
const errors: string[] = [];
let rawChecked = 0;
for (const s of manifest) {
  const pagesPath = join(REPO_ROOT, s.pages_file);
  if (!existsSync(pagesPath)) {
    errors.push(`${s.id}: missing ${s.pages_file}`);
  } else {
    const got = sha256(readFileSync(pagesPath));
    if (got !== s.pages_sha256) errors.push(`${s.id}: ${s.pages_file} sha256 ${got} != manifest ${s.pages_sha256}`);
  }
  for (const r of s.raw) {
    const p = join(RAW_DIR, s.id, r.name);
    if (!existsSync(p)) continue;
    const buf = readFileSync(p);
    rawChecked++;
    if (buf.length !== r.bytes || sha256(buf) !== r.sha256) errors.push(`${s.id}: raw ${r.name} does not match manifest`);
  }
}
if (errors.length > 0) {
  for (const e of errors) console.error(e);
  console.error(`${errors.length} errors`);
  process.exit(1);
}
console.log(`${manifest.length} sources ok (${rawChecked} raw files checked)`);
