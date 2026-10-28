// Storage for the review desk (plan phase-4, 4c "Storage").
//
// The desk writes exactly three files, all under plates/: overrides.json, picks.json and
// the desk's own queue file. Every write goes through writeDeskJson, which refuses any
// other path. Everything else the desk touches is read-only.

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { isAbsolute, join, normalize, relative, resolve, sep } from "node:path";

export const OVERRIDES_FILE = "plates/overrides.json";
export const PICKS_FILE = "plates/picks.json";
export const QUEUE_FILE = "plates/desk-queue.json";
export const SPEND_FILE = "plates/spend.json";
export const ENTRIES_DIR = "data/entries";

/** The only files the desk may write, relative to the repo root. */
export const WRITE_ALLOW_LIST: readonly string[] = Object.freeze([OVERRIDES_FILE, PICKS_FILE, QUEUE_FILE]);

/** Image folders the desk may serve to its own page (read-only). refs never leave the machine. */
const SERVE_ROOT = /^plates\/(iter\d+|cand|grid|refs|desk)\//;
const SERVE_EXT = /\.(png|jpe?g|webp)$/i;

function relPosix(root: string, p: string): string {
  return relative(resolve(root), resolve(root, p)).split(sep).join("/");
}

/** True when `p` (relative to root, or absolute) is exactly one of the three desk files. */
export function isWriteAllowed(root: string, p: string): boolean {
  if (typeof p !== "string" || p.includes("\0")) return false;
  const rel = relPosix(root, p);
  if (rel.startsWith("..") || isAbsolute(rel)) return false;
  return WRITE_ALLOW_LIST.includes(rel);
}

export function writeDeskJson(root: string, p: string, data: unknown): void {
  if (!isWriteAllowed(root, p)) throw new Error(`desk refuses to write ${p}: not in the allow-list`);
  writeFileSync(resolve(root, p), JSON.stringify(data, null, 2) + "\n");
}

/** Resolves an image path the desk may serve, or null. */
export function servablePath(root: string, p: string): string | null {
  if (typeof p !== "string" || p.includes("\0") || p.includes("..")) return null;
  const rel = normalize(p).split(sep).join("/").replace(/^\.\//, "");
  if (!SERVE_ROOT.test(rel) || !SERVE_EXT.test(rel)) return null;
  const abs = resolve(root, rel);
  if (relPosix(root, abs) !== rel) return null;
  return existsSync(abs) ? abs : null;
}

export function readJson<T>(root: string, p: string, fallback: T): T {
  const abs = resolve(root, p);
  return existsSync(abs) ? (JSON.parse(readFileSync(abs, "utf8")) as T) : fallback;
}

// ---- formats ------------------------------------------------------------------------

/** A visual-tradition human edit made at the desk: the approved text and the raw note. */
export interface DeskHumanEdit {
  type: "visual-tradition";
  text: string;
  note: string;
  by: string;
  date: string;
}

export interface CreatureOverride {
  drop?: Array<{ text: string; reason: string; by: string; date: string }>;
  visual?: { text: string; negative_extra?: string; basis: string; by: string; date: string; note?: string };
  human_edits?: DeskHumanEdit[];
}
export type Overrides = Record<string, CreatureOverride>;
export type Picks = Record<string, { source: string; approved_by: string; date: string }>;

export type JobStatus = "queued" | "running" | "done" | "failed";
export interface QueueJob {
  id: string;
  creature: string;
  text: string;
  seed: number;
  dry_run: boolean;
  status: JobStatus;
  queued: string;
  log: string[];
}
export interface LlmCall {
  date: string;
  creature: string;
  endpoint: string;
  model: string;
  cost_usd: number;
  note: string;
  ok: boolean;
}
export interface Queue {
  note: string;
  jobs: QueueJob[];
  flags: Array<{ creature: string; text: string; date: string }>;
  skips: Array<{ creature: string; date: string }>;
  llm_calls: LlmCall[];
}

export function emptyQueue(): Queue {
  return {
    note: "Review desk queue (plan phase-4, 4c): redraw jobs, skips, flags and the note-to-edit model calls with their cost.",
    jobs: [],
    flags: [],
    skips: [],
    llm_calls: [],
  };
}

export const readOverrides = (root: string) => readJson<Overrides>(root, OVERRIDES_FILE, {});
export const readPicks = (root: string) => readJson<Picks>(root, PICKS_FILE, {});
export const readQueue = (root: string) => ({ ...emptyQueue(), ...readJson<Partial<Queue>>(root, QUEUE_FILE, {}) });

/** Running fal spend per creature, from the plate ledger. */
export function spendByCreature(root: string): Record<string, number> {
  const ledger = readJson<{ rows: Array<{ entry: string; estimate_usd: number }> }>(root, SPEND_FILE, { rows: [] });
  const out: Record<string, number> = {};
  for (const r of ledger.rows) out[r.entry] = Math.round(((out[r.entry] ?? 0) + r.estimate_usd) * 10_000) / 10_000;
  return out;
}

export function creatureIds(root: string): string[] {
  const dir = resolve(root, ENTRIES_DIR);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.slice(0, -5))
    .sort();
}

const SAFE_ID = /^[a-z0-9][a-z0-9-]{0,63}$/;
export function assertId(id: unknown): asserts id is string {
  if (typeof id !== "string" || !SAFE_ID.test(id)) throw new Error(`bad creature id: ${String(id)}`);
}

// ---- candidates ---------------------------------------------------------------------

export interface Candidate {
  /** The seed folder, as picks.json records it. */
  source: string;
  image: string;
}

function listDirs(abs: string): string[] {
  return existsSync(abs) ? readdirSync(abs).filter((n) => statSync(join(abs, n)).isDirectory()) : [];
}

/** Candidates of the latest iteration that has this creature (plates/iterN/out/<id>/<seed>/). */
export function candidates(root: string, id: string): { iteration: string | null; items: Candidate[] } {
  assertId(id);
  const iters = listDirs(resolve(root, "plates"))
    .filter((d) => /^iter\d+$/.test(d))
    .sort((a, b) => Number(b.slice(4)) - Number(a.slice(4)));
  const roots = [`plates/desk/${id}`, ...iters.map((d) => `plates/${d}/out/${id}`)];
  for (const base of roots) {
    const items: Candidate[] = [];
    for (const seed of listDirs(resolve(root, base)).sort()) {
      const files = readdirSync(resolve(root, base, seed)).filter((f) => /\.(png|webp|jpe?g)$/i.test(f)).sort();
      for (const f of files) items.push({ source: `${base}/${seed}`, image: `${base}/${seed}/${f}` });
    }
    if (items.length) return { iteration: base, items };
  }
  return { iteration: null, items: [] };
}

export function refImages(root: string, id: string): string[] {
  assertId(id);
  const dir = resolve(root, "plates/refs", id);
  return existsSync(dir)
    ? readdirSync(dir)
        .filter((f) => SERVE_EXT.test(f))
        .sort()
        .map((f) => `plates/refs/${id}/${f}`)
    : [];
}

// ---- views --------------------------------------------------------------------------

export type CreatureState = "unreviewed" | "redraw queued" | "approved" | "skipped" | "flagged";

export function stateOf(id: string, picks: Picks, queue: Queue): CreatureState {
  if (queue.jobs.some((j) => j.creature === id && (j.status === "queued" || j.status === "running"))) return "redraw queued";
  if (picks[id]) return "approved";
  if (queue.flags.some((f) => f.creature === id)) return "flagged";
  if (queue.skips.some((s) => s.creature === id)) return "skipped";
  return "unreviewed";
}

/** The labelled agent starting draft: the sourced clauses joined, never Ben's text. */
export function agentDraft(entry: { appearance?: Array<{ text: string }> }): string {
  return (entry.appearance ?? []).map((c) => c.text.trim()).join(" ");
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}
