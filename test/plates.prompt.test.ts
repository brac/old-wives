import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import {
  AVOID_PREFIX,
  CLAUSE_CAP,
  NEGATIVE_TOKENS,
  STYLE_TOKENS,
  authorIndex,
  buildPrompt,
  capClauses,
  rankClause,
} from "../src/plates/prompt.js";

const authors = authorIndex(JSON.parse(readFileSync("sources/manifest.json", "utf8")));
const entry = (id: string) => JSON.parse(readFileSync(`data/entries/${id}.json`, "utf8"));

const words = (s: string) => s.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];

function entryWords(e: unknown): Set<string> {
  return new Set(words(JSON.stringify(e)));
}

describe("tokens", () => {
  test("positive and negative tokens are the brainstorm C1 and C4 text", () => {
    expect(STYLE_TOKENS.startsWith("silverpoint study, metalpoint drawing on prepared paper")).toBe(true);
    expect(STYLE_TOKENS.endsWith("blank paper ground, study sheet")).toBe(true);
    expect(NEGATIVE_TOKENS.startsWith("no painterly fantasy concept art")).toBe(true);
    expect(NEGATIVE_TOKENS.endsWith("no watermark, no border")).toBe(true);
  });
});

describe("ranking and cap", () => {
  test("support counts distinct authors, then distinct pages", () => {
    // ralston1872 and ralston1873 are the same author.
    const r = rankClause({ text: "x", cites: ["ralston1872:p.1", "ralston1873:p.2", "afanasyev1868:p.3"] }, authors);
    expect(r.authors).toBe(2);
    expect(r.pages).toBe(3);
  });

  test("unknown source ids are an error, not a silent zero", () => {
    expect(() => rankClause({ text: "x", cites: ["nobody1900:p.1"] }, authors)).toThrow(/unknown source/);
  });

  test("cap keeps the best supported and emits them in entry order", () => {
    const c = (text: string, a: number, p: number) => ({ text, cites: [], authors: a, pages: p });
    const { used, dropped } = capClauses([c("a", 1, 1), c("b", 2, 1), c("c", 1, 3), c("d", 1, 1)], 2);
    expect(used.map((x) => x.text)).toEqual(["b", "c"]);
    expect(dropped.map((x) => x.text)).toEqual(["a", "d"]);
  });

  test(`a 12-clause entry yields exactly ${10} clauses`, () => {
    expect(CLAUSE_CAP).toBe(10);
    const appearance = Array.from({ length: 12 }, (_, i) => ({
      text: `clause${i}.`,
      cites: i < 2 ? ["ralston1872:p.1"] : ["ralston1872:p.1", "afanasyev1868:p.2"],
    }));
    const p = buildPrompt({ id: "t", appearance, variants: [] }, authors);
    expect(p.clauses_used).toHaveLength(10);
    expect(p.clauses_dropped.map((c) => c.text)).toEqual(["clause0.", "clause1."]);
  });
});

describe("entry reading", () => {
  test("scene clauses are used when appearance is empty", () => {
    const p = buildPrompt(entry("bannik"), authors);
    expect(p.field).toBe("scene");
    expect(p.clauses_used.length).toBeGreaterThan(0);
  });

  test("--form selects a variant, and a missing or empty form throws", () => {
    const e = { id: "t", appearance: [{ text: "base.", cites: ["ralston1872:p.1"] }], variants: [{ id: "v", appearance: [{ text: "variant.", cites: ["ralston1872:p.2"] }] }, { id: "empty", appearance: [] }] };
    expect(buildPrompt(e, authors, { form: "v" }).prompt.startsWith("variant.")).toBe(true);
    expect(() => buildPrompt(e, authors, { form: "nope" })).toThrow(/no variant/);
    expect(() => buildPrompt(e, authors, { form: "empty" })).toThrow(/no appearance/);
  });

  test("negative goes inline as Avoid: when the endpoint has no negative_prompt", () => {
    const p = buildPrompt(entry("baba-yaga"), authors, { negativeInline: true });
    expect(p.negative).toBe("");
    expect(p.prompt.endsWith(`${AVOID_PREFIX} ${NEGATIVE_TOKENS}`)).toBe(true);
  });
});

describe.each(["baba-yaga", "bannik", "zmey-gorynych"])("bake-off entry %s", (id) => {
  test("prompt holds no word absent from the entry apart from the tokens, and at most 10 clauses", () => {
    const e = entry(id);
    for (const negativeInline of [false, true]) {
      const p = buildPrompt(e, authors, { negativeInline });
      const allowed = entryWords(e);
      for (const w of words(`${STYLE_TOKENS} ${NEGATIVE_TOKENS} ${AVOID_PREFIX}`)) allowed.add(w);
      expect(words(p.prompt).filter((w) => !allowed.has(w))).toEqual([]);
      expect(p.clauses_used.length).toBeLessThanOrEqual(10);
      expect(p.clauses_used.length + p.clauses_dropped.length).toBe(e.appearance.length || e.scene.length);
    }
  });
});
