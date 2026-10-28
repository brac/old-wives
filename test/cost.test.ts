import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { appendRow, formatTotals, makeRow, readCost, totals } from "../src/cost/cost.js";

const D = "2026-10-28";
const M = "claude-opus-5-5";

describe("makeRow", () => {
  test("prices tokens at the input rate (usd) and the output rate (usd_high)", () => {
    const r = makeRow("kikimora", "draft", 100_000, M, D);
    expect(r).toEqual({ creature: "kikimora", stage: "draft", model: M, subagent_tokens: 100_000, usd: 0.4, usd_high: 2, date: D });
  });

  test("rejects a bad stage, a bad token count, an unpriced model and a bad id", () => {
    expect(() => makeRow("kikimora", "plate", 10, M, D)).toThrow(/stage/);
    expect(() => makeRow("kikimora", "draft", 0, M, D)).toThrow(/tokens/);
    expect(() => makeRow("kikimora", "draft", 1.5, M, D)).toThrow(/tokens/);
    expect(() => makeRow("kikimora", "draft", 10, "gpt-x", D)).toThrow(/no price/);
    expect(() => makeRow("Kiki Mora", "draft", 10, M, D)).toThrow(/creature/);
  });
});

describe("totals and the cap", () => {
  test("sums usd over all runs for display; the verdict checks draft usd against the cap", () => {
    const rows = [
      makeRow("vila", "draft", 80_000, M, D), // 0.32
      makeRow("vila", "verify", 45_000, M, D), // 0.18 -> 0.50 total
      makeRow("koschei", "draft", 130_000, M, D), // 0.52
      makeRow("koschei", "verify", 30_000, M, D), // 0.12 -> 0.64 total
    ];
    const t = totals(rows, 0.5);
    expect(t.find((x) => x.creature === "vila")).toMatchObject({ runs: 2, tokens: 125_000, usd: 0.5, usd_high: 2.5, draft_usd: 0.32, verdict: "PASS" });
    expect(t.find((x) => x.creature === "koschei")).toMatchObject({ usd: 0.64, draft_usd: 0.52, verdict: "OVER" });
    expect(totals(rows, 0.6).every((x) => x.verdict === "PASS")).toBe(true);
  });

  test("draft usd 0.40 with verify usd 0.30 is PASS at cap 0.50; verify is not capped", () => {
    const rows = [
      makeRow("polevik", "draft", 100_000, M, D), // 0.40
      makeRow("polevik", "verify", 75_000, M, D), // 0.30 -> 0.70 total
    ];
    expect(totals(rows, 0.5)[0]).toMatchObject({ usd: 0.7, draft_usd: 0.4, verdict: "PASS" });
  });

  test("draft usd 0.52 is OVER at cap 0.50", () => {
    expect(totals([makeRow("vila", "draft", 130_000, M, D)], 0.5)[0]).toMatchObject({ draft_usd: 0.52, verdict: "OVER" });
  });

  test("the cap is checked against usd, not usd_high", () => {
    const t = totals([makeRow("ala", "draft", 120_000, M, D)], 0.5); // usd 0.48, usd_high 2.40
    expect(t[0]!.verdict).toBe("PASS");
  });

  test("formats one line per creature ending in the verdict", () => {
    expect(formatTotals([], 0.5)).toEqual(["no runs recorded"]);
    const [line] = formatTotals(totals([makeRow("ala", "draft", 200_000, M, D)], 0.5), 0.5);
    expect(line).toMatch(/^ala .*usd 0\.8000 .*OVER$/);
  });
});

describe("the cost file", () => {
  let dir: string | undefined;
  afterEach(() => dir && rmSync(dir, { recursive: true, force: true }));

  test("a missing file reads as no rows; appends accumulate one row per run", () => {
    dir = mkdtempSync(join(tmpdir(), "cost-"));
    const path = join(dir, "data", "cost.json");
    expect(readCost(path).rows).toEqual([]);
    appendRow(path, makeRow("mora", "draft", 50_000, M, D));
    appendRow(path, makeRow("mora", "verify", 20_000, M, D));
    const f = JSON.parse(readFileSync(path, "utf8"));
    expect(f.rows.map((r: { stage: string }) => r.stage)).toEqual(["draft", "verify"]);
    expect(typeof f.description).toBe("string");
    expect(totals(readCost(path).rows, 0.5)[0]).toMatchObject({ usd: 0.28, verdict: "PASS" });
  });
});
