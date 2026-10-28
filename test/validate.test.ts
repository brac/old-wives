import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, test } from "vitest";
import { spawnSync } from "node:child_process";
import { validateDir, validateEntry, validateFile, validateLog, type Stage } from "../src/validate/validate.js";

const FIXTURES = join(import.meta.dirname, "..", "fixtures");
const INVALID = join(FIXTURES, "invalid");

/**
 * Each invalid fixture, the only error rule it may raise, the path it is raised at, and the stage.
 * `rule` is a list where one fixture necessarily trips two rules.
 */
const TABLE: Record<string, { rule: string | string[]; path: string; stage: Stage; log?: boolean }> = {
  "untagged-clause": { rule: "minItems", path: "/appearance/0/cites", stage: "draft" },
  "clause-missing-cites": { rule: "required", path: "/appearance/0", stage: "draft" },
  "bad-tag-grammar": { rule: "pattern", path: "/appearance/0/cites/0", stage: "draft" },
  // "Slavic" is also outside the people table, so it trips R-PEOPLE as well as the schema pattern.
  "people-slavic": { rule: ["pattern", "R-PEOPLE"], path: "/peoples_regions/0/people", stage: "draft" },
  "people-not-in-table": { rule: "R-PEOPLE", path: "/peoples_regions/0/people", stage: "draft" },
  "empty-appearance-no-scene": { rule: "minItems", path: "/scene", stage: "draft" },
  "unknown-property": { rule: "unevaluatedProperties", path: "/", stage: "draft" },
  "bad-family": { rule: "enum", path: "/family/value", stage: "draft" },
  "family-v1-string": { rule: "type", path: "/family", stage: "draft" },
  "family-uncited": { rule: "R-FAMILY", path: "/family/cites", stage: "draft" },
  "family-unclassified-with-cites": { rule: "R-FAMILY", path: "/family/cites", stage: "draft" },
  "appearance-forms-missing": { rule: "required", path: "/", stage: "draft" },
  "form-unknown-id": { rule: "R-FORM-REF", path: "/appearance/3/form", stage: "draft" },
  "form-empty": { rule: "R-FORM-EMPTY", path: "/appearance_forms/2", stage: "draft" },
  "form-duplicate-id": { rule: "R-FORM-DUP", path: "/appearance_forms/1/id", stage: "draft" },
  "form-on-variant-clause": { rule: "unevaluatedProperties", path: "/variants/0/appearance/0", stage: "draft" },
  "log-reformed-same-form": { rule: "R-REFORMED", path: "/reformed/0", stage: "verified", log: true },
  "log-reformed-missing": { rule: "required", path: "/", stage: "verified", log: true },
  // Every manifest source is public domain, so a non-PD row also disagrees with the manifest.
  "no-pd-source": { rule: ["R-PD", "R-SOURCE-MANIFEST"], path: "/sources", stage: "draft" },
  "cite-source-not-listed": { rule: "R-CITE-SRC", path: "/appearance/0/cites/0", stage: "draft" },
  "id-mismatch": { rule: "R-ID", path: "/id", stage: "draft" },
  "draft-with-attestation": { rule: "R-STAGE", path: "/attestation", stage: "draft" },
  "verified-without-attestation": { rule: "R-STAGE", path: "/attestation", stage: "verified" },
  "cite-unresolvable": { rule: "R-CITE-RESOLVES", path: "/appearance/0/cites/0", stage: "draft" },
  "page-tag-on-headword-source": { rule: "R-CITE-RESOLVES", path: "/appearance/0/cites/0", stage: "draft" },
  "native-name-uncited": { rule: "required", path: "/names/primary/native/0", stage: "draft" },
  "source-not-in-manifest": { rule: "R-SOURCE-MANIFEST", path: "/sources/3/source_id", stage: "draft" },
};

describe("invalid fixtures fail on exactly their named rule", () => {
  test("the table covers every file in fixtures/invalid", () => {
    const names = readdirSync(INVALID)
      .filter((n) => n.endsWith(".json"))
      .map((n) => n.slice(0, -5))
      .sort();
    expect(names).toEqual(Object.keys(TABLE).sort());
  });

  test.each(Object.entries(TABLE))("%s", (name, { rule, path, stage, log }) => {
    const { issues } = validateFile(join(INVALID, `${name}.json`), { stage, log });
    const errors = issues.filter((i) => i.severity === "error");
    expect(errors.length).toBeGreaterThan(0);
    expect([...new Set(errors.map((e) => e.rule))].sort()).toEqual([rule].flat().sort());
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
    expect(entries.some((e) => e.appearance_forms.length > 1)).toBe(true);
    expect(entries.some((e) => (e.family as unknown as { value: string }).value === "unclassified")).toBe(true);
  });

  test("the valid log set has a reformed row and a removed family", () => {
    const logs = readdirSync(join(FIXTURES, "valid/log")).map(
      (n) => JSON.parse(readFileSync(join(FIXTURES, "valid/log", n), "utf8")) as Record<string, { field: string }[]>,
    );
    expect(logs.some((l) => l.reformed.length > 0)).toBe(true);
    expect(logs.some((l) => l.removed.some((r) => r.field === "/family"))).toBe(true);
  });
});

describe("Slavic umbrella terms", () => {
  const base = JSON.parse(readFileSync(join(FIXTURES, "valid/draft/fixture-seen.json"), "utf8")) as {
    peoples_regions: { people: string; cites: string[] }[];
  };
  test.each(["Slavic", "slav", "SLAVS", "Slavonic", " slavic "])("rejects %j", (people) => {
    const obj = { ...base, peoples_regions: [{ people, cites: ["ralston1872:p.123"] }] };
    const rules = validateEntry(obj, { stage: "draft", basename: "fixture-seen" }).map((i) => i.rule);
    // The schema pattern rejects it; it is also outside the people table (R-PEOPLE).
    expect(rules.sort()).toEqual(["R-PEOPLE", "pattern"]);
  });
  test.each(["Russians", "Slovaks", "Slovenes"])("accepts %j", (people) => {
    const obj = { ...base, peoples_regions: [{ people, cites: ["ralston1872:p.123"] }] };
    expect(validateEntry(obj, { stage: "draft", basename: "fixture-seen" })).toEqual([]);
  });
  test('"East Slavs" passes the umbrella pattern but is not in the people table', () => {
    const obj = { ...base, peoples_regions: [{ people: "East Slavs", cites: ["ralston1872:p.123"] }] };
    const rules = validateEntry(obj, { stage: "draft", basename: "fixture-seen" }).map((i) => i.rule);
    expect(rules).toEqual(["R-PEOPLE"]);
  });
});

describe("R-RELATED", () => {
  const tmp = mkdtempSync(join(tmpdir(), "old-wives-related-"));
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

describe("R-CITE-RESOLVES", () => {
  const base = JSON.parse(readFileSync(join(FIXTURES, "valid/draft/fixture-seen.json"), "utf8")) as {
    appearance: { text: string; cites: string[] }[];
  };
  const rulesFor = (cite: string, stage: Stage) => {
    const obj = structuredClone(base);
    obj.appearance[0].cites = [cite];
    return validateEntry(obj, { stage, basename: "fixture-seen" }).map((i) => [i.rule, i.severity]);
  };

  test.each(["draft", "verified"] as Stage[])("an unresolvable page is an error at stage %s", (stage) => {
    const issues = rulesFor("machal1918:p.9999", stage).filter(([r]) => r === "R-CITE-RESOLVES");
    expect(issues).toEqual([["R-CITE-RESOLVES", "error"]]);
  });

  test("a pp. range of 15 pages passes", () => {
    expect(rulesFor("ralston1872:pp.110-124", "draft")).toEqual([]);
  });

  test("a pp. range of 16 pages fails", () => {
    expect(rulesFor("ralston1872:pp.110-125", "draft")).toEqual([["R-CITE-RESOLVES", "error"]]);
  });

  test("a p. tag on a headword source fails", () => {
    expect(rulesFor("karadzic1818:p.163", "draft")).toEqual([["R-CITE-RESOLVES", "error"]]);
  });

  test("verify logs check to_cites and rationale cites, not what was removed", () => {
    const log = JSON.parse(readFileSync(join(FIXTURES, "valid/log/fixture-seen.json"), "utf8")) as {
      removed: { cites: string[] }[];
      retagged: { to_cites: string[] }[];
      grade_rationale: { cites: string[] }[];
    };
    const removedBad = structuredClone(log);
    removedBad.removed[0].cites = ["machal1918:p.9999"];
    expect(validateLog(removedBad, { basename: "fixture-seen" })).toEqual([]);
    const toBad = structuredClone(log);
    toBad.retagged[0].to_cites = ["machal1918:p.9999"];
    expect(validateLog(toBad, { basename: "fixture-seen" }).map((i) => i.rule)).toEqual(["R-CITE-RESOLVES"]);
    const rationaleBad = structuredClone(log);
    rationaleBad.grade_rationale[0].cites = ["machal1918:p.9999"];
    expect(validateLog(rationaleBad, { basename: "fixture-seen" }).map((i) => i.rule)).toEqual(["R-CITE-RESOLVES"]);
  });
});

describe("R-SOURCE-MANIFEST", () => {
  const base = JSON.parse(readFileSync(join(FIXTURES, "valid/draft/fixture-seen.json"), "utf8")) as {
    sources: { year: number }[];
  };
  test("a year that differs from the manifest fails", () => {
    const obj = structuredClone(base);
    obj.sources[0].year = 1917;
    const issues = validateEntry(obj, { stage: "draft", basename: "fixture-seen" });
    expect(issues.map((i) => [i.rule, i.path])).toEqual([["R-SOURCE-MANIFEST", "/sources/0/year"]]);
  });
});

describe("validate CLI", () => {
  const cli = join(import.meta.dirname, "..", "src", "validate", "cli.ts");
  const run = (...args: string[]) =>
    spawnSync(process.execPath, ["--import", "tsx", cli, ...args], { encoding: "utf8" });

  test("entries without --stage print usage and exit 2", () => {
    const r = run(join(FIXTURES, "valid/draft"));
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("usage:");
  });

  test("--log does not need --stage", () => {
    expect(run(join(FIXTURES, "valid/log"), "--log").status).toBe(0);
  });
});
