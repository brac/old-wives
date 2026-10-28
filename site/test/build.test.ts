// Checks the built site in site/dist. These tests do NOT build: they need a fresh build
// first. `npm run site:test` (root) builds, then runs this suite; running vitest here on
// its own checks whatever dist/ currently holds.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { ENTRIES_DIR, PLATES_DIR, type Entry } from "../src/lib/entries.ts";

const DIST = fileURLToPath(new URL("../dist/", import.meta.url));

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [relative(DIST, p).replace(/\\/g, "/")];
  });
}

const diskIds = readdirSync(ENTRIES_DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => f.slice(0, -".json".length))
  .sort();
const diskEntries = diskIds.map((id) => JSON.parse(readFileSync(join(ENTRIES_DIR, `${id}.json`), "utf8")) as Entry);

let files: Set<string>;
beforeAll(() => {
  if (!existsSync(join(DIST, "index.html"))) {
    throw new Error("site/dist/index.html missing: run `npm run site:build` first (or `npm run site:test` from the root)");
  }
  files = new Set(walk(DIST));
});

describe("site build output", () => {
  it("built the home page", () => {
    expect(files.has("index.html")).toBe(true);
  });

  it("has a spread route for every entry on disk", () => {
    expect(diskIds.length).toBeGreaterThan(0);
    for (const id of diskIds) expect(files, `creatures/${id}/index.html`).toContain(`creatures/${id}/index.html`);
  });

  it("ships every image.file and image.thumb an entry references", () => {
    for (const e of diskEntries) {
      expect(files, `${e.id} image.file`).toContain(e.image.file);
      expect(files, `${e.id} image.thumb`).toContain(e.image.thumb);
    }
  });

  it("never ships a .full.png master", () => {
    expect([...files].filter((f) => f.endsWith(".full.png"))).toEqual([]);
  });

  it("ships only the web and thumb plate sizes", () => {
    const plates = [...files].filter((f) => f.startsWith("plates/"));
    expect(plates.length).toBe(diskIds.length * 2);
    for (const f of plates) expect(f).toMatch(/^plates\/slavic\/[a-z0-9-]+\.(web|thumb)\.webp$/);
  });

  it("index.json lists exactly the entries on disk", () => {
    const rows = JSON.parse(readFileSync(join(DIST, "data/slavic/index.json"), "utf8")) as {
      id: string;
      primary_name: string;
      family: string;
      peoples: string[];
      attestation_grade: string;
      thumb: string;
    }[];
    expect(rows.map((r) => r.id).sort()).toEqual(diskIds);
    for (const r of rows) {
      const e = diskEntries.find((d) => d.id === r.id)!;
      expect(r.family).toBe(e.family.value);
      expect(r.attestation_grade).toBe(e.attestation.grade);
      expect(r.thumb).toBe("/" + e.image.thumb);
      expect(files).toContain(r.thumb.slice(1));
      expect(r.peoples.length).toBeGreaterThan(0);
      expect(r.primary_name.length).toBeGreaterThan(0);
    }
  });

  it("serves every entry, the schema and the licence verbatim", () => {
    for (const id of diskIds) {
      expect(readFileSync(join(DIST, `data/slavic/${id}.json`), "utf8")).toBe(
        readFileSync(join(ENTRIES_DIR, `${id}.json`), "utf8"),
      );
    }
    const schema = fileURLToPath(new URL("../../schema/entry.schema.json", import.meta.url));
    expect(readFileSync(join(DIST, "data/schema/entry.schema.json"), "utf8")).toBe(readFileSync(schema, "utf8"));
    const licence = readFileSync(join(DIST, "data/LICENSE"), "utf8");
    expect(licence.startsWith("Attribution 4.0 International")).toBe(true);
    expect(licence).toBe(readFileSync(new URL("../src/assets/cc-by-4.0.txt", import.meta.url), "utf8"));
  });

  it("writes the OG contact sheet", () => {
    expect(files).toContain("og/contact-sheet.png");
  });

  it("copies plates byte for byte", () => {
    for (const e of diskEntries) {
      const name = e.image.thumb.split("/").pop()!;
      expect(readFileSync(join(DIST, e.image.thumb)).equals(readFileSync(join(PLATES_DIR, name)))).toBe(true);
    }
  });
});
