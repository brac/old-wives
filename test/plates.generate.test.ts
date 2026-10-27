import { describe, expect, test } from "vitest";
import { ARMS, buildInput, estimateUsd, getArm } from "../src/plates/arms.js";
import { SPEND_CAP_USD, checkSpend, emptyLedger, planJob, type Ledger } from "../src/plates/generate.js";

const ledgerAt = (total: number): Ledger => ({ ...emptyLedger(), total_usd: total });

describe("spend guard", () => {
  test("the cap is $25", () => {
    expect(SPEND_CAP_USD).toBe(25);
  });

  test("a job inside the cap passes, including one that lands exactly on it", () => {
    expect(() => checkSpend(ledgerAt(0), 0.04)).not.toThrow();
    expect(() => checkSpend(ledgerAt(24.96), 0.04)).not.toThrow();
  });

  test("a job that would pass the cap is refused", () => {
    expect(() => checkSpend(ledgerAt(24.97), 0.04)).toThrow(/refusing/);
    expect(() => checkSpend(ledgerAt(25), 0.003)).toThrow(/refusing/);
    expect(() => checkSpend(ledgerAt(0), 25.01)).toThrow(/refusing/);
  });

  test("a zero or invalid estimate is refused", () => {
    expect(() => checkSpend(ledgerAt(0), 0)).toThrow(/positive/);
    expect(() => checkSpend(ledgerAt(0), Number.NaN)).toThrow(/positive/);
  });
});

describe("arms", () => {
  test("four arms, each a 3:4 portrait", () => {
    expect(Object.keys(ARMS).sort()).toEqual(["qwen", "qwen-edit-refs", "schnell", "zimage"]);
    for (const a of Object.values(ARMS)) expect(a.width / a.height).toBeCloseTo(0.75, 3);
  });

  test("estimates stay under $0.10 for the text arms", () => {
    expect(estimateUsd(ARMS.qwen)).toBe(0.04);
    expect(estimateUsd(ARMS.zimage)).toBe(0.01);
    expect(estimateUsd(ARMS.schnell)).toBe(0.003);
    expect(estimateUsd(ARMS["qwen-edit-refs"], 4)).toBe(0.18);
  });

  test("schnell has no negative_prompt; only the edit arm sends image_urls", () => {
    const p = { prompt: "p", negative: "n", seed: 1, imageUrls: ["u"] };
    expect(buildInput(ARMS.schnell, p)).not.toHaveProperty("negative_prompt");
    expect(buildInput(ARMS.qwen, p)).toMatchObject({ negative_prompt: "n", image_size: { width: 1104, height: 1472 } });
    expect(buildInput(ARMS.qwen, p)).not.toHaveProperty("image_urls");
    expect(buildInput(ARMS["qwen-edit-refs"], p)).toMatchObject({ image_urls: ["u"] });
  });

  test("unknown arm is an error", () => {
    expect(() => getArm("flux-2-pro")).toThrow(/unknown arm/);
  });
});

describe("planJob", () => {
  const base = ["--entry", "data/entries/baba-yaga.json", "--out", "x", "--seed", "1"];

  test("schnell puts the negative tokens inline", () => {
    const { job, dryRun } = planJob(["--arm", "schnell", ...base, "--dry-run"]);
    expect(dryRun).toBe(true);
    expect(job.built.negative).toBe("");
    expect(job.built.prompt).toContain("Avoid: no painterly");
  });

  test("refs are required on the edit arm and refused elsewhere", () => {
    expect(() => planJob(["--arm", "qwen-edit-refs", ...base])).toThrow(/needs --refs/);
    expect(() => planJob(["--arm", "qwen", ...base, "--refs", "style/refs/manifest.json"])).toThrow(/no reference/);
  });

  test("bad seed is refused", () => {
    expect(() => planJob(["--arm", "qwen", "--entry", "data/entries/baba-yaga.json", "--out", "x", "--seed", "abc"])).toThrow(/seed/);
  });
});
