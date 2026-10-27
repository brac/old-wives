import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { authorIndex, buildPrompt, nameForms, neutralNoun, sanitiseClause } from "../src/plates/prompt.js";

const authors = authorIndex(JSON.parse(readFileSync("sources/manifest.json", "utf8")));
const entry = (id: string) => JSON.parse(readFileSync(`data/entries/${id}.json`, "utf8"));

/** Any quotation mark; an apostrophe between two letters (a possessive) is not one. */
const QUOTE_MARK = /["“”„‟«»‹›‚]|(?<![\p{L}\p{N}])['‘’]|['‘’](?![\p{L}\p{N}])/u;
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const hasName = (text: string, names: string[]) =>
  names.filter((n) => new RegExp(`(?<![\\p{L}\\p{N}])${escapeRe(n)}(?![\\p{L}\\p{N}])`, "iu").test(text));

describe("prompt sanitiser on zmey-gorynych's real clauses", () => {
  const e = entry("zmey-gorynych");
  const names = nameForms(e);
  const noun = neutralNoun(e);
  const clauses: string[] = (e.appearance as Array<{ text: string }>).map((c) => c.text);

  test("the entry really carries the hazards the sanitiser removes", () => {
    expect(names).toEqual(expect.arrayContaining(["Zmey Gorynych", "Горынычъ", "Zmei Goruinuich", "Goruinuich", "Горынчище"]));
    expect(clauses.some((c) => QUOTE_MARK.test(c))).toBe(true);
    expect(clauses.some((c) => hasName(c, names).length > 0)).toBe(true);
    expect(noun).toBe("the serpent");
  });

  test("no sent clause holds a quotation mark", () => {
    for (const c of clauses) expect(sanitiseClause(c, names, noun)).not.toMatch(QUOTE_MARK);
  });

  test("no sent clause holds any name form of the creature", () => {
    for (const c of clauses) expect(hasName(sanitiseClause(c, names, noun), names)).toEqual([]);
  });

  test("no sent clause holds a parenthetical", () => {
    for (const c of clauses) expect(sanitiseClause(c, names, noun)).not.toMatch(/[()[\]]/);
  });

  test("the patronymic phrase goes with its name, leaving no stub", () => {
    const c = clauses.find((t) => t.includes("patronymic"))!;
    expect(sanitiseClause(c, names, noun)).toBe("The stories describe the Serpent as fiery.");
  });

  test("the built prompt sends the sanitised text and keeps the raw text", () => {
    const p = buildPrompt(e, authors, { form: "ralston-winged-serpent" });
    expect(p.prompt_raw).toContain('"fiery"');
    expect(p.prompt_raw).toContain("Goruinuich");
    expect(p.prompt).not.toMatch(QUOTE_MARK);
    expect(hasName(p.prompt, names)).toEqual([]);
    expect(p.prompt).toContain("the Snake is a serpent");
    expect(e.appearance.map((c: { text: string }) => c.text)).toEqual(clauses); // the entry is unchanged
  });
});

describe("prompt sanitiser on text with nothing to remove", () => {
  test("a clause with no names, quotes or asides passes through unchanged", () => {
    const e = entry("vodyanoi");
    for (const c of ["He has a fat belly.", "He wears a high cap of reeds on his head."]) {
      expect(sanitiseClause(c, nameForms(e), neutralNoun(e))).toBe(c);
    }
    const p = buildPrompt(e, authors, { form: "machal-bald-reed-cap" });
    expect(p.prompt).toBe(p.prompt_raw);
  });

  test("names elsewhere in a word are left alone, and the noun takes a sentence start", () => {
    expect(sanitiseClause("Baba Yaga flies. The yagaberry is red.", ["Baba Yaga", "Yaga"], "the creature")).toBe(
      "The creature flies. The yagaberry is red.",
    );
  });
});
