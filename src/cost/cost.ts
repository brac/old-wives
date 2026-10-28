// Per-creature cost record for draft and verify runs (Phase 4 settled decision: draft cost
// cap $0.50 per creature, checked against draft runs only; verify runs are recorded but not capped; tokens converted at the API price of the model used).
//
// The harness reports only the total subagent tokens of a run, with no input/output split.
// So each row carries two prices: `usd` prices every token at the model's input rate, and
// `usd_high` prices every token at its output rate. The true cost lies between the two and
// is input-dominated (a draft or verify run reads far more corpus text than it writes), so
// `usd` is the figure the draft cap is checked against and `usd_high` is the bound Ben can see.
// Verify runs are recorded but not capped.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export type Stage = "draft" | "verify";
export const STAGES: readonly Stage[] = ["draft", "verify"];

/** API list prices in USD per million tokens. */
export const PRICES: Record<string, { input: number; output: number }> = {
  "claude-opus-5-5": { input: 4, output: 20 },
};
export const DEFAULT_MODEL = "claude-opus-5-5";
export const DEFAULT_CAP = 0.5;

export interface CostRow {
  creature: string;
  stage: Stage;
  model: string;
  subagent_tokens: number;
  /** tokens x input price: the figure the draft cap is checked against. */
  usd: number;
  /** tokens x output price: the upper bound. */
  usd_high: number;
  /** YYYY-MM-DD */
  date: string;
}

export interface CostFile {
  description: string;
  rows: CostRow[];
}

export const DESCRIPTION =
  "One row per draft or verify run. subagent_tokens is the harness's total for the run (no input/output split). usd = tokens x the model's input price, usd_high = tokens x its output price; the true cost lies between and is input-dominated. The $0.50 per-creature cap is checked against the sum of usd over draft rows; verify rows are recorded but not capped. Written by `npm run cost -- add`.";

const round6 = (n: number) => Math.round(n * 1e6) / 1e6;

export function makeRow(creature: string, stage: string, tokens: number, model: string, date: string): CostRow {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(creature)) throw new Error(`bad creature id: ${creature}`);
  if (!STAGES.includes(stage as Stage)) throw new Error(`stage must be draft or verify, got: ${stage}`);
  if (!Number.isInteger(tokens) || tokens <= 0) throw new Error(`tokens must be a positive integer, got: ${tokens}`);
  const price = PRICES[model];
  if (!price) throw new Error(`no price for model ${model}; known: ${Object.keys(PRICES).join(", ")}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`bad date: ${date}`);
  return {
    creature,
    stage: stage as Stage,
    model,
    subagent_tokens: tokens,
    usd: round6((tokens * price.input) / 1e6),
    usd_high: round6((tokens * price.output) / 1e6),
    date,
  };
}

export interface CreatureTotal {
  creature: string;
  runs: number;
  tokens: number;
  usd: number;
  usd_high: number;
  /** sum of usd over draft runs only: the figure checked against the cap. */
  draft_usd: number;
  verdict: "PASS" | "OVER";
}

/** Sums tokens and usd over all of a creature's runs for display; the verdict checks draft_usd against the cap. */
export function totals(rows: CostRow[], cap: number): CreatureTotal[] {
  const by = new Map<string, CreatureTotal>();
  for (const r of rows) {
    const t = by.get(r.creature) ?? { creature: r.creature, runs: 0, tokens: 0, usd: 0, usd_high: 0, draft_usd: 0, verdict: "PASS" as const };
    t.runs++;
    t.tokens += r.subagent_tokens;
    t.usd = round6(t.usd + r.usd);
    t.usd_high = round6(t.usd_high + r.usd_high);
    if (r.stage === "draft") t.draft_usd = round6(t.draft_usd + r.usd);
    by.set(r.creature, t);
  }
  return [...by.values()].map((t) => ({ ...t, verdict: t.draft_usd > cap ? "OVER" : "PASS" }));
}

export function readCost(path: string): CostFile {
  if (!existsSync(path)) return { description: DESCRIPTION, rows: [] };
  const f = JSON.parse(readFileSync(path, "utf8")) as CostFile;
  if (!Array.isArray(f.rows)) throw new Error(`${path}: no rows array`);
  return f;
}

export function appendRow(path: string, row: CostRow): CostFile {
  const f = readCost(path);
  const next = { description: f.description ?? DESCRIPTION, rows: [...f.rows, row] };
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(next, null, 2) + "\n");
  return next;
}

export function formatTotals(ts: CreatureTotal[], cap: number): string[] {
  if (ts.length === 0) return ["no runs recorded"];
  return ts.map(
    (t) => `${t.creature}  runs ${t.runs}  tokens ${t.tokens}  usd ${t.usd.toFixed(4)} (high ${t.usd_high.toFixed(4)})  draft_usd ${t.draft_usd.toFixed(4)}  cap ${cap.toFixed(2)}  ${t.verdict}`,
  );
}
