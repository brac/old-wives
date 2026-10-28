import { describe, expect, it } from "vitest";
import { parseCite } from "../src/lib/cite.ts";
import { deepLink, deepLinkMode } from "../src/lib/deeplink.ts";
import { entryChip, getSources, getEntries } from "../src/lib/entries.ts";

/** Every cite tag in an entry: the members of every `cites` array, at any depth. */
function allCites(v: unknown, out: string[] = []): string[] {
  if (Array.isArray(v)) for (const x of v) allCites(x, out);
  else if (v && typeof v === "object") {
    for (const [k, x] of Object.entries(v)) {
      if (k === "cites" && Array.isArray(x)) out.push(...(x as string[]));
      else allCites(x, out);
    }
  }
  return out;
}

const pages = [
  { leaf: 1, page: null },
  { leaf: 10, page: "xiii" },
  { leaf: 250, page: "240" },
  { leaf: 251, page: "241" },
  { leaf: 120, page: "108" },
  { leaf: 128, page: "108" },
];
const item = "mythologyofallra0003john";

describe("deepLinkMode", () => {
  it("allows only archive.org page sources with IA's own labels", () => {
    expect(deepLinkMode({ iaItem: item, locator: "page", pageLabelSource: undefined })).toBe("ia-label");
    expect(deepLinkMode({ iaItem: item, locator: "page", pageLabelSource: "ia" })).toBe("ia-label");
    expect(deepLinkMode({ iaItem: item, locator: "page", pageLabelSource: "header" })).toBe("header-ia-label");
    expect(deepLinkMode({ iaItem: item, locator: "headword", pageLabelSource: undefined })).toBe("item");
    expect(deepLinkMode({ iaItem: undefined, locator: "page", pageLabelSource: undefined })).toBe("item");
  });
});

describe("deepLink", () => {
  it("links a single page by its label", () => {
    expect(deepLink(item, "ia-label", parseCite("machal1918:p.240"), pages)).toBe(
      "https://archive.org/details/mythologyofallra0003john/page/240",
    );
  });

  it("links a roman front-matter label", () => {
    expect(deepLink(item, "ia-label", parseCite("machal1918:p.xiii"), pages)).toBe(
      "https://archive.org/details/mythologyofallra0003john/page/xiii",
    );
  });

  it("links a range to its first page", () => {
    expect(deepLink(item, "ia-label", parseCite("machal1918:pp.240-241"), pages)).toBe(
      "https://archive.org/details/mythologyofallra0003john/page/240",
    );
  });

  it("refuses a repeated label, a missing label, a headword, and item-mode sources", () => {
    expect(deepLink(item, "ia-label", parseCite("machal1918:p.108"), pages)).toBeUndefined();
    expect(deepLink(item, "ia-label", parseCite("machal1918:p.999"), pages)).toBeUndefined();
    expect(deepLink(item, "ia-label", parseCite("machal1918:s.v.Leshy"), pages)).toBeUndefined();
    expect(deepLink(item, "item", parseCite("machal1918:p.240"), pages)).toBeUndefined();
    expect(deepLink(undefined, "ia-label", parseCite("machal1918:p.240"), pages)).toBeUndefined();
  });
});

describe("chips on real entries", () => {
  it("every chip links to a page of its own item, the item, or the entry's own URL", () => {
    const sources = getSources();
    for (const e of getEntries()) {
      for (const tag of allCites(e)) {
        const c = entryChip(e, tag);
        const s = sources.get(parseCite(tag).sourceId)!;
        if (s.deepLinkMode === "item" || parseCite(tag).kind === "sv") {
          expect(c.href, tag).not.toMatch(/\/page\//);
        } else if (s.url && s.deepLinkMode === "header-ia-label") {
          expect(c.href === s.url || c.href.startsWith(`${s.url}/page/`), tag).toBe(true);
        } else if (s.url) {
          expect([s.url, `${s.url}/page/${encodeURIComponent(parseCite(tag).locus.split("-")[0]!)}`], tag).toContain(c.href);
        }
      }
    }
  });
});

describe("header-labelled sources (phase 4a)", () => {
  // Máchal 1918 around the plates: IA counts the plate leaves, the printed headers do not.
  const hdr = [
    { leaf: 125, page: "87" }, // blank plate leaf, kept on IA's label
    { leaf: 129, page: "87", iaPage: "91" },
    { leaf: 139, page: "95", iaPage: "101" },
    { leaf: 145, page: "101", iaPage: "107" },
    { leaf: 153, page: "115", page_inferred: true },
    { leaf: 160, page: "115", iaPage: "108" },
    { leaf: 161, page: "108" },
    { leaf: 286, page: "240" },
  ];
  it("links a header label by the cited leaf's IA label", () => {
    expect(deepLink(item, "header-ia-label", parseCite("machal1918:p.95"), hdr)).toBe(
      `https://archive.org/details/${item}/page/101`,
    );
    expect(deepLink(item, "header-ia-label", parseCite("machal1918:p.240"), hdr)).toBe(
      `https://archive.org/details/${item}/page/240`,
    );
  });
  it("keeps the item link when the header label or the IA label is not unique", () => {
    expect(deepLink(item, "header-ia-label", parseCite("machal1918:p.87"), hdr)).toBeUndefined();
    expect(deepLink(item, "header-ia-label", parseCite("machal1918:p.115"), hdr)).toBeUndefined();
    // header 101 names leaf 145 only, but no other leaf claims IA 107: linked.
    expect(deepLink(item, "header-ia-label", parseCite("machal1918:pp.101-102"), hdr)).toBe(
      `https://archive.org/details/${item}/page/107`,
    );
    // header 108 is unique, but IA 108 is claimed by leaf 160 as well: no link.
    expect(deepLink(item, "header-ia-label", parseCite("machal1918:p.108"), hdr)).toBeUndefined();
  });
});
