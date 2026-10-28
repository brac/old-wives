// Usage:
//   npm run cost -- add <creature-id> <draft|verify> <subagent-tokens> [--model <id>] [--cap 0.50]
//   npm run cost -- show [<creature-id>] [--cap 0.50]
// `add` appends one row to data/cost.json, then prints that creature's total against the cap.
// `show` prints every creature's total (or one creature's). Each total line ends PASS or OVER,
// comparing the sum of `usd` over the creature's draft and verify runs with the cap.
// Exits 2 on bad input. A creature id must be a row in prompts/creatures.json.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { appendRow, DEFAULT_CAP, DEFAULT_MODEL, formatTotals, makeRow, readCost, totals } from "./cost.js";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..", "..");
const COST_PATH = join(ROOT, "data", "cost.json");

function knownCreatures(): Set<string> {
  const f = JSON.parse(readFileSync(join(ROOT, "prompts", "creatures.json"), "utf8")) as { creatures: { id: string }[] };
  return new Set(f.creatures.map((c) => c.id));
}

function main(): void {
  const args = process.argv.slice(2);
  let model = DEFAULT_MODEL;
  let cap = DEFAULT_CAP;
  const pos: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    if (a === "--model") model = args[++i] ?? "";
    else if (a === "--cap") cap = Number(args[++i]);
    else pos.push(a);
  }
  const usage = "usage: npm run cost -- add <id> <draft|verify> <tokens> [--model <id>] [--cap 0.50] | show [<id>] [--cap 0.50]";
  if (!Number.isFinite(cap) || cap <= 0) {
    console.error(`bad --cap\n${usage}`);
    process.exit(2);
  }
  const [cmd, id, stage, tokens] = pos;
  if (cmd === "add" && id && stage && tokens && pos.length === 4) {
    if (!knownCreatures().has(id)) {
      console.error(`unknown creature: ${id} (not in prompts/creatures.json)`);
      process.exit(2);
    }
    let row;
    try {
      row = makeRow(id, stage, Number(tokens), model, new Date().toISOString().slice(0, 10));
    } catch (e) {
      console.error((e as Error).message);
      process.exit(2);
    }
    const f = appendRow(COST_PATH, row);
    console.log(`recorded ${row.creature} ${row.stage} ${row.subagent_tokens} tokens, usd ${row.usd} (high ${row.usd_high})`);
    for (const line of formatTotals(totals(f.rows.filter((r) => r.creature === id), cap), cap)) console.log(line);
  } else if (cmd === "show" && pos.length <= 2) {
    const rows = readCost(COST_PATH).rows.filter((r) => !id || r.creature === id);
    for (const line of formatTotals(totals(rows, cap), cap)) console.log(line);
  } else {
    console.error(usage);
    process.exit(2);
  }
}

main();
