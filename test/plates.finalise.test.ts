import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import {
  buildImage,
  buildPublicSidecar,
  finalise,
  parsePicks,
  readPick,
  seedFromDir,
  sidecarFailures,
  tintShare,
  withImage,
  type Sidecar,
} from "../src/plates/finalise.js";
import { STYLE_TOKENS_VERSION } from "../src/plates/prompt.js";
import { validateEntry } from "../src/validate/validate.js";

const REPO = join(import.meta.dirname, "..");

const fixtureSidecar = (seed = 7): Sidecar => ({
  date: "2026-10-27T21:10:09.903Z",
  endpoint: "fal-ai/qwen-image",
  request_id: "req-123",
  seed_requested: seed,
  seed_returned: seed,
  size_returned: { width: 6, height: 8 },
  interpretive: true,
  style: "a",
  prompt: "A test creature. silverpoint study",
  negative: "colour",
  human_edits: [{ type: "visual-tradition", text: "A test creature.", by: "Ben", date: "2026-10-27" }],
  cost_usd_estimate: 0.04,
  licence: "Apache-2.0",
});

let root: string;

/** A tiny repo: one pick with a 6x8 grey PNG (one tinted pixel at the origin) and its sidecar. */
async function makeRepo(dirName: string, sidecar: Sidecar): Promise<string> {
  const r = mkdtempSync(join(tmpdir(), "beasts-finalise-"));
  const src = join(r, "plates", "iterX", "out", "test-beast", dirName);
  mkdirSync(src, { recursive: true });
  const px = Buffer.alloc(6 * 8 * 3, 200);
  px[0] = 255;
  px[1] = 0;
  px[2] = 0;
  await sharp(px, { raw: { width: 6, height: 8, channels: 3 } }).png().toFile(join(src, "test-beast-qwen.full.png"));
  writeFileSync(join(src, "test-beast-qwen.json"), JSON.stringify(sidecar));
  writeFileSync(
    join(r, "plates", "picks.json"),
    JSON.stringify({ "test-beast": { source: `plates/iterX/out/test-beast/${dirName}`, approved_by: "Ben", date: "2026-10-27" } }),
  );
  mkdirSync(join(r, "data", "entries"), { recursive: true });
  writeFileSync(join(r, "data", "entries", "test-beast.json"), '{\n  "id": "test-beast",\n  "image": null,\n  "notes": []\n}\n');
  return r;
}

beforeAll(async () => {
  root = await makeRepo("a-s7", fixtureSidecar(7));
});
afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("picks", () => {
  test("parses the real picks file: ten rows, all approved by Ben", () => {
    const picks = parsePicks(readFileSync(join(REPO, "plates", "picks.json"), "utf8"));
    expect(picks).toHaveLength(10);
    expect(picks.every((p) => p.approved_by === "Ben" && p.date === "2026-10-27")).toBe(true);
    expect(picks.find((p) => p.id === "drekavac")?.source).toBe("plates/iter5/out/drekavac/a-s42");
  });

  test("rejects a bad id, an unknown key, a missing source and a bad date", () => {
    expect(() => parsePicks('{"Bad Id": {"source": "x", "approved_by": "Ben", "date": "2026-10-27"}}')).toThrow(/bad entry id/);
    expect(() => parsePicks('{"a": {"source": "x", "approved_by": "Ben", "date": "2026-10-27", "x": 1}}')).toThrow(/unknown keys/);
    expect(() => parsePicks('{"a": {"approved_by": "Ben", "date": "2026-10-27"}}')).toThrow(/missing source/);
    expect(() => parsePicks('{"a": {"source": "x", "approved_by": "Ben", "date": "27/10"}}')).toThrow(/YYYY-MM-DD/);
    expect(() => parsePicks("{}")).toThrow(/no rows/);
  });

  test("the seed comes from the directory suffix", () => {
    expect(seedFromDir("plates/iter2/out/baba-yaga/a2-s21")).toBe(21);
    expect(seedFromDir("plates/iter5/out/drekavac/a-s42/")).toBe(42);
    expect(() => seedFromDir("plates/iter5/out/drekavac/a")).toThrow(/-s<seed>/);
  });
});

describe("readPick", () => {
  test("finds the PNG and sidecar", () => {
    const [pick] = parsePicks(readFileSync(join(root, "plates", "picks.json"), "utf8"));
    const files = readPick(root, pick);
    expect(files.seed).toBe(7);
    expect(files.png.endsWith("test-beast-qwen.full.png")).toBe(true);
  });

  test("a sidecar whose seed_returned differs from the directory seed fails loudly", async () => {
    const r = await makeRepo("a-s8", fixtureSidecar(7));
    try {
      const [pick] = parsePicks(readFileSync(join(r, "plates", "picks.json"), "utf8"));
      expect(() => readPick(r, pick)).toThrow(/seed_returned 7 does not match directory seed 8/);
      await expect(finalise({ root: r })).rejects.toThrow(/does not match/);
    } finally {
      rmSync(r, { recursive: true, force: true });
    }
  });

  test("a missing source directory fails loudly", () => {
    expect(() => readPick(root, { id: "x", source: "plates/nope/a-s1", approved_by: "Ben", date: "2026-10-27" })).toThrow(/missing/);
  });
});

describe("image object", () => {
  test("built from a fixture sidecar", () => {
    const image = buildImage("test-beast", fixtureSidecar());
    expect(image).toEqual({
      file: "plates/slavic/test-beast.web.webp",
      thumb: "plates/slavic/test-beast.thumb.webp",
      prompt: "A test creature. silverpoint study",
      negative: "colour",
      model: "fal-ai/qwen-image",
      seed: 7,
      date: "2026-10-27",
      style_tokens_version: STYLE_TOKENS_VERSION,
      licence: "Apache-2.0",
      interpretive: true,
      cost_usd: 0.04,
      request_id: "req-123",
      human_edits: [{ type: "visual-tradition", text: "A test creature.", by: "Ben", date: "2026-10-27" }],
    });
    expect(STYLE_TOKENS_VERSION).toBe("a-2026-10-27");
  });

  test("the public sidecar holds only named fields", () => {
    const pub = buildPublicSidecar(
      { id: "test-beast", source: "plates/x/a-s7", approved_by: "Ben", date: "2026-10-27" },
      { ...fixtureSidecar(), input: { secret: "nope" } } as Sidecar,
    );
    expect(pub).toMatchObject({ endpoint: "fal-ai/qwen-image", request_id: "req-123", negative: "colour", size: { width: 6, height: 8 } });
    expect(JSON.stringify(pub)).not.toContain("nope");
  });

  test("the sidecar checks flag a non-interpretive, non-a or unedited plate", () => {
    expect(sidecarFailures(fixtureSidecar())).toEqual([]);
    expect(sidecarFailures({ ...fixtureSidecar(), interpretive: false, style: "b", human_edits: [] })).toHaveLength(3);
  });

  test("withImage replaces only the image value and keeps the trailing-newline state", () => {
    const image = buildImage("test-beast", fixtureSidecar());
    const withNl = withImage('{\n  "id": "x",\n  "image": null,\n  "notes": []\n}\n', image);
    expect(withNl.endsWith("}\n")).toBe(true);
    expect(Object.keys(JSON.parse(withNl))).toEqual(["id", "image", "notes"]);
    expect(withImage('{\n  "image": null\n}', image).endsWith("}")).toBe(true);
  });
});

describe("schema", () => {
  const entry = () => JSON.parse(readFileSync(join(REPO, "data", "entries", "baba-yaga.json"), "utf8")) as Record<string, unknown>;
  const imageErrors = (image: unknown) =>
    validateEntry({ ...entry(), image }, { stage: "verified", basename: "baba-yaga" }).filter((i) => i.severity === "error");

  test("accepts a filled image", () => {
    expect(imageErrors(buildImage("baba-yaga", fixtureSidecar()))).toEqual([]);
  });

  test("accepts an image without the optional negative and request_id", () => {
    const { negative: _n, request_id: _r, ...rest } = buildImage("baba-yaga", fixtureSidecar());
    expect(imageErrors(rest)).toEqual([]);
  });

  test("rejects an extra key", () => {
    const errs = imageErrors({ ...buildImage("baba-yaga", fixtureSidecar()), colour: "red" });
    expect(errs.some((e) => e.rule === "unevaluatedProperties")).toBe(true);
  });

  test("rejects a missing thumb", () => {
    const { thumb: _t, ...rest } = buildImage("baba-yaga", fixtureSidecar());
    const errs = imageErrors(rest);
    expect(errs.length).toBeGreaterThan(0);
    expect(errs.some((e) => e.message.includes("thumb"))).toBe(true);
  });

  test("rejects a human edit with an empty field", () => {
    const image = buildImage("baba-yaga", fixtureSidecar());
    expect(imageErrors({ ...image, human_edits: [{ type: "visual-tradition", text: "", by: "Ben", date: "2026-10-27" }] }).length).toBeGreaterThan(0);
  });
});

describe("finalise on the fixture repo", () => {
  test("writes the web, thumb, sidecar and entry, and a rerun changes nothing", async () => {
    const rows = await finalise({ root });
    expect(rows).toHaveLength(1);
    expect(rows[0].web).toBe("6x8");
    // The fixture is not plate-sized, so the dimension check must fail it.
    expect(rows[0].failures.some((f) => f.includes("not 1104x1472"))).toBe(true);
    const out = join(root, "plates", "slavic");
    const snapshot = () =>
      ["test-beast.full.png", "test-beast.web.webp", "test-beast.thumb.webp", "test-beast.json"]
        .map((n) => readFileSync(join(out, n)).toString("base64"))
        .concat(readFileSync(join(root, "data", "entries", "test-beast.json"), "utf8"));
    const first = snapshot();
    const entry = JSON.parse(first[4]) as { image: { file: string } };
    expect(entry.image.file).toBe("plates/slavic/test-beast.web.webp");
    await finalise({ root });
    expect(snapshot()).toEqual(first);
  });

  test("tint share counts the one tinted sample on the 16 px grid", async () => {
    const png = join(root, "plates", "iterX", "out", "test-beast", "a-s7", "test-beast-qwen.full.png");
    // A 6x8 image has a single grid sample, at (0, 0), which is pure red.
    expect(await tintShare(png)).toBe(100);
  });
});
