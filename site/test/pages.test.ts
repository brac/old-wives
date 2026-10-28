// The Markdown content pages and the internal-link crawler. Like build.test.ts, these
// read site/dist and need a fresh build first (`npm run site:test` from the root).
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { INTERPRETIVE_LINE } from "../src/lib/grades.ts";
import { SITE_NAME } from "../src/lib/site.ts";

const DIST = fileURLToPath(new URL("../dist/", import.meta.url));

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [relative(DIST, p).replace(/\\/g, "/")];
  });
}

const read = (rel: string) => readFileSync(join(DIST, rel), "utf8");
const squash = (s: string) => s.replace(/\s+/g, " ");

/** The frontmatter title of a content page, read from its Markdown source. */
function mdTitle(name: string): string {
  const src = readFileSync(fileURLToPath(new URL(`../src/content/${name}.md`, import.meta.url)), "utf8");
  return /^title:\s*(.+)$/m.exec(src)![1]!.trim();
}

/**
 * Resolve a root-relative href against dist the way a static host does: the exact file,
 * or the directory's index.html. Query and fragment are ignored.
 */
export function resolves(href: string, files: Set<string>): boolean {
  const path = decodeURIComponent(href.split(/[?#]/)[0]!).replace(/^\/+/, "");
  if (path === "") return files.has("index.html");
  const bare = path.replace(/\/+$/, "");
  if (!path.endsWith("/") && files.has(bare)) return true;
  return files.has(`${bare}/index.html`);
}

describe("content pages", () => {
  for (const [route, name] of [["about", "about"], ["method", "method"], ["data", "data"]] as const) {
    it(`/${route}/ exists with its <title>`, () => {
      const file = join(DIST, route, "index.html");
      expect(existsSync(file), `${route}/index.html`).toBe(true);
      const title = /<title>([^<]*)<\/title>/.exec(read(`${route}/index.html`))?.[1];
      expect(title).toBe(`${mdTitle(name)} | ${SITE_NAME}`);
    });
  }

  it("the about page states the fixed interpretive line", () => {
    expect(squash(read("about/index.html"))).toContain(INTERPRETIVE_LINE);
  });

  it("the method page's contact sheet is in the build", () => {
    expect(read("method/index.html")).toContain('src="/og/contact-sheet.png"');
    expect(existsSync(join(DIST, "og", "contact-sheet.png"))).toBe(true);
  });
});

describe("internal links", () => {
  it("every href=\"/...\" and src=\"/...\" in the built HTML resolves to a file in dist", () => {
    const files = new Set(walk(DIST));
    const pages = [...files].filter((f) => f.endsWith(".html"));
    expect(pages.length).toBeGreaterThan(10);
    const broken: string[] = [];
    let checked = 0;
    for (const page of pages) {
      for (const m of read(page).matchAll(/\b(?:href|src)="(\/(?!\/)[^"]*)"/g)) {
        checked++;
        if (!resolves(m[1]!, files)) broken.push(`${page} -> ${m[1]}`);
      }
    }
    expect(checked).toBeGreaterThan(pages.length);
    expect(broken).toEqual([]);
  });

  it("the resolver rejects a missing route", () => {
    const files = new Set(["index.html", "method/index.html", "og/a.png"]);
    expect(resolves("/method/", files)).toBe(true);
    expect(resolves("/method", files)).toBe(true);
    expect(resolves("/og/a.png", files)).toBe(true);
    expect(resolves("/methods/", files)).toBe(false);
    expect(resolves("/og/b.png", files)).toBe(false);
  });
});
