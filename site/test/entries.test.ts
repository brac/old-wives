import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CONTENTS_ORDER,
  ENTRIES_DIR,
  REPO_ROOT,
  getEntries,
  getEntry,
  getEntryIds,
  getLoaded,
  getNeighbours,
  getSource,
  indexRows,
  primaryName,
} from "../src/lib/entries.ts";

const diskIds = readdirSync(ENTRIES_DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => f.slice(0, -".json".length));

describe("contents order", () => {
  it("covers exactly the entries on disk, once each", () => {
    expect(new Set(CONTENTS_ORDER).size).toBe(CONTENTS_ORDER.length);
    expect([...CONTENTS_ORDER].sort()).toEqual([...diskIds].sort());
  });

  it("matches the plate table in style/STYLE-SHEET.md", () => {
    const sheet = readFileSync(join(REPO_ROOT, "style", "STYLE-SHEET.md"), "utf8");
    const table = sheet.slice(sheet.indexOf("## The ten plates"), sheet.indexOf("\n## ", sheet.indexOf("## The ten plates") + 1));
    const order = [...table.matchAll(/plates\/slavic\/([a-z0-9-]+)\.thumb\.webp/g)].map((m) => m[1]);
    expect(order).toEqual([...CONTENTS_ORDER]);
  });

  it("getEntries and getEntryIds follow it", () => {
    expect(getEntries().map((e) => e.id)).toEqual([...CONTENTS_ORDER]);
    expect(getEntryIds()).toEqual([...CONTENTS_ORDER]);
  });
});

describe("helpers", () => {
  it("gets one entry by id and rejects unknown ids", () => {
    expect(getEntry("leshy").id).toBe("leshy");
    expect(getLoaded("leshy").raw).toBe(readFileSync(join(ENTRIES_DIR, "leshy.json"), "utf8"));
    expect(() => getEntry("nope")).toThrow(/unknown entry/);
  });

  it("wraps prev/next at both ends", () => {
    const first = CONTENTS_ORDER[0];
    const last = CONTENTS_ORDER[CONTENTS_ORDER.length - 1];
    expect(getNeighbours(first).prev.id).toBe(last);
    expect(getNeighbours(last).next.id).toBe(first);
    expect(getNeighbours(first).next.id).toBe(CONTENTS_ORDER[1]);
  });

  it("capitalises the primary name for display", () => {
    expect(primaryName(getEntry("leshy"))).toBe("Leshy");
    expect(primaryName(getEntry("baba-yaga"))).toBe("Baba Yaga");
    expect(primaryName(getEntry("zmey-gorynych"))).toBe("Zmey Gorynych");
  });

  it("looks up sources from sources/manifest.json", () => {
    const s = getSource("machal1918");
    expect(s).toMatchObject({ author: "Jan Máchal", year: 1918 });
    expect(s.url).toBe("https://archive.org/details/mythologyofallra0003john");
    expect(() => getSource("nope")).toThrow(/unknown source/);
  });

  it("every cite in every entry names a known source", () => {
    for (const e of getEntries()) {
      for (const tag of JSON.stringify(e).match(/"[a-z0-9]+:(?:p|pp|s\.v)\.[^"]*"/g) ?? []) {
        expect(() => getSource(tag.slice(1, tag.indexOf(":")))).not.toThrow();
      }
    }
  });

  it("builds one index row per entry", () => {
    const rows = indexRows();
    expect(rows.map((r) => r.id)).toEqual([...CONTENTS_ORDER]);
    for (const r of rows) expect(r.peoples).toEqual([...new Set(r.peoples)]);
  });
});
