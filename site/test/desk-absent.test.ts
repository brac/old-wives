// The review desk is dev-only (plan phase-4, 4c): no _desk path and no desk API string may
// reach the production build. Reads site/dist, so it needs a fresh build first
// (`npm run site:test` from the root builds, then runs this suite).
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const DIST = fileURLToPath(new URL("../dist/", import.meta.url));
const TEXT = /\.(html|js|mjs|css|json|xml|txt|map|svg|webmanifest)$/i;
const DESK_STRINGS = ["_desk", "desk-queue", "createDeskApi", "Review desk", "agent draft, not yet yours", "openrouter/router"];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [relative(DIST, p).replace(/\\/g, "/")];
  });
}

describe("review desk is absent from the build", () => {
  it("dist exists", () => {
    expect(existsSync(join(DIST, "index.html")), "run `npm run site:build` first").toBe(true);
  });
  it("no path under dist mentions the desk", () => {
    expect(walk(DIST).filter((f) => /desk/i.test(f))).toEqual([]);
  });
  it("no built text file carries a desk route or API string", () => {
    const hits: string[] = [];
    for (const f of walk(DIST).filter((f) => TEXT.test(f))) {
      const body = readFileSync(join(DIST, f), "utf8");
      for (const s of DESK_STRINGS) if (body.includes(s)) hits.push(`${f}: ${s}`);
    }
    expect(hits).toEqual([]);
  });
});
