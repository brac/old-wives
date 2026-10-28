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
    expect(deepLinkMode({ iaItem: item, locator: "page", pageLabelSource: "header" })).toBe("item");
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
        } else if (s.url) {
          expect([s.url, `${s.url}/page/${encodeURIComponent(parseCite(tag).locus.split("-")[0]!)}`], tag).toContain(c.href);
        }
      }
    }
  });
});
