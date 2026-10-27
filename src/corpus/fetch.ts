// Downloads the raw corpus files into sources/raw/<id>/ and records their
// sha256 and size in sources/manifest.json. Idempotent: a file whose sha256
// already matches the manifest is skipped. Node built-ins only.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  loadManifest,
  RAW_DIR,
  saveManifest,
  sha256,
  wikisourceRawName,
  wikisourceRawUrl,
  type SourceEntry,
} from "./manifest.js";

const USER_AGENT = "beasts-corpus/0.1 (+https://github.com/brac/beasts)";
const MAX_CONCURRENT = 2;
const MAX_ATTEMPTS = 6;

interface Job {
  source: SourceEntry;
  name: string;
  url: string;
  /** sha1 published by IA metadata, when known, to check the download. */
  sha1?: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function get(url: string): Promise<Buffer> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": USER_AGENT }, redirect: "follow" });
      if (res.status === 429 || res.status >= 500) {
        lastErr = new Error(`HTTP ${res.status} for ${url}`);
      } else if (!res.ok) {
        throw Object.assign(new Error(`HTTP ${res.status} for ${url}`), { fatal: true });
      } else {
        return Buffer.from(await res.arrayBuffer());
      }
    } catch (err) {
      if ((err as { fatal?: boolean }).fatal) throw err;
      lastErr = err;
    }
    const wait = Math.min(60_000, 1000 * 2 ** attempt);
    console.error(`retry ${attempt}/${MAX_ATTEMPTS} in ${wait} ms: ${String(lastErr)}`);
    await sleep(wait);
  }
  throw lastErr;
}

function iaFileUrl(item: string, name: string): string {
  return `https://archive.org/download/${encodeURIComponent(item)}/${encodeURIComponent(name)}`;
}

async function iaSha1s(item: string): Promise<Map<string, string>> {
  const buf = await get(`https://archive.org/metadata/${encodeURIComponent(item)}`);
  const meta = JSON.parse(buf.toString("utf8")) as { files?: { name: string; sha1?: string }[] };
  const map = new Map<string, string>();
  for (const f of meta.files ?? []) if (f.sha1) map.set(f.name, f.sha1);
  return map;
}

function alreadyHave(job: Job): boolean {
  const path = join(RAW_DIR, job.source.id, job.name);
  if (!existsSync(path)) return false;
  const rec = job.source.raw.find((r) => r.name === job.name);
  return rec !== undefined && sha256(readFileSync(path)) === rec.sha256;
}

async function runJob(job: Job): Promise<void> {
  const dir = join(RAW_DIR, job.source.id);
  const path = join(dir, job.name);
  if (alreadyHave(job)) {
    console.log(`skip  ${job.source.id}/${job.name}`);
    return;
  }
  mkdirSync(dir, { recursive: true });
  const data = await get(job.url);
  if (job.sha1) {
    const got = createHash("sha1").update(data).digest("hex");
    if (got !== job.sha1) throw new Error(`sha1 mismatch for ${job.source.id}/${job.name}: ${got} != ${job.sha1}`);
  }
  writeFileSync(path + ".part", data);
  renameSync(path + ".part", path);
  const rec = { name: job.name, sha256: sha256(data), bytes: data.length };
  const i = job.source.raw.findIndex((r) => r.name === job.name);
  if (i >= 0) job.source.raw[i] = rec;
  else job.source.raw.push(rec);
  job.source.raw.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  console.log(`fetch ${job.source.id}/${job.name} ${data.length} bytes`);
}

async function main(): Promise<void> {
  const manifest = loadManifest();
  const only = process.argv.slice(2);
  const jobs: Job[] = [];
  for (const source of manifest) {
    if (only.length > 0 && !only.includes(source.id)) continue;
    if (source.origin.type === "ia") {
      const { item, files } = source.origin;
      const needed = files.filter((name) => !alreadyHave({ source, name, url: "" }));
      const sha1s = needed.length > 0 ? await iaSha1s(item) : new Map<string, string>();
      for (const name of files) jobs.push({ source, name, url: iaFileUrl(item, name), sha1: sha1s.get(name) });
    } else {
      const { page, revision_id } = source.origin;
      jobs.push({ source, name: wikisourceRawName(revision_id), url: wikisourceRawUrl(page, revision_id) });
    }
  }

  let next = 0;
  const failures: string[] = [];
  async function worker(): Promise<void> {
    while (next < jobs.length) {
      const job = jobs[next++]!;
      try {
        await runJob(job);
        saveManifest(manifest);
      } catch (err) {
        failures.push(`${job.source.id}/${job.name}: ${String(err)}`);
      }
    }
  }
  await Promise.all(Array.from({ length: MAX_CONCURRENT }, worker));
  saveManifest(manifest);
  if (failures.length > 0) {
    for (const f of failures) console.error(`FAIL ${f}`);
    process.exit(1);
  }
  console.log(`${jobs.length} files ok`);
}

await main();
