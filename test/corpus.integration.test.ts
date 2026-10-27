// Runs the plan's cite and find rows (stop conditions 8-16) against the real
// committed corpus under sources/pages/.
import { describe, expect, test } from "vitest";
import { findIn } from "../src/corpus/find-cli.js";
import { normalize } from "../src/corpus/normalize.js";
import { diskCorpus, createResolver } from "../src/corpus/resolve.js";

const corpus = diskCorpus();
const resolve = createResolver(corpus);

function text(tag: string): string {
  const r = resolve(tag);
  if (!r.ok) throw new Error(`${tag}: ${r.reason}`);
  return r.pages.map((p) => p.text).join("\n");
}

function pageNum(tag: string): number {
  return Number(/:p\.(\d+)$/.exec(tag)?.[1] ?? NaN);
}

describe("cite rows", () => {
  test("8: machal1918:p.267 contains poludnic", () => {
    expect(normalize(text("machal1918:p.267"))).toContain("poludnic");
  });
  test("9: ralston1872:p.123 contains bannik", () => {
    expect(normalize(text("ralston1872:p.123"))).toContain("bannik");
  });
  test("10: afanasyev1868:p.69 contains банник", () => {
    expect(normalize(text("afanasyev1868:p.69"))).toContain(normalize("банник"));
  });
  test("11: afanasyev1869:p.586 contains яга", () => {
    expect(normalize(text("afanasyev1869:p.586"))).toContain(normalize("яга"));
  });
  test("12: karadzic1818:s.v.Дрекавац contains Ziege", () => {
    expect(text("karadzic1818:s.v.Дрекавац")).toContain("Ziege");
  });
  test("13: frombald1725:p.11 resolves and names Plogojowitz", () => {
    expect(text("frombald1725:p.11")).toMatch(/Plogojo\w+/);
  });
  test("14: machal1918:p.9999 is page not found", () => {
    expect(resolve("machal1918:p.9999")).toEqual({ ok: false, reason: "page not found" });
  });
});

describe("find rows", () => {
  test("15: леший in afanasyev1868 hits within pp. 326-349", () => {
    const hits = findIn(corpus.sources.filter((s) => s.id === "afanasyev1868"), corpus.pages, "леший", 50);
    expect(hits.some((h) => pageNum(h.tag) >= 326 && pageNum(h.tag) <= 349)).toBe(true);
  });
  test("16: lesiy in machal1918 hits within pp. 261-263", () => {
    const hits = findIn(corpus.sources.filter((s) => s.id === "machal1918"), corpus.pages, "lesiy", 50);
    expect(hits.some((h) => pageNum(h.tag) >= 261 && pageNum(h.tag) <= 263)).toBe(true);
  });
});

describe("headword overrides resolve", () => {
  for (const id of ["karadzic1818", "karadzic1852"]) {
    for (const hw of ["Дрекавац", "Вампир", "Вукодлак"]) {
      test(`${id}:s.v.${hw}`, () => {
        const r = resolve(`${id}:s.v.${hw}`);
        const override = corpus.headwords(id).find((h) => h.headword === hw);
        expect(r.ok && r.pages[0]!.leaf).toBe(override?.leaf);
      });
    }
  }
});
