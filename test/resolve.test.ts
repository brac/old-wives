import { describe, expect, test } from "vitest";
import { scanDjvuString } from "../src/corpus/djvu.js";
import { serializePages, splitWikisourcePages } from "../src/corpus/build.js";
import { findIn } from "../src/corpus/find-cli.js";
import type { PageRecord, SourceEntry } from "../src/corpus/manifest.js";
import { createResolver, parseTag, type Corpus, type HeadwordOverride } from "../src/corpus/resolve.js";

function src(id: string, locator: "page" | "headword"): SourceEntry {
  return {
    id,
    author: "A",
    title: "T",
    year: 1900,
    edition: "e",
    language: "en",
    kind: "folklore",
    public_domain: true,
    pd_reason: "old",
    locator,
    origin: { type: "ia", item: id, files: [] },
    raw: [],
    pages_file: `sources/pages/${id}.jsonl`,
    pages_sha256: "",
    notes: "",
  };
}

const PAGES: Record<string, PageRecord[]> = {
  book: [
    { leaf: 1, page: null, text: "cover" },
    { leaf: 2, page: "xiii", text: "preface" },
    { leaf: 3, page: "1", text: "The LéSiy lives in woods." },
    { leaf: 4, page: "2", text: "The Poludnica walks at noon." },
    { leaf: 5, page: "3", text: "end" },
  ],
  dict: [
    { leaf: 10, page: "163", text: "Вампир, m. vide вукодлак.\nВампирица, f." },
    { leaf: 11, page: null, text: "„Древавац, вца, ein Thier wie eine Ziege" },
  ],
};
const HEADWORDS: Record<string, HeadwordOverride[]> = {
  dict: [{ headword: "Дрекавац", leaf: 11, ocr_spelling: "„Древавац" }],
};
const corpus: Corpus = {
  sources: [src("book", "page"), src("dict", "headword")],
  pages: (id) => PAGES[id] ?? [],
  headwords: (id) => HEADWORDS[id] ?? [],
};
const resolve = createResolver(corpus);

describe("parseTag", () => {
  test("accepts the three forms", () => {
    expect(parseTag("book:p.12")).toEqual({ source: "book", kind: "p", page: "12" });
    expect(parseTag("book:pp.xiii-2")).toEqual({ source: "book", kind: "pp", first: "xiii", last: "2" });
    expect(parseTag("dict:s.v.Вампир")).toEqual({ source: "dict", kind: "sv", headword: "Вампир" });
  });
  test("rejects bad grammar", () => {
    for (const t of ["book:12", "Book:p.1", "book:p.", "book:pp.1", "book:p.XIII", "book"]) expect(parseTag(t)).toBeNull();
  });
});

describe("resolve", () => {
  test("p. finds a printed page, including roman", () => {
    const r = resolve("book:p.2");
    expect(r.ok && r.pages.map((p) => p.leaf)).toEqual([4]);
    const x = resolve("book:p.xiii");
    expect(x.ok && x.pages[0]!.text).toBe("preface");
  });
  test("missing page reports page not found", () => {
    expect(resolve("book:p.9999")).toEqual({ ok: false, reason: "page not found" });
  });
  test("pp. returns the inclusive leaf range", () => {
    const r = resolve("book:pp.1-3");
    expect(r.ok && r.pages.map((p) => p.leaf)).toEqual([3, 4, 5]);
    expect(resolve("book:pp.3-1").ok).toBe(false);
  });
  test("unknown source and bad grammar fail", () => {
    expect(resolve("nope:p.1")).toEqual({ ok: false, reason: "unknown source: nope" });
    expect(resolve("book:x").ok).toBe(false);
  });
  test("s.v. matches a headword at line start, not a prefix of a longer word", () => {
    const r = resolve("dict:s.v.вампир");
    expect(r.ok && r.via).toBe("match");
    expect(r.ok && r.pages[0]!.leaf).toBe(10);
    expect(resolve("dict:s.v.Вамп").ok).toBe(false);
  });
  test("s.v. falls back to the override table for OCR-mangled headwords", () => {
    const r = resolve("dict:s.v.Дрекавац");
    expect(r.ok && r.via).toBe("override");
    expect(r.ok && r.pages[0]!.text).toContain("Ziege");
  });
  test("p. and pp. are refused on headword sources", () => {
    // Leaf 10 carries IA page "163", as Karadžić 1818 does, so only the locator check can refuse it.
    const r = resolve("dict:p.163");
    expect(r.ok === false && r.reason).toMatch(/headword/);
    expect(resolve("dict:pp.163-163").ok).toBe(false);
  });

  test("s.v. is refused on page-cited sources", () => {
    expect(resolve("book:s.v.LéSiy").ok).toBe(false);
  });
});

describe("find", () => {
  test("matches over normalised text and tags by page", () => {
    const hits = findIn(corpus.sources, corpus.pages, "lesiy", 50);
    expect(hits.map((h) => h.tag)).toEqual(["book:p.1"]);
  });
  test("headword sources print a leaf locator", () => {
    const hits = findIn(corpus.sources, corpus.pages, "Ziege", 50);
    expect(hits.map((h) => h.tag)).toEqual(["dict@leaf11"]);
  });
});

describe("djvu scanner", () => {
  test("one leaf per OBJECT, words joined by spaces, lines by newlines, entities decoded", () => {
    const xml = `<DjVuXML><BODY>
<OBJECT data="x" usemap="a_0001.djvu"><PARAM name="PAGE" value="a"/><HIDDENTEXT/></OBJECT>
<OBJECT data="x"><HIDDENTEXT><PAGECOLUMN><REGION><PARAGRAPH>
<LINE><WORD coords="1">Tom </WORD><WORD coords="2">&amp;</WORD><WORD coords="3">&quot;Jerry&quot;</WORD></LINE>
<LINE><WORD coords="4">ѣ</WORD></LINE>
</PARAGRAPH></REGION></PAGECOLUMN></HIDDENTEXT></OBJECT></BODY></DjVuXML>`;
    expect(scanDjvuString(xml)).toEqual([
      { leaf: 1, text: "" },
      { leaf: 2, text: 'Tom & "Jerry"\nѣ' },
    ]);
  });
});

describe("build helpers", () => {
  test("wikisource split on {{Seite|N}} and markup stripped", () => {
    const wt = "header {{Seite|11||a.png}}\n{{center|'''<tt>Copia</tt> x'''}}\nPeter <tt>Plogojoviz</tt>\n{{Seite|12||b.png}} more<br />text\n[[Kategorie:X]]";
    expect(splitWikisourcePages(wt)).toEqual([
      { leaf: 1, page: "11", text: "Copia x\nPeter Plogojoviz" },
      { leaf: 2, page: "12", text: "more\ntext" },
    ]);
  });
  test("serializePages sorts by leaf with stable key order and LF endings", () => {
    const out = serializePages([
      { text: "b", page: null, leaf: 2 } as PageRecord,
      { leaf: 1, page: "1", text: "a" },
    ]);
    expect(out).toBe('{"leaf":1,"page":"1","text":"a"}\n{"leaf":2,"page":null,"text":"b"}\n');
  });
});
