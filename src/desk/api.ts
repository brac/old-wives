// The review desk's local API (plan phase-4, 4c). Mounted by site/astro.config.mjs as
// dev-server middleware at /_desk/api, in `astro dev` only; never part of a build.
//
// Writes: only through store.writeDeskJson (overrides, picks, the queue file).
// Reads: data/entries, plates/spend.json, candidate folders, plates/refs (served to the
// local page only; reference images are never sent to any API).

import { spawn } from "node:child_process";
import { createReadStream, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import { estimateUsd, getArm } from "../plates/arms.js";
import { wordDiff } from "./diff.js";
import { NOTE_ENDPOINT, NOTE_MODEL, NOTE_SPEND_CAP_USD, WHISPER_ENDPOINT, noteToEdit, transcribe, type FalCall } from "./llm.js";
import {
  OVERRIDES_FILE,
  PICKS_FILE,
  QUEUE_FILE,
  agentDraft,
  assertId,
  candidates,
  creatureIds,
  readJson,
  readOverrides,
  readPicks,
  readQueue,
  refImages,
  servablePath,
  spendByCreature,
  stateOf,
  today,
  writeDeskJson,
  type QueueJob,
} from "./store.js";

export const DESK_ARM = "qwen";

/** Plan phase-4, "Plate cap": $1 per plate including redraws, enforced per creature. */
export const PLATE_CAP_USD = 1.0;
/** Estimated cost of one desk redraw (one image on DESK_ARM, no references). */
export const JOB_ESTIMATE_USD = estimateUsd(getArm(DESK_ARM));

const r4 = (n: number) => Math.round(n * 10_000) / 10_000;

/**
 * Committed plate spend for a creature: every plates/spend.json row for it plus the
 * estimate of each of its queued or running desk jobs (dry runs included, to stay on the
 * safe side). `excludeJobId` leaves one job out, so the drain can add it back explicitly.
 */
export function plateCommitted(root: string, id: string, excludeJobId?: string): number {
  const ledger = spendByCreature(root)[id] ?? 0;
  const pending = readQueue(root).jobs.filter(
    (j) => j.creature === id && j.id !== excludeJobId && (j.status === "queued" || j.status === "running"),
  ).length;
  return r4(ledger + pending * JOB_ESTIMATE_USD);
}

/** Null when one more job fits under the cap, otherwise the refusal message. */
export function plateCapRefusal(root: string, id: string, excludeJobId?: string): string | null {
  const committed = plateCommitted(root, id, excludeJobId);
  const after = r4(committed + JOB_ESTIMATE_USD);
  if (after <= PLATE_CAP_USD) return null;
  return `plate cap: ${id} has $${committed.toFixed(2)} spent or queued of the $${PLATE_CAP_USD.toFixed(2)} cap; one more redraw (est. $${JOB_ESTIMATE_USD.toFixed(2)}) would make $${after.toFixed(2)}`;
}

export type RunJob = (job: QueueJob, root: string, onLog: (line: string) => void) => Promise<void>;

/** Default runner: the plates generator, one job at a time, output under plates/desk/<id>/. */
export const spawnGenerator: RunJob = (job, root, onLog) =>
  new Promise((ok, fail) => {
    const args = ["run", "plates", "--", "--arm", DESK_ARM, "--entry", `data/entries/${job.creature}.json`, "--out", `plates/desk/${job.creature}/s${job.seed}`, "--seed", String(job.seed)];
    if (job.dry_run) args.push("--dry-run");
    const child = spawn(process.platform === "win32" ? "npm.cmd" : "npm", args, { cwd: root, shell: process.platform === "win32" });
    const take = (b: Buffer) => b.toString().split(/\r?\n/).filter(Boolean).forEach(onLog);
    child.stdout.on("data", take);
    child.stderr.on("data", take);
    child.on("error", fail);
    child.on("close", (code) => (code === 0 ? ok() : fail(new Error(`generator exited ${code}`))));
  });

export interface DeskDeps {
  root: string;
  fal?: FalCall;
  runJob?: RunJob;
  /** Queue jobs as --dry-run (set DESK_DRY_RUN=1). */
  dryRun?: boolean;
}

class HttpError extends Error {
  constructor(public status: number, msg: string) {
    super(msg);
  }
}

async function body(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const c of req) {
    size += (c as Buffer).length;
    if (size > 10_000_000) throw new HttpError(413, "body too large");
    chunks.push(c as Buffer);
  }
  return Buffer.concat(chunks);
}

async function json(req: IncomingMessage): Promise<Record<string, unknown>> {
  try {
    return JSON.parse((await body(req)).toString("utf8") || "{}");
  } catch {
    throw new HttpError(400, "body is not JSON");
  }
}

function str(v: unknown, name: string, max = 4000): string {
  if (typeof v !== "string" || !v.trim()) throw new HttpError(400, `missing ${name}`);
  if (v.length > max) throw new HttpError(400, `${name} too long`);
  return v.trim();
}

function send(res: ServerResponse, status: number, data: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(data));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function entryOf(root: string, id: string): any {
  assertId(id);
  if (!creatureIds(root).includes(id)) throw new HttpError(404, `no entry ${id}`);
  return JSON.parse(readFileSync(resolve(root, "data/entries", `${id}.json`), "utf8"));
}

/** Ben's current text for a creature, or null when only the agent draft exists. */
function bensText(root: string, id: string): string | null {
  return readOverrides(root)[id]?.visual?.text ?? null;
}

export function llmSpend(root: string): number {
  return Math.round(readQueue(root).llm_calls.reduce((s, c) => s + c.cost_usd, 0) * 1e6) / 1e6;
}

export function createDeskApi(deps: DeskDeps) {
  const { root } = deps;
  const runJob = deps.runJob ?? spawnGenerator;
  let running: Promise<void> | null = null;

  async function drain(): Promise<void> {
    for (;;) {
      const q = readQueue(root);
      const job = q.jobs.find((j) => j.status === "queued");
      if (!job) return;
      const setStatus = (patch: Partial<QueueJob>, line?: string) => {
        const cur = readQueue(root);
        const j = cur.jobs.find((x) => x.id === job.id);
        if (!j) return;
        Object.assign(j, patch);
        if (line) j.log = [...j.log, line].slice(-40);
        writeDeskJson(root, QUEUE_FILE, cur);
      };
      if (!job.dry_run) {
        const refusal = plateCapRefusal(root, job.creature, job.id);
        if (refusal) {
          setStatus({ status: "failed" }, `failed: ${refusal}`);
          continue;
        }
      }
      setStatus({ status: "running" }, `start ${new Date().toISOString()}`);
      try {
        await runJob(job, root, (line) => setStatus({}, line));
        setStatus({ status: "done" }, "done");
      } catch (err) {
        setStatus({ status: "failed" }, `failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  const routes: Record<string, (req: IncomingMessage, url: URL, res: ServerResponse) => Promise<unknown>> = {
    "GET /config": async () => ({
      note_endpoint: NOTE_ENDPOINT,
      note_model: NOTE_MODEL,
      whisper_endpoint: WHISPER_ENDPOINT,
      llm_spend_usd: llmSpend(root),
      llm_cap_usd: NOTE_SPEND_CAP_USD,
      dry_run: Boolean(deps.dryRun),
    }),

    "GET /batch": async () => {
      const picks = readPicks(root);
      const queue = readQueue(root);
      const spend = spendByCreature(root);
      return creatureIds(root).map((id) => {
        const c = candidates(root, id);
        const pick = picks[id];
        const thumb = (pick && c.items.find((i) => i.source === pick.source)?.image) ?? c.items[0]?.image ?? null;
        return { id, name: entryOf(root, id).names?.primary ?? id, state: stateOf(id, picks, queue), spend_usd: spend[id] ?? 0, thumb };
      });
    },

    "GET /creature": async (_req, url) => {
      const id = url.searchParams.get("id") ?? "";
      const entry = entryOf(root, id);
      const ov = readOverrides(root)[id] ?? {};
      const picks = readPicks(root);
      const queue = readQueue(root);
      const visual = ov.visual ?? null;
      return {
        id,
        name: entry.names?.primary ?? id,
        state: stateOf(id, picks, queue),
        pick: picks[id] ?? null,
        appearance: entry.appearance ?? [],
        visual,
        draft: visual ? null : { label: "agent draft, not yet yours", text: agentDraft(entry) },
        can_generate: Boolean(visual),
        candidates: candidates(root, id),
        refs: refImages(root, id),
        spend_usd: spendByCreature(root)[id] ?? 0,
        plate_cap_usd: PLATE_CAP_USD,
        plate_committed_usd: plateCommitted(root, id),
        plate_headroom_usd: r4(Math.max(0, PLATE_CAP_USD - plateCommitted(root, id))),
        redraw_estimate_usd: JOB_ESTIMATE_USD,
        history: {
          human_edits: ov.human_edits ?? [],
          drop: ov.drop ?? [],
          llm_calls: queue.llm_calls.filter((c) => c.creature === id),
          jobs: queue.jobs.filter((j) => j.creature === id),
          flags: queue.flags.filter((f) => f.creature === id),
        },
      };
    },

    "GET /queue": async () => readQueue(root),

    "POST /note": async (req) => {
      const b = await json(req);
      const id = str(b.id, "id", 64);
      entryOf(root, id);
      const note = str(b.note, "note");
      const text = str(b.text, "text");
      if (llmSpend(root) >= NOTE_SPEND_CAP_USD) throw new HttpError(402, `note-to-edit spend has reached the $${NOTE_SPEND_CAP_USD} cap`);
      const log = (ok: boolean, cost: number) => {
        const q = readQueue(root);
        q.llm_calls.push({ date: new Date().toISOString(), creature: id, endpoint: NOTE_ENDPOINT, model: NOTE_MODEL, cost_usd: cost, note, ok });
        writeDeskJson(root, QUEUE_FILE, q);
      };
      try {
        const r = await noteToEdit(note, text, deps.fal);
        log(true, r.cost_usd);
        return { ...r, diff: wordDiff(text, r.revised) };
      } catch (err) {
        log(false, 0);
        throw err;
      }
    },

    "POST /accept": async (req) => {
      const b = await json(req);
      const id = str(b.id, "id", 64);
      const entry = entryOf(root, id);
      const text = str(b.text, "text");
      const note = typeof b.note === "string" ? b.note.trim() : "";
      if (text === agentDraft(entry).trim()) throw new HttpError(409, "that is the unedited agent draft; edit or replace it first");
      const overrides = readOverrides(root);
      const ov = (overrides[id] ??= {});
      const date = today();
      const negative = typeof b.negative_extra === "string" ? b.negative_extra.trim() : ov.visual?.negative_extra;
      ov.visual = { text, ...(negative ? { negative_extra: negative } : {}), basis: "visual tradition", by: "Ben", date, ...(note ? { note } : {}) };
      ov.human_edits = [...(ov.human_edits ?? []), { type: "visual-tradition", text, note, by: "Ben", date }];
      writeDeskJson(root, OVERRIDES_FILE, overrides);
      return { ok: true, visual: ov.visual };
    },

    "POST /approve": async (req) => {
      const b = await json(req);
      const id = str(b.id, "id", 64);
      entryOf(root, id);
      const source = str(b.source, "source", 300);
      if (!candidates(root, id).items.some((c) => c.source === source)) throw new HttpError(400, `${source} is not a candidate of ${id}`);
      const picks = readPicks(root);
      picks[id] = { source, approved_by: "Ben", date: today() };
      writeDeskJson(root, PICKS_FILE, picks);
      return { ok: true, pick: picks[id] };
    },

    "POST /redraw": async (req) => {
      const b = await json(req);
      const id = str(b.id, "id", 64);
      entryOf(root, id);
      const text = bensText(root, id);
      if (!text) throw new HttpError(409, "no text of Ben's yet: generate stays disabled until the agent draft is edited and accepted");
      const refusal = plateCapRefusal(root, id);
      if (refusal) throw new HttpError(402, refusal);
      const q = readQueue(root);
      const seed = Number.isSafeInteger(b.seed) ? (b.seed as number) : 51 + q.jobs.filter((j) => j.creature === id).length;
      const job: QueueJob = { id: `${id}-${Date.now()}`, creature: id, text, seed, dry_run: Boolean(deps.dryRun), status: "queued", queued: new Date().toISOString(), log: [] };
      q.jobs.push(job);
      writeDeskJson(root, QUEUE_FILE, q);
      return { ok: true, job };
    },

    "POST /run": async () => {
      if (!running) running = drain().finally(() => (running = null));
      return { ok: true, running: true };
    },

    "POST /skip": async (req) => {
      const id = str((await json(req)).id, "id", 64);
      entryOf(root, id);
      const q = readQueue(root);
      q.skips.push({ creature: id, date: today() });
      writeDeskJson(root, QUEUE_FILE, q);
      return { ok: true };
    },

    "POST /flag": async (req) => {
      const b = await json(req);
      const id = str(b.id, "id", 64);
      entryOf(root, id);
      const q = readQueue(root);
      q.flags.push({ creature: id, text: str(b.text, "text"), date: today() });
      writeDeskJson(root, QUEUE_FILE, q);
      return { ok: true };
    },

    "POST /transcribe": async (req) => {
      const audio = await body(req);
      if (!audio.length) throw new HttpError(400, "no audio");
      const type = String(req.headers["content-type"] ?? "audio/webm");
      return { text: await transcribe(new Blob([new Uint8Array(audio)], { type })) };
    },
  };

  /** Connect-style middleware; expects to be mounted at /_desk/api. */
  return async function deskApi(req: IncomingMessage, res: ServerResponse, next?: () => void): Promise<void> {
    const url = new URL(req.url ?? "/", "http://desk.local");
    if (req.method === "GET" && url.pathname === "/file") {
      const abs = servablePath(root, url.searchParams.get("p") ?? "");
      if (!abs) return send(res, 404, { error: "not found" });
      res.setHeader("Content-Type", /\.png$/i.test(abs) ? "image/png" : /\.webp$/i.test(abs) ? "image/webp" : "image/jpeg");
      res.setHeader("Cache-Control", "private, max-age=60");
      createReadStream(abs).pipe(res);
      return;
    }
    const route = routes[`${req.method} ${url.pathname}`];
    if (!route) return next ? next() : send(res, 404, { error: "no such desk route" });
    try {
      send(res, 200, await route(req, url, res));
    } catch (err) {
      const status = err instanceof HttpError ? err.status : 500;
      send(res, status, { error: err instanceof Error ? err.message : String(err) });
    }
  };
}

/** Exposed for tests: whether a JSON file still holds what it held. */
export const snapshot = (root: string, p: string) => JSON.stringify(readJson(root, p, null));
