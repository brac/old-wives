// Plate finalisation (Phase 2d-i).
//
//   npm run plates:finalise [-- --no-entries]
//
// For every approved pick in plates/picks.json it copies the generated PNG to
// plates/slavic/<id>.full.png, writes a native-size web webp and a 400 px thumbnail, writes a
// slim public sidecar plates/slavic/<id>.json, fills the `image` field of
// data/entries/<id>.json (unless --no-entries), and prints a mechanical check table.
//
// The check is mechanics only: dimensions, aspect and sidecar metadata are hard failures
// (non-zero exit); the tint share is printed as information and never gates. No step here
// looks at a plate the way a judge would, and nothing spends money or reads .env.
//
// Every output is a pure function of its inputs, so a rerun leaves every file byte-identical.

import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { pathToFileURL } from "node:url";
import sharp from "sharp";
import { STYLE_TOKENS_VERSION } from "./prompt.js";

export const WEB_WIDTH = 1104;
export const WEB_HEIGHT = 1472;
export const THUMB_WIDTH = 400;
export const WEBP_QUALITY = 85;
/** Tint share: samples on this grid whose HSL chroma exceeds the threshold. Information only. */
export const TINT_GRID = 16;
export const TINT_THRESHOLD = 0.12;
export const OUT_DIR = "plates/slavic";

export interface Pick {
  id: string;
  source: string;
  approved_by: string;
  date: string;
}

export interface HumanEdit {
  type: string;
  text: string;
  by: string;
  date: string;
}

/** The fields of a generate.ts sidecar this script reads. */
export interface Sidecar {
  date: string;
  endpoint: string;
  request_id?: string;
  seed_requested?: number;
  seed_returned: number;
  size_returned?: { width: number; height: number };
  interpretive?: boolean;
  style?: string;
  prompt: string;
  negative?: string;
  human_edits?: HumanEdit[];
  cost_usd_estimate: number;
  licence: string;
}

/** The entry's `image` object, in the key order it is written. */
export interface EntryImage {
  file: string;
  thumb: string;
  prompt: string;
  negative?: string;
  model: string;
  seed: number;
  date: string;
  style_tokens_version: string;
  licence: string;
  interpretive: boolean;
  cost_usd: number;
  request_id?: string;
  human_edits: HumanEdit[];
}

const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Parses plates/picks.json: `{ "<id>": { source, approved_by, date } }`. Throws on any malformed row. */
export function parsePicks(text: string): Pick[] {
  const raw = JSON.parse(text) as unknown;
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) throw new Error("picks: expected an object keyed by entry id");
  const picks: Pick[] = [];
  for (const [id, row] of Object.entries(raw as Record<string, unknown>)) {
    if (!ID.test(id)) throw new Error(`picks: bad entry id ${JSON.stringify(id)}`);
    if (row === null || typeof row !== "object") throw new Error(`picks: ${id}: expected an object`);
    const { source, approved_by, date, ...rest } = row as Record<string, unknown>;
    if (Object.keys(rest).length > 0) throw new Error(`picks: ${id}: unknown keys ${Object.keys(rest).join(", ")}`);
    if (typeof source !== "string" || source.length === 0) throw new Error(`picks: ${id}: missing source`);
    if (typeof approved_by !== "string" || approved_by.length === 0) throw new Error(`picks: ${id}: missing approved_by`);
    if (typeof date !== "string" || !DATE.test(date)) throw new Error(`picks: ${id}: date must be YYYY-MM-DD`);
    picks.push({ id, source, approved_by, date });
  }
  if (picks.length === 0) throw new Error("picks: no rows");
  return picks;
}

/** The seed a pick directory names, from its `-s<n>` suffix (e.g. `a2-s21` -> 21). */
export function seedFromDir(dir: string): number {
  const m = /-s(\d+)$/.exec(basename(dir.replace(/[\\/]+$/, "")));
  if (!m) throw new Error(`${dir}: directory name does not end in -s<seed>`);
  return Number(m[1]);
}

export interface PickFiles {
  png: string;
  sidecarPath: string;
  sidecar: Sidecar;
  seed: number;
}

/** Locates the one PNG and one sidecar in a pick directory and checks the seed. Throws loudly. */
export function readPick(root: string, pick: Pick): PickFiles {
  const dir = resolve(root, pick.source);
  if (!existsSync(dir)) throw new Error(`${pick.id}: source directory ${pick.source} is missing`);
  const names = readdirSync(dir).sort();
  const pngs = names.filter((n) => n.endsWith(".full.png"));
  const jsons = names.filter((n) => n.endsWith(".json"));
  if (pngs.length !== 1) throw new Error(`${pick.id}: expected one *.full.png in ${pick.source}, found ${pngs.length}`);
  if (jsons.length !== 1) throw new Error(`${pick.id}: expected one sidecar *.json in ${pick.source}, found ${jsons.length}`);
  const sidecarPath = join(dir, jsons[0]);
  const sidecar = JSON.parse(readFileSync(sidecarPath, "utf8")) as Sidecar;
  const seed = seedFromDir(pick.source);
  if (sidecar.seed_returned !== seed) {
    throw new Error(`${pick.id}: sidecar seed_returned ${String(sidecar.seed_returned)} does not match directory seed ${seed}`);
  }
  for (const key of ["prompt", "endpoint", "date", "licence"] as const) {
    if (typeof sidecar[key] !== "string" || sidecar[key].length === 0) throw new Error(`${pick.id}: sidecar has no ${key}`);
  }
  if (typeof sidecar.cost_usd_estimate !== "number") throw new Error(`${pick.id}: sidecar has no cost_usd_estimate`);
  return { png: join(dir, pngs[0]), sidecarPath, sidecar, seed };
}

/** Builds an entry's `image` object from a sidecar. Paths are repo-relative with forward slashes. */
export function buildImage(id: string, sidecar: Sidecar): EntryImage {
  // Optional keys, placed in a stable order.
  return {
    file: `${OUT_DIR}/${id}.web.webp`,
    thumb: `${OUT_DIR}/${id}.thumb.webp`,
    prompt: sidecar.prompt,
    ...(sidecar.negative !== undefined ? { negative: sidecar.negative } : {}),
    model: sidecar.endpoint,
    seed: sidecar.seed_returned,
    // The sidecar's own date (an ISO timestamp in UTC), cut to YYYY-MM-DD.
    date: sidecar.date.slice(0, 10),
    style_tokens_version: STYLE_TOKENS_VERSION,
    licence: sidecar.licence,
    interpretive: sidecar.interpretive === true,
    cost_usd: sidecar.cost_usd_estimate,
    ...(sidecar.request_id !== undefined ? { request_id: sidecar.request_id } : {}),
    human_edits: (sidecar.human_edits ?? []).map(({ type, text, by, date }) => ({ type, text, by, date })),
  };
}

/** The slim public sidecar: the `image` fields plus provenance. Built from named fields only. */
export function buildPublicSidecar(pick: Pick, sidecar: Sidecar): Record<string, unknown> {
  return {
    id: pick.id,
    source: pick.source,
    approved_by: pick.approved_by,
    approved_date: pick.date,
    ...buildImage(pick.id, sidecar),
    endpoint: sidecar.endpoint,
    request_id: sidecar.request_id ?? null,
    negative: sidecar.negative ?? null,
    size: sidecar.size_returned ?? null,
  };
}

/** Hard sidecar checks. Returns the failures; empty means pass. */
export function sidecarFailures(sidecar: Sidecar): string[] {
  const out: string[] = [];
  if (sidecar.interpretive !== true) out.push("interpretive is not true");
  if (sidecar.style !== "a") out.push(`style is ${JSON.stringify(sidecar.style)}, not "a"`);
  if (!(sidecar.human_edits ?? []).some((e) => e.type === "visual-tradition")) out.push("no visual-tradition human edit");
  return out;
}

/** Share of samples on a TINT_GRID grid whose HSL S x (2 x min(L, 1-L)) exceeds TINT_THRESHOLD, in percent. */
export async function tintShare(png: string): Promise<number> {
  const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  let total = 0;
  let tinted = 0;
  for (let y = 0; y < info.height; y += TINT_GRID) {
    for (let x = 0; x < info.width; x += TINT_GRID) {
      const i = (y * info.width + x) * ch;
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const l = (max + min) / 2;
      const d = max - min;
      const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
      total++;
      if (s * 2 * Math.min(l, 1 - l) > TINT_THRESHOLD) tinted++;
    }
  }
  return (100 * tinted) / total;
}

/** Writes a file only when its bytes differ, so a rerun touches nothing. */
function writeIfChanged(path: string, bytes: Buffer | string): void {
  const buf = typeof bytes === "string" ? Buffer.from(bytes, "utf8") : bytes;
  if (existsSync(path) && readFileSync(path).equals(buf)) return;
  writeFileSync(path, buf);
}

/** Replaces an entry's `image` value and nothing else, keeping its key order and trailing-newline state. */
export function withImage(entryText: string, image: EntryImage): string {
  const obj = JSON.parse(entryText) as Record<string, unknown>;
  if (!("image" in obj)) throw new Error("entry has no image key");
  obj.image = image;
  const trailing = entryText.endsWith("\n") ? "\n" : "";
  return JSON.stringify(obj, null, 2) + trailing;
}

export interface CheckRow {
  id: string;
  seed: number;
  web: string;
  thumb: string;
  tint: number;
  webKb: number;
  thumbKb: number;
  failures: string[];
}

export interface FinaliseOptions {
  root: string;
  picksPath?: string;
  outDir?: string;
  entriesDir?: string;
  writeEntries?: boolean;
}

/** Runs the whole finalisation. Hard failures are collected per row; a missing file or seed mismatch throws. */
export async function finalise(opts: FinaliseOptions): Promise<CheckRow[]> {
  const root = opts.root;
  const picks = parsePicks(readFileSync(resolve(root, opts.picksPath ?? "plates/picks.json"), "utf8"));
  const outDir = resolve(root, opts.outDir ?? OUT_DIR);
  const entriesDir = resolve(root, opts.entriesDir ?? "data/entries");
  // Read and check every pick before writing anything, so a bad pick leaves no partial output.
  const files = picks.map((p) => readPick(root, p));
  mkdirSync(outDir, { recursive: true });
  const rows: CheckRow[] = [];
  for (const [i, pick] of picks.entries()) {
    const { png, sidecar, seed } = files[i];
    const fullOut = join(outDir, `${pick.id}.full.png`);
    writeIfChanged(fullOut, readFileSync(png));

    const web = await sharp(png).webp({ quality: WEBP_QUALITY }).toBuffer();
    const thumb = await sharp(png).resize({ width: THUMB_WIDTH }).webp({ quality: WEBP_QUALITY }).toBuffer();
    writeIfChanged(join(outDir, `${pick.id}.web.webp`), web);
    writeIfChanged(join(outDir, `${pick.id}.thumb.webp`), thumb);
    writeIfChanged(join(outDir, `${pick.id}.json`), JSON.stringify(buildPublicSidecar(pick, sidecar), null, 2) + "\n");

    const failures = sidecarFailures(sidecar);
    const wm = await sharp(web).metadata();
    const tm = await sharp(thumb).metadata();
    if (wm.width !== WEB_WIDTH || wm.height !== WEB_HEIGHT) failures.push(`web is ${wm.width}x${wm.height}, not ${WEB_WIDTH}x${WEB_HEIGHT}`);
    if (tm.width !== THUMB_WIDTH) failures.push(`thumb is ${tm.width} wide, not ${THUMB_WIDTH}`);
    const expectedThumbH = (THUMB_WIDTH * 4) / 3;
    if (tm.height === undefined || Math.abs(tm.height - expectedThumbH) > 1) failures.push(`thumb height ${tm.height} is not 3:4 within 1 px`);

    if (opts.writeEntries !== false) {
      const entryPath = join(entriesDir, `${pick.id}.json`);
      if (!existsSync(entryPath)) throw new Error(`${pick.id}: entry ${entryPath} is missing`);
      writeIfChanged(entryPath, withImage(readFileSync(entryPath, "utf8"), buildImage(pick.id, sidecar)));
    }

    rows.push({
      id: pick.id,
      seed,
      web: `${wm.width}x${wm.height}`,
      thumb: `${tm.width}x${tm.height}`,
      tint: await tintShare(png),
      webKb: web.length / 1024,
      thumbKb: thumb.length / 1024,
      failures,
    });
  }
  return rows;
}

export function formatTable(rows: CheckRow[]): string {
  const lines = [
    "| entry | seed | web | thumb | tint % (info) | web kB | thumb kB | hard check |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
  ];
  for (const r of rows) {
    lines.push(
      `| ${r.id} | ${r.seed} | ${r.web} | ${r.thumb} | ${r.tint.toFixed(1)} | ${r.webKb.toFixed(1)} | ${r.thumbKb.toFixed(1)} | ${r.failures.length === 0 ? "pass" : "FAIL: " + r.failures.join("; ")} |`,
    );
  }
  const webTotal = rows.reduce((a, r) => a + r.webKb, 0);
  const thumbTotal = rows.reduce((a, r) => a + r.thumbKb, 0);
  lines.push("", `total: web ${webTotal.toFixed(1)} kB, thumb ${thumbTotal.toFixed(1)} kB, ${rows.length} rows`);
  return lines.join("\n");
}

async function main(argv: string[]): Promise<number> {
  const { values } = parseArgs({ args: argv, options: { "no-entries": { type: "boolean", default: false } } });
  const rows = await finalise({ root: process.cwd(), writeEntries: !values["no-entries"] });
  console.log(formatTable(rows));
  const failed = rows.filter((r) => r.failures.length > 0);
  if (failed.length > 0) {
    console.error(`${failed.length} plate(s) failed the hard check`);
    return 1;
  }
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (err: unknown) => {
      console.error((err as Error).message);
      process.exit(1);
    },
  );
}
