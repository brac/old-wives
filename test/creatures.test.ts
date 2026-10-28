import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { loadManifest } from "../src/corpus/manifest.js";
import { tablePeoples } from "../src/validate/validate.js";

const ROOT = join(import.meta.dirname, "..");

type Hint = { source_id: string; pages: string; note?: string };
type Creature = {
  id: string;
  romanized: string;
  family: string;
  expected_peoples: string[];
  spellings: string[];
  source_hints: Hint[];
  batch?: number;
};

const PILOT = ["domovoi", "bannik", "rusalka", "vodyanoi", "leshy", "poludnitsa", "vampir", "drekavac", "zmey-gorynych", "baba-yaga"];

// The entry schema's family enum, minus "unclassified" (a hint always names a family).
const FAMILIES = (() => {
  const schema = JSON.parse(readFileSync(join(ROOT, "schema/entry.schema.json"), "utf8"));
  const found: string[][] = [];
  const walk = (n: unknown): void => {
    if (Array.isArray(n)) n.forEach(walk);
    else if (n && typeof n === "object") {
      const o = n as Record<string, unknown>;
      if (Array.isArray(o.enum) && o.enum.includes("household")) found.push(o.enum as string[]);
      Object.values(o).forEach(walk);
    }
  };
  walk(schema);
  return new Set(found[0]!.filter((f) => f !== "unclassified"));
})();

describe("prompts/creatures.json", () => {
  const raw = readFileSync(join(ROOT, "prompts/creatures.json"), "utf8");
  const { creatures } = JSON.parse(raw) as { creatures: Creature[] };
  const tranche = creatures.filter((c) => c.batch !== undefined);

  test("parses, with unique ids", () => {
    expect(creatures.length).toBeGreaterThan(PILOT.length);
    expect(new Set(creatures.map((c) => c.id)).size).toBe(creatures.length);
  });

  test("the ten pilot rows come first, in order, with no batch", () => {
    expect(creatures.slice(0, PILOT.length).map((c) => c.id)).toEqual(PILOT);
    for (const c of creatures.slice(0, PILOT.length)) expect(c.batch).toBeUndefined();
  });

  test("every source_id is in the manifest", () => {
    const ids = new Set(loadManifest().map((s) => s.id));
    for (const c of creatures) for (const h of c.source_hints) expect(ids, `${c.id}: ${h.source_id}`).toContain(h.source_id);
  });

  test("every tranche row is complete, with a known family and table peoples", () => {
    const people = tablePeoples();
    for (const c of tranche) {
      expect([1, 2, 3], c.id).toContain(c.batch);
      expect(FAMILIES, `${c.id}: ${c.family}`).toContain(c.family);
      expect(c.romanized.length, c.id).toBeGreaterThan(0);
      expect(c.spellings.length, c.id).toBeGreaterThan(0);
      expect(c.source_hints.length, c.id).toBeGreaterThan(0);
      expect(c.expected_peoples.length, c.id).toBeGreaterThan(0);
      for (const p of c.expected_peoples) expect(people, `${c.id}: ${p}`).toContain(p);
      for (const h of c.source_hints) expect(h.pages.length, `${c.id}: ${h.source_id}`).toBeGreaterThan(0);
    }
  });

  test("no tranche row is a pilot id", () => {
    for (const c of tranche) expect(PILOT).not.toContain(c.id);
  });

  test("each batch holds at most ten, spans at least four families and is not all household", () => {
    for (const b of [1, 2, 3]) {
      const rows = tranche.filter((c) => c.batch === b);
      expect(rows.length, `batch ${b}`).toBeLessThanOrEqual(10);
      const families = new Set(rows.map((c) => c.family));
      expect(families.size, `batch ${b}`).toBeGreaterThanOrEqual(4);
      expect([...families], `batch ${b}`).not.toEqual(["household"]);
    }
  });
});
