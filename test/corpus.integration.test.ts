// Runs the plan's cite and find rows (stop conditions 8-16) against the real
// committed corpus under sources/pages/.
import { describe, expect, test } from "vitest";
import { auditPages, isNumericLabel } from "../src/corpus/audit.js";
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
  // Each case had a wrong or missing text match: an override must win over an earlier matching line.
  for (const [tag, leaf, why] of [
    ["karadzic1852:s.v.Усуд", 807, "text match lands on the cross-reference on leaf 739"],
    ["karadzic1852:s.v.мора", 383, "text match lands on running text on leaf 193"],
    ["karadzic1818:s.v.Вила", 113, "OCR prints the headword as Busa"],
  ] as const) {
    test(`${tag} -> leaf ${leaf} (${why})`, () => {
      const r = resolve(tag);
      expect(r.ok && r.via).toBe("override");
      expect(r.ok && r.pages[0]!.leaf).toBe(leaf);
    });
  }
});

// Page-label audit: the label must match the number printed in the leaf's running header.
// Known defects stay visible here with their own floor instead of being tuned away.
const AUDIT_FLOOR = 0.95;
const KNOWN_LABEL_DEFECTS: Record<string, { floor: number; why: string }> = {
  machal1918: {
    floor: 0.9,
    why: "IA counts plate leaves as pages at leaves 125-153 (printed pp. 87-107 labelled 91-115, so pp. 108-115 are doubled); no data/ tag cites that range",
  },
};

describe("page-label audit", () => {
  const paged = corpus.sources.filter((s) => s.locator === "page" && corpus.pages(s.id).some((r) => isNumericLabel(r.page)));
  const results = paged.map((s) => ({ id: s.id, ...auditPages(corpus.pages(s.id)) }));

  test("prints per-source agreement", () => {
    for (const r of results) {
      const pct = r.found > 0 ? ((100 * r.agree) / r.found).toFixed(1) : "-";
      const known = KNOWN_LABEL_DEFECTS[r.id] ? " [known defect]" : "";
      console.log(`audit ${r.id}: ${r.agree}/${r.found} header numbers agree (${pct}%), ${r.numeric} numeric labels${known}`);
    }
    expect(results.length).toBeGreaterThan(0);
  });

  for (const r of results) {
    const known = KNOWN_LABEL_DEFECTS[r.id];
    const floor = known?.floor ?? AUDIT_FLOOR;
    test(`${r.id}: >= ${floor * 100}% of found header numbers agree with the label`, () => {
      if (r.found === 0) return;
      expect(r.agree / r.found).toBeGreaterThanOrEqual(floor);
    });
  }
});

describe("afanasyev1865 header labels", () => {
  const pages = corpus.pages("afanasyev1865");
  test("p.25 is leaf 29, whose text starts with its printed number", () => {
    expect(text("afanasyev1865:p.25").split("\n")[0]).toBe("25");
  });
  test("numeric labels are unique and increase with the leaf", () => {
    const nums = pages.filter((r) => isNumericLabel(r.page)).map((r) => Number(r.page));
    for (let i = 1; i < nums.length; i++) expect(nums[i]!).toBeGreaterThan(nums[i - 1]!);
  });
  test("leaf 13 (no header) is inferred from its neighbours, not the dominant offset", () => {
    expect(pages.find((r) => r.leaf === 13)).toMatchObject({ page: "9", page_inferred: true });
  });
});
