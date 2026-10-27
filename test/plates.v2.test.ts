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
  nameForms,
  neutralNoun,
  styleTokens,
  type HumanEdit,
  type Overrides,
  type SelectOpts,
} from "../src/plates/prompt.js";

const authors = authorIndex(JSON.parse(readFileSync("sources/manifest.json", "utf8")));
const entry = (id: string) => JSON.parse(readFileSync(`data/entries/${id}.json`, "utf8"));
const allOverrides = JSON.parse(readFileSync("plates/overrides.json", "utf8")) as Overrides;
/** The overrides without the 2d-d visual entries: the clause path these tests cover. */
const overrides: Overrides = Object.fromEntries(Object.entries(allOverrides).map(([id, o]) => [id, { drop: o.drop ?? [] }]));
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
    const drop = overrides["baba-yaga"].drop!;
    for (const d of drop) expect(texts).not.toContain(d.text);
    expect(p.human_edits.map((h) => h.text)).toEqual(drop.map((d) => d.text));
    expect((p.human_edits as HumanEdit[]).every((h) => h.by === "Ben" && h.date === "2026-10-27" && h.reason.length > 0)).toBe(true);
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

describe("visual overrides (2d-d)", () => {
  const ids = Object.keys(GATE);

  test("all ten creatures carry a visual override from Ben, and baba-yaga keeps her drop list", () => {
    for (const id of ids) {
      const v = allOverrides[id]?.visual;
      expect(v, id).toBeDefined();
      expect(v).toMatchObject({ basis: "visual tradition", by: "Ben", date: "2026-10-27" });
      expect(v!.note!.length).toBeGreaterThan(0);
    }
    expect(allOverrides["baba-yaga"].drop).toHaveLength(2);
  });

  test.each(ids)("%s: no quote mark, no word of a name form, and no iron, green, red or blue in the text", (id) => {
    const text = allOverrides[id].visual!.text;
    expect(text).not.toMatch(/["“”„«»]/);
    // An apostrophe between two letters (a stag's antlers) is not a quote, as in the sanitiser.
    expect(text).not.toMatch(/(?<![\p{L}\p{N}])['‘’]|['‘’](?![\p{L}\p{N}])/u);
    const textWords = new Set(words(text));
    const nameWords = nameForms(entry(id)).flatMap((n) => words(n));
    expect(nameWords.filter((w) => textWords.has(w))).toEqual([]);
    for (const w of ["iron", "green", "red", "blue"]) expect(textWords.has(w)).toBe(false);
  });

  test.each(ids)("%s: the prompt is built from the visual text and the sidecar fields are set", (id) => {
    const e = entry(id);
    const v = allOverrides[id].visual!;
    for (const style of ["a", "b"] as const) {
      const p = buildPrompt(e, authors, { overrides: allOverrides, style });
      expect(p.prompt).toBe(`${v.text} ${styleTokens({ style })}`);
      expect(p.prompt_raw).toBe(p.prompt);
      expect(p.negative).toBe(v.negative_extra ? `${NEGATIVE_TOKENS}, ${v.negative_extra}` : NEGATIVE_TOKENS);
      expect(p.field).toBe("visual");
      expect(p.style).toBe(style);
      expect(p.interpretive).toBe(true);
      expect(p.clauses_used).toEqual([]);
      expect(p.clauses_dropped).toEqual([]);
      expect(p.human_edits).toEqual([{ type: "visual-tradition", text: v.text, by: "Ben", date: "2026-10-27" }]);
      const inline = buildPrompt(e, authors, { overrides: allOverrides, style, negativeInline: true });
      expect(inline.negative).toBe("");
      expect(inline.prompt.endsWith(`${AVOID_PREFIX} ${p.negative}`)).toBe(true);
    }
  });

  test("the visual text passes through the sanitiser", () => {
    const e = entry("leshy");
    const o: Overrides = { leshy: { visual: { text: 'A "leshy" (forest) man.', basis: "visual tradition", by: "Ben", date: "2026-10-27" } } };
    const p = buildPrompt(e, authors, { overrides: o });
    const subject = p.prompt.slice(0, p.prompt.indexOf(styleTokens()));
    expect(subject).not.toMatch(/["()]|leshy|forest/i);
    expect(subject).toContain("creature");
    expect(p.prompt_raw.startsWith('A "leshy" (forest) man. ')).toBe(true);
  });

  test("--form, --variant or --scene-presence with a visual override throws", () => {
    expect(() => buildPrompt(entry("zmey-gorynych"), authors, { overrides: allOverrides, form: "ralston-winged-serpent" })).toThrow(/visual override/);
    expect(() => buildPrompt(entry("poludnitsa"), authors, { overrides: allOverrides, variant: "polish" })).toThrow(/visual override/);
    expect(() => buildPrompt(entry("drekavac"), authors, { overrides: allOverrides, scenePresence: true })).toThrow(/visual override/);
  });

  test("a visual override missing its basis, author or date is refused", () => {
    const bad = { leshy: { visual: { text: "An old man." } } } as unknown as Overrides;
    expect(() => buildPrompt(entry("leshy"), authors, { overrides: bad })).toThrow(/needs text, basis, by and date/);
  });

  test("visual takes precedence over drop for baba-yaga", () => {
    const p = buildPrompt(entry("baba-yaga"), authors, { overrides: allOverrides });
    expect(p.human_edits).toHaveLength(1);
    expect(p.prompt).not.toMatch(/iron/i);
  });
});
