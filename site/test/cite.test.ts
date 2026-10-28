import { describe, expect, it } from "vitest";
import { chip, chipLabel, formatLocus, parseCite, surname } from "../src/lib/cite.ts";

describe("cite chip formatting", () => {
  it("formats a single page", () => {
    expect(chipLabel("machal1918:p.240", "Jan Máchal", 1918)).toBe("Máchal 1918, p. 240");
  });

  it("formats a page range with an en dash", () => {
    expect(chipLabel("ralston1872:pp.145-146", "W. R. S. Ralston", 1872)).toBe("Ralston 1872, pp. 145–146");
  });

  it("formats a roman-numeral page", () => {
    expect(chipLabel("ralston1872:p.xiii", "W. R. S. Ralston", 1872)).toBe("Ralston 1872, p. xiii");
  });

  it("formats an s.v. headword", () => {
    expect(chipLabel("karadzic1818:s.v.Дрекавац", "Вук Стефановић Караџић (Vuk Stefanović Karadžić)", 1818)).toBe(
      "Karadžić 1818, s.v. Дрекавац",
    );
  });

  it("parses the three tag kinds", () => {
    expect(parseCite("a1:p.5")).toEqual({ sourceId: "a1", kind: "p", locus: "5" });
    expect(parseCite("a1:pp.5-7")).toEqual({ sourceId: "a1", kind: "pp", locus: "5-7" });
    expect(parseCite("a1:s.v.Вампир")).toEqual({ sourceId: "a1", kind: "sv", locus: "Вампир" });
    expect(formatLocus(parseCite("a1:s.v.Вампир"))).toBe("s.v. Вампир");
  });

  it("rejects a malformed tag", () => {
    expect(() => parseCite("machal1918 p.240")).toThrow(/malformed/);
    expect(() => parseCite("machal1918:page 240")).toThrow(/malformed/);
  });

  it("picks the surname", () => {
    expect(surname("Frombald")).toBe("Frombald");
    expect(surname("А. Н. Афанасьев (A. N. Afanasyev)")).toBe("Afanasyev");
    expect(surname("Augustin Calmet, trans. Henry Christmas")).toBe("Calmet");
    expect(surname("Karel Jaromír Erben")).toBe("Erben");
  });

  it("links the manifest URL, falling back to the entry's own URL", () => {
    const src = { author: "Jan Máchal", year: 1918 };
    expect(chip("machal1918:p.240", { ...src, url: "https://archive.org/details/x" }, "https://e").href).toBe(
      "https://archive.org/details/x",
    );
    expect(chip("machal1918:p.240", { ...src, url: undefined }, "https://e").href).toBe("https://e");
    expect(chip("machal1918:p.240", { ...src, url: undefined }).href).toBeUndefined();
  });
});
