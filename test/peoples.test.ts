import { readFileSync } from "node:fs";
import { join } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, test } from "vitest";
import { loadManifest } from "../src/corpus/manifest.js";
import { tablePeoples } from "../src/validate/validate.js";

const ROOT = join(import.meta.dirname, "..");
const read = (p: string) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));

type Row = { term: string; sources: string[]; people: string; contested: boolean };

function compile() {
  const ajv = new Ajv2020.default({ allErrors: true, strict: true });
  return ajv.compile(read("schema/peoples.schema.json"));
}

describe("sources/peoples.json", () => {
  const table = read("sources/peoples.json") as { rows: Row[] };

  test("passes its schema", () => {
    const validate = compile();
    expect(validate(table), JSON.stringify(validate.errors)).toBe(true);
  });

  test("a row missing `people` fails the schema", () => {
    const validate = compile();
    const { people: _drop, ...row } = table.rows[0];
    expect(validate({ ...table, rows: [row] })).toBe(false);
    expect(validate.errors?.map((e) => e.keyword)).toContain("required");
  });

  test("an umbrella term as people fails the schema", () => {
    const validate = compile();
    expect(validate({ ...table, rows: [{ ...table.rows[0], people: "Slavs" }] })).toBe(false);
  });

  test("terms are unique and every source id is a manifest source", () => {
    const terms = table.rows.map((r) => r.term);
    expect(new Set(terms).size).toBe(terms.length);
    const ids = new Set(loadManifest().map((m) => m.id));
    for (const r of table.rows) for (const s of r.sources) expect(ids.has(s), `${r.term}: ${s}`).toBe(true);
  });

  test("seeds the six Phase 1 terms, and at least one row is contested", () => {
    const all = table.rows.map((r) => r.term).join(" | ");
    for (const t of ["Little-Russia", "Little-Russians", "Lusatia", "Ruthenians", "Kief and Chernigof", "South-Russian", "Kharkov"]) {
      expect(all).toContain(t);
    }
    expect(table.rows.some((r) => r.contested)).toBe(true);
  });

  test("the validator's people set is the table's people set", () => {
    expect([...tablePeoples()].sort()).toEqual([...new Set(table.rows.map((r) => r.people))].sort());
  });
});

describe("prompt versions", () => {
  const draft = readFileSync(join(ROOT, "prompts/draft.md"), "utf8");
  const verify = readFileSync(join(ROOT, "prompts/verify.md"), "utf8");

  test("headers are draft-v2.1 and verify-v2.1", () => {
    expect(draft.split("\n")[0].trim()).toBe("<!-- draft-v2.1 -->");
    expect(verify.split("\n")[0].trim()).toBe("<!-- verify-v2.1 -->");
  });

  test("verify tells the log to record verify-v2.1, and both prompts name the table", () => {
    expect(verify).toContain('verifier_prompt_version: "verify-v2.1"');
    expect(verify).not.toContain('verifier_prompt_version: "verify-v2"');
    expect(draft).toContain("sources/peoples.json");
    expect(verify).toContain("sources/peoples.json");
  });
});
