import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import {
  AVOID_PREFIX,
  CLAUSE_CAP,
  GUIDES_TOKENS,
  NEGATIVE_TOKENS,
  PAPER_TOKENS,
  PRESENCE_TOKEN,
  STYLE_TOKENS,
  authorIndex,
  buildPrompt,
  neutralNoun,
  type Overrides,
  type SelectOpts,
} from "../src/plates/prompt.js";

const authors = authorIndex(JSON.parse(readFileSync("sources/manifest.json", "utf8")));
const entry = (id: string) => JSON.parse(readFileSync(`data/entries/${id}.json`, "utf8"));
const overrides = JSON.parse(readFileSync("plates/overrides.json", "utf8")) as Overrides;
const words = (s: string) => s.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];

/** The 2d-a gate configuration for every creature. Formed entries use their largest form. */
export const GATE: Record<string, SelectOpts> = {
  "baba-yaga": {},
  bannik: { scenePresence: true },
  domovoi: { form: "vyatka-little-old-man" },
  drekavac: { scenePresence: true },
  leshy: { form: "ralston-own-shape" },
  poludnitsa: { variant: "polish" },
  rusalka: { form: "full-grown-maiden" },
  vampir: { form: "exhumed-corpse" },
  vodyanoi: { form: "machal-bald-reed-cap" },
  "zmey-gorynych": { form: "ralston-winged-serpent" },
};

describe.each(Object.entries(GATE))("v2 entry %s", (id, sel) => {
  test("prompt holds at most 10 clauses and only entry words, tokens and the presence constant", () => {
    const e = entry(id);
    for (const negativeInline of [false, true]) {
      const p = buildPrompt(e, authors, { ...sel, overrides, negativeInline });
      const allowed = new Set(words(JSON.stringify(e)));
      const fixed = [STYLE_TOKENS, ...Object.values(GUIDES_TOKENS), ...Object.values(PAPER_TOKENS), NEGATIVE_TOKENS, AVOID_PREFIX];
      if (p.interpretive) fixed.push(PRESENCE_TOKEN);
      fixed.push(neutralNoun(e)); // the sanitiser's stand-in for the creature's names
      for (const w of words(fixed.join(" "))) allowed.add(w);
      expect(words(p.prompt).filter((w) => !allowed.has(w))).toEqual([]);
      expect(p.clauses_used.length).toBeGreaterThan(0);
      expect(p.clauses_used.length).toBeLessThanOrEqual(CLAUSE_CAP);
      expect(p.prompt).not.toMatch(/study sheet/);
    }
  });
});

describe("v2 clause selection", () => {
  test("--form takes the clauses with no form plus that form's, and nothing from other forms", () => {
    const e = entry("leshy");
    const p = buildPrompt(e, authors, { form: "ralston-own-shape", cap: 99 });
    const expected = e.appearance.filter((c: { form?: string }) => !c.form || c.form === "ralston-own-shape").map((c: { text: string }) => c.text);
    expect(p.clauses_used.map((c) => c.text)).toEqual(expected);
    expect(p.form).toBe("ralston-own-shape");
    expect(p.interpretive).toBe(false);
  });

  test("an entry with forms and no --form is refused, so forms never mix", () => {
    expect(() => buildPrompt(entry("zmey-gorynych"), authors)).toThrow(/pass --form/);
  });

  test("unknown form or variant ids fail with a clear message", () => {
    expect(() => buildPrompt(entry("zmey-gorynych"), authors, { form: "ralston-winged-serpant" })).toThrow(
      /has no form "ralston-winged-serpant" \(forms: ralston-winged-serpent/,
    );
    expect(() => buildPrompt(entry("poludnitsa"), authors, { variant: "polsh" })).toThrow(/has no variant or form "polsh" \(variants: bohemian/);
    expect(() => buildPrompt(entry("leshy"), authors, { form: "x", variant: "y" })).toThrow(/not both/);
  });

  test("--variant takes that variant's appearance clauses", () => {
    const e = entry("poludnitsa");
    const p = buildPrompt(e, authors, { variant: "polish" });
    const v = e.variants.find((x: { id: string }) => x.id === "polish");
    expect(p.clauses_used.map((c) => c.text)).toEqual(v.appearance.map((c: { text: string }) => c.text));
    expect(p.variant).toBe("polish");
  });

  test("scene plate: scene clauses, the best-supported behaviour clause, then the presence token", () => {
    const e = entry("bannik");
    for (const p of [buildPrompt(e, authors), buildPrompt(e, authors, { scenePresence: true })]) {
      expect(p.field).toBe("scene");
      expect(p.interpretive).toBe(true);
      expect(p.behaviour_clause).not.toBeNull();
      expect(e.behavior_habitat.map((c: { text: string }) => c.text)).toContain(p.behaviour_clause);
      expect(p.clauses_used.at(-1)!.text).toBe(p.behaviour_clause);
      expect(p.prompt_raw).toContain(`${p.behaviour_clause} ${PRESENCE_TOKEN} ${STYLE_TOKENS}`);
      expect(p.prompt.endsWith(`. ${PRESENCE_TOKEN} ${STYLE_TOKENS}`)).toBe(true);
    }
    // With a populated appearance, the scene plate is opt-in.
    expect(buildPrompt(entry("drekavac"), authors).interpretive).toBe(false);
    expect(buildPrompt(entry("drekavac"), authors, { scenePresence: true }).interpretive).toBe(true);
  });

  test("the behaviour clause is chosen by authors, then pages, then entry order", () => {
    const c = (text: string, cites: string[]) => ({ text, cites });
    const e = {
      id: "t",
      schema_version: 2,
      appearance: [],
      scene: [c("scene.", ["ralston1872:p.1"])],
      behavior_habitat: [c("one.", ["ralston1872:p.1"]), c("two.", ["ralston1872:p.1", "ralston1872:p.2"]), c("three.", ["ralston1872:p.1", "afanasyev1868:p.2"])],
    };
    expect(buildPrompt(e, authors).behaviour_clause).toBe("three.");
  });

  test("v1 bake-off copies still build, with --form meaning a variant", () => {
    const e = JSON.parse(readFileSync("plates/bakeoff/v1/baba-yaga.json", "utf8"));
    expect(buildPrompt(e, authors).field).toBe("appearance");
    expect(buildPrompt(JSON.parse(readFileSync("plates/bakeoff/v1/bannik.json", "utf8")), authors).interpretive).toBe(false);
  });
});

describe("human edits", () => {
  test("baba-yaga's two dropped clauses are removed before the cap and recorded", () => {
    const e = entry("baba-yaga");
    const p = buildPrompt(e, authors, { overrides, cap: 99 });
    const texts = p.clauses_used.map((c) => c.text);
    for (const d of overrides["baba-yaga"].drop) expect(texts).not.toContain(d.text);
    expect(p.human_edits.map((h) => h.text)).toEqual(overrides["baba-yaga"].drop.map((d) => d.text));
    expect(p.human_edits.every((h) => h.by === "Ben" && h.date === "2026-10-27" && h.reason.length > 0)).toBe(true);
    expect(texts.length).toBe(e.appearance.length - 2);
  });

  test("an override whose text matches no clause fails loudly", () => {
    const bad: Overrides = { "baba-yaga": { drop: [{ text: "Her nose is of brass.", reason: "r", by: "Ben", date: "2026-10-27" }] } };
    expect(() => buildPrompt(entry("baba-yaga"), authors, { overrides: bad })).toThrow(/matches no clause/);
  });

  test("an override missing its reason, author or date is refused", () => {
    const bad = { "baba-yaga": { drop: [{ text: "Her nose is sometimes described as being of iron." }] } } as unknown as Overrides;
    expect(() => buildPrompt(entry("baba-yaga"), authors, { overrides: bad })).toThrow(/needs text, reason, by and date/);
  });
});
