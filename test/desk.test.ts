import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { JOB_ESTIMATE_USD, PLATE_CAP_USD, createDeskApi, type RunJob } from "../src/desk/api.js";
import { applyDiff, wordDiff } from "../src/desk/diff.js";
import { NOTE_ENDPOINT, NOTE_INSTRUCTION, NOTE_MODEL, noteToEdit, type FalCall } from "../src/desk/llm.js";
import { WRITE_ALLOW_LIST, isWriteAllowed, servablePath, writeDeskJson } from "../src/desk/store.js";

describe("wordDiff", () => {
  it("marks changed words and keeps the rest", () => {
    expect(wordDiff("a long nose and a staff", "a very long nose and no staff")).toEqual([
      { op: "same", text: "a" },
      { op: "add", text: "very" },
      { op: "same", text: "long nose and" },
      { op: "del", text: "a" },
      { op: "add", text: "no" },
      { op: "same", text: "staff" },
    ]);
  });
  it("handles empty sides and identical text", () => {
    expect(wordDiff("", "new words")).toEqual([{ op: "add", text: "new words" }]);
    expect(wordDiff("old words", "")).toEqual([{ op: "del", text: "old words" }]);
    expect(wordDiff("same  text\n", "same text")).toEqual([{ op: "same", text: "same text" }]);
  });
  it("round-trips to the new text", () => {
    const a = "She wears ragged peasant clothes and leans on a gnarled wooden staff. Full figure.";
    const b = "She wears ragged peasant clothes, hunched over. Full figure, more hunched.";
    expect(applyDiff(wordDiff(a, b))).toBe(b);
  });
});

describe("write allow-list", () => {
  const root = "/repo";
  it("allows exactly the three desk files", () => {
    expect([...WRITE_ALLOW_LIST].sort()).toEqual(["plates/desk-queue.json", "plates/overrides.json", "plates/picks.json"]);
    for (const p of WRITE_ALLOW_LIST) expect(isWriteAllowed(root, p)).toBe(true);
    expect(isWriteAllowed(root, "plates/../plates/picks.json")).toBe(true);
  });
  it("refuses every other path", () => {
    for (const p of [
      "plates/spend.json",
      "data/entries/leshy.json",
      "plates/slavic/leshy.json",
      "../plates/picks.json",
      "plates/picks.json.bak",
      "plates/refs/leshy/01.jpg",
      "/etc/passwd",
      "C:/Windows/x.json",
      "",
      "plates/picks.json\0",
    ]) {
      expect(isWriteAllowed(root, p), p).toBe(false);
    }
    expect(() => writeDeskJson(root, "plates/spend.json", {})).toThrow(/allow-list/);
  });
  it("serves only images under the candidate and ref folders", () => {
    expect(servablePath(process.cwd(), "plates/overrides.json")).toBeNull();
    expect(servablePath(process.cwd(), "plates/refs/../../.env")).toBeNull();
    expect(servablePath(process.cwd(), "data/entries/leshy.json")).toBeNull();
  });
});

describe("noteToEdit", () => {
  it("sends the fixed instruction to the pinned model and returns cost", async () => {
    let seen: { endpoint: string; input: Record<string, unknown> } | null = null;
    const fal: FalCall = async (endpoint, input) => {
      seen = { endpoint, input };
      return { data: { output: "A hunched old man.", usage: { cost: 0.0004 } } };
    };
    const r = await noteToEdit("more hunched", "An old man.", fal);
    expect(r).toEqual({ revised: "A hunched old man.", model: NOTE_MODEL, endpoint: NOTE_ENDPOINT, cost_usd: 0.0004 });
    expect(seen!.endpoint).toBe("openrouter/router");
    expect(seen!.input.model).toBe("google/gemini-2.5-flash");
    expect(seen!.input.system_prompt).toBe(NOTE_INSTRUCTION);
    expect(String(seen!.input.prompt)).toContain("more hunched");
  });
});

// A scratch repo: one scratch creature, mocked model, mocked generator.
describe("desk API round trip on a scratch creature", () => {
  let root: string;
  const ID = "scratch-creature";
  const fal: FalCall = async () => ({ data: { output: "A tall grey figure with a longer nose.", usage: { cost: 0.0003 } } });
  const ran: string[] = [];
  const runJob: RunJob = async (job, r, onLog) => {
    ran.push(`${job.creature}:${job.text}`);
    const dir = join(r, "plates/desk", job.creature, `s${job.seed}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, `${job.creature}-qwen-s${job.seed}.full.png`), "png");
    onLog("mock generate done");
  };

  async function call(api: ReturnType<typeof createDeskApi>, method: string, url: string, body?: unknown) {
    const chunks = body === undefined ? [] : [Buffer.from(JSON.stringify(body))];
    const req = Object.assign((async function* () { yield* chunks; })(), { method, url, headers: {} });
    let out = "";
    const res = { statusCode: 0, setHeader() {}, end(s: string) { out = s; } };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await api(req as any, res as any);
    return { status: res.statusCode, data: JSON.parse(out) };
  }

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "desk-"));
    mkdirSync(join(root, "data/entries"), { recursive: true });
    mkdirSync(join(root, "plates"), { recursive: true });
    writeFileSync(join(root, "data/entries", `${ID}.json`), JSON.stringify({ id: ID, names: { primary: "Scratch" }, appearance: [{ text: "He is tall.", cites: ["x:p.1"] }] }));
    writeFileSync(join(root, "plates/spend.json"), JSON.stringify({ rows: [{ entry: ID, estimate_usd: 0.04 }, { entry: ID, estimate_usd: 0.04 }] }));
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));

  it("draft -> refused generate -> note -> accept -> redraw -> approve", async () => {
    const api = createDeskApi({ root, fal, runJob, dryRun: true });
    let c = (await call(api, "GET", `/creature?id=${ID}`)).data;
    expect(c.draft.label).toBe("agent draft, not yet yours");
    expect(c.can_generate).toBe(false);
    expect(c.spend_usd).toBe(0.08);
    expect((await call(api, "POST", "/redraw", { id: ID })).status).toBe(409);
    expect((await call(api, "POST", "/accept", { id: ID, text: "He is tall." })).status).toBe(409);

    const n = await call(api, "POST", "/note", { id: ID, note: "grey, longer nose", text: "A tall figure." });
    expect(n.status).toBe(200);
    expect(n.data.diff.some((o: { op: string }) => o.op === "add")).toBe(true);
    const acc = await call(api, "POST", "/accept", { id: ID, text: n.data.revised, note: "grey, longer nose" });
    expect(acc.status).toBe(200);
    const ov = JSON.parse(readFileSync(join(root, "plates/overrides.json"), "utf8"))[ID];
    expect(ov.visual).toMatchObject({ text: n.data.revised, basis: "visual tradition", by: "Ben", note: "grey, longer nose" });
    expect(ov.human_edits).toEqual([expect.objectContaining({ type: "visual-tradition", note: "grey, longer nose", by: "Ben" })]);

    expect((await call(api, "POST", "/redraw", { id: ID })).status).toBe(200);
    await call(api, "POST", "/run", {});
    for (let i = 0; i < 50 && ran.length === 0; i++) await new Promise((r) => setTimeout(r, 10));
    await new Promise((r) => setTimeout(r, 20));
    expect(ran).toEqual([`${ID}:${n.data.revised}`]);
    const q = (await call(api, "GET", "/queue")).data;
    expect(q.jobs[0]).toMatchObject({ status: "done", dry_run: true });
    expect(q.llm_calls).toEqual([expect.objectContaining({ creature: ID, model: NOTE_MODEL, cost_usd: 0.0003, ok: true })]);

    c = (await call(api, "GET", `/creature?id=${ID}`)).data;
    expect(c.candidates.items).toHaveLength(1);
    expect((await call(api, "POST", "/approve", { id: ID, source: "plates/iter9/out/x" })).status).toBe(400);
    expect((await call(api, "POST", "/approve", { id: ID, source: c.candidates.items[0].source })).status).toBe(200);
    const batch = (await call(api, "GET", "/batch?batch=pilot")).data;
    expect(batch).toEqual([expect.objectContaining({ id: ID, name: "Scratch", state: "approved" })]);
  });

  describe("plate cap", () => {
    const ledger = (...usd: number[]) =>
      writeFileSync(join(root, "plates/spend.json"), JSON.stringify({ rows: usd.map((estimate_usd) => ({ entry: ID, estimate_usd })) }));
    const bens = () =>
      writeFileSync(join(root, "plates/overrides.json"), JSON.stringify({ [ID]: { visual: { text: "Ben's text.", basis: "visual tradition", by: "Ben" } } }));

    it("uses a $1 cap and the qwen estimate of $0.04", () => {
      expect(PLATE_CAP_USD).toBe(1);
      expect(JOB_ESTIMATE_USD).toBe(0.04);
    });

    it("refuses at queue time at the boundary: 0.98 + 0.04 refused, 0.94 + 0.04 accepted", async () => {
      bens();
      ledger(0.5, 0.48);
      const api = createDeskApi({ root, fal, runJob });
      const r = await call(api, "POST", "/redraw", { id: ID });
      expect(r.status).toBe(402);
      expect(r.data.error).toContain(ID);
      expect(r.data.error).toContain("$0.98");
      expect(r.data.error).toContain("$1.00");
      expect((await call(api, "GET", "/queue")).data.jobs).toEqual([]);

      ledger(0.5, 0.44);
      expect((await call(api, "POST", "/redraw", { id: ID })).status).toBe(200);
      const c = (await call(api, "GET", `/creature?id=${ID}`)).data;
      expect(c.spend_usd).toBe(0.94);
      expect(c.plate_headroom_usd).toBe(0.02);
    });

    it("counts queued jobs toward the cap", async () => {
      bens();
      ledger(0.9);
      const api = createDeskApi({ root, fal, runJob });
      expect((await call(api, "POST", "/redraw", { id: ID })).status).toBe(200); // 0.94
      expect((await call(api, "POST", "/redraw", { id: ID })).status).toBe(200); // 0.98
      const third = await call(api, "POST", "/redraw", { id: ID }); // 1.02
      expect(third.status).toBe(402);
      expect(third.data.error).toContain("$0.98");
    });

    it("re-checks in the drain before a real generate call and fails the job", async () => {
      bens();
      ledger(0.9);
      const api = createDeskApi({ root, fal, runJob, dryRun: false });
      const before = ran.length;
      expect((await call(api, "POST", "/redraw", { id: ID })).status).toBe(200);
      ledger(0.9, 0.08); // spend landed elsewhere after the job was queued
      await call(api, "POST", "/run", {});
      let q = (await call(api, "GET", "/queue")).data;
      for (let i = 0; i < 50 && q.jobs[0].status !== "failed" && q.jobs[0].status !== "done"; i++) {
        await new Promise((r) => setTimeout(r, 10));
        q = (await call(api, "GET", "/queue")).data;
      }
      expect(ran.length).toBe(before);
      expect(q.jobs[0].status).toBe("failed");
      const last: string = q.jobs[0].log.at(-1);
      for (const part of [ID, "$0.98", "$1.00"]) expect(last).toContain(part);
    });
  });

  describe("batch selector", () => {
    const entry = (id: string, batch?: number) => {
      writeFileSync(join(root, "data/entries", `${id}.json`), JSON.stringify({ id, names: { primary: { romanized: `${id} name`, native: [{ script: "Cyrl", text: "x" }] } }, appearance: [] }));
      return { id, ...(batch === undefined ? {} : { batch }) };
    };
    beforeEach(() => {
      mkdirSync(join(root, "prompts"), { recursive: true });
      const rows = [entry("pa"), entry("zb", 1), entry("pb"), entry("ab", 1), entry("c2", 2), entry("c3", 3), { id: "missing", batch: 1 }];
      writeFileSync(join(root, "prompts/creatures.json"), JSON.stringify({ creatures: rows }));
      writeFileSync(join(root, "plates/picks.json"), JSON.stringify({ zb: { source: "s", approved_by: "Ben", date: "2026-10-28" } }));
    });
    const ids = (rows: Array<{ id: string }>) => rows.map((r) => r.id);

    it("defaults to batch 1, in creatures.json order, only creatures on disk", async () => {
      const api = createDeskApi({ root, fal, runJob });
      expect(ids((await call(api, "GET", "/batch")).data)).toEqual(["zb", "ab"]);
      expect(ids((await call(api, "GET", "/batch?batch=1")).data)).toEqual(["zb", "ab"]);
      expect(ids((await call(api, "GET", "/batch?batch=2")).data)).toEqual(["c2"]);
      expect(ids((await call(api, "GET", "/batch?batch=3")).data)).toEqual(["c3"]);
    });
    it("pilot is the creatures on disk with no batch", async () => {
      const api = createDeskApi({ root, fal, runJob });
      expect(ids((await call(api, "GET", "/batch?batch=pilot")).data)).toEqual(["pa", "pb", ID]);
    });
    it("refuses an unknown batch", async () => {
      const api = createDeskApi({ root, fal, runJob });
      expect((await call(api, "GET", "/batch?batch=4")).status).toBe(400);
    });
    it("every row has a string name, and /creature keeps the native forms", async () => {
      const api = createDeskApi({ root, fal, runJob });
      for (const b of ["pilot", "1", "2", "3"]) {
        for (const r of (await call(api, "GET", `/batch?batch=${b}`)).data) expect(typeof r.name, r.id).toBe("string");
      }
      expect((await call(api, "GET", "/batch")).data[0].name).toBe("zb name");
      const c = (await call(api, "GET", "/creature?id=zb")).data;
      expect(c.name).toBe("zb name");
      expect(c.names.primary.native).toEqual([{ script: "Cyrl", text: "x" }]);
    });
    it("summarises count and approvals per batch", async () => {
      const api = createDeskApi({ root, fal, runJob });
      expect((await call(api, "GET", "/batches")).data).toEqual([
        { batch: "pilot", label: "pilot", count: 3, approved: 0 },
        { batch: "1", label: "batch 1", count: 2, approved: 1 },
        { batch: "2", label: "batch 2", count: 1, approved: 0 },
        { batch: "3", label: "batch 3", count: 1, approved: 0 },
      ]);
    });
    it("tells the card whether Ben's text exists", async () => {
      writeFileSync(join(root, "plates/overrides.json"), JSON.stringify({ ab: { visual: { text: "Ben's text.", basis: "visual tradition", by: "Ben" } } }));
      const api = createDeskApi({ root, fal, runJob });
      const rows = (await call(api, "GET", "/batch")).data;
      expect(rows.map((r: { id: string; has_text: boolean; thumb: unknown }) => [r.id, r.has_text, r.thumb])).toEqual([["zb", false, null], ["ab", true, null]]);
    });
  });

  it("rejects unknown ids and path tricks", async () => {
    const api = createDeskApi({ root, fal, runJob });
    expect((await call(api, "GET", "/creature?id=../x")).status).toBe(500);
    expect((await call(api, "GET", "/creature?id=nobody")).status).toBe(404);
    expect((await call(api, "GET", "/file?p=plates/spend.json")).status).toBe(404);
  });
});
