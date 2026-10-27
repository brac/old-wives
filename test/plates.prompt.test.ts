import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import {
  AVOID_PREFIX,
  CLAUSE_CAP,
  NEGATIVE_TOKENS,
  GUIDES_TOKENS,
  PAPER_TOKENS,
  STYLE_TOKENS,
  STYLES,
  authorIndex,
  buildPrompt,
  capClauses,
  rankClause,
  styleTokens,
} from "../src/plates/prompt.js";

const authors = authorIndex(JSON.parse(readFileSync("sources/manifest.json", "utf8")));
const entry = (id: string) => JSON.parse(readFileSync(`plates/bakeoff/v1/${id}.json`, "utf8"));

const words = (s: string) => s.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];

function entryWords(e: unknown): Set<string> {
  return new Set(words(JSON.stringify(e)));
}

describe("tokens", () => {
  test("negative tokens are bare nouns: no item starts with \"no \"", () => {
    const items = NEGATIVE_TOKENS.split(",").map((t) => t.trim());
    expect(items.length).toBe(18);
    for (const t of items) expect(t.toLowerCase().startsWith("no ")).toBe(false);
  });

  test("positive tokens default to guides off and plain paper; negatives carry the no-script list", () => {
    expect(STYLE_TOKENS).toBe(
      "silverpoint study, metalpoint drawing, Renaissance sketch, hatching and cross-hatching, fine line, high contrast, sharp focus, monochrome, clean light paper ground",
    );
    expect(styleTokens()).toBe(styleTokens({ guides: "off", paper: "plain", style: "a" }));
    expect(styleTokens({ style: "b" })).toBe(
      "silverpoint drawing, metalpoint, hatching and cross-hatching, fine line, high contrast, sharp focus, monochrome, clean light paper ground, plain empty background",
    );
    expect(NEGATIVE_TOKENS.startsWith("painterly fantasy concept art")).toBe(true);
    expect(NEGATIVE_TOKENS.endsWith(
      "watermark, border, handwriting, inscriptions, annotations, script, lettering, captions",
    )).toBe(true);
    const p = buildPrompt(entry("baba-yaga"), authors);
    expect(p.guides).toBe("off");
    expect(p.paper).toBe("plain");
    expect(p.style).toBe("a");
    expect(p.prompt.endsWith(` ${STYLE_TOKENS}`)).toBe(true);
    expect(buildPrompt(entry("baba-yaga"), authors, { style: "b" }).prompt.endsWith(` ${styleTokens({ style: "b" })}`)).toBe(true);
  });

  test('no positive style item starts with "no ", for every guides, paper and style', () => {
    for (const style of STYLES) {
      for (const guides of ["on", "off"] as const) {
        for (const paper of ["plain", "prepared"] as const) {
          const items = styleTokens({ guides, paper, style }).split(",").map((t) => t.trim());
          for (const t of items) {
            expect(t.length).toBeGreaterThan(0);
            expect(t.toLowerCase().startsWith("no ")).toBe(false);
          }
        }
      }
    }
  });

  test("style b has no study, sketch or Renaissance; guides on keeps its phrase in both styles", () => {
    for (const guides of ["on", "off"] as const) {
      for (const paper of ["plain", "prepared"] as const) {
        expect(styleTokens({ guides, paper, style: "b" })).not.toMatch(/study|sketch|renaissance/i);
        for (const style of STYLES) {
          const t = styleTokens({ guides, paper, style });
          if (guides === "on") expect(t).toContain(GUIDES_TOKENS.on);
          else expect(t).not.toMatch(/grid|measuring/);
        }
      }
    }
    expect(() => styleTokens({ style: "c" as never })).toThrow(/unknown style option/);
  });

  test('"study sheet" is gone from every style combination', () => {
    for (const style of STYLES) {
      for (const guides of ["on", "off"] as const) {
        for (const paper of ["plain", "prepared"] as const) expect(styleTokens({ guides, paper, style })).not.toMatch(/study sheet/);
      }
    }
  });
});

describe("style switches", () => {
  test("each switch emits its own wording and not the other value's", () => {
    expect(GUIDES_TOKENS.on).toBe("proportion lines, faint construction grid and measuring marks around the figure");
    expect(GUIDES_TOKENS.off).toBe("");
    expect(PAPER_TOKENS.plain).toBe("clean light paper ground");
    expect(PAPER_TOKENS.prepared).toBe("lightly prepared paper, pale warm tint, faint paper tooth");
    for (const guides of ["on", "off"] as const) {
      for (const paper of ["plain", "prepared"] as const) {
        const t = styleTokens({ guides, paper });
        if (guides === "on") expect(t).toContain(GUIDES_TOKENS.on);
        else expect(t).not.toContain(GUIDES_TOKENS.on);
        expect(t).toContain(PAPER_TOKENS[paper]);
        expect(t).not.toContain(PAPER_TOKENS[paper === "plain" ? "prepared" : "plain"]);
        expect(t).not.toContain("visible construction lines");
        expect(t).not.toContain("blank paper ground");
        expect(t).not.toContain("on prepared paper");
        if (paper === "plain") expect(t).not.toMatch(/prepared/);
        if (guides === "off") expect(t).not.toMatch(/proportion lines|faint construction grid/);
        const p = buildPrompt(entry("baba-yaga"), authors, { guides, paper });
        expect(p.prompt.endsWith(` ${t}`)).toBe(true);
        expect(p.guides).toBe(guides);
        expect(p.paper).toBe(paper);
      }
    }
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
      const styles = [STYLE_TOKENS, ...Object.values(GUIDES_TOKENS), ...Object.values(PAPER_TOKENS)].join(" ");
      for (const w of words(`${styles} ${NEGATIVE_TOKENS} ${AVOID_PREFIX}`)) allowed.add(w);
      expect(words(p.prompt).filter((w) => !allowed.has(w))).toEqual([]);
      expect(p.clauses_used.length).toBeLessThanOrEqual(10);
      expect(p.clauses_used.length + p.clauses_dropped.length).toBe(e.appearance.length || e.scene.length);
    }
  });
});
