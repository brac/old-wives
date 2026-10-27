import { describe, expect, test } from "vitest";
import { normalize } from "../src/corpus/normalize.js";

describe("normalize", () => {
  test("pre-reform Cyrillic folds to modern: лѣшій == леший", () => {
    expect(normalize("лѣшій")).toBe(normalize("леший"));
    expect(normalize("Лѣшій")).toBe("лешии");
  });

  test("Latin diacritics and case fold: LéSiy == lesiy", () => {
    expect(normalize("LéSiy")).toBe("lesiy");
    expect(normalize("Lésiy")).toBe("lesiy");
  });

  test("letter map ѣ і ѳ ѵ ё й", () => {
    expect(normalize("ѣ і ѳ ѵ ё й")).toBe("е и ф и е и");
  });

  test("word-final ъ is dropped, medial ъ kept", () => {
    expect(normalize("банникъ")).toBe("банник");
    expect(normalize("горынычъ, объ")).toBe("горыныч, об");
    expect(normalize("объявить")).toBe("объявить");
  });

  test("whitespace collapses and trims", () => {
    expect(normalize("  a \n\t b  ")).toBe("a b");
  });

  test("NFC and NFD inputs normalise the same", () => {
    expect(normalize("Poludnica".normalize("NFD"))).toBe(normalize("Poludnica"));
    expect(normalize("Máchal".normalize("NFD"))).toBe("machal");
  });
});
