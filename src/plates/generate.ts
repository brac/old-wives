// Plate generation CLI (Phase 2a).
//
//   npm run plates -- --arm <id> --entry <path> [--form <id>] [--refs <a,b,...>]
//                     --out <dir> --seed <n> [--guides on|off] [--paper plain|prepared] [--dry-run]
//
// A live run needs FAL_KEY, loaded with `tsx --env-file=.env`; the key is never printed.
// --dry-run prints the prompt and the estimate, reads no key and spends nothing.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { pathToFileURL } from "node:url";
import { buildInput, estimateUsd, getArm, type Arm } from "./arms.js";
import { GUIDES_TOKENS, PAPER_TOKENS, authorIndex, buildPrompt, type Guides, type Paper, type PlatePrompt } from "./prompt.js";

/** Pilot spend cap in USD (plan phase-2, "Spend"). */
export const SPEND_CAP_USD = 25;
export const LEDGER_PATH = "plates/spend.json";

export interface LedgerRow {
  date: string;
  arm: string;
  endpoint: string;
  entry: string;
  seed: number;
  estimate_usd: number;
  status: "submitted" | "done" | "failed";
  request_id?: string;
  file?: string;
}

export interface Ledger {
  note: string;
  total_usd: number;
  rows: LedgerRow[];
}

export function emptyLedger(): Ledger {
  return {
    note: "Running ledger of fal spend. total_usd sums estimate_usd of every submitted row, including failed ones, because a failed request may still bill.",
    total_usd: 0,
    rows: [],
  };
}

/** Throws unless the running total plus this job's estimate stays within the cap. */
export function checkSpend(ledger: Ledger, estimate: number, cap = SPEND_CAP_USD): void {
  if (!(estimate > 0)) throw new Error(`refusing: estimate ${estimate} is not a positive cost`);
  const after = Math.round((ledger.total_usd + estimate) * 10_000) / 10_000;
  if (after > cap) {
    throw new Error(`refusing: ledger $${ledger.total_usd} + estimate $${estimate} = $${after} would pass the $${cap} cap`);
  }
}

export function readLedger(path = LEDGER_PATH): Ledger {
  return existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as Ledger) : emptyLedger();
}

function writeLedger(ledger: Ledger, path = LEDGER_PATH): void {
  ledger.total_usd = Math.round(ledger.rows.reduce((s, r) => s + r.estimate_usd, 0) * 10_000) / 10_000;
  writeFileSync(path, JSON.stringify(ledger, null, 2) + "\n");
}

export function plateName(entryId: string, arm: Arm, seed: number, form?: string): string {
  return [entryId, form, arm.id, `s${seed}`].filter(Boolean).join("-");
}

export interface Job {
  arm: Arm;
  entryPath: string;
  entryId: string;
  form?: string;
  refs: string[];
  out: string;
  seed: number;
  built: PlatePrompt;
  estimate: number;
  name: string;
}

export function planJob(argv: string[]): { job: Job; dryRun: boolean } {
  const { values } = parseArgs({
    args: argv,
    options: {
      arm: { type: "string" },
      entry: { type: "string" },
      form: { type: "string" },
      refs: { type: "string" },
      out: { type: "string" },
      seed: { type: "string" },
      guides: { type: "string" },
      paper: { type: "string" },
      "dry-run": { type: "boolean", default: false },
    },
  });
  for (const k of ["arm", "entry", "out", "seed"] as const) {
    if (!values[k]) throw new Error(`missing --${k}`);
  }
  const seed = Number(values.seed);
  if (!Number.isSafeInteger(seed) || seed < 0) throw new Error(`--seed must be a non-negative integer, got ${values.seed}`);
  if (values.guides !== undefined && !Object.hasOwn(GUIDES_TOKENS, values.guides)) {
    throw new Error(`--guides must be on or off, got ${values.guides}`);
  }
  if (values.paper !== undefined && !Object.hasOwn(PAPER_TOKENS, values.paper)) {
    throw new Error(`--paper must be plain or prepared, got ${values.paper}`);
  }
  const arm = getArm(values.arm!);
  const refs = values.refs ? values.refs.split(",").map((s) => s.trim()).filter(Boolean) : [];
  if (arm.takesRefs && refs.length === 0) throw new Error(`arm ${arm.id} needs --refs`);
  if (!arm.takesRefs && refs.length > 0) throw new Error(`arm ${arm.id} takes no reference images`);
  for (const r of refs) if (!existsSync(r)) throw new Error(`reference not found: ${r}`);

  const entry = JSON.parse(readFileSync(values.entry!, "utf8"));
  const authors = authorIndex(JSON.parse(readFileSync("sources/manifest.json", "utf8")));
  const built = buildPrompt(entry, authors, {
    form: values.form,
    negativeInline: !arm.hasNegativePrompt,
    guides: values.guides as Guides | undefined,
    paper: values.paper as Paper | undefined,
  });
  const job: Job = {
    arm,
    entryPath: values.entry!,
    entryId: entry.id,
    form: values.form,
    refs,
    out: values.out!,
    seed,
    built,
    estimate: estimateUsd(arm, refs.length),
    name: plateName(entry.id, arm, seed, values.form),
  };
  return { job, dryRun: values["dry-run"]! };
}

function printJob(job: Job, ledger: Ledger): void {
  const b = job.built;
  console.log(`arm:       ${job.arm.id} (${job.arm.endpoint}), ${job.arm.width}x${job.arm.height}, seed ${job.seed}`);
  console.log(`entry:     ${job.entryId} [${b.field}${job.form ? `, form ${job.form}` : ""}]`);
  if (b.guides || b.paper) console.log(`style:     guides ${b.guides ?? "(default)"}, paper ${b.paper ?? "(default)"}`);
  console.log(`clauses:   ${b.clauses_used.length} used, ${b.clauses_dropped.length} dropped`);
  if (job.refs.length) console.log(`refs:      ${job.refs.join(", ")}`);
  console.log(`prompt:    ${b.prompt}`);
  console.log(`negative:  ${b.negative || "(inline as Avoid:)"}`);
  console.log(`estimate:  $${job.estimate} (ledger $${ledger.total_usd}, cap $${SPEND_CAP_USD})`);
}

async function runLive(job: Job, ledger: Ledger): Promise<void> {
  if (!process.env.FAL_KEY) throw new Error("FAL_KEY is not set; run with tsx --env-file=.env");
  checkSpend(ledger, job.estimate);
  const { fal } = await import("@fal-ai/client");

  const imageUrls: string[] = [];
  for (const r of job.refs) {
    const file = new File([readFileSync(r)], basename(r), { type: r.endsWith(".png") ? "image/png" : "image/jpeg" });
    imageUrls.push(await fal.storage.upload(file));
  }
  const input = buildInput(job.arm, { prompt: job.built.prompt, negative: job.built.negative, seed: job.seed, imageUrls });

  // Record the job before submitting, so a crash after billing still counts against the cap.
  const date = new Date().toISOString();
  const row: LedgerRow = { date, arm: job.arm.id, endpoint: job.arm.endpoint, entry: job.entryId, seed: job.seed, estimate_usd: job.estimate, status: "submitted" };
  ledger.rows.push(row);
  writeLedger(ledger);

  try {
    const result = await fal.subscribe(job.arm.endpoint, { input, logs: false });
    row.request_id = result.requestId;
    const data = result.data as { images?: Array<{ url: string; width?: number; height?: number }>; seed?: number };
    const image = data.images?.[0];
    if (!image) throw new Error(`no image in response (request ${result.requestId})`);
    const res = await fetch(image.url);
    if (!res.ok) throw new Error(`download failed: HTTP ${res.status}`);
    mkdirSync(job.out, { recursive: true });
    const png = join(job.out, `${job.name}.full.png`);
    writeFileSync(png, Buffer.from(await res.arrayBuffer()));
    const sidecar = {
      name: job.name,
      date,
      arm: job.arm.id,
      endpoint: job.arm.endpoint,
      request_id: result.requestId,
      seed_requested: job.seed,
      seed_returned: data.seed ?? null,
      size_requested: { width: job.arm.width, height: job.arm.height },
      size_returned: { width: image.width ?? null, height: image.height ?? null },
      entry: job.entryPath,
      field: job.built.field,
      form: job.built.form,
      guides: job.built.guides,
      paper: job.built.paper,
      prompt: job.built.prompt,
      negative: job.built.negative,
      clauses_used: job.built.clauses_used,
      clauses_dropped: job.built.clauses_dropped,
      refs: job.refs.map((r, i) => ({ file: r, uploaded_url: imageUrls[i] })),
      input,
      cost_usd_estimate: job.estimate,
      price_source: job.arm.priceSource,
      licence: job.arm.licence,
    };
    writeFileSync(join(job.out, `${job.name}.json`), JSON.stringify(sidecar, null, 2) + "\n");
    row.status = "done";
    row.file = png;
    console.log(`wrote ${png} (request ${result.requestId})`);
  } catch (err) {
    row.status = "failed";
    throw err;
  } finally {
    writeLedger(ledger);
  }
}

export async function main(argv: string[]): Promise<void> {
  const { job, dryRun } = planJob(argv);
  const ledger = readLedger();
  printJob(job, ledger);
  if (dryRun) {
    checkSpend(ledger, job.estimate);
    console.log("dry run: nothing submitted, nothing spent");
    return;
  }
  await runLive(job, ledger);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
