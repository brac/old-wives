import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, test } from "vitest";
import { validateDir, validateEntry, validateFile, type Stage } from "../src/validate/validate.js";

const FIXTURES = join(import.meta.dirname, "..", "fixtures");
const INVALID = join(FIXTURES, "invalid");

/** Each invalid fixture, the only error rule it may raise, the path it is raised at, and the stage. */
const TABLE: Record<string, { rule: string; path: string; stage: Stage }> = {
  "untagged-clause": { rule: "minItems", path: "/appearance/0/cites", stage: "draft" },
  "clause-missing-cites": { rule: "required", path: "/appearance/0", stage: "draft" },
  "bad-tag-grammar": { rule: "pattern", path: "/appearance/0/cites/0", stage: "draft" },
  "people-slavic": { rule: "pattern", path: "/peoples_regions/0/people", stage: "draft" },
  "empty-appearance-no-scene": { rule: "minItems", path: "/scene", stage: "draft" },
  "unknown-property": { rule: "unevaluatedProperties", path: "/", stage: "draft" },
  "bad-family": { rule: "enum", path: "/family", stage: "draft" },
  "no-pd-source": { rule: "R-PD", path: "/sources", stage: "draft" },
  "cite-source-not-listed": { rule: "R-CITE-SRC", path: "/appearance/0/cites/0", stage: "draft" },
  "id-mismatch": { rule: "R-ID", path: "/id", stage: "draft" },
  "draft-with-attestation": { rule: "R-STAGE", path: "/attestation", stage: "draft" },
  "verified-without-attestation": { rule: "R-STAGE", path: "/attestation", stage: "verified" },
};

describe("invalid fixtures fail on exactly their named rule", () => {
  test("the table covers every file in fixtures/invalid", () => {
    const names = readdirSync(INVALID)
      .filter((n) => n.endsWith(".json"))
      .map((n) => n.slice(0, -5))
      .sort();
    expect(names).toEqual(Object.keys(TABLE).sort());
  });

  test.each(Object.entries(TABLE))("%s", (name, { rule, path, stage }) => {
    const { issues } = validateFile(join(INVALID, `${name}.json`), { stage });
    const errors = issues.filter((i) => i.severity === "error");
    expect(errors.length).toBeGreaterThan(0);
    expect([...new Set(errors.map((e) => e.rule))]).toEqual([rule]);
    expect(errors.map((e) => e.path)).toContain(path);
  });
});

describe("valid fixtures pass", () => {
  test.each([
    ["valid/draft", { stage: "draft" as Stage }],
    ["valid/verified", { stage: "verified" as Stage }],
    ["valid/log", { stage: "verified" as Stage, log: true }],
  ])("%s", (dir, opts) => {
    const report = validateDir(join(FIXTURES, dir), opts);
    expect(report.files.flatMap((f) => f.issues)).toEqual([]);
    expect(report.invalid).toBe(0);
    expect(report.valid).toBeGreaterThanOrEqual(1);
  });

  test("the valid set has a seen creature, an unseen one and one with nested variants", () => {
    const entries = ["valid/draft", "valid/verified"].flatMap((d) =>
      readdirSync(join(FIXTURES, d)).map(
        (n) => JSON.parse(readFileSync(join(FIXTURES, d, n), "utf8")) as Record<string, unknown[]>,
      ),
    );
    expect(entries.some((e) => e.appearance.length > 0)).toBe(true);
    expect(entries.some((e) => e.appearance.length === 0 && e.scene.length > 0)).toBe(true);
    expect(entries.some((e) => e.variants.length > 0)).toBe(true);
  });
});

describe("Slavic umbrella terms", () => {
  const base = JSON.parse(readFileSync(join(FIXTURES, "valid/draft/fixture-seen.json"), "utf8")) as {
    peoples_regions: { people: string; cites: string[] }[];
  };
  test.each(["Slavic", "slav", "SLAVS", "Slavonic", " slavic "])("rejects %j", (people) => {
    const obj = { ...base, peoples_regions: [{ people, cites: ["ralston1872:p.123"] }] };
    const rules = validateEntry(obj, { stage: "draft", basename: "fixture-seen" }).map((i) => i.rule);
    expect(rules).toEqual(["pattern"]);
  });
  test.each(["East Slavs", "Russians", "Slovaks", "Slovenes"])("accepts %j", (people) => {
    const obj = { ...base, peoples_regions: [{ people, cites: ["ralston1872:p.123"] }] };
    expect(validateEntry(obj, { stage: "draft", basename: "fixture-seen" })).toEqual([]);
  });
});

describe("R-RELATED", () => {
  const tmp = mkdtempSync(join(tmpdir(), "beasts-related-"));
  afterAll(() => rmSync(tmp, { recursive: true, force: true }));
  const entry = readFileSync(join(FIXTURES, "valid/draft/fixture-seen.json"), "utf8");
  writeFileSync(join(tmp, "fixture-seen.json"), entry);

  test("a dangling related id is a warning in draft", () => {
    const report = validateDir(tmp, { stage: "draft" });
    expect(report.files[0].issues.map((i) => [i.rule, i.severity])).toEqual([["R-RELATED", "warning"]]);
    expect(report.invalid).toBe(0);
    expect(report.warnings).toBe(1);
  });

  test("a dangling related id is an error in verified", () => {
    const report = validateDir(tmp, { stage: "verified" });
    const related = report.files[0].issues.filter((i) => i.rule === "R-RELATED");
    expect(related.map((i) => i.severity)).toEqual(["error"]);
    expect(report.invalid).toBe(1);
  });
});
