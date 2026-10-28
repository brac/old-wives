// Usage: npm run stats [-- --data-dir <dir>] [--log-dir <dir>]
// Prints per-creature pilot stats from data/drafts, data/entries and data/verify-log, then
// runs the reconciliation check: for each field bucket, the draft's checkable items equal the
// entry's checkable items plus the log's `removed` items. Notes the verifier added (entry notes
// whose text is in neither the draft's notes nor a downgrade's `to_text`) are not counted.
// `family` is one checkable item unless it is `unclassified`. Re-formed appearance clauses are
// checked on both sides: every `reformed` row must match a form change between draft and entry,
// and every form change must have a `reformed` row.
// Exits 1 if any verified creature fails to reconcile, naming it. A creature with no entry or
// no log yet is reported as pending and is not reconciled.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * The planted canaries, by exact text, keyed on the log's `verifier_prompt_version` and then on
 * creature id. Each verify batch planted its own canaries, so a log is checked only against the
 * canaries of the batch that wrote it. verify-v1: phase 1 plan, post-review amendments, kept for
 * history (the v1 logs are in git at tags `phase-1` and `phase-1c`). verify-v2: phase 1d.
 */
export const CANARIES_BY_VERSION: Record<string, Record<string, string>> = {
  "verify-v1": {
    domovoi: "He wears a tall felt hat.",
    vodyanoi: "He flees at the sound of church bells.",
    "baba-yaga": "She has a single eye in the middle of her forehead.",
  },
  "verify-v2": {
    poludnitsa: "She wears a wreath of cornflowers on her head.",
    vampir: "When a vampire's grave is opened, its eyes glow red.",
  },
  "verify-v2.1": {
    polevik: "It takes the shape of a crow and perches on the last standing sheaf to watch the reapers.",
    tugarin: "He cannot abide the smoke of burning juniper and flees from it.",
  },
};

/** The canary planted in this creature for the verify batch that wrote `log`, if any. */
export function canaryFor(id: string, log: Json): string | undefined {
  return CANARIES_BY_VERSION[log?.verifier_prompt_version]?.[id];
}

/** Field buckets, in table order. */
export const BUCKETS = [
  "native",
  "name_variants",
  "meaning",
  "peoples_regions",
  "family",
  "appearance",
  "scene",
  "behavior_habitat",
  "dealing_with_it",
  "origin",
  "variants",
  "notes",
] as const;
export type Bucket = (typeof BUCKETS)[number];

type Json = any; // the data files are schema-validated elsewhere; this module only counts.

export interface Item {
  pointer: string;
  bucket: Bucket;
  /** Set for notes, so verifier-added notes can be recognised. */
  noteText?: string;
}

const CLAUSE_FIELDS = ["appearance", "scene", "behavior_habitat", "dealing_with_it", "origin"] as const;
const VARIANT_CLAUSE_FIELDS = ["appearance", "scene", "behavior_habitat", "dealing_with_it", "origin"] as const;

/** Map a draft JSON pointer to its bucket. */
export function bucketOf(pointer: string): Bucket {
  if (/^\/names\/primary\/native\//.test(pointer) || /^\/names\/variants\/\d+\/native\//.test(pointer)) return "native";
  if (/^\/names\/variants\//.test(pointer)) return "name_variants";
  if (/^\/names\/meaning\//.test(pointer)) return "meaning";
  if (/^\/variants\//.test(pointer)) return "variants";
  const head = pointer.split("/")[1] as Bucket;
  if ((BUCKETS as readonly string[]).includes(head)) return head;
  throw new Error(`no bucket for pointer ${pointer}`);
}

function arr(v: unknown): Json[] {
  return Array.isArray(v) ? v : [];
}

/** Every checkable item, as defined in prompts/verify.md section 2. */
export function checkableItems(doc: Json): Item[] {
  const out: Item[] = [];
  const push = (pointer: string, noteText?: string) => out.push({ pointer, bucket: bucketOf(pointer), noteText });
  const names = doc.names ?? {};
  arr(names.primary?.native).forEach((_, i) => push(`/names/primary/native/${i}`));
  arr(names.variants).forEach((v, i) => {
    push(`/names/variants/${i}`);
    arr(v.native).forEach((_, j) => push(`/names/variants/${i}/native/${j}`));
  });
  arr(names.meaning).forEach((_, i) => push(`/names/meaning/${i}`));
  arr(doc.peoples_regions).forEach((_, i) => push(`/peoples_regions/${i}`));
  const family = doc.family;
  if (family && family.value !== "unclassified" && arr(family.cites).length > 0) push("/family");
  for (const f of CLAUSE_FIELDS) arr(doc[f]).forEach((_, i) => push(`/${f}/${i}`));
  arr(doc.variants).forEach((v, i) => {
    for (const f of VARIANT_CLAUSE_FIELDS) arr(v[f]).forEach((_, j) => push(`/variants/${i}/${f}/${j}`));
    arr(v.notes).forEach((n, j) => {
      if (arr(n.cites).length > 0) push(`/variants/${i}/notes/${j}`, n.text);
    });
  });
  arr(doc.notes).forEach((n, i) => {
    if (arr(n.cites).length > 0) push(`/notes/${i}`, n.text);
  });
  return out;
}

/** Note texts present in the draft, plus downgrade targets, so retained notes are recognised. */
function draftNoteTexts(draft: Json, log: Json): Set<string> {
  const texts = new Set<string>();
  for (const n of arr(draft.notes)) texts.add(n.text);
  for (const v of arr(draft.variants)) for (const n of arr(v.notes)) texts.add(n.text);
  for (const d of arr(log.downgraded)) if (/\/notes\/\d+$/.test(d.field)) texts.add(d.to_text);
  return texts;
}

export type Counts = Record<Bucket, number>;
const zero = (): Counts => Object.fromEntries(BUCKETS.map((b) => [b, 0])) as Counts;
export const total = (c: Counts) => BUCKETS.reduce((s, b) => s + c[b], 0);

export interface Reconcile {
  ok: boolean;
  /** One line per bucket that fails: draft vs entry + removed. */
  mismatches: string[];
}

export interface CreatureStats {
  id: string;
  pending: boolean;
  draft: Counts;
  verified?: Counts;
  removedByBucket?: Counts;
  addedNotes?: number;
  removed?: number;
  canaryRemoved?: number;
  canaryKept?: boolean;
  downgraded?: number;
  retagged?: number;
  reformed?: number;
  flagged?: number;
  grade?: string;
  appearance?: number;
  /** Appearance clauses with no `form`, which describe every form. */
  commonAppearance?: number;
  /** The entry's appearance forms, each with its clause count. */
  forms?: FormCount[];
  sceneUsed?: boolean;
  variants?: number;
  nameVariants?: number;
  peoples?: number;
  reconcile?: Reconcile;
}

export interface FormCount {
  id: string;
  label: string;
  clauses: number;
}

/** The entry's appearance forms with the number of clauses in each. */
export function formCounts(doc: Json): FormCount[] {
  return arr(doc.appearance_forms).map((f) => ({
    id: f.id,
    label: f.label,
    clauses: arr(doc.appearance).filter((c) => c.form === f.id).length,
  }));
}

/**
 * Re-forms, checked on both sides. Each draft appearance clause is matched to the entry clause
 * with its text (or its downgraded `to_text`); removed clauses have no match and are skipped.
 * A form change with no `reformed` row, or a `reformed` row with no such change, is a mismatch.
 */
export function reformMismatches(draft: Json, entry: Json, log: Json): string[] {
  const out: string[] = [];
  const formOf = (c: Json): string | null => (typeof c?.form === "string" ? c.form : null);
  const draftClauses = arr(draft.appearance);
  const entryClauses = arr(entry.appearance);
  const rows = new Map<string, Json>();
  for (const r of arr(log.reformed)) {
    if (rows.has(r.field)) out.push(`reformed: ${r.field} is logged twice`);
    rows.set(r.field, r);
  }
  draftClauses.forEach((c, i) => {
    const field = `/appearance/${i}`;
    const texts = new Set([c.text, ...arr(log.downgraded).filter((d) => d.field === field).map((d) => d.to_text)]);
    const match = entryClauses.find((e) => texts.has(e.text));
    const row = rows.get(field);
    rows.delete(field);
    if (!match) {
      if (row) out.push(`reformed: ${field} is logged but not in the entry`);
      return;
    }
    const from = formOf(c);
    const to = formOf(match);
    if (from === to) {
      if (row) out.push(`reformed: ${field} is logged but its form did not change (${String(from)})`);
    } else if (!row) {
      out.push(`reformed: ${field} moved from form ${String(from)} to ${String(to)} with no reformed row`);
    } else if (row.from_form !== from || row.to_form !== to) {
      out.push(
        `reformed: ${field} logged ${String(row.from_form)} -> ${String(row.to_form)}, entry shows ${String(from)} -> ${String(to)}`,
      );
    }
  });
  for (const field of rows.keys()) out.push(`reformed: ${field} is not a draft appearance clause`);
  return out;
}

function count(items: Item[]): Counts {
  const c = zero();
  for (const it of items) c[it.bucket]++;
  return c;
}

/** Compute one creature's stats. `entry` and `log` are undefined when verify has not run. */
export function creatureStats(id: string, draft: Json, entry?: Json, log?: Json): CreatureStats {
  const draftCounts = count(checkableItems(draft));
  if (!entry || !log) return { id, pending: true, draft: draftCounts };

  const keep = draftNoteTexts(draft, log);
  const entryItems = checkableItems(entry);
  const retained = entryItems.filter((it) => it.noteText === undefined || keep.has(it.noteText));
  const verified = count(retained);
  const removedByBucket = zero();
  for (const r of arr(log.removed)) removedByBucket[bucketOf(r.field)]++;

  const mismatches: string[] = [];
  for (const b of BUCKETS) {
    if (draftCounts[b] !== verified[b] + removedByBucket[b]) {
      mismatches.push(`${b}: draft ${draftCounts[b]} != verified ${verified[b]} + removed ${removedByBucket[b]}`);
    }
  }
  mismatches.push(...reformMismatches(draft, entry, log));

  const canary = canaryFor(id, log);
  const canaryRemoved = canary ? arr(log.removed).filter((r) => r.text === canary).length : 0;
  const entryText = JSON.stringify(entry);
  const peoples = new Set(arr(entry.peoples_regions).map((p) => p.people));
  return {
    id,
    pending: false,
    draft: draftCounts,
    verified,
    removedByBucket,
    addedNotes: entryItems.length - retained.length,
    removed: arr(log.removed).length - canaryRemoved,
    canaryRemoved,
    canaryKept: canary ? entryText.includes(canary) : undefined,
    downgraded: arr(log.downgraded).length,
    retagged: arr(log.retagged).length,
    reformed: arr(log.reformed).length,
    flagged: arr(log.flagged).length,
    grade: log.grade,
    appearance: arr(entry.appearance).length,
    commonAppearance: arr(entry.appearance).filter((c) => typeof c.form !== "string").length,
    forms: formCounts(entry),
    sceneUsed: arr(entry.appearance).length === 0 && arr(entry.scene).length > 0,
    variants: arr(entry.variants).length,
    nameVariants: arr(entry.names?.variants).length,
    peoples: peoples.size,
    reconcile: { ok: mismatches.length === 0, mismatches },
  };
}

function readJson(path: string): Json | undefined {
  if (!existsSync(path)) return undefined;
  return JSON.parse(readFileSync(path, "utf8").replace(/^﻿/, ""));
}

export function loadAll(dataDir: string, logDir: string): CreatureStats[] {
  const draftsDir = join(dataDir, "drafts");
  const ids = readdirSync(draftsDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.slice(0, -5))
    .sort();
  return ids.map((id) =>
    creatureStats(
      id,
      readJson(join(draftsDir, `${id}.json`)),
      readJson(join(dataDir, "entries", `${id}.json`)),
      readJson(join(logDir, `${id}.json`)),
    ),
  );
}

const SHORT: Record<Bucket, string> = {
  native: "native",
  name_variants: "namevar",
  meaning: "meaning",
  peoples_regions: "peoples",
  family: "family",
  appearance: "appear",
  scene: "scene",
  behavior_habitat: "behav",
  dealing_with_it: "dealing",
  origin: "origin",
  variants: "variants",
  notes: "notes",
};

function row(cells: (string | number)[], widths: number[]): string {
  return cells.map((c, i) => String(c).padStart(widths[i])).join("  ");
}

export function render(all: CreatureStats[]): string {
  const lines: string[] = [];
  for (const s of all) {
    lines.push(`== ${s.id}${s.pending ? "  (pending: not yet verified)" : ""}`);
    const head = ["", ...BUCKETS.map((b) => SHORT[b]), "total"];
    const w = head.map((h) => Math.max(h.length, 8));
    lines.push(row(head, w));
    lines.push(row(["draft", ...BUCKETS.map((b) => s.draft[b]), total(s.draft)], w));
    if (s.pending) continue;
    lines.push(row(["verified", ...BUCKETS.map((b) => s.verified![b]), total(s.verified!)], w));
    lines.push(row(["removed", ...BUCKETS.map((b) => s.removedByBucket![b]), total(s.removedByBucket!)], w));
    const canary = s.canaryKept !== undefined ? `, canary removed ${s.canaryRemoved}${s.canaryKept ? " (CANARY KEPT IN ENTRY)" : ""}` : "";
    lines.push(
      `removed ${s.removed} (canaries excluded)${canary}; downgraded ${s.downgraded}; retagged ${s.retagged}; reformed ${s.reformed}; flagged ${s.flagged}; verifier-added cited notes ${s.addedNotes}`,
    );
    lines.push(
      `grade ${s.grade}; appearance clauses ${s.appearance}; scene used ${s.sceneUsed ? "yes" : "no"}; variants ${s.variants}; name variants ${s.nameVariants}; peoples ${s.peoples}`,
    );
    const forms = s.forms!.map((f) => `${f.id} (${f.clauses})`).join(", ");
    lines.push(`forms ${s.forms!.length}${forms ? `: ${forms}` : ""}; common appearance clauses ${s.commonAppearance}`);
    lines.push(s.reconcile!.ok ? "reconcile: ok" : `reconcile: MISMATCH\n  ${s.reconcile!.mismatches.join("\n  ")}`);
  }
  const done = all.filter((s) => !s.pending);
  const sum = (k: "removed" | "canaryRemoved" | "downgraded" | "retagged" | "reformed" | "flagged") =>
    done.reduce((n, s) => n + (s[k] ?? 0), 0);
  lines.push("");
  lines.push(
    `totals over ${done.length} verified: removed ${sum("removed")} (excl. ${sum("canaryRemoved")} canaries); downgraded ${sum("downgraded")}; retagged ${sum("retagged")}; reformed ${sum("reformed")}; flagged ${sum("flagged")}`,
  );
  const pending = all.filter((s) => s.pending).map((s) => s.id);
  if (pending.length > 0) lines.push(`pending: ${pending.join(", ")}`);
  return lines.join("\n");
}

function main(): void {
  const root = resolve(fileURLToPath(import.meta.url), "..", "..", "..");
  const args = process.argv.slice(2);
  let dataDir = join(root, "data");
  let logDir: string | undefined;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--data-dir") dataDir = resolve(args[++i]);
    else if (args[i] === "--log-dir") logDir = resolve(args[++i]);
    else {
      console.error(`unknown argument ${args[i]}\nusage: npm run stats [-- --data-dir <dir>] [--log-dir <dir>]`);
      process.exit(2);
    }
  }
  const all = loadAll(dataDir, logDir ?? join(dataDir, "verify-log"));
  console.log(render(all));
  const bad = all.filter((s) => s.reconcile && !s.reconcile.ok).map((s) => s.id);
  if (bad.length > 0) {
    console.error(`reconciliation FAILED: ${bad.join(", ")}`);
    process.exit(1);
  }
  console.log(`reconciliation ok for ${all.filter((s) => !s.pending).length} verified creatures`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
