// Checks the built spreads and contents page in site/dist. Like build.test.ts, these do
// NOT build: run `npm run site:test` from the root (build, then this suite).
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { CONTENTS_ORDER, getEntries, imagePath, primaryName, type Clause } from "../src/lib/entries.ts";
import { SITE_URL } from "../src/lib/site.ts";

const DIST = fileURLToPath(new URL("../dist/", import.meta.url));
// Hardcoded on purpose (not imported from grades.ts), so a change to the wording fails here.
const INTERPRETIVE = "A drawing after the folk tradition. The sources describe:";

function page(rel: string): string {
  const p = join(DIST, rel);
  if (!existsSync(p)) throw new Error(`${rel} missing: run \`npm run site:test\` from the root`);
  return readFileSync(p, "utf8");
}

const decode = (s: string) =>
  s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

function attr(tag: string, name: string): string | undefined {
  const m = new RegExp(`\\s${name}="([^"]*)"`).exec(tag);
  return m ? decode(m[1]!) : undefined;
}

/** Every chip on a page (any element with data-cite), as { of, tag } in document order. */
function chips(html: string): { of: string; tag: string }[] {
  return [...html.matchAll(/<(?:a|span)\b[^>]*\bdata-cite="[^"]*"[^>]*>/g)].map((m) => ({
    of: attr(m[0], "data-of")!,
    tag: attr(m[0], "data-cite")!,
  }));
}

/** The cites the page renders for each `<field>.<i>`, keyed by i. */
function citesOn(html: string, field: string): Map<number, string[]> {
  const out = new Map<number, string[]>();
  for (const c of chips(html)) {
    const m = /^(.*)\.(\d+)$/.exec(c.of);
    if (!m || m[1] !== field) continue;
    const i = Number(m[2]);
    out.set(i, [...(out.get(i) ?? []), c.tag]);
  }
  return out;
}

function expectClauses(html: string, field: string, clauses: Clause[], id: string): void {
  const on = citesOn(html, field);
  expect(on.size, `${id} ${field}: clauses with chips`).toBe(clauses.length);
  clauses.forEach((c, i) => expect(on.get(i), `${id} ${field}.${i}`).toEqual(c.cites));
}

function anchor(html: string, attrName: string, value: string): string | undefined {
  return [...html.matchAll(/<a\b[^>]*>/g)].map((m) => m[0]).find((t) => attr(t, attrName) === value);
}

const entries = getEntries();
const spread = (id: string) => page(`creatures/${id}/index.html`);

describe("spreads", () => {
  it("every spread shows its web plate with the required alt", () => {
    for (const e of entries) {
      const img = [...spread(e.id).matchAll(/<img\b[^>]*>/g)]
        .map((m) => m[0])
        .find((t) => attr(t, "src") === imagePath(e.image.file));
      expect(img, `${e.id} plate <img>`).toBeDefined();
      expect(attr(img!, "alt")).toBe(`Silverpoint study of ${primaryName(e)}`);
    }
  });

  it("every interpretive plate carries the fixed line", () => {
    const interpretive = entries.filter((e) => e.image.interpretive === true);
    expect(interpretive.length).toBeGreaterThan(0);
    for (const e of interpretive) expect(spread(e.id), e.id).toContain(INTERPRETIVE);
  });

  it("never leaves the left page without a description", () => {
    for (const e of entries) {
      if (e.appearance.length > 0) continue;
      const html = spread(e.id);
      if (e.scene.length > 0) expectClauses(html, "scene", e.scene, e.id);
      else expect(html).toContain("The sources give no description of its appearance.");
    }
  });

  it("renders every appearance clause with exactly its cites", () => {
    for (const e of entries) expectClauses(spread(e.id), "appearance", e.appearance, e.id);
  });

  it("renders every scene clause with exactly its cites, on one page only", () => {
    for (const e of entries) {
      const html = spread(e.id);
      expectClauses(html, "scene", e.scene, e.id);
      if (e.scene.length === 0) continue;
      const leftHasScene = e.appearance.length === 0;
      expect(html.includes("<h2>Scene</h2>"), `${e.id} Scene section`).toBe(!leftHasScene);
    }
  });

  it("hides a section with no clauses, heading and all", () => {
    const titles = { behavior_habitat: "Behaviour and habitat", dealing_with_it: "Dealing with it", origin: "Origin" } as const;
    let hidden = 0;
    for (const e of entries) {
      const html = spread(e.id);
      expect(html, e.id).not.toContain("Nothing in the cited sources.");
      for (const [f, title] of Object.entries(titles) as [keyof typeof titles, string][]) {
        expect(html.includes(`<h2>${title}</h2>`), `${e.id} ${title}`).toBe(e[f].length > 0);
        if (e[f].length === 0) hidden++;
      }
    }
    // Guard against a vacuous pass: the pilot data must contain at least one empty section.
    expect(hidden).toBeGreaterThan(0);
  });

  it("renders every attestation rationale clause with exactly its cites", () => {
    for (const e of entries) expectClauses(spread(e.id), "attestation.rationale", e.attestation.rationale, e.id);
  });

  it("renders the other clause fields with exactly their cites", () => {
    for (const e of entries) {
      const html = spread(e.id);
      for (const f of ["behavior_habitat", "dealing_with_it", "origin"] as const) expectClauses(html, f, e[f], e.id);
      expectClauses(html, "names.meaning", e.names.meaning, e.id);
      e.variants.forEach((v, i) => {
        expectClauses(html, `variants.${i}.appearance`, v.appearance, e.id);
        expectClauses(html, `variants.${i}.behavior_habitat`, v.behavior_habitat, e.id);
      });
    }
  });

  it("shows the attestation badge with its definition in a title and a tap target", () => {
    for (const e of entries) {
      const html = spread(e.id);
      expect(html, e.id).toMatch(new RegExp(`<details[^>]*data-grade="${e.attestation.grade}"`));
      expect(html, e.id).toMatch(/<summary title="[^"]+"/);
      expect(html, e.id).toContain('class="grade-def"');
    }
  });

  it("closes variants by default", () => {
    for (const e of entries) {
      const tags = [...spread(e.id).matchAll(/<details\b[^>]*class="variant"[^>]*>/g)].map((m) => m[0]);
      expect(tags.length, e.id).toBe(e.variants.length);
      for (const t of tags) expect(t).not.toMatch(/\sopen\b/);
    }
  });

  it("links related entries only when the id is published, else renders plain text", () => {
    const known = new Set<string>(CONTENTS_ORDER);
    for (const e of entries) {
      const html = spread(e.id);
      for (const r of e.related) {
        const a = anchor(html, "data-related", r.id);
        expect(Boolean(a), `${e.id} -> ${r.id}`).toBe(known.has(r.id));
        if (a) expect(attr(a, "href")).toBe(`/creatures/${r.id}/`);
        else expect(html, `${e.id} -> ${r.id} as text`).toContain(`data-related-text="${r.id}"`);
      }
    }
  });

  it("turns pages in contents order, wrapping at both ends", () => {
    const n = CONTENTS_ORDER.length;
    CONTENTS_ORDER.forEach((id, i) => {
      const html = spread(id);
      const prev = anchor(html, "data-nav", "prev");
      const next = anchor(html, "data-nav", "next");
      expect(prev && attr(prev, "href"), `${id} prev`).toBe(`/creatures/${CONTENTS_ORDER[(i - 1 + n) % n]}/`);
      expect(next && attr(next, "href"), `${id} next`).toBe(`/creatures/${CONTENTS_ORDER[(i + 1) % n]}/`);
    });
    const first = anchor(spread(CONTENTS_ORDER[0]), "data-nav", "prev")!;
    expect(attr(first, "href")).toBe(`/creatures/${CONTENTS_ORDER[n - 1]}/`);
  });

  it("gives each spread its own og:image", () => {
    const seen = new Set<string>();
    for (const e of entries) {
      const m = /<meta property="og:image" content="([^"]*)"/.exec(spread(e.id));
      expect(m?.[1], e.id).toBe(new URL(imagePath(e.image.file), SITE_URL).href);
      seen.add(m![1]!);
    }
    expect(seen.size).toBe(entries.length);
  });

  it("links every chip to a URL", () => {
    for (const e of entries) {
      expect([...spread(e.id).matchAll(/<span\b[^>]*\bdata-cite=/g)].length, `${e.id}: unlinked chips`).toBe(0);
    }
  });
});

describe("contents page", () => {
  it("links all ten spreads in contents order", () => {
    const html = page("index.html");
    const links = [...html.matchAll(/<a\b[^>]*\bdata-contents="[^"]*"[^>]*>/g)].map((m) => m[0]);
    expect(links.map((t) => attr(t, "data-contents"))).toEqual([...CONTENTS_ORDER]);
    expect(links.map((t) => attr(t, "href"))).toEqual(CONTENTS_ORDER.map((id) => `/creatures/${id}/`));
  });

  it("gives every thumbnail the silverpoint alt", () => {
    const html = page("index.html");
    for (const e of entries) {
      const img = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]).find((t) => attr(t, "src") === imagePath(e.image.thumb));
      expect(img, `${e.id} thumbnail <img>`).toBeDefined();
      expect(attr(img!, "alt")).toBe(`Silverpoint study of ${primaryName(e)}`);
    }
  });

  it("uses the contact sheet as its og:image", () => {
    expect(page("index.html")).toContain(`<meta property="og:image" content="${SITE_URL}/og/contact-sheet.png"`);
  });
});
